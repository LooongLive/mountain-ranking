import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, x-edit-password',
  'access-control-allow-methods': 'POST, OPTIONS',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const password = request.headers.get('x-edit-password') || '';
  const expectedPassword = Deno.env.get('EDIT_PASSWORD') || '';

  if (!expectedPassword || password !== expectedPassword) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response('Missing Supabase function secrets', { status: 500, headers: corsHeaders });
  }

  const { boardId, data } = await request.json();

  if (!boardId || !data) {
    return new Response('Missing boardId or data', { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { error } = await supabase
    .from('dashboard_pages')
    .upsert({ id: boardId, data, updated_at: new Date().toISOString() }, { onConflict: 'id' });

  if (error) {
    return new Response(error.message, { status: 500, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
});

