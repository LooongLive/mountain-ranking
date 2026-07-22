(() => {
  const SUPABASE_URL = 'https://ochhwfntlpzwjextvxsh.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_rqJNhAe_muGxtreVFihdUA_Ou5g4S-N';
  const BOARD_ID = 'headquarters-suggestions';
  const FIELD = '__globalControls';
  const PAGE_KEY = 'ci-page-info-enabled';

  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  const endpoint = (extra = '') =>
    `${SUPABASE_URL}/rest/v1/dashboard_pages?id=eq.${encodeURIComponent(BOARD_ID)}${extra}`;

  const localEnabled = () => {
    try {
      return localStorage.getItem(PAGE_KEY) !== '0';
    } catch {
      return true;
    }
  };

  const setLocalEnabled = (enabled) => {
    try {
      localStorage.setItem(PAGE_KEY, enabled ? '1' : '0');
    } catch {}
    document.documentElement.dataset.infoPageEnabled = enabled ? '1' : '0';
  };

  const clickRanking = () => {
    const rankingButton = [...document.querySelectorAll('.showcase-switcher button')]
      .find((button) => /改善排名/.test(button.textContent || ''));
    if (rankingButton && !rankingButton.classList.contains('is-active')) {
      rankingButton.click();
    }
  };

  const applyPageVisibility = (enabled = localEnabled()) => {
    setLocalEnabled(enabled);
    const buttons = [...document.querySelectorAll('.showcase-switcher button')];
    const infoButton = buttons.find((button) => /信息展示|活动|议程/.test(button.textContent || ''));
    if (infoButton) {
      infoButton.style.display = enabled ? '' : 'none';
      infoButton.disabled = !enabled;
      if (!enabled && infoButton.classList.contains('is-active')) clickRanking();
    }
    if (!enabled) clickRanking();
    document.querySelectorAll('.ci-info-toggle').forEach((button) => {
      button.classList.toggle('is-on', enabled);
      const label = button.querySelector('b');
      if (label) label.textContent = enabled ? '开启' : '关闭';
    });
  };

  const readBoard = async () => {
    const response = await fetch(endpoint('&select=data&limit=1'), {
      headers,
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`读取云端设置失败 HTTP ${response.status}`);
    const rows = await response.json();
    return rows[0]?.data || {};
  };

  const mergePageSetting = (data, enabled = localEnabled()) => {
    const nextData = data && typeof data === 'object' ? { ...data } : {};
    nextData.infoPage = {
      ...(nextData.infoPage || {}),
      enabled,
    };
    nextData[FIELD] = {
      ...(nextData[FIELD] || {}),
      infoPageEnabled: enabled,
      infoPageSynced: true,
      savedAt: new Date().toISOString(),
      storage: 'supabase',
    };
    return nextData;
  };

  const saveGlobalPageSetting = async (enabled = localEnabled()) => {
    const data = mergePageSetting(await readBoard(), enabled);
    const saveUrl = `${SUPABASE_URL}/functions/v1/dashboard-save`;
    const response = await fetch(saveUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ boardId: BOARD_ID, data }),
    });
    if (!response.ok) throw new Error(`保存云端设置失败 HTTP ${response.status}`);
    return enabled;
  };

  const decorateSavePayload = (payload) => {
    if (!payload || typeof payload !== 'object') return payload;
    if (!payload.data || typeof payload.data !== 'object') return payload;
    return {
      ...payload,
      data: mergePageSetting(payload.data, localEnabled()),
    };
  };

  const installSaveBridge = () => {
    if (window.__ciGlobalControlsSaveBridge) return;
    window.__ciGlobalControlsSaveBridge = true;
    const nativeFetch = window.fetch.bind(window);
    window.fetch = async (input, init = {}) => {
      const url = String(input?.url || input || '');
      let nextInit = init;
      if (url.includes('/functions/v1/dashboard-save') && typeof init?.body === 'string') {
        try {
          nextInit = {
            ...init,
            body: JSON.stringify(decorateSavePayload(JSON.parse(init.body))),
          };
        } catch (error) {
          console.warn('全局页面开关合并到云端保存请求失败', error);
        }
      }
      const response = await nativeFetch(input, nextInit);
      if (url.includes('/functions/v1/dashboard-save') && response.ok) {
        window.setTimeout(() => loadGlobalPageSetting().catch((error) => console.warn(error)), 600);
      }
      return response;
    };
  };

  const saveGlobalPageSettingDirectly = async (enabled = localEnabled()) => {
    const data = await readBoard();
    data.infoPage = {
      ...(data.infoPage || {}),
      enabled,
    };
    data[FIELD] = {
      ...(data[FIELD] || {}),
      infoPageEnabled: enabled,
      infoPageSynced: true,
      savedAt: new Date().toISOString(),
      storage: 'supabase',
    };
    const response = await fetch(endpoint(), {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({ data }),
    });
    if (!response.ok) throw new Error(`保存云端设置失败 HTTP ${response.status}`);
    const rows = await response.json();
    const savedData = rows[0]?.data || {};
    const savedEnabled = typeof savedData?.infoPage?.enabled === 'boolean'
      ? savedData.infoPage.enabled
      : savedData?.[FIELD]?.infoPageEnabled;
    if (savedEnabled !== enabled) throw new Error('保存云端设置失败：服务器未返回新状态');
    return enabled;
  };

  const loadGlobalPageSetting = async () => {
    const data = await readBoard();
    const enabled = typeof data?.infoPage?.enabled === 'boolean'
      ? data.infoPage.enabled
      : data?.[FIELD]?.infoPageEnabled;
    if (typeof enabled === 'boolean') applyPageVisibility(enabled);
  };

  const showSaveResult = (message) => {
    const saveButton = [...document.querySelectorAll('button')]
      .find((button) => /保存云端/.test(button.textContent || ''));
    if (!saveButton) return;
    const oldTitle = saveButton.title;
    saveButton.title = message;
    window.clearTimeout(showSaveResult.timer);
    showSaveResult.timer = window.setTimeout(() => {
      saveButton.title = oldTitle || '';
    }, 3000);
  };

  const queueApply = () => requestAnimationFrame(() => applyPageVisibility(localEnabled()));

  document.addEventListener('click', (event) => {
    const toggle = event.target?.closest?.('.ci-info-toggle');
    if (!toggle) return;
    window.setTimeout(() => {
      const enabled = localEnabled();
      applyPageVisibility(enabled);
      showSaveResult(enabled ? '活动安排已开启，请点保存云端同步' : '活动安排已关闭，请点保存云端同步');
    }, 80);
  }, true);

  window.__ciSaveInfoPageEnabled = saveGlobalPageSettingDirectly;

  document.addEventListener('click', (event) => {
    const button = event.target?.closest?.('button');
    if (!button || !/保存云端/.test(button.textContent || '')) return;
    window.setTimeout(() => showSaveResult('正在随保存云端同步全局页面开关'), 150);
    window.setTimeout(() => loadGlobalPageSetting().catch((error) => console.warn(error)), 2500);
  }, true);

  installSaveBridge();
  loadGlobalPageSetting().catch((error) => console.warn(error));
  document.addEventListener('DOMContentLoaded', () => {
    loadGlobalPageSetting().catch((error) => console.warn(error));
    queueApply();
  });
  new MutationObserver(queueApply).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  window.addEventListener('storage', (event) => {
    if (event.key === PAGE_KEY) applyPageVisibility(localEnabled());
  });
})();
