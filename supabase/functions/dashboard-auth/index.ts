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

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
});

