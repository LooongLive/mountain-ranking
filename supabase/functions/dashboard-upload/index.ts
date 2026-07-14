import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, x-edit-password',
  'access-control-allow-methods': 'POST, OPTIONS',
};

function cleanSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').slice(0, 80);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const password = request.headers.get('x-edit-password') || '';
  const expectedPassword = Deno.env.get('EDIT_PASSWORD') || '';
  const expectedInfoPassword = Deno.env.get('INFO_EDIT_PASSWORD') || '';

  if ((!expectedPassword || password !== expectedPassword) && (!expectedInfoPassword || password !== expectedInfoPassword)) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const bucket = Deno.env.get('MEDIA_BUCKET') || 'dashboard-media';

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response('Missing Supabase function secrets', { status: 500, headers: corsHeaders });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const boardId = cleanSegment(String(formData.get('boardId') || 'headquarters-suggestions'));
  const folder = cleanSegment(String(formData.get('folder') || 'uploads'));

  if (!(file instanceof File)) {
    return new Response('Missing file', { status: 400, headers: corsHeaders });
  }

  if (file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp')) {
    return new Response('webp images are disabled for TV compatibility', { status: 415, headers: corsHeaders });
  }

  const originalName = cleanSegment(file.name || 'upload');
  const objectPath = `${boardId}/${folder}/${Date.now()}-${crypto.randomUUID()}-${originalName}`;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(objectPath, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (error) {
    return new Response(error.message, { status: 500, headers: corsHeaders });
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);

  return new Response(JSON.stringify({ path: objectPath, url: data.publicUrl }), {
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
});
