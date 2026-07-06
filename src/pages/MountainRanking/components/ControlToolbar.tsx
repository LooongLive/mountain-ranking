import { useRef, useState } from 'react';
import { Plus, Image as ImageIcon, Video, Settings, Eye, Edit3, RotateCcw, Move, TrendingUp, Type, Route, Save, LockKeyhole, LogOut, Camera, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useMountainRanking } from '@/context/MountainRankingContext';
import { exportDashboardImage } from '@/lib/exportDashboardImage';

export default function ControlToolbar() {
  const { isEditMode, isEditAuthorized, isManualMode, setIsEditMode, setIsManualMode, unlockEditing, lockEditing,
    saveToCloud, uploadFile, saveStatus, cloudMessage, addDepartment, addFloatModule, resetToAutoRanking,
    resetAll, theme, setTheme, sortedDepartments, floatModules } = useMountainRanking();

  const bgInputRef = useRef<HTMLInputElement>(null);
  const bgVideoInputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isExporting, setIsExporting] = useState(false);

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
      // message is already shown in the toolbar
    }
  };

  const handleExportImage = async () => {
    setIsExporting(true);
    try {
      await exportDashboardImage({
        departments: sortedDepartments,
        floatModules,
        theme,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : '4K 截图生成失败');
    } finally {
      setIsExporting(false);
    }
  };

  const getHexFromRgba = (rgba: string, fallback: string) => {
    if (rgba.startsWith('#')) return rgba;
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0');
      const g = parseInt(match[2]).toString(16).padStart(2, '0');
      const b = parseInt(match[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    return fallback;
  };

  const getAlphaFromRgba = (rgba: string, fallback: number) => {
    const match = rgba.match(/[\d.]+\)$/);
    return match ? parseFloat(match[0]) : fallback;
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
          <DialogContent className="sm:max-w-sm">
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
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>添加悬浮模块</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => addFloatModule('image')}>
                <ImageIcon className="mr-2 h-4 w-4" />图片公告（A4 竖版）
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addFloatModule('video')}>
                <Video className="mr-2 h-4 w-4" />视频公告（16:9）
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>背景</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => bgInputRef.current?.click()}>
                <ImageIcon className="mr-2 h-4 w-4" />上传背景图片
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => bgVideoInputRef.current?.click()}>
                <Video className="mr-2 h-4 w-4" />上传背景视频
              </DropdownMenuItem>
              <input ref={bgInputRef} type="file" accept="image/png,image/jpeg,image/gif" className="hidden" onChange={handleBgUpload} />
              <input ref={bgVideoInputRef} type="file" accept="video/*" className="hidden" onChange={handleBgVideoUpload} />
              <DropdownMenuSeparator />
              <DropdownMenuLabel>动画效果</DropdownMenuLabel>
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Sparkles className="mr-2 h-4 w-4" />攀登流光动画
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader><DialogTitle>攀登流光动画</DialogTitle></DialogHeader>
                  <div className="space-y-5 py-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">启用流光</Label>
                      <Switch checked={theme.pathGlowEnabled}
                        onCheckedChange={(checked) => setTheme((prev) => ({ ...prev, pathGlowEnabled: checked }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>流光颜色</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={theme.pathGlowColor}
                          onChange={(e) => setTheme((prev) => ({ ...prev, pathGlowColor: e.target.value }))}
                          className="h-9 w-12 cursor-pointer rounded-md border border-border" />
                        <Input type="text" value={theme.pathGlowColor}
                          onChange={(e) => setTheme((prev) => ({ ...prev, pathGlowColor: e.target.value }))}
                          className="h-9 text-xs font-mono flex-1" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>行进速度</Label>
                        <span className="text-xs text-muted-foreground tabular-nums">{theme.pathGlowDuration}s</span>
                      </div>
                      <Slider value={[theme.pathGlowDuration]} min={4} max={30} step={1}
                        onValueChange={([v]) => setTheme((prev) => ({ ...prev, pathGlowDuration: v }))} />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>再次出现间隔</Label>
                        <span className="text-xs text-muted-foreground tabular-nums">{theme.pathGlowInterval}s</span>
                      </div>
                      <Slider value={[theme.pathGlowInterval]} min={0} max={60} step={1}
                        onValueChange={([v]) => setTheme((prev) => ({ ...prev, pathGlowInterval: v }))} />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>备用输出</DropdownMenuLabel>
              <DropdownMenuItem
                disabled={isExporting}
                onSelect={(e) => {
                  e.preventDefault();
                  handleExportImage();
                }}
              >
                <Camera className="mr-2 h-4 w-4" />{isExporting ? '正在生成 4K 截图' : '生成 4K 截图'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>样式设置</DropdownMenuLabel>
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Route className="mr-2 h-4 w-4" />攀登路径样式
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
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
                          <button key={opt.value} type="button"
                            onClick={() => setTheme((prev) => ({ ...prev, pathStyle: opt.value as typeof theme.pathStyle }))}
                            className={`px-3 py-2 rounded-md text-sm border transition-colors ${
                              theme.pathStyle === opt.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-accent/20'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>路径颜色</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={theme.pathColor}
                          onChange={(e) => setTheme((prev) => ({ ...prev, pathColor: e.target.value }))}
                          className="h-9 w-12 cursor-pointer rounded-md border border-border" />
                        <Input type="text" value={theme.pathColor}
                          onChange={(e) => setTheme((prev) => ({ ...prev, pathColor: e.target.value }))}
                          className="h-9 text-xs font-mono flex-1" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>路径粗细</Label>
                        <span className="text-xs text-muted-foreground tabular-nums">{theme.pathWidth.toFixed(2)}</span>
                      </div>
                      <Slider value={[theme.pathWidth]} min={0.1} max={1.5} step={0.05}
                        onValueChange={([v]) => setTheme((prev) => ({ ...prev, pathWidth: v }))} />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Sparkles className="mr-2 h-4 w-4" />攀登流光设置
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader><DialogTitle>攀登流光设置</DialogTitle></DialogHeader>
                  <div className="space-y-5 py-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">启用流光</Label>
                      <Switch checked={theme.pathGlowEnabled}
                        onCheckedChange={(checked) => setTheme((prev) => ({ ...prev, pathGlowEnabled: checked }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>流光颜色</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={theme.pathGlowColor}
                          onChange={(e) => setTheme((prev) => ({ ...prev, pathGlowColor: e.target.value }))}
                          className="h-9 w-12 cursor-pointer rounded-md border border-border" />
                        <Input type="text" value={theme.pathGlowColor}
                          onChange={(e) => setTheme((prev) => ({ ...prev, pathGlowColor: e.target.value }))}
                          className="h-9 text-xs font-mono flex-1" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>行进速度</Label>
                        <span className="text-xs text-muted-foreground tabular-nums">{theme.pathGlowDuration}s</span>
                      </div>
                      <Slider value={[theme.pathGlowDuration]} min={4} max={30} step={1}
                        onValueChange={([v]) => setTheme((prev) => ({ ...prev, pathGlowDuration: v }))} />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>再次出现间隔</Label>
                        <span className="text-xs text-muted-foreground tabular-nums">{theme.pathGlowInterval}s</span>
                      </div>
                      <Slider value={[theme.pathGlowInterval]} min={0} max={60} step={1}
                        onValueChange={([v]) => setTheme((prev) => ({ ...prev, pathGlowInterval: v }))} />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Type className="mr-2 h-4 w-4" />标题与主题设置
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>标题与主题设置</DialogTitle></DialogHeader>
                  <div className="space-y-5 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="mainTitle">主标题</Label>
                      <Input id="mainTitle" value={theme.mainTitle}
                        onChange={(e) => setTheme((prev) => ({ ...prev, mainTitle: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subTitle">副标题</Label>
                      <Input id="subTitle" value={theme.subTitle}
                        onChange={(e) => setTheme((prev) => ({ ...prev, subTitle: e.target.value }))} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>主标题颜色</Label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={theme.mainTitleColor}
                            onChange={(e) => setTheme((prev) => ({ ...prev, mainTitleColor: e.target.value }))}
                            className="h-9 w-12 cursor-pointer rounded-md border border-border" />
                          <span className="text-xs text-muted-foreground">{theme.mainTitleColor}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>副标题颜色</Label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={theme.subTitleColor}
                            onChange={(e) => setTheme((prev) => ({ ...prev, subTitleColor: e.target.value }))}
                            className="h-9 w-12 cursor-pointer rounded-md border border-border" />
                          <span className="text-xs text-muted-foreground">{theme.subTitleColor}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>主标题字号</Label>
                        <span className="text-xs text-muted-foreground tabular-nums">{theme.mainTitleSize}px</span>
                      </div>
                      <Slider value={[theme.mainTitleSize]} min={20} max={80} step={1}
                        onValueChange={([v]) => setTheme((prev) => ({ ...prev, mainTitleSize: v }))} />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>副标题字号</Label>
                        <span className="text-xs text-muted-foreground tabular-nums">{theme.subTitleSize}px</span>
                      </div>
                      <Slider value={[theme.subTitleSize]} min={12} max={40} step={1}
                        onValueChange={([v]) => setTheme((prev) => ({ ...prev, subTitleSize: v }))} />
                    </div>

                    <div className="space-y-3 pt-2 border-t border-border/60">
                      <div className="text-sm font-medium text-foreground">部门标签样式</div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">显示边框</Label>
                        <Switch checked={theme.labelShowBorder}
                          onCheckedChange={(checked) => setTheme((prev) => ({ ...prev, labelShowBorder: checked }))} />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">背景色</Label>
                          <div className="flex items-center gap-1.5">
                            <input type="color"
                              value={getHexFromRgba(theme.labelBgColor, '#ffffff')}
                              onChange={(e) => {
                                const alphaMatch = theme.labelBgColor.match(/[\d.]+\)$/);
                                const alpha = alphaMatch ? parseFloat(alphaMatch[0]) : 0.25;
                                const hex = e.target.value;
                                const r = parseInt(hex.slice(1, 3), 16);
                                const g = parseInt(hex.slice(3, 5), 16);
                                const b = parseInt(hex.slice(5, 7), 16);
                                setTheme((prev) => ({ ...prev, labelBgColor: `rgba(${r}, ${g}, ${b}, ${alpha})` }));
                              }}
                              className="h-8 w-10 cursor-pointer rounded-md border border-border" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">边框色</Label>
                          <div className="flex items-center gap-1.5">
                            <input type="color"
                              value={getHexFromRgba(theme.labelBorderColor, '#ffffff')}
                              onChange={(e) => {
                                const alphaMatch = theme.labelBorderColor.match(/[\d.]+\)$/);
                                const alpha = alphaMatch ? parseFloat(alphaMatch[0]) : 0.6;
                                const hex = e.target.value;
                                const r = parseInt(hex.slice(1, 3), 16);
                                const g = parseInt(hex.slice(3, 5), 16);
                                const b = parseInt(hex.slice(5, 7), 16);
                                setTheme((prev) => ({ ...prev, labelBorderColor: `rgba(${r}, ${g}, ${b}, ${alpha})` }));
                              }}
                              className="h-8 w-10 cursor-pointer rounded-md border border-border" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">文字色</Label>
                          <div className="flex items-center gap-1.5">
                            <input type="color"
                              value={getHexFromRgba(theme.labelTextColor, '#1e3a5f')}
                              onChange={(e) => setTheme((prev) => ({ ...prev, labelTextColor: e.target.value }))}
                              className="h-8 w-10 cursor-pointer rounded-md border border-border" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">背景透明度</Label>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {Math.round(getAlphaFromRgba(theme.labelBgColor, 0.25) * 100)}%
                          </span>
                        </div>
                        <Slider value={[getAlphaFromRgba(theme.labelBgColor, 0.25)]}
                          min={0} max={1} step={0.05}
                          onValueChange={([v]) => {
                            const rgbMatch = theme.labelBgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                            if (rgbMatch) {
                              setTheme((prev) => ({ ...prev, labelBgColor: `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${v})` }));
                            }
                          }} />
                      </div>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-border/60">
                      <div className="text-sm font-medium text-foreground">悬浮模块样式</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">背景色</Label>
                          <div className="flex items-center gap-1.5">
                            <input type="color"
                              value={getHexFromRgba(theme.floatBgColor, '#ffffff')}
                              onChange={(e) => {
                                const alphaMatch = theme.floatBgColor.match(/[\d.]+\)$/);
                                const alpha = alphaMatch ? parseFloat(alphaMatch[0]) : 0.75;
                                const hex = e.target.value;
                                const r = parseInt(hex.slice(1, 3), 16);
                                const g = parseInt(hex.slice(3, 5), 16);
                                const b = parseInt(hex.slice(5, 7), 16);
                                setTheme((prev) => ({ ...prev, floatBgColor: `rgba(${r}, ${g}, ${b}, ${alpha})` }));
                              }}
                              className="h-8 w-10 cursor-pointer rounded-md border border-border" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">边框色</Label>
                          <div className="flex items-center gap-1.5">
                            <input type="color"
                              value={getHexFromRgba(theme.floatBorderColor, '#ffffff')}
                              onChange={(e) => {
                                setTheme((prev) => ({ ...prev, floatBorderColor: e.target.value }));
                              }}
                              className="h-8 w-10 cursor-pointer rounded-md border border-border" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">背景透明度</Label>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {Math.round(getAlphaFromRgba(theme.floatBgColor, 0.75) * 100)}%
                          </span>
                        </div>
                        <Slider value={[getAlphaFromRgba(theme.floatBgColor, 0.75)]}
                          min={0} max={1} step={0.05}
                          onValueChange={([v]) => {
                            const rgbMatch = theme.floatBgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                            if (rgbMatch) {
                              setTheme((prev) => ({ ...prev, floatBgColor: `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${v})` }));
                            }
                          }} />
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={resetToAutoRanking}>
                <RotateCcw className="mr-2 h-4 w-4" />重置为自动排名
              </DropdownMenuItem>
              <DropdownMenuItem onClick={resetAll} className="text-destructive focus:text-destructive">
                <RotateCcw className="mr-2 h-4 w-4" />重置全部数据
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}
