import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { IDepartment, IFloatModule, IThemeConfig } from '@/types/mountain-ranking';
import { generateId } from '@/lib/utils';
import {
  isCloudConfigured,
  loadDashboardFromCloud,
  saveDashboardToCloud,
  uploadDashboardFile,
  verifyEditPassword,
  type DashboardData,
} from '@/lib/dashboardCloud';

const STORAGE_KEYS = {
  departments: '__mountain_ranking_departments',
  floatModules: '__mountain_ranking_modules',
  theme: '__mountain_ranking_theme',
  isManualMode: '__mountain_ranking_manual_mode',
};

const DEFAULT_BG = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80';

const INITIAL_DEPARTMENTS: IDepartment[] = [
  { id: 'dept_ie', name: 'IE', count: 60, unit: '件', position: { x: 88, y: 12, isManual: false }, avatars: [] },
  { id: 'dept_finance', name: '财务', count: 50, unit: '件', position: { x: 74, y: 22, isManual: false }, avatars: [] },
  { id: 'dept_purchase', name: '采购', count: 40, unit: '件', position: { x: 64, y: 34, isManual: false }, avatars: [] },
  { id: 'dept_rd', name: '研发', count: 30, unit: '件', position: { x: 58, y: 47, isManual: false }, avatars: [] },
  { id: 'dept_sales', name: '销售', count: 20, unit: '件', position: { x: 47, y: 59, isManual: false }, avatars: [] },
  { id: 'dept_other', name: '其他组', count: 10, unit: '件', position: { x: 34, y: 71, isManual: false }, avatars: [] },
];

const INITIAL_THEME: IThemeConfig = {
  mainTitle: '攀登改善高峰，共筑卓越之路',
  subTitle: 'Climb the Peak of Improvement, Forge Excellence Together',
  mainTitleColor: 'hsl(222 47% 20%)',
  subTitleColor: 'hsl(222 47% 28%)',
  mainTitleSize: 42,
  subTitleSize: 20,
  backgroundImage: DEFAULT_BG,
  backgroundVideo: '',
  pathStyle: 'dashed',
  pathColor: '#1e3a5f',
  pathWidth: 0.35,
  pathGlowEnabled: true,
  pathGlowColor: '#8bdcff',
  pathGlowDuration: 12,
  pathGlowInterval: 6,
  labelScale: 1,
  labelFontScale: 1,
  labelBgColor: 'rgba(255, 255, 255, 0.25)',
  labelBorderColor: 'rgba(255, 255, 255, 0.6)',
  labelTextColor: '#1e3a5f',
  labelShowBorder: true,
  floatBgColor: 'rgba(255, 255, 255, 0.75)',
  floatBorderColor: 'rgba(255, 255, 255, 0.6)',
};

const INITIAL_FLOAT_MODULES: IFloatModule[] = [
  { id: 'mod_1', type: 'image', title: '月度公告', contentUrl: '', position: { x: 40, y: 200 }, size: { width: 280, height: 396 }, minimized: false, orientation: 'portrait', shadow: { x: 0, y: 16, blur: 36, opacity: 0.24 } },
  { id: 'mod_2', type: 'video', title: '改善案例视频', contentUrl: '', position: { x: 360, y: 260 }, size: { width: 480, height: 270 }, minimized: false, orientation: 'landscape', shadow: { x: 0, y: 16, blur: 36, opacity: 0.24 } },
];

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

