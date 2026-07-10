import { useRef, useState } from 'react';
import {
  Plus,
  Image as ImageIcon,
  Video,
  Settings,
  Eye,
  Edit3,
  RotateCcw,
  Move,
  TrendingUp,
  Type,
  Route,
  Save,
  LockKeyhole,
  LogOut,
  Camera,
  Sparkles,
  MessageSquareText,
  Scaling,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useMountainRanking } from '@/context/MountainRankingContext';
import { exportDashboardImage } from '@/lib/exportDashboardImage';

type SettingsDialog = 'title' | 'path' | 'glow' | 'card' | 'bubbles' | null;

export default function ControlToolbar() {
  const {
    isEditMode,
    isEditAuthorized,
    isManualMode,
    setIsEditMode,
    setIsManualMode,
    unlockEditing,
    lockEditing,
    saveToCloud,
    uploadFile,
    saveStatus,
    cloudMessage,
    addDepartment,
    addFloatModule,
    resetToAutoRanking,
    resetAll,
    theme,
    setTheme,
    sortedDepartments,
    floatModules,
  } = useMountainRanking();

  const bgInputRef = useRef<HTMLInputElement>(null);
  const bgVideoInputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState<SettingsDialog>(null);

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file, 'backgrounds');
      setTheme((prev) => ({ ...prev, backgroundImage: url, backgroundVideo: '' }));
    } catch (error) {
      alert(error instanceof Error ? error.message : '背景图片上传失败');
    }
    if (bgInputRef.current) bgInputRef.current.value = '';
  };

  const handleBgVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file, 'background-videos');
      setTheme((prev) => ({ ...prev, backgroundVideo: url }));
    } catch (error) {
      alert(error instanceof Error ? error.message : '背景视频上传失败');
    }
    if (bgVideoInputRef.current) bgVideoInputRef.current.value = '';
  };

  const handleUnlock = async () => {
    setAuthError('');
    try {
      const ok = await unlockEditing(password);
      if (!ok) {
        setAuthError('密码不正确，请重新输入。');
        return;
      }
      setPassword('');
      setAuthOpen(false);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : '密码验证失败。');
    }
  };

  const handleSave = async () => {
    try {
      await saveToCloud();
    } catch {
      // 提示已由云端状态展示。
    }
  };

  const handleExportImage = async () => {
    setIsExporting(true);
    try {
      await exportDashboardImage({ departments: sortedDepartments, floatModules, theme });
    } catch (error) {
      alert(error instanceof Error ? error.message : '4K 截图生成失败');
    } finally {
      setIsExporting(false);
    }
  };

  const getHexFromRgba = (rgba: string, fallback: string) => {
    if (rgba.startsWith('#')) return rgba;
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return fallback;
    return `#${parseInt(match[1]).toString(16).padStart(2, '0')}${parseInt(match[2]).toString(16).padStart(2, '0')}${parseInt(match[3]).toString(16).padStart(2, '0')}`;
  };

  const getAlphaFromRgba = (rgba: string, fallback: number) => {
    const match = rgba.match(/,\s*([\d.]+)\s*\)$/);
    return match ? parseFloat(match[1]) : fallback;
  };

  const rgbaFromHex = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const updateRgbaColor = (key: 'labelBgColor' | 'labelBorderColor' | 'floatBgColor' | 'floatBorderColor', hex: string, fallbackAlpha: number) => {
    const current = theme[key];
    setTheme((prev) => ({ ...prev, [key]: rgbaFromHex(hex, getAlphaFromRgba(current, fallbackAlpha)) }));
  };

  return (
    <div className="dashboard-toolbar fixed top-4 right-4 z-50 flex items-center gap-2">
      {!isEditAuthorized ? (
        <Dialog open={authOpen} onOpenChange={setAuthOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm" className="shadow-md">
              <LockKeyhole className="mr-1.5 h-4 w-4" />编辑登录
            </Button>
          </DialogTrigger>
          <DialogContent className="settings-glass-panel sm:max-w-sm">
            <DialogHeader><DialogTitle>输入编辑密码</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <Input
                autoFocus
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleUnlock(); }}
                placeholder="请输入编辑密码"
              />
              {authError && <p className="text-sm text-destructive">{authError}</p>}
              <Button type="button" className="w-full" onClick={handleUnlock} disabled={!password.trim()}>
                进入编辑模式
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <>
          <Button variant={isEditMode ? 'default' : 'secondary'} size="sm" onClick={() => setIsEditMode(!isEditMode)} className="shadow-md">
            {isEditMode ? (<><Eye className="mr-1.5 h-4 w-4" />预览模式</>) : (<><Edit3 className="mr-1.5 h-4 w-4" />编辑模式</>)}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSave} className="shadow-sm" disabled={saveStatus === 'saving'}>
            <Save className="mr-1.5 h-4 w-4" />{saveStatus === 'saving' ? '保存中' : '保存云端'}
          </Button>
          <Button variant="ghost" size="icon" onClick={lockEditing} className="shadow-sm bg-background/80" title="退出编辑">
            <LogOut className="h-4 w-4" />
          </Button>
        </>
      )}

      {cloudMessage && <div className="hidden xl:block max-w-72 truncate rounded-md border border-border bg-background/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">{cloudMessage}</div>}

      {isEditAuthorized && isEditMode && (
        <>
          <div className="flex items-center gap-1 rounded-md border border-border bg-background/90 backdrop-blur-sm p-1 shadow-sm">
            <Button variant={!isManualMode ? 'default' : 'ghost'} size="sm" onClick={() => setIsManualMode(false)} className="h-7 text-xs">
              <TrendingUp className="mr-1 h-3.5 w-3.5" />自动排名
            </Button>
            <Button variant={isManualMode ? 'default' : 'ghost'} size="sm" onClick={() => setIsManualMode(true)} className="h-7 text-xs">
              <Move className="mr-1 h-3.5 w-3.5" />手动拖拽
            </Button>
          </div>

          <Button variant="secondary" size="sm" onClick={addDepartment} className="shadow-sm">
            <Plus className="mr-1.5 h-4 w-4" />添加部门
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="shadow-sm"><Settings className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="settings-glass-menu w-64 max-h-[78vh] overflow-y-auto">
              <DropdownMenuLabel>添加模块</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => addFloatModule('image')}>
                <ImageIcon className="mr-2 h-4 w-4" />图片公告
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addFloatModule('video')}>
                <Video className="mr-2 h-4 w-4" />视频公告
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addFloatModule('ticker')}>
                <MessageSquareText className="mr-2 h-4 w-4" />信息滚动模块
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>背景</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => bgInputRef.current?.click()}>
                <ImageIcon className="mr-2 h-4 w-4" />上传背景图片
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => bgVideoInputRef.current?.click()}>
                <Video className="mr-2 h-4 w-4" />上传背景视频
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>设置</DropdownMenuLabel>
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSettingsDialog('title'); }}>
                <Type className="mr-2 h-4 w-4" />标题与主题
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSettingsDialog('card'); }}>
                <Scaling className="mr-2 h-4 w-4" />卡片尺寸与字体
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSettingsDialog('path'); }}>
                <Route className="mr-2 h-4 w-4" />攀登路径样式
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSettingsDialog('glow'); }}>
                <Sparkles className="mr-2 h-4 w-4" />攀登流光设置
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSettingsDialog('bubbles'); }}>
                <MessageSquareText className="mr-2 h-4 w-4" />漫画气泡设置
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>备用输出</DropdownMenuLabel>
              <DropdownMenuItem disabled={isExporting} onSelect={(e) => { e.preventDefault(); handleExportImage(); }}>
                <Camera className="mr-2 h-4 w-4" />{isExporting ? '正在生成 4K 截图' : '生成 4K 截图'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={resetToAutoRanking}>
                <RotateCcw className="mr-2 h-4 w-4" />重置为自动排名
              </DropdownMenuItem>
              <DropdownMenuItem onClick={resetAll} className="text-destructive focus:text-destructive">
                <RotateCcw className="mr-2 h-4 w-4" />重置全部数据
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <input ref={bgInputRef} type="file" accept="image/png,image/jpeg,image/gif" className="hidden" onChange={handleBgUpload} />
          <input ref={bgVideoInputRef} type="file" accept="video/*" className="hidden" onChange={handleBgVideoUpload} />
        </>
      )}

      <Dialog open={settingsDialog === 'glow'} onOpenChange={(open) => setSettingsDialog(open ? 'glow' : null)}>
        <DialogContent className="settings-glass-panel sm:max-w-md">
          <DialogHeader><DialogTitle>攀登流光设置</DialogTitle></DialogHeader>
          <div className="space-y-5 py-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">启用流光</Label>
              <Switch checked={theme.pathGlowEnabled} onCheckedChange={(checked) => setTheme((prev) => ({ ...prev, pathGlowEnabled: checked }))} />
            </div>
            <div className="space-y-2">
              <Label>流光颜色</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={theme.pathGlowColor} onChange={(e) => setTheme((prev) => ({ ...prev, pathGlowColor: e.target.value }))} className="h-9 w-12 cursor-pointer rounded-md border border-border" />
                <Input value={theme.pathGlowColor} onChange={(e) => setTheme((prev) => ({ ...prev, pathGlowColor: e.target.value }))} className="h-9 text-xs font-mono flex-1" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><Label>行进速度</Label><span className="text-xs text-muted-foreground tabular-nums">{theme.pathGlowDuration}s</span></div>
              <Slider value={[theme.pathGlowDuration]} min={4} max={30} step={1} onValueChange={([v]) => setTheme((prev) => ({ ...prev, pathGlowDuration: v }))} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><Label>再次出现间隔</Label><span className="text-xs text-muted-foreground tabular-nums">{theme.pathGlowInterval}s</span></div>
              <Slider value={[theme.pathGlowInterval]} min={0} max={60} step={1} onValueChange={([v]) => setTheme((prev) => ({ ...prev, pathGlowInterval: v }))} />
            </div>
            <div className="space-y-3 rounded-xl border border-white/50 bg-white/55 p-3">
              <div className="flex items-center justify-between">
                <Label>顶部流光边框持续</Label>
                <span className="text-xs text-muted-foreground tabular-nums">{theme.pathGlowBorderDuration ?? 3}s</span>
              </div>
              <Slider
                value={[theme.pathGlowBorderDuration ?? 3]}
                min={1}
                max={12}
                step={0.5}
                onValueChange={([v]) => setTheme((prev) => ({ ...prev, pathGlowBorderDuration: v }))}
              />
              <div className="grid grid-cols-[76px_1fr] items-center gap-2">
                <Label className="text-xs">边框浅色</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={theme.pathGlowBorderColorA ?? '#E2CBFF'} onChange={(e) => setTheme((prev) => ({ ...prev, pathGlowBorderColorA: e.target.value }))} className="h-8 w-10 cursor-pointer rounded-md border border-border" />
                  <Input value={theme.pathGlowBorderColorA ?? '#E2CBFF'} onChange={(e) => setTheme((prev) => ({ ...prev, pathGlowBorderColorA: e.target.value }))} className="h-8 text-xs font-mono" />
                </div>
                <Label className="text-xs">边框深色</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={theme.pathGlowBorderColorB ?? '#393BB2'} onChange={(e) => setTheme((prev) => ({ ...prev, pathGlowBorderColorB: e.target.value }))} className="h-8 w-10 cursor-pointer rounded-md border border-border" />
                  <Input value={theme.pathGlowBorderColorB ?? '#393BB2'} onChange={(e) => setTheme((prev) => ({ ...prev, pathGlowBorderColorB: e.target.value }))} className="h-8 text-xs font-mono" />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsDialog === 'card'} onOpenChange={(open) => setSettingsDialog(open ? 'card' : null)}>
        <DialogContent className="settings-glass-panel sm:max-w-md">
          <DialogHeader><DialogTitle>卡片尺寸与字体</DialogTitle></DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between"><Label>卡片整体尺寸</Label><span className="text-xs text-muted-foreground tabular-nums">{Math.round((theme.labelScale ?? 1) * 100)}%</span></div>
              <Slider value={[theme.labelScale ?? 1]} min={0.55} max={2.4} step={0.05} onValueChange={([v]) => setTheme((prev) => ({ ...prev, labelScale: v }))} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><Label>卡片内部字体</Label><span className="text-xs text-muted-foreground tabular-nums">{Math.round((theme.labelFontScale ?? 1) * 100)}%</span></div>
              <Slider value={[theme.labelFontScale ?? 1]} min={0.7} max={2.2} step={0.05} onValueChange={([v]) => setTheme((prev) => ({ ...prev, labelFontScale: v }))} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><Label>卡片背景透明度</Label><span className="text-xs text-muted-foreground tabular-nums">{Math.round(getAlphaFromRgba(theme.labelBgColor, 0.25) * 100)}%</span></div>
              <Slider value={[getAlphaFromRgba(theme.labelBgColor, 0.25)]} min={0} max={1} step={0.05} onValueChange={([v]) => setTheme((prev) => ({ ...prev, labelBgColor: rgbaFromHex(getHexFromRgba(theme.labelBgColor, '#ffffff'), v) }))} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><Label>卡片背景模糊</Label><span className="text-xs text-muted-foreground tabular-nums">{theme.labelBlur ?? 35}px</span></div>
              <Slider value={[theme.labelBlur ?? 35]} min={0} max={100} step={1} onValueChange={([v]) => setTheme((prev) => ({ ...prev, labelBlur: v }))} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsDialog === 'bubbles'} onOpenChange={(open) => setSettingsDialog(open ? 'bubbles' : null)}>
        <DialogContent className="settings-glass-panel sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>漫画气泡设置</DialogTitle></DialogHeader>
          <div className="space-y-5 py-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">启用气泡</Label>
              <Switch checked={theme.speechBubblesEnabled} onCheckedChange={(checked) => setTheme((prev) => ({ ...prev, speechBubblesEnabled: checked }))} />
            </div>
            <div className="space-y-3">
              <Label>气泡款式</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'rounded', label: '圆润' },
                  { value: 'comic', label: '漫画' },
                  { value: 'cloud', label: '云朵' },
                  { value: 'burst', label: '爆炸' },
                  { value: 'caption', label: '对白' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTheme((prev) => ({ ...prev, speechBubbleStyle: opt.value as typeof theme.speechBubbleStyle }))}
                    className={`px-3 py-2 rounded-md text-sm border transition-colors ${theme.speechBubbleStyle === opt.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-background/70 border-border hover:bg-accent/20'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>背景颜色</Label>
                <input
                  type="color"
                  value={getHexFromRgba(theme.speechBubbleColor, '#ffffff')}
                  onChange={(e) => setTheme((prev) => ({ ...prev, speechBubbleColor: rgbaFromHex(e.target.value, getAlphaFromRgba(theme.speechBubbleColor, 0.58)) }))}
                  className="h-9 w-12 cursor-pointer rounded-md border border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>文字颜色</Label>
                <input
                  type="color"
                  value={getHexFromRgba(theme.speechBubbleTextColor, '#1e3a5f')}
                  onChange={(e) => setTheme((prev) => ({ ...prev, speechBubbleTextColor: e.target.value }))}
                  className="h-9 w-12 cursor-pointer rounded-md border border-border"
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><Label>背景透明度</Label><span className="text-xs text-muted-foreground tabular-nums">{Math.round(getAlphaFromRgba(theme.speechBubbleColor, 0.58) * 100)}%</span></div>
              <Slider
                value={[getAlphaFromRgba(theme.speechBubbleColor, 0.58)]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={([v]) => setTheme((prev) => ({ ...prev, speechBubbleColor: rgbaFromHex(getHexFromRgba(theme.speechBubbleColor, '#ffffff'), v) }))}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><Label>整体透明度</Label><span className="text-xs text-muted-foreground tabular-nums">{Math.round((theme.speechBubbleOpacity ?? 0.92) * 100)}%</span></div>
              <Slider value={[theme.speechBubbleOpacity ?? 0.92]} min={0.2} max={1} step={0.05} onValueChange={([v]) => setTheme((prev) => ({ ...prev, speechBubbleOpacity: v }))} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><Label>气泡大小</Label><span className="text-xs text-muted-foreground tabular-nums">{Math.round((theme.speechBubbleScale ?? 1) * 100)}%</span></div>
              <Slider value={[theme.speechBubbleScale ?? 1]} min={0.65} max={1.8} step={0.05} onValueChange={([v]) => setTheme((prev) => ({ ...prev, speechBubbleScale: v }))} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><Label>玻璃模糊</Label><span className="text-xs text-muted-foreground tabular-nums">{theme.speechBubbleBlur ?? 22}px</span></div>
              <Slider value={[theme.speechBubbleBlur ?? 22]} min={0} max={48} step={1} onValueChange={([v]) => setTheme((prev) => ({ ...prev, speechBubbleBlur: v }))} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><Label>单次停留时间</Label><span className="text-xs text-muted-foreground tabular-nums">{theme.speechBubbleHoldSeconds ?? 2.6}s</span></div>
              <Slider value={[theme.speechBubbleHoldSeconds ?? 2.6]} min={1.5} max={5} step={0.1} onValueChange={([v]) => setTheme((prev) => ({ ...prev, speechBubbleHoldSeconds: v }))} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><Label>再次出现间隔</Label><span className="text-xs text-muted-foreground tabular-nums">{theme.speechBubbleIntervalSeconds ?? 5}s</span></div>
              <Slider value={[theme.speechBubbleIntervalSeconds ?? 5]} min={2} max={12} step={0.5} onValueChange={([v]) => setTheme((prev) => ({ ...prev, speechBubbleIntervalSeconds: v }))} />
            </div>
            <div className="space-y-2">
              <Label>第一名气泡预设</Label>
              <textarea
                value={(theme.speechBubbleMessagesTop ?? []).join('\n')}
                onChange={(e) => setTheme((prev) => ({ ...prev, speechBubbleMessagesTop: e.target.value.split(/\n|[｜|]/).map((item) => item.trim()).filter(Boolean) }))}
                className="min-h-24 w-full resize-y rounded-md border border-border bg-background/70 p-2 text-sm leading-relaxed"
                placeholder="每行一句，随机出现"
              />
            </div>
            <div className="space-y-2">
              <Label>其他部门气泡预设</Label>
              <textarea
                value={(theme.speechBubbleMessagesNormal ?? []).join('\n')}
                onChange={(e) => setTheme((prev) => ({ ...prev, speechBubbleMessagesNormal: e.target.value.split(/\n|[｜|]/).map((item) => item.trim()).filter(Boolean) }))}
                className="min-h-24 w-full resize-y rounded-md border border-border bg-background/70 p-2 text-sm leading-relaxed"
                placeholder="每行一句，随机出现"
              />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              单独点击卡片旁边的气泡，可以为某一个部门覆盖自己的文案、颜色、透明度和大小。
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsDialog === 'path'} onOpenChange={(open) => setSettingsDialog(open ? 'path' : null)}>
        <DialogContent className="settings-glass-panel sm:max-w-md">
          <DialogHeader><DialogTitle>攀登路径样式</DialogTitle></DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-3">
              <Label>路径样式</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'dashed', label: '虚线' },
                  { value: 'solid', label: '实线' },
                  { value: 'dots', label: '圆点' },
                  { value: 'wave', label: '波浪' },
                  { value: 'arrow', label: '箭头' },
                  { value: 'footprint', label: '脚印' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTheme((prev) => ({ ...prev, pathStyle: opt.value as typeof theme.pathStyle }))}
                    className={`px-3 py-2 rounded-md text-sm border transition-colors ${theme.pathStyle === opt.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-background/70 border-border hover:bg-accent/20'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>路径颜色</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={theme.pathColor} onChange={(e) => setTheme((prev) => ({ ...prev, pathColor: e.target.value }))} className="h-9 w-12 cursor-pointer rounded-md border border-border" />
                <Input value={theme.pathColor} onChange={(e) => setTheme((prev) => ({ ...prev, pathColor: e.target.value }))} className="h-9 text-xs font-mono flex-1" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><Label>路径粗细</Label><span className="text-xs text-muted-foreground tabular-nums">{theme.pathWidth.toFixed(2)}</span></div>
              <Slider value={[theme.pathWidth]} min={0.1} max={1.5} step={0.05} onValueChange={([v]) => setTheme((prev) => ({ ...prev, pathWidth: v }))} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsDialog === 'title'} onOpenChange={(open) => setSettingsDialog(open ? 'title' : null)}>
        <DialogContent className="settings-glass-panel sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>标题与主题设置</DialogTitle></DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="mainTitle">主标题</Label>
              <Input id="mainTitle" value={theme.mainTitle} onChange={(e) => setTheme((prev) => ({ ...prev, mainTitle: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subTitle">副标题</Label>
              <Input id="subTitle" value={theme.subTitle} onChange={(e) => setTheme((prev) => ({ ...prev, subTitle: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>主标题颜色</Label>
                <input type="color" value={theme.mainTitleColor} onChange={(e) => setTheme((prev) => ({ ...prev, mainTitleColor: e.target.value }))} className="h-9 w-12 cursor-pointer rounded-md border border-border" />
              </div>
              <div className="space-y-2">
                <Label>副标题颜色</Label>
                <input type="color" value={theme.subTitleColor} onChange={(e) => setTheme((prev) => ({ ...prev, subTitleColor: e.target.value }))} className="h-9 w-12 cursor-pointer rounded-md border border-border" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><Label>主标题字号</Label><span className="text-xs text-muted-foreground tabular-nums">{theme.mainTitleSize}px</span></div>
              <Slider value={[theme.mainTitleSize]} min={20} max={80} step={1} onValueChange={([v]) => setTheme((prev) => ({ ...prev, mainTitleSize: v }))} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><Label>副标题字号</Label><span className="text-xs text-muted-foreground tabular-nums">{theme.subTitleSize}px</span></div>
              <Slider value={[theme.subTitleSize]} min={12} max={40} step={1} onValueChange={([v]) => setTheme((prev) => ({ ...prev, subTitleSize: v }))} />
            </div>
            <div className="space-y-3 rounded-xl border border-border/60 bg-background/40 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-foreground">标题位置</div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2 text-xs"
                  onClick={() => setTheme((prev) => ({ ...prev, titlePositionX: 960, titlePositionY: 42 }))}
                >
                  回到顶部居中
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">横向位置</Label>
                  <span className="text-xs text-muted-foreground tabular-nums">{Math.round(theme.titlePositionX ?? 960)}</span>
                </div>
                <Slider
                  value={[theme.titlePositionX ?? 960]}
                  min={160}
                  max={1760}
                  step={1}
                  onValueChange={([v]) => setTheme((prev) => ({ ...prev, titlePositionX: v }))}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">纵向位置</Label>
                  <span className="text-xs text-muted-foreground tabular-nums">{Math.round(theme.titlePositionY ?? 42)}</span>
                </div>
                <Slider
                  value={[theme.titlePositionY ?? 42]}
                  min={0}
                  max={320}
                  step={1}
                  onValueChange={([v]) => setTheme((prev) => ({ ...prev, titlePositionY: v }))}
                />
              </div>
              <p className="text-xs text-muted-foreground">也可以在编辑模式下直接拖动标题。</p>
            </div>
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="text-sm font-medium text-foreground">部门标签样式</div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">显示边框</Label>
                <Switch checked={theme.labelShowBorder} onCheckedChange={(checked) => setTheme((prev) => ({ ...prev, labelShowBorder: checked }))} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">背景色</Label>
                  <input type="color" value={getHexFromRgba(theme.labelBgColor, '#ffffff')} onChange={(e) => updateRgbaColor('labelBgColor', e.target.value, 0.25)} className="h-8 w-10 cursor-pointer rounded-md border border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">边框色</Label>
                  <input type="color" value={getHexFromRgba(theme.labelBorderColor, '#ffffff')} onChange={(e) => updateRgbaColor('labelBorderColor', e.target.value, 0.6)} className="h-8 w-10 cursor-pointer rounded-md border border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">文字色</Label>
                  <input type="color" value={getHexFromRgba(theme.labelTextColor, '#1e3a5f')} onChange={(e) => setTheme((prev) => ({ ...prev, labelTextColor: e.target.value }))} className="h-8 w-10 cursor-pointer rounded-md border border-border" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between"><Label className="text-xs">标签背景透明度</Label><span className="text-xs text-muted-foreground">{Math.round(getAlphaFromRgba(theme.labelBgColor, 0.25) * 100)}%</span></div>
                <Slider value={[getAlphaFromRgba(theme.labelBgColor, 0.25)]} min={0} max={1} step={0.05} onValueChange={([v]) => setTheme((prev) => ({ ...prev, labelBgColor: rgbaFromHex(getHexFromRgba(theme.labelBgColor, '#ffffff'), v) }))} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between"><Label className="text-xs">标签背景模糊</Label><span className="text-xs text-muted-foreground">{theme.labelBlur ?? 35}px</span></div>
                <Slider value={[theme.labelBlur ?? 35]} min={0} max={100} step={1} onValueChange={([v]) => setTheme((prev) => ({ ...prev, labelBlur: v }))} />
              </div>
            </div>
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="text-sm font-medium text-foreground">悬浮模块样式</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">背景色</Label>
                  <input type="color" value={getHexFromRgba(theme.floatBgColor, '#ffffff')} onChange={(e) => updateRgbaColor('floatBgColor', e.target.value, 0.75)} className="h-8 w-10 cursor-pointer rounded-md border border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">边框色</Label>
                  <input type="color" value={getHexFromRgba(theme.floatBorderColor, '#ffffff')} onChange={(e) => updateRgbaColor('floatBorderColor', e.target.value, 0.6)} className="h-8 w-10 cursor-pointer rounded-md border border-border" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between"><Label className="text-xs">模块背景透明度</Label><span className="text-xs text-muted-foreground">{Math.round(getAlphaFromRgba(theme.floatBgColor, 0.75) * 100)}%</span></div>
                <Slider value={[getAlphaFromRgba(theme.floatBgColor, 0.75)]} min={0} max={1} step={0.05} onValueChange={([v]) => setTheme((prev) => ({ ...prev, floatBgColor: rgbaFromHex(getHexFromRgba(theme.floatBgColor, '#ffffff'), v) }))} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
