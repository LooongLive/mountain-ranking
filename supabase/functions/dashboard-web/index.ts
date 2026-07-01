const html = "<!doctype html>\n<html lang=\"zh-CN\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <link rel=\"icon\" type=\"image/svg+xml\" href=\"https://ochhwfntlpzwjextvxsh.supabase.co/storage/v1/object/public/dashboard-site/releases/20260701083542/favicon.svg\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>雪山攀登排名</title>\n    <script type=\"module\" crossorigin src=\"https://ochhwfntlpzwjextvxsh.supabase.co/storage/v1/object/public/dashboard-site/releases/20260701083542/assets/index-BfwAJ2OP.js\"></script>\n    <link rel=\"stylesheet\" crossorigin href=\"https://ochhwfntlpzwjextvxsh.supabase.co/storage/v1/object/public/dashboard-site/releases/20260701083542/assets/index-Dpl2CzKd.css\">\n  </head>\n  <body>\n    <div id=\"root\"></div>\n  </body>\n</html>\n";

Deno.serve(() => {
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
});
