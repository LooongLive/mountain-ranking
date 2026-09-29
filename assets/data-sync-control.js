(() => {
  const REFRESH_ENABLED_KEY = 'ci-auto-refresh-enabled';
  const REFRESH_MINUTES_KEY = 'ci-auto-refresh-minutes';
  const MIGRATION_KEY = 'ci-auto-refresh-8h-v1';
  const EIGHT_HOURS_MINUTES = '480';

  try {
    if (localStorage.getItem(MIGRATION_KEY) !== '1') {
      localStorage.setItem(REFRESH_ENABLED_KEY, '1');
      localStorage.setItem(REFRESH_MINUTES_KEY, EIGHT_HOURS_MINUTES);
      localStorage.setItem(MIGRATION_KEY, '1');
    }
  } catch {}

  const nativeFetch = window.fetch.bind(window);
  const pendingReads = new Map();

  window.fetch = (input, init = {}) => {
    const url = String(input?.url || input || '');
    const method = String(init.method || input?.method || 'GET').toUpperCase();
    const isBoardRead = method === 'GET'
      && url.includes('.supabase.co/rest/v1/dashboard_pages?');

    if (!isBoardRead) return nativeFetch(input, init);

    const cacheKey = url;
    const pending = pendingReads.get(cacheKey);
    if (pending) return pending.then((response) => response.clone());

    const request = nativeFetch(input, init).then((response) => {
      window.setTimeout(() => pendingReads.delete(cacheKey), 30000);
      return response;
    }, (error) => {
      pendingReads.delete(cacheKey);
      throw error;
    });
    pendingReads.set(cacheKey, request);
    return request.then((response) => response.clone());
  };
})();
