const ALLOWED_ORIGINS = [
  'https://looonglive.github.io',
  'http://127.0.0.1:5177',
  'http://127.0.0.1:5176',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5173',
  'null'
];
const BOARD_KEY = 'headquarters-suggestions';

function cors(request) {
  const origin = request.headers.get('Origin') || '';
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : 'https://looonglive.github.io';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, x-edit-password',
    'Access-Control-Max-Age': '86400'
  };
}

function json(request, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...cors(request),
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function mergeDeep(base, patch) {
  if (!isObject(base) || !isObject(patch)) return patch;
  const out = { ...base };
  for (const key of Object.keys(patch)) {
    if (key === 'localStorage' && isObject(patch[key])) {
      out[key] = { ...(isObject(out[key]) ? out[key] : {}), ...patch[key] };
    } else if (isObject(out[key]) && isObject(patch[key])) {
      out[key] = mergeDeep(out[key], patch[key]);
    } else {
      out[key] = patch[key];
    }
  }
  return out;
}

async function readState(env) {
  return await env.DASHBOARD_KV.get(BOARD_KEY, { type: 'json' }) || {
    version: 0,
    savedAt: '',
    data: {}
  };
}

async function writeState(env, wrapper) {
  await env.DASHBOARD_KV.put(BOARD_KEY, JSON.stringify(wrapper));
}

async function saveState(request, env) {
  const body = await request.json().catch(() => ({}));
  const current = await readState(env);
  const incoming = body.data && typeof body.data === 'object' ? body.data : {};
  const nextData = body.patch || body.merge ? mergeDeep(current.data || {}, incoming) : incoming;
  const next = {
    version: Number(current.version || 0) + 1,
    savedAt: new Date().toISOString(),
    data: nextData
  };
  await writeState(env, next);
  return json(request, { ok: true, mode: body.patch || body.merge ? 'patch' : 'replace', savedAt: next.savedAt, version: next.version });
}

async function recordVisit(request, env) {
  const current = await readState(env);
  const data = current.data || {};
  const stats = data.__visitorStats || { visits: [] };
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const cf = request.cf || {};
  const address = [cf.city, cf.region, cf.country].filter(Boolean).join(' / ') || 'unknown';
  const ua = (request.headers.get('User-Agent') || '').slice(0, 120);
  const key = `${ip}|${address}`;
  const now = new Date().toISOString();
  let row = stats.visits.find(item => item.key === key);
  if (!row) {
    row = { key, ip, address, count: 0, firstAt: now, lastAt: '', ua };
    stats.visits.unshift(row);
  }
  row.count = Number(row.count || 0) + 1;
  row.lastAt = now;
  row.ua = ua;
  stats.visits = stats.visits
    .sort((a, b) => String(b.lastAt || '').localeCompare(String(a.lastAt || '')))
    .slice(0, 100);
  data.__visitorStats = stats;
  const next = { version: Number(current.version || 0) + 1, savedAt: now, data };
  await writeState(env, next);
  return json(request, { ok: true, stats });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors(request) });
    }
    const url = new URL(request.url);
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/api/state')) {
      return json(request, await readState(env));
    }
    if (request.method === 'POST' && url.pathname === '/api/state') {
      if (env.EDIT_PASSWORD) {
        const password = request.headers.get('X-Edit-Password') || '';
        if (password !== env.EDIT_PASSWORD) return json(request, { ok: false, error: 'Unauthorized' }, 401);
      }
      return saveState(request, env);
    }
    if (request.method === 'POST' && url.pathname === '/api/visit') {
      return recordVisit(request, env);
    }
    return json(request, { ok: false, error: 'Not found' }, 404);
  }
};
