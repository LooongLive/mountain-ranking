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

  const saveGlobalPageSetting = async (enabled = localEnabled()) => {
    const data = await readBoard();
    data[FIELD] = {
      ...(data[FIELD] || {}),
      infoPageEnabled: enabled,
      savedAt: new Date().toISOString(),
      storage: 'supabase',
    };
    const response = await fetch(endpoint(), {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ data }),
    });
    if (!response.ok) throw new Error(`保存云端设置失败 HTTP ${response.status}`);
    return enabled;
  };

  const loadGlobalPageSetting = async () => {
    const data = await readBoard();
    const enabled = data?.[FIELD]?.infoPageEnabled;
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
    window.setTimeout(async () => {
      const enabled = localEnabled();
      applyPageVisibility(enabled);
      try {
        await saveGlobalPageSetting(enabled);
        showSaveResult('活动安排页面开关已保存到 Supabase');
      } catch (error) {
        console.error(error);
        showSaveResult('活动安排页面开关保存失败，请再点保存云端');
      }
    }, 80);
  }, true);

  document.addEventListener('click', (event) => {
    const button = event.target?.closest?.('button');
    if (!button || !/保存云端/.test(button.textContent || '')) return;
    window.setTimeout(() => {
      saveGlobalPageSetting(localEnabled())
        .then(() => showSaveResult('全局页面开关已保存到 Supabase'))
        .catch((error) => {
          console.error(error);
          showSaveResult('全局页面开关保存失败');
        });
    }, 1200);
  }, true);

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