interface MountainRankingContextValue {
  departments: IDepartment[];
  sortedDepartments: IDepartment[];
  floatModules: IFloatModule[];
  theme: IThemeConfig;
  isEditMode: boolean;
  isEditAuthorized: boolean;
  isManualMode: boolean;
  isCloudReady: boolean;
  isLoadingCloud: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  cloudMessage: string;
  setDepartments: (depts: IDepartment[] | ((prev: IDepartment[]) => IDepartment[])) => void;
  setFloatModules: (mods: IFloatModule[] | ((prev: IFloatModule[]) => IFloatModule[])) => void;
  setTheme: (theme: IThemeConfig | ((prev: IThemeConfig) => IThemeConfig)) => void;
  setIsEditMode: (v: boolean) => void;
  setIsManualMode: (v: boolean) => void;
  unlockEditing: (password: string) => Promise<boolean>;
  lockEditing: () => void;
  saveToCloud: () => Promise<void>;
  uploadFile: (file: File, folder: string) => Promise<string>;
  addDepartment: () => void;
  removeDepartment: (id: string) => void;
  updateDepartment: (id: string, patch: Partial<IDepartment>) => void;
  updateDepartmentPosition: (id: string, x: number, y: number, isManual: boolean) => void;
  addAvatar: (deptId: string, imageUrl: string) => void;
  updateAvatarPosition: (deptId: string, avatarId: string, offsetX: number, offsetY: number) => void;
  removeAvatar: (deptId: string, avatarId: string) => void;
  addFloatModule: (type: 'image' | 'video' | 'ticker') => void;
  removeFloatModule: (id: string) => void;
  updateFloatModule: (id: string, patch: Partial<IFloatModule>) => void;
  toggleFloatOrientation: (id: string) => void;
  resetToAutoRanking: () => void;
  resetAll: () => void;
}

const MountainRankingContext = createContext<MountainRankingContextValue | null>(null);

