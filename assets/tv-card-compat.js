(() => {
  const ua = navigator.userAgent || '';
  const isTvBrowser = /SmartTV|Tizen|Web0S|WebOS|NetCast|HbbTV|BRAVIA|Viera|AFT/i.test(ua);
  const supportsGlass =
    typeof CSS !== 'undefined' &&
    (CSS.supports('backdrop-filter', 'blur(1px)') ||
      CSS.supports('-webkit-backdrop-filter', 'blur(1px)'));

  if (isTvBrowser || !supportsGlass) {
    document.documentElement.classList.add('ci-solid-glass');
  }

  const legacyScarf = 'M12 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6';
  const legacyMountain = 'M4 25.5 12.5 8l5.2 9.4';
  const svgNamespace = 'http://www.w3.org/2000/svg';

  const addSvgElement = (svg, tag, attributes) => {
    const element = document.createElementNS(svgNamespace, tag);
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
    svg.appendChild(element);
  };

  const replaceLegacyAvatar = (svg) => {
    if (!svg || svg.dataset.ciSmileAvatar === '1') return;
    const pathData = Array.from(svg.querySelectorAll('path'))
      .map((path) => path.getAttribute('d') || '')
      .join(' ');
    if (!pathData.includes(legacyScarf) && !pathData.includes(legacyMountain)) return;

    svg.dataset.ciSmileAvatar = '1';
    svg.setAttribute('viewBox', '0 0 32 32');
    svg.setAttribute('fill', 'none');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    addSvgElement(svg, 'circle', {
      cx: '16', cy: '16', r: '11', stroke: 'currentColor', 'stroke-width': '2.4'
    });
    addSvgElement(svg, 'circle', { cx: '12', cy: '13', r: '1.5', fill: 'currentColor' });
    addSvgElement(svg, 'circle', { cx: '20', cy: '13', r: '1.5', fill: 'currentColor' });
    addSvgElement(svg, 'path', {
      d: 'M10.5 19c1.5 2 3.3 3 5.5 3s4-1 5.5-3',
      stroke: 'currentColor',
      'stroke-width': '2.4',
      'stroke-linecap': 'round'
    });
  };

  let scheduled = false;
  const cleanLegacyAvatars = () => {
    scheduled = false;
    document.querySelectorAll('.ranking-card svg, .ranking-label svg, .mobile-dashboard__climber svg, .landscape-dashboard__icon svg')
      .forEach(replaceLegacyAvatar);
  };
  const scheduleClean = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(cleanLegacyAvatars);
  };

  document.addEventListener('DOMContentLoaded', scheduleClean);
  new MutationObserver(scheduleClean).observe(document.documentElement, { childList: true, subtree: true });
  scheduleClean();
})();
