import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify CRON_SECRET to prevent unauthorized invocations
  const authHeader = req.headers.get('Authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 0. إنهاء المعاملات المعلقة المنتهية
    const { data: expiredCount, error: expireTxError } = await supabase.rpc('expire_pending_transactions');
    if (expireTxError) {
      console.error('Error expiring pending transactions:', expireTxError);
    } else {
      console.log(`Expired ${expiredCount} pending wallet transactions`);
    }

    // 1. جلب الاشتراكات التي تحتاج للتجديد (auto_renew = true)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        restaurant_id,
        plan_id,
        expires_at,
        auto_renew,
        status,
        restaurants!inner(owner_id)
      `)
      .in('status', ['active', 'expired'])
      .eq('auto_renew', true)
      .lt('expires_at', tomorrow.toISOString())
      .gt('expires_at', fortyEightHoursAgo.toISOString());

    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
      return new Response(JSON.stringify({ error: subsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions to renew`);

    const results = {
      total: subscriptions?.length || 0,
      renewed: 0,
      failed: 0,
      insufficient_balance: 0,
      expired_updated: 0,
      errors: [] as string[],
    };

    // 2. لكل اشتراك، حاول التجديد
    for (const sub of subscriptions || []) {
      try {
        const { data: renewResult, error: renewError } = await supabase.rpc('subscribe_to_plan', {
          p_restaurant_id: sub.restaurant_id,
          p_plan_id: sub.plan_id,
          p_auto_renew: true,
        });

        if (renewError) {
          console.error(`Error renewing subscription ${sub.id}:`, renewError);
          results.failed++;
          results.errors.push(`Sub ${sub.id}: ${renewError.message}`);
          continue;
        }

        if (renewResult === 'success') {
          console.log(`Successfully renewed subscription ${sub.id}`);
          results.renewed++;
        } else if (renewResult === 'insufficient_balance') {
          console.log(`Insufficient balance for subscription ${sub.id}`);
          results.insufficient_balance++;
        } else {
          console.log(`Failed to renew subscription ${sub.id}: ${renewResult}`);
          results.failed++;
          results.errors.push(`Sub ${sub.id}: ${renewResult}`);
        }
      } catch (err) {
        console.error(`Exception renewing subscription ${sub.id}:`, err);
        results.failed++;
        results.errors.push(`Sub ${sub.id}: ${err.message}`);
      }
    }

    // 3. تحديث status إلى expired لجميع الاشتراكات المنتهية التي لم تُجدد
    const { data: expiredData, error: expiredError } = await supabase
      .from('subscriptions')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (expiredError) {
      console.error('Error updating expired subscriptions:', expiredError);
    } else {
      results.expired_updated = expiredData?.length || 0;
      console.log(`Marked ${results.expired_updated} subscriptions as expired`);
    }

    console.log('Auto-renewal results:', results);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Auto-renewal error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
