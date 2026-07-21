(() => {
  const isPortraitPhone = () =>
    window.matchMedia('(orientation: portrait)').matches;

  const infoPageEnabled = () => {
    try {
      return localStorage.getItem('ci-page-info-enabled') !== '0';
    } catch {
      return true;
    }
  };

  const enforceGlobalPageSwitch = () => {
    const enabled = infoPageEnabled();
    document.documentElement.dataset.infoPageEnabled = enabled ? '1' : '0';
    if (enabled) return;
    const buttons = [...document.querySelectorAll('.showcase-switcher button')];
    const rankingButton = buttons.find((button) => /改善排名/.test(button.textContent || ''));
    const infoButton = buttons.find((button) => /信息展示|活动|议程/.test(button.textContent || ''));
    if (infoButton) {
      infoButton.style.display = 'none';
      infoButton.disabled = true;
    }
    if (rankingButton && !rankingButton.classList.contains('is-active')) {
      rankingButton.click();
    }
  };

  const mediaPath = (path) => {
    const base = window.location.pathname.startsWith('/mountain-ranking')
      ? '/mountain-ranking'
      : '';
    return `${base}${path}`;
  };

  const icons = {
    ie: '/static-media/icons/ie.png',
    finance: '/static-media/icons/budget.png',
    procurement: '/static-media/icons/procurement.png',
    sales: '/static-media/icons/prototype.png',
    ops: '/static-media/icons/contribution.png',
    ec: '/static-media/icons/economy.png',
  };

  const poster = {
    month: '/static-media/posters/monthly-announcement.jpeg',
    image: '/static-media/posters/eteams-entry.png',
  };

  const textOf = (node) => String(node?.textContent || '').toLowerCase();

  const iconFor = (text) => {
    if (/ie|工业/.test(text)) return icons.ie;
    if (/finance|财务|预算/.test(text)) return icons.finance;
    if (/procurement|采购/.test(text)) return icons.procurement;
    if (/sales|销售/.test(text)) return icons.sales;
    if (/ec|经济|其他/.test(text)) return icons.ec;
    if (/ops|qehs|hr|gmo|研发|贡献/.test(text)) return icons.ops;
    return '';
  };

  const posterFor = (text) => {
    if (/月度公告/.test(text)) return poster.month;
    if (/图片公告|eteams|申请/.test(text)) return poster.image;
    return '';
  };

  const setImage = (img, src) => {
    if (!src) return;
    const next = mediaPath(src);
    if (img.getAttribute('src') !== next) img.setAttribute('src', next);
    img.style.display = '';
    img.classList.remove('ci-media-failed');
  };

  const classifyModules = () => {
    document.querySelectorAll('.mobile-dashboard__module').forEach((module) => {
      const title = textOf(module.querySelector('h2'));
      const isTicker = !!module.querySelector('.mobile-dashboard__ticker');
      const isPoster = /月度公告|图片公告/.test(title);
      module.classList.toggle('is-mobile-ticker', isTicker);
      module.classList.toggle('is-mobile-poster', isPoster);
    });
  };

  const repairMobileImages = () => {
    if (!isPortraitPhone()) return;
    document.querySelectorAll('.mobile-dashboard__rank-row').forEach((row) => {
      const text = textOf(row);
      const climber = row.querySelector('.mobile-dashboard__climber');
      const img = climber?.querySelector('img');
      if (img && (img.complete && img.naturalWidth === 0 || /supabase\.co\/storage\/v1\/object/.test(img.src))) {
        setImage(img, iconFor(text));
      }
    });

    document.querySelectorAll('.mobile-dashboard__module').forEach((module) => {
      const src = posterFor(textOf(module.querySelector('h2')));
      if (!src) return;
      module.querySelectorAll('.mobile-dashboard__media img').forEach((img) => {
        if (img.complete && img.naturalWidth === 0 || /supabase\.co\/storage\/v1\/object/.test(img.src)) {
          setImage(img, src);
        }
      });
    });

    document.querySelectorAll('.mobile-dashboard .ci-media-placeholder').forEach((node) => {
      node.remove();
    });
  };

  let raf = 0;
  const refresh = () => {
    raf = 0;
    enforceGlobalPageSwitch();
    classifyModules();
    repairMobileImages();
  };
  const queue = () => {
    if (!raf) raf = window.requestAnimationFrame(refresh);
  };

  window.addEventListener('resize', queue);
  window.addEventListener('orientationchange', () => window.setTimeout(queue, 120));
  window.addEventListener('storage', (event) => {
    if (event.key === 'ci-page-info-enabled') queue();
  });
  document.addEventListener('DOMContentLoaded', queue);
  document.addEventListener('error', (event) => {
    if (event.target?.tagName === 'IMG') window.setTimeout(queue, 30);
  }, true);
  new MutationObserver(queue).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  window.setInterval(queue, 1600);
  queue();
})();
