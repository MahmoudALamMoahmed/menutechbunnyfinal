import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-kashier-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // دائماً نرد 200 حسب متطلبات Kashier
  const ok = () =>
    new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const body = await req.json();
    const { event, data } = body;

    console.log(`[Webhook] Received event: ${event}, merchantOrderId: ${data?.merchantOrderId}, status: ${data?.status}`);

    // نتعامل فقط مع أحداث الدفع
    if (event !== "pay") {
      console.log(`[Webhook] Ignoring non-pay event: ${event}`);
      return ok();
    }

    // --- الطبقة 1: التحقق من التوقيع ---
    const KASHIER_API_KEY = Deno.env.get("KASHIER_API_KEY")!;
    const kashierSignature = req.headers.get("x-kashier-signature");

    if (!kashierSignature) {
      console.error("[Webhook] Missing x-kashier-signature header");
      return ok();
    }

    // بناء التوقيع حسب توثيق Kashier
    const signatureKeys = [...(data.signatureKeys || [])].sort();
    const signatureParts: string[] = [];

    for (const key of signatureKeys) {
      const value = data[key];
      if (value !== undefined && value !== null) {
        signatureParts.push(
          `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
        );
      }
    }

    const signaturePayload = signatureParts.join("&");

    // حساب HMAC-SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(KASHIER_API_KEY);
    const msgData = encoder.encode(signaturePayload);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (computedSignature !== kashierSignature) {
      console.error(
        `[Webhook] INVALID SIGNATURE! Computed: ${computedSignature}, Received: ${kashierSignature}`
      );
      return ok();
    }

    console.log("[Webhook] Signature verified successfully");

    // --- الطبقة 2-5: معالجة الدفع عبر DB Function ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const merchantOrderId = data.merchantOrderId;
    const paymentStatus = data.status;
    // Kashier يرسل المبلغ بالقروش أحياناً - نتحقق من القيمة
    const webhookAmount = parseFloat(data.amount);
    const paymentMethod = data.method || "unknown";

    if (paymentStatus === "SUCCESS") {
      // استدعاء دالة process_successful_payment الآمنة
      const { data: result, error } = await adminClient.rpc(
        "process_successful_payment",
        {
          p_kashier_order_id: merchantOrderId,
          p_amount: webhookAmount,
          p_payment_method: paymentMethod,
        }
      );

      if (error) {
        console.error("[Webhook] DB function error:", error);
      } else {
        console.log(`[Webhook] Payment processing result: ${result} for order: ${merchantOrderId}`);

        if (result === "amount_mismatch") {
          console.error(
            `[Webhook] AMOUNT MISMATCH! Webhook amount: ${webhookAmount}, Order: ${merchantOrderId}`
          );
        }
      }
    } else {
      // دفع فاشل
      console.log(`[Webhook] Payment failed with status: ${paymentStatus} for order: ${merchantOrderId}`);

      const { data: result, error } = await adminClient.rpc(
        "process_failed_payment",
        { p_kashier_order_id: merchantOrderId }
      );

      if (error) {
        console.error("[Webhook] Failed payment DB error:", error);
      } else {
        console.log(`[Webhook] Failed payment result: ${result}`);
      }
    }

    return ok();
  } catch (err) {
    console.error("[Webhook] Unexpected error:", err);
    return ok();
  }
});