export function MountainRankingProvider({ children }: { children: ReactNode }) {
  const [departments, setDepartmentsState] = useState<IDepartment[]>(() =>
    loadFromStorage(STORAGE_KEYS.departments, INITIAL_DEPARTMENTS),
  );
  const [floatModules, setFloatModulesState] = useState<IFloatModule[]>(() =>
    loadFromStorage(STORAGE_KEYS.floatModules, INITIAL_FLOAT_MODULES),
  );
  const [theme, setThemeState] = useState<IThemeConfig>(() => {
    const stored = loadFromStorage<Partial<IThemeConfig> | null>(STORAGE_KEYS.theme, null);
    if (!stored) return INITIAL_THEME;
    return { ...INITIAL_THEME, ...stored };
  });
  const [isEditMode, setIsEditModeState] = useState(false);
  const [isEditAuthorized, setIsEditAuthorized] = useState(false);
  const [editPassword, setEditPassword] = useState('');
  const [isLoadingCloud, setIsLoadingCloud] = useState(true);
  const [saveStatus, setSaveStatus] = useState<MountainRankingContextValue['saveStatus']>('idle');
  const [cloudMessage, setCloudMessage] = useState('');
  const [isManualMode, setIsManualModeState] = useState<boolean>(() =>
    loadFromStorage(STORAGE_KEYS.isManualMode, false),
  );
  const isCloudReady = isCloudConfigured();

  const applyDashboardData = (data: Partial<DashboardData>) => {
    if (data.departments) setDepartmentsState(data.departments);
    if (data.floatModules) setFloatModulesState(data.floatModules);
    if (data.theme) setThemeState({ ...INITIAL_THEME, ...data.theme });
    if (typeof data.isManualMode === 'boolean') setIsManualModeState(data.isManualMode);
  };

  useEffect(() => {
    let mounted = true;

    async function loadCloudData() {
      if (!isCloudReady) {
        setIsLoadingCloud(false);
        setCloudMessage('未配置 Supabase，当前使用本机缓存。');
        return;
      }

      try {
        const data = await loadDashboardFromCloud();
        if (!mounted) return;
        if (data) {
          applyDashboardData(data);
          setCloudMessage('已加载云端最新数据。');
        } else {
          setCloudMessage('云端暂无数据，请编辑后保存一次。');
        }
      } catch (error) {
        if (!mounted) return;
        setCloudMessage(error instanceof Error ? error.message : '云端数据读取失败。');
      } finally {
        if (mounted) setIsLoadingCloud(false);
      }
    }

    loadCloudData();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCloudReady]);

  useEffect(() => { saveToStorage(STORAGE_KEYS.departments, departments); }, [departments]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.floatModules, floatModules); }, [floatModules]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.theme, theme); }, [theme]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.isManualMode, isManualMode); }, [isManualMode]);

  const sortedDepartments = useMemo(
    () => [...departments].sort((a, b) => b.count - a.count),
    [departments],
  );

  const setDepartments: MountainRankingContextValue['setDepartments'] = (updater) => {
    if (typeof updater === 'function') {
      setDepartmentsState((prev) => (updater as (prev: IDepartment[]) => IDepartment[])(prev));
    } else {
      setDepartmentsState(updater);
    }
  };

  const setFloatModules: MountainRankingContextValue['setFloatModules'] = (updater) => {
    if (typeof updater === 'function') {
      setFloatModulesState((prev) => (updater as (prev: IFloatModule[]) => IFloatModule[])(prev));
    } else {
      setFloatModulesState(updater);
    }
  };

  const setTheme: MountainRankingContextValue['setTheme'] = (updater) => {
    if (typeof updater === 'function') {
      setThemeState((prev) => (updater as (prev: IThemeConfig) => IThemeConfig)(prev));
    } else {
      setThemeState(updater);
    }
  };

  const setIsEditMode = (value: boolean) => {
    if (value && !isEditAuthorized) return;
    setIsEditModeState(value);
  };

  const unlockEditing = async (password: string) => {
    const ok = await verifyEditPassword(password);
    if (!ok) return false;

    setEditPassword(password);
    setIsEditAuthorized(true);
    setIsEditModeState(true);
    setCloudMessage('编辑模式已解锁。');
    return true;
  };

  const lockEditing = () => {
    setEditPassword('');
    setIsEditAuthorized(false);
    setIsEditModeState(false);
    setCloudMessage('已退出编辑模式。');
  };

  const getDashboardData = (): DashboardData => ({
    departments,
    floatModules,
    theme,
    isManualMode,
  });

  const saveToCloud = async () => {
    setSaveStatus('saving');
    setCloudMessage('正在保存到云端...');
    try {
      await saveDashboardToCloud(getDashboardData(), editPassword);
      setSaveStatus('saved');
      setCloudMessage('已保存到云端。');
    } catch (error) {
      setSaveStatus('error');
      setCloudMessage(error instanceof Error ? error.message : '保存失败。');
      throw error;
    }
  };

  const uploadFile = async (file: File, folder: string) => {
    return uploadDashboardFile(file, editPassword, folder);
  };

  const addDepartment = () => {
    const newDept: IDepartment = {
      id: generateId('dept'),
      name: '新部门',
      count: 0,
      unit: '件',
      position: { x: 50, y: 50, isManual: false },
      avatars: [],
    };
    setDepartments((prev) => [...prev, newDept]);
  };

  const removeDepartment = (id: string) => {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
  };

  const updateDepartment = (id: string, patch: Partial<IDepartment>) => {
    setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const updateDepartmentPosition = (id: string, x: number, y: number, isManual: boolean) => {
    setDepartments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, position: { x, y, isManual } } : d)),
    );
  };

  const addAvatar = (deptId: string, imageUrl: string) => {
    setDepartments((prev) =>
      prev.map((d) =>
        d.id === deptId
          ? {
              ...d,
              avatars: [
                ...d.avatars,
                {
                  id: generateId('av'),
                  deptId,
                  imageUrl,
                  offsetX: 60 + d.avatars.length * 40,
                  offsetY: -20,
                },
              ],
            }
          : d,
      ),
    );
  };

  const updateAvatarPosition = (deptId: string, avatarId: string, offsetX: number, offsetY: number) => {
    setDepartments((prev) =>
      prev.map((d) =>
        d.id === deptId
          ? { ...d, avatars: d.avatars.map((a) => (a.id === avatarId ? { ...a, offsetX, offsetY } : a)) }
          : d,
      ),
    );
  };

  const removeAvatar = (deptId: string, avatarId: string) => {
    setDepartments((prev) =>
      prev.map((d) => (d.id === deptId ? { ...d, avatars: d.avatars.filter((a) => a.id !== avatarId) } : d)),
    );
  };

  const addFloatModule = (type: 'image' | 'video' | 'ticker') => {
    const isPortrait = type === 'image';
    const size = type === 'ticker'
      ? { width: 520, height: 168 }
      : isPortrait ? { width: 280, height: 396 } : { width: 480, height: 270 };
    const newMod: IFloatModule = {
      id: generateId('mod'),
      type,
      title: type === 'image' ? '图片公告' : type === 'video' ? '视频公告' : '改善信息滚动',
      contentUrl: '',
      position: { x: 120 + floatModules.length * 30, y: 180 + floatModules.length * 30 },
      size,
      minimized: false,
      orientation: isPortrait ? 'portrait' : 'landscape',
      visibleRows: type === 'ticker' ? 2 : undefined,
      scrollItems: type === 'ticker'
        ? [
            { id: generateId('msg'), name: '姓名', content: '改善内容' },
            { id: generateId('msg'), name: '姓名', content: '改善内容' },
          ]
        : undefined,
      shadow: { x: 0, y: 16, blur: 36, opacity: 0.24 },
    };
    setFloatModules((prev) => [...prev, newMod]);
  };

  const removeFloatModule = (id: string) => {
    setFloatModules((prev) => prev.filter((m) => m.id !== id));
  };

  const updateFloatModule = (id: string, patch: Partial<IFloatModule>) => {
    setFloatModules((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const toggleFloatOrientation = (id: string) => {
    setFloatModules((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const newOrientation = m.orientation === 'portrait' ? 'landscape' : 'portrait';
        return {
          ...m,
          orientation: newOrientation,
          size: { width: m.size.height, height: m.size.width },
        };
      }),
    );
  };

  const resetToAutoRanking = () => {
    const sorted = [...departments].sort((a, b) => b.count - a.count);
    const n = sorted.length;
    const updated = sorted.map((d, i) => {
      const t = n <= 1 ? 0 : i / (n - 1);
      const y = 15 + t * 60;
      const x = 85 - t * 55;
      return { ...d, position: { x, y, isManual: false } };
    });
    setDepartments(updated);
    setIsManualModeState(false);
  };

  const resetAll = () => {
    setDepartmentsState(INITIAL_DEPARTMENTS);
    setFloatModulesState(INITIAL_FLOAT_MODULES);
    setThemeState(INITIAL_THEME);
    setIsManualModeState(false);
  };

  const value: MountainRankingContextValue = {
    departments,
    sortedDepartments,
    floatModules,
    theme,
    isEditMode,
    isEditAuthorized,
    isManualMode,
    isCloudReady,
    isLoadingCloud,
    saveStatus,
    cloudMessage,
    setDepartments,
    setFloatModules,
    setTheme,
    setIsEditMode,
    setIsManualMode: setIsManualModeState,
    unlockEditing,
    lockEditing,
    saveToCloud,
    uploadFile,
    addDepartment,
    removeDepartment,
    updateDepartment,
    updateDepartmentPosition,
    addAvatar,
    updateAvatarPosition,
    removeAvatar,
    addFloatModule,
    removeFloatModule,
    updateFloatModule,
    toggleFloatOrientation,
    resetToAutoRanking,
    resetAll,
  };

  return (
    <MountainRankingContext.Provider value={value}>
      {children}
    </MountainRankingContext.Provider>
  );
}

export function useMountainRanking() {
  const ctx = useContext(MountainRankingContext);
  if (!ctx) {
    throw new Error('useMountainRanking must be used within MountainRankingProvider');
  }
  return ctx;
}
