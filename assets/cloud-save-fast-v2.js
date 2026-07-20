(() => {
  const API = 'https://mountain-ranking-api.290205693-845.workers.dev';
  const SUPA = 'https://ochhwfntlpzwjextvxsh.supabase.co';

  if (!window.fetch) return;

  const nativeFetch = window.fetch.bind(window);
  const asUrl = (input) => {
    try {
      return typeof input === 'string' ? input : input && input.url || '';
    } catch {
      return '';
    }
  };
  const json = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
  const wanted = (key) => (
    key.startsWith('__mountain_ranking_') ||
    key.startsWith('ci-page-') ||
    key.startsWith('ci-auto-refresh-') ||
    key.startsWith('ci-info-world-clock') ||
    key.startsWith('ci-progress-')
  );
  const readLocal = () => {
    const out = {};
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && wanted(key)) out[key] = localStorage.getItem(key);
      }
    } catch {}
    return out;
  };
  const readBody = (init) => {
    try {
      return init && typeof init.body === 'string' ? JSON.parse(init.body) : {};
    } catch {
      return {};
    }
  };
  const normalize = (data) => {
    data = data && typeof data === 'object' ? data : {};
    const localStorageData = { ...readLocal(), ...(data.localStorage || {}) };
    if (data.departments) localStorageData.__mountain_ranking_departments = JSON.stringify(data.departments);
    if (data.floatModules) localStorageData.__mountain_ranking_modules = JSON.stringify(data.floatModules);
    if (data.theme) localStorageData.__mountain_ranking_theme = JSON.stringify(data.theme);
    if (data.infoPage) localStorageData.__mountain_ranking_info_page = JSON.stringify(data.infoPage);
    if (typeof data.isManualMode === 'boolean') {
      localStorageData.__mountain_ranking_manual_mode = JSON.stringify(data.isManualMode);
    }
    return localStorageData;
  };
  const timeoutFetch = (url, init = {}, ms = 45000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return nativeFetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
  };
  const headers = () => {
    const h = { 'Content-Type': 'application/json' };
    try {
      const password =
        sessionStorage.getItem('__ci_edit_password') ||
        sessionStorage.getItem('ci-edit-password') ||
        sessionStorage.getItem('dashboard-password');
      if (password) h['X-Edit-Password'] = password;
    } catch {}
    return h;
  };
  const save = async (data) => {
    const localStorageData = normalize(data);
    if (!(
      localStorageData.__mountain_ranking_departments ||
      localStorageData.__mountain_ranking_modules ||
      localStorageData.__mountain_ranking_theme ||
      localStorageData.__mountain_ranking_info_page
    )) {
      return json({ ok: false, error: '没有可保存的有效页面数据' }, 500);
    }

    const patch = { localStorage: localStorageData, updatedAt: new Date().toISOString() };
    const response = await timeoutFetch(`${API}/api/state`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ patch: true, data: patch })
    });

    let body = {};
    try {
      body = await response.clone().json();
    } catch {}
    if (!response.ok || body.ok === false) {
      return json({ ok: false, error: body.error || `云端写入失败 HTTP ${response.status}` }, 500);
    }
    return json({
      ok: true,
      success: true,
      verified: true,
      mode: 'worker-write-confirmed',
      savedAt: body.savedAt || new Date().toISOString(),
      version: body.version
    });
  };
  const rows = (state) => {
    const data = state && state.data || {};
    const localStorageData = data.localStorage || {};
    let globalControls = data.__globalControls || {};
    try {
      if (localStorageData['ci-page-info-enabled'] != null) {
        globalControls = { ...globalControls, infoPageEnabled: localStorageData['ci-page-info-enabled'] !== '0' };
      }
    } catch {}
    return [{ id: 'headquarters-suggestions', data: { ...data, __globalControls: globalControls } }];
  };

  window.fetch = async (input, init = {}) => {
    const url = asUrl(input);
    const method = String(init && init.method || 'GET').toUpperCase();

    if (method === 'POST' && url.includes(`${SUPA}/functions/v1/dashboard-save`)) {
      try {
        return await save(readBody(init).data || {});
      } catch (error) {
        return json({ ok: false, error: String(error && error.message || error) }, 500);
      }
    }
    if ((method === 'POST' || method === 'PATCH' || method === 'PUT') && url.includes(`${SUPA}/rest/v1/dashboard_pages`)) {
      try {
        const body = readBody(init);
        return await save(body.data || body || {});
      } catch (error) {
        return json({ ok: false, error: String(error && error.message || error) }, 500);
      }
    }
    if (method === 'GET' && url.includes(`${SUPA}/rest/v1/dashboard_pages`)) {
      try {
        const response = await timeoutFetch(`${API}/api/state`, { cache: 'no-store' }, 22000);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        document.documentElement.dataset.cloudflareState = 'online';
        return json(rows(await response.json()));
      } catch {
        document.documentElement.dataset.cloudflareState = 'offline';
        return nativeFetch(input, init);
      }
    }
    return nativeFetch(input, init);
  };
})();
