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

    const { branch_id, restaurant_id, email, password } = await req.json();

    if (!branch_id || !restaurant_id || !email || !password) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // التحقق أن المستخدم هو صاحب هذا المطعم
    const { data: restaurant, error: restaurantError } = await userClient
      .from('restaurants')
      .select('id')
      .eq('id', restaurant_id)
      .eq('owner_id', user.id)
      .single();

    if (restaurantError || !restaurant) {
      return new Response(JSON.stringify({ error: 'Not authorized to manage this restaurant' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // التحقق أن الفرع ينتمي لهذا المطعم
    const { data: branch, error: branchError } = await userClient
      .from('branches')
      .select('id')
      .eq('id', branch_id)
      .eq('restaurant_id', restaurant_id)
      .single();

    if (branchError || !branch) {
      return new Response(JSON.stringify({ error: 'Branch not found in this restaurant' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // التحقق أن الفرع ليس لديه حساب بالفعل
    const { data: existingStaff } = await userClient
      .from('branch_staff')
      .select('id')
      .eq('branch_id', branch_id)
      .maybeSingle();

    if (existingStaff) {
      return new Response(JSON.stringify({ error: 'This branch already has a staff account' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // إنشاء المستخدم في Supabase Auth باستخدام service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // تأكيد الإيميل تلقائياً
    });

    if (createError || !newUser.user) {
      return new Response(JSON.stringify({ error: createError?.message || 'Failed to create user' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // إدخال سجل في branch_staff
    const { error: insertError } = await adminClient
      .from('branch_staff')
      .insert({
        user_id: newUser.user.id,
        branch_id,
        restaurant_id,
        email,
      });

    if (insertError) {
      // في حالة الخطأ، حذف المستخدم الذي تم إنشاؤه لتجنب orphaned accounts
      await adminClient.auth.admin.deleteUser(newUser.user.id);
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, user_id: newUser.user.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
