import type { IDepartment, IFloatModule, IThemeConfig } from '@/types/mountain-ranking';

export interface DashboardData {
  departments: IDepartment[];
  floatModules: IFloatModule[];
  theme: IThemeConfig;
  isManualMode: boolean;
}

interface CloudConfig {
  supabaseUrl: string;
  anonKey: string;
  boardId: string;
}

function getCloudConfig(): CloudConfig | null {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const boardId = import.meta.env.VITE_BOARD_ID || 'headquarters-suggestions';

  if (!supabaseUrl || !anonKey) return null;
  return { supabaseUrl, anonKey, boardId };
}

export function isCloudConfigured() {
  return Boolean(getCloudConfig());
}

function getFunctionUrl(name: string) {
  const config = getCloudConfig();
  if (!config) return null;
  return `${config.supabaseUrl}/functions/v1/${name}`;
}

function getHeaders(config: CloudConfig) {
  return {
    apikey: config.anonKey,
    Authorization: `Bearer ${config.anonKey}`,
  };
}

export async function loadDashboardFromCloud(): Promise<DashboardData | null> {
  const config = getCloudConfig();
  if (!config) return null;

  const params = new URLSearchParams({
    id: `eq.${config.boardId}`,
    select: 'data',
    limit: '1',
  });

  const response = await fetch(`${config.supabaseUrl}/rest/v1/dashboard_pages?${params}`, {
    headers: getHeaders(config),
  });

  if (!response.ok) {
    throw new Error(`云端数据读取失败：${response.status}`);
  }

  const rows = (await response.json()) as Array<{ data?: DashboardData }>;
  return rows[0]?.data ?? null;
}

export async function verifyEditPassword(password: string) {
  const config = getCloudConfig();
  const localPassword = import.meta.env.VITE_EDIT_PASSWORD;

  if (!config) {
    return Boolean(localPassword && password === localPassword);
  }

  const authUrl = getFunctionUrl('dashboard-auth');
  if (!authUrl) return false;

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      ...getHeaders(config),
      'content-type': 'application/json',
      'x-edit-password': password,
    },
    body: JSON.stringify({ boardId: config.boardId }),
  });

  return response.ok;
}

export async function saveDashboardToCloud(data: DashboardData, password: string) {
  const config = getCloudConfig();
  if (!config) {
    throw new Error('还没有配置 Supabase 环境变量，当前只能保存在本机浏览器。');
  }

  const saveUrl = getFunctionUrl('dashboard-save');
  if (!saveUrl) throw new Error('保存接口未配置。');

  const response = await fetch(saveUrl, {
    method: 'POST',
    headers: {
      ...getHeaders(config),
      'content-type': 'application/json',
      'x-edit-password': password,
    },
    body: JSON.stringify({ boardId: config.boardId, data }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `云端保存失败：${response.status}`);
  }
}

export async function uploadDashboardFile(file: File, password: string, folder: string) {
  const config = getCloudConfig();
  if (!config) {
    throw new Error('还没有配置 Supabase 环境变量，无法上传到云端存储桶。');
  }

  if (file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp')) {
    throw new Error('电视端兼容模式下不支持 webp 图片，请改用 jpg 或 png。');
  }

  const uploadUrl = getFunctionUrl('dashboard-upload');
  if (!uploadUrl) throw new Error('上传接口未配置。');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('boardId', config.boardId);
  formData.append('folder', folder);

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      ...getHeaders(config),
      'x-edit-password': password,
    },
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `文件上传失败：${response.status}`);
  }

  const result = (await response.json()) as { url?: string };
  if (!result.url) throw new Error('上传成功但没有返回文件地址。');
  return result.url;
}

