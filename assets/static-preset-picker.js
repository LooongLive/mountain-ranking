(() => {
  const BASE = window.location.pathname.startsWith('/mountain-ranking')
    ? '/mountain-ranking'
    : '';
  const STORAGE_KEY = 'ci-static-media-presets-v1';

  const mediaUrl = (path) => window.__CI_STATIC_MEDIA__?.[path] || `${BASE}${path}`;
  const backgrounds = [
    { id: 'alpine-dawn', name: '冰川晨光', path: '/static-media/backgrounds/alpine-dawn.jpg' },
    { id: 'golden-summits', name: '金色群峰', path: '/static-media/backgrounds/golden-summits.jpg' },
    { id: 'silver-glacier', name: '银色冰川', path: '/static-media/backgrounds/silver-glacier.jpg' },
  ];

  const departments = [
    {
      key: 'ops',
      name: 'OPS / QEHS / HR / GMO',
      match: /OPS|QEHS|HR|GMO/i,
      options: [
        { name: '团队协作', path: '/static-media/icons/presets/ops-team.png' },
        { name: '持续改善', path: '/static-media/icons/contribution.png' },
      ],
    },
    {
      key: 'ie',
      name: 'IE',
      match: /^IE(?:\s|:|$)/i,
      options: [
        { name: '工业工程', path: '/static-media/icons/presets/ie-team.png' },
        { name: '精益改善', path: '/static-media/icons/ie.png' },
      ],
    },
    {
      key: 'procurement',
      name: 'Procurement',
      match: /Procurement|采购/i,
      options: [
        { name: '供应协同', path: '/static-media/icons/presets/procurement-team.png' },
        { name: '采购改善', path: '/static-media/icons/procurement.png' },
      ],
    },
    {
      key: 'sales',
      name: 'Sales',
      match: /Sales|销售/i,
      options: [
        { name: '增长协作', path: '/static-media/icons/presets/sales-team.png' },
        { name: '创意改善', path: '/static-media/icons/prototype.png' },
      ],
    },
    {
      key: 'finance',
      name: 'Finance',
      match: /Finance|财务/i,
      options: [
        { name: '预算管理', path: '/static-media/icons/budget.png' },
        { name: '经营增长', path: '/static-media/icons/economy.png' },
      ],
    },
    {
      key: 'ec',
      name: 'EC',
      match: /^EC(?:\s|:|$)|工程变更/i,
      options: [
        { name: '经济改善', path: '/static-media/icons/economy.png' },
        { name: '流程创新', path: '/static-media/icons/prototype.png' },
      ],
    },
  ];

  const defaults = {
    background: backgrounds[0].path,
    icons: Object.fromEntries(departments.map((department) => [
      department.key,
      department.options[0].path,
    ])),
  };

  const readSelection = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      const savedBackground = String(saved?.background || '').replace(
        /\/static-media\/backgrounds\/(alpine-dawn|golden-summits|silver-glacier)\.png$/,
        '/static-media/backgrounds/$1.jpg',
      );
      return {
        background: savedBackground || defaults.background,
        icons: { ...defaults.icons, ...(saved?.icons || {}) },
      };
    } catch {
      return { background: defaults.background, icons: { ...defaults.icons } };
    }
  };

  let selection = readSelection();

  const saveSelection = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
    } catch {}
  };

  const findDepartment = (text) => departments.find((department) => department.match.test(text));

  const setImage = (image, path) => {
    if (!image || !path) return;
    const next = mediaUrl(path);
    if (image.getAttribute('src') !== next) image.setAttribute('src', next);
    image.classList.remove('ci-media-failed');
    delete image.dataset.ciBrokenHandled;
    image.style.removeProperty('display');
  };

  const showClimberImage = (image, path) => {
    if (!image) return;
    setImage(image, path);
    image.style.setProperty('display', 'block', 'important');
    image.style.setProperty('width', '100%', 'important');
    image.style.setProperty('height', '100%', 'important');
    image.style.setProperty('object-fit', 'contain', 'important');
  };

  const applyBackground = () => {
    document.querySelectorAll('img[alt="雪山背景"]').forEach((image) => {
      setImage(image, selection.background);
      image.style.objectFit = 'cover';
    });
  };

  const applyDepartmentIcons = () => {
    document.querySelectorAll('.ranking-label').forEach((card) => {
      const department = findDepartment(card.textContent || '');
      if (department) showClimberImage(card.querySelector('img[alt="攀登者"]'), selection.icons[department.key]);
    });

    document.querySelectorAll('.mobile-dashboard__rank-row, .landscape-dashboard__rank-card').forEach((card) => {
      const department = findDepartment(card.textContent || '');
      if (!department) return;
      showClimberImage(
        card.querySelector('.mobile-dashboard__climber img, .landscape-dashboard__icon img'),
        selection.icons[department.key],
      );
    });
  };

  const applySelections = () => {
    applyBackground();
    applyDepartmentIcons();
    document.querySelectorAll('.ci-static-preset-button').forEach((button) => {
      const selectedPath = button.dataset.kind === 'background'
        ? selection.background
        : selection.icons[button.dataset.department];
      button.classList.toggle('is-selected', selectedPath === button.dataset.path);
    });
  };

  const presetButton = ({ kind, path, name, department = '' }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ci-static-preset-button';
    button.dataset.kind = kind;
    button.dataset.path = path;
    button.dataset.department = department;
    button.innerHTML = `<img src="${mediaUrl(path)}" alt=""><span>${name}</span>`;
    button.addEventListener('pointerdown', (event) => event.stopPropagation());
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (kind === 'background') selection.background = path;
      else selection.icons[department] = path;
      saveSelection();
      applySelections();
    });
    return button;
  };

  const mountPicker = () => {
    document.querySelectorAll('.settings-glass-menu').forEach((menu) => {
      if (menu.querySelector('.ci-static-presets')) return;
      menu.querySelectorAll('[role="menuitem"]').forEach((item) => {
        if (/^(图片公告|视频公告|上传背景图片|上传背景视频)$/.test((item.textContent || '').trim())) {
          item.style.display = 'none';
        }
      });
      const panel = document.createElement('section');
      panel.className = 'ci-static-presets';

      const backgroundTitle = document.createElement('strong');
      backgroundTitle.textContent = '固定雪山背景';
      panel.appendChild(backgroundTitle);
      const backgroundGrid = document.createElement('div');
      backgroundGrid.className = 'ci-static-background-grid';
      backgrounds.forEach((background) => backgroundGrid.appendChild(presetButton({
        kind: 'background',
        path: background.path,
        name: background.name,
      })));
      panel.appendChild(backgroundGrid);

      const iconTitle = document.createElement('strong');
      iconTitle.textContent = '小组卡片图标';
      panel.appendChild(iconTitle);
      departments.forEach((department) => {
        const row = document.createElement('div');
        row.className = 'ci-static-icon-row';
        const label = document.createElement('span');
        label.textContent = department.name;
        row.appendChild(label);
        const choices = document.createElement('div');
        department.options.forEach((option) => choices.appendChild(presetButton({
          kind: 'icon',
          department: department.key,
          path: option.path,
          name: option.name,
        })));
        row.appendChild(choices);
        panel.appendChild(row);
      });

      const note = document.createElement('small');
      note.textContent = '固定素材由 GitHub 提供，不消耗 Supabase 图片流量。';
      panel.appendChild(note);
      menu.appendChild(panel);
      applySelections();
    });
  };

  const decoratePayload = (payload) => {
    if (!payload?.data || typeof payload.data !== 'object') return payload;
    const data = { ...payload.data };
    data.theme = { ...(data.theme || {}), backgroundImage: selection.background };
    if (Array.isArray(data.departments)) {
      data.departments = data.departments.map((department) => {
        const preset = findDepartment(department.name || '');
        return preset
          ? { ...department, climberImage: selection.icons[preset.key] }
          : department;
      });
    }
    return { ...payload, data };
  };

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const url = String(input?.url || input || '');
    if (url.includes('/functions/v1/dashboard-save') && typeof init.body === 'string') {
      try {
        init = { ...init, body: JSON.stringify(decoratePayload(JSON.parse(init.body))) };
      } catch {}
    }
    return nativeFetch(input, init);
  };

  let frame = 0;
  const queue = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      mountPicker();
      applySelections();
      document.querySelectorAll('button[title="替换攀登者图片"]').forEach((button) => {
        button.style.display = 'none';
      });
    });
  };

  document.addEventListener('DOMContentLoaded', queue);
  new MutationObserver(queue).observe(document.documentElement, { childList: true, subtree: true });
  window.setInterval(queue, 3000);
  queue();
})();
