import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STORAGE_ZONE = "menutechfinal";
const STORAGE_HOSTNAME = "storage.bunnycdn.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessKey = Deno.env.get("BUNNY_STORAGE_ACCESS_KEY");
    if (!accessKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing Bunny Storage access key" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { path } = await req.json();

    if (!path) {
      console.log("No path provided, skipping deletion");
      return new Response(
        JSON.stringify({ success: true, message: "No file to delete" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Path validation
    if (!path.startsWith("restaurants/")) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid delete path" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ownership check - verify user owns the restaurant in the path
    const pathParts = path.split('/');
    const restaurantUsername = pathParts[1];
    if (!restaurantUsername) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid path format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: restaurant } = await userClient
      .from('restaurants')
      .select('id')
      .eq('username', restaurantUsername)
      .eq('owner_id', user.id)
      .single();

    if (!restaurant) {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Deleting from Bunny: ${path}, user: ${user.id}`);

    const response = await fetch(
      `https://${STORAGE_HOSTNAME}/${STORAGE_ZONE}/${path}`,
      {
        method: "DELETE",
        headers: {
          AccessKey: accessKey,
        },
      }
    );

    console.log("Bunny delete response:", response.status);

    if (response.ok || response.status === 404) {
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const errorText = await response.text();
      console.error("Bunny delete failed:", response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: `Delete failed: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in bunny-delete:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
