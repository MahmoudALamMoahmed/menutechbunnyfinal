import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // التحقق من المستخدم الحالي (صاحب المطعم)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { staff_user_id } = await req.json();
    if (!staff_user_id) {
      return new Response(JSON.stringify({ error: 'Missing staff_user_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // التحقق أن الموظف ينتمي لمطعم يمتلكه المستخدم الحالي
    const { data: staffRecord, error: staffError } = await userClient
      .from('branch_staff')
      .select('id, restaurant_id')
      .eq('user_id', staff_user_id)
      .single();

    if (staffError || !staffRecord) {
      return new Response(JSON.stringify({ error: 'Staff record not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // التحقق أن صاحب المطعم يملك هذا المطعم
    const { data: restaurant, error: restaurantError } = await userClient
      .from('restaurants')
      .select('id')
      .eq('id', staffRecord.restaurant_id)
      .eq('owner_id', user.id)
      .single();

    if (restaurantError || !restaurant) {
      return new Response(JSON.stringify({ error: 'Not authorized to manage this restaurant' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // حذف المستخدم من Supabase Auth (cascade يحذف branch_staff تلقائياً)
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(staff_user_id);

    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // حذف سجل branch_staff يدوياً (لأن user_id ليس FK مباشر لـ auth.users مع cascade)
    await adminClient
      .from('branch_staff')
      .delete()
      .eq('user_id', staff_user_id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
