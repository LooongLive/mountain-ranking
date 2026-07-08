import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import {
  X,
  Minus,
  Image as ImageIcon,
  Video,
  Upload,
  RotateCw,
  MessageSquareText,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn, generateId } from '@/lib/utils';
import type {
  AnnouncementTransition,
  IFloatModule,
  IFloatModulePage,
  IModuleShadow,
  IScrollItem,
  ITickerGlass,
} from '@/types/mountain-ranking';
import { useMountainRanking } from '@/context/MountainRankingContext';

interface FloatModuleProps {
  module: IFloatModule;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

const DEFAULT_SHADOW: IModuleShadow = { x: 0, y: 16, blur: 36, opacity: 0.24 };
const DEFAULT_TICKER_GLASS: ITickerGlass = { backgroundColor: 'rgba(255, 255, 255, 0.32)', blur: 26, innerBorderOpacity: 0.24 };
const TRANSITION_OPTIONS: Array<{ value: AnnouncementTransition; label: string }> = [
  { value: 'fade', label: '淡入淡出' },
  { value: 'cut', label: '直接切换' },
  { value: 'slide', label: '横向滑入' },
  { value: 'zoom', label: '缩放浮现' },
  { value: 'sword', label: '剑影扫过' },
];

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return { r: 255, g: 255, b: 255 };
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function colorToHex(color: string) {
  if (color.startsWith('#') && color.length === 7) return color;
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return '#ffffff';
  return `#${[match[1], match[2], match[3]].map((v) => Number(v).toString(16).padStart(2, '0')).join('')}`;
}

function colorToAlpha(color: string) {
  const match = color.match(/rgba?\(\d+,\s*\d+,\s*\d+(?:,\s*([\d.]+))?\)/i);
  if (!match) return 0.32;
  return match[1] === undefined ? 1 : Math.max(0, Math.min(1, Number(match[1])));
}

function toRgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha)).toFixed(2)})`;
}

function getModuleIcon(type: IFloatModule['type']) {
  if (type === 'image') return <ImageIcon className="w-4 h-4 text-primary shrink-0" />;
  if (type === 'video') return <Video className="w-4 h-4 text-primary shrink-0" />;
  return <MessageSquareText className="w-4 h-4 text-primary shrink-0" />;
}

export default function FloatModule({ module }: FloatModuleProps) {
  const { isEditMode, updateFloatModule, removeFloatModule, toggleFloatOrientation, theme, uploadFile } = useMountainRanking();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [uploadTargetPageId, setUploadTargetPageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  const moduleShadow = module.shadow ?? DEFAULT_SHADOW;
  const isTicker = module.type === 'ticker';
  const isAnnouncement = module.type === 'image' || module.type === 'video';
  const announcementTransition = module.carouselTransition ?? 'fade';
  const announcementPages = useMemo<IFloatModulePage[]>(() => {
    if (!isAnnouncement) return [];
    if (module.pages?.length) return module.pages;
    if (module.contentUrl) return [{ id: 'legacy', contentUrl: module.contentUrl, durationSeconds: 5 }];
    return [];
  }, [isAnnouncement, module.contentUrl, module.pages]);
  const activeAnnouncementPage = announcementPages[activePageIndex] ?? announcementPages[0];
  const visibleRows = Math.max(1, Math.min(8, module.visibleRows ?? 2));
  const scrollItems = module.scrollItems ?? [];
  const tickerSpeed = Math.max(4, Math.min(90, module.tickerSpeed ?? 12));
  const tickerFontSize = Math.max(10, Math.min(36, module.tickerFontSize ?? 15));
  const tickerGlass = { ...DEFAULT_TICKER_GLASS, ...(module.glass ?? {}) };
  const tickerInnerBorderOpacity = Math.max(0, Math.min(1, tickerGlass.innerBorderOpacity ?? 0.24));
  const shouldScroll = scrollItems.length > visibleRows && scrollItems.length > 2;
  const tickerRows = useMemo(
    () => (shouldScroll ? [...scrollItems, ...scrollItems] : scrollItems),
    [scrollItems, shouldScroll],
  );

  const handleOrientationToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFloatOrientation(module.id);
  };

  const handleDragStart = (e: MouseEvent<HTMLDivElement>) => {
    if (!isEditMode || module.minimized) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('video') || target.closest('input') || target.closest('[data-resize-handle]') || target.closest('[data-module-editor]')) return;
    e.stopPropagation(); e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, px: module.position.x, py: module.position.y };

    const handleMouseMove = (ev: globalThis.MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = ev.clientX - dragStartRef.current.x;
      const dy = ev.clientY - dragStartRef.current.y;
      updateFloatModule(module.id, {
        position: { x: Math.max(0, dragStartRef.current.px + dx), y: Math.max(0, dragStartRef.current.py + dy) },
      });
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeStart = (e: MouseEvent<HTMLDivElement>) => {
    if (!isEditMode || module.minimized) return;
    e.stopPropagation(); e.preventDefault();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: module.size.width,
      height: module.size.height,
    };

    const handleMouseMove = (ev: globalThis.MouseEvent) => {
      if (!resizeStartRef.current) return;
      const dx = ev.clientX - resizeStartRef.current.x;
      const dy = ev.clientY - resizeStartRef.current.y;
      const newWidth = Math.max(160, resizeStartRef.current.width + dx);
      const newHeight = Math.max(96, resizeStartRef.current.height + dy);
      updateFloatModule(module.id, {
        size: { width: Math.round(newWidth), height: Math.round(newHeight) },
      });
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isTicker) return;
    try {
      const url = await uploadFile(file, module.type === 'image' ? 'modules/images' : 'modules/videos');
      if (isAnnouncement) {
        const pages = getStoredAnnouncementPages();
        const targetPageId = uploadTargetPageId ?? activeAnnouncementPage?.id ?? pages[activePageIndex]?.id;
        const targetIndex = targetPageId ? pages.findIndex((page) => page.id === targetPageId) : -1;
        const nextPages = targetIndex >= 0
          ? pages.map((page, index) => (index === targetIndex ? { ...page, contentUrl: url } : page))
          : [...pages, { id: generateId('page'), contentUrl: url, durationSeconds: 5 }];
        updateFloatModule(module.id, {
          contentUrl: nextPages[0]?.contentUrl ?? url,
          pages: nextPages,
          carouselTransition: announcementTransition,
        });
        setActivePageIndex(targetIndex >= 0 ? targetIndex : nextPages.length - 1);
        setUploadTargetPageId(null);
      } else {
        updateFloatModule(module.id, { contentUrl: url });
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : '文件上传失败');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateShadow = (patch: Partial<IModuleShadow>) => {
    updateFloatModule(module.id, { shadow: { ...moduleShadow, ...patch } });
  };

  const updateTickerGlass = (patch: Partial<ITickerGlass>) => {
    updateFloatModule(module.id, { glass: { ...tickerGlass, ...patch } });
  };

  const updateTickerItem = (itemId: string, patch: Partial<IScrollItem>) => {
    updateFloatModule(module.id, {
      scrollItems: scrollItems.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
    });
  };

  const addTickerItem = () => {
    updateFloatModule(module.id, {
      scrollItems: [...scrollItems, { id: generateId('msg'), name: '姓名', content: '改善内容' }],
    });
  };

  const removeTickerItem = (itemId: string) => {
    updateFloatModule(module.id, { scrollItems: scrollItems.filter((item) => item.id !== itemId) });
  };

  const toggleMinimize = (e: React.MouseEvent) => { e.stopPropagation(); updateFloatModule(module.id, { minimized: !module.minimized }); };
  const handleClose = (e: React.MouseEvent) => { e.stopPropagation(); removeFloatModule(module.id); };

  const style: React.CSSProperties = {
    left: module.position.x,
    top: module.position.y,
    width: module.size.width,
    height: module.minimized ? undefined : isTicker ? undefined : module.size.height,
    background: isTicker
      ? tickerGlass.backgroundColor
      : theme.floatBgColor,
    borderColor: theme.floatBorderColor,
    borderWidth: '1px',
    borderStyle: 'solid',
    boxShadow: `${moduleShadow.x}px ${moduleShadow.y}px ${moduleShadow.blur}px rgba(0, 0, 0, ${moduleShadow.opacity})`,
  };

  const tickerGlassHex = colorToHex(tickerGlass.backgroundColor);
  const tickerGlassAlpha = colorToAlpha(tickerGlass.backgroundColor);
  const tickerStyle = {
    '--ticker-visible-rows': visibleRows,
    '--ticker-duration': `${tickerSpeed}s`,
    '--ticker-font-size': `${tickerFontSize}px`,
    '--ticker-row-height': `${Math.max(42, tickerFontSize * 2.8)}px`,
    '--ticker-glass-bg': tickerGlass.backgroundColor,
    '--ticker-glass-alpha': tickerGlassAlpha,
    '--ticker-glass-highlight': tickerGlassAlpha <= 0.01 ? 0 : 1,
    '--ticker-glass-blur': `${tickerGlass.blur}px`,
    '--ticker-inner-border-opacity': tickerInnerBorderOpacity,
    '--ticker-row-border-opacity': Math.min(1, tickerInnerBorderOpacity * 1.6),
  } as React.CSSProperties;

  useEffect(() => {
    if (activePageIndex >= announcementPages.length) {
      setActivePageIndex(0);
    }
  }, [activePageIndex, announcementPages.length]);

  useEffect(() => {
    if (!isAnnouncement || announcementPages.length <= 1) return;
    const duration = Math.max(1, Math.min(120, activeAnnouncementPage?.durationSeconds ?? 5)) * 1000;
    const timer = window.setTimeout(() => {
      setActivePageIndex((index) => (index + 1) % announcementPages.length);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [activeAnnouncementPage?.durationSeconds, announcementPages.length, isAnnouncement]);

  const getStoredAnnouncementPages = () => {
    if (module.pages?.length) return module.pages;
    if (module.contentUrl) {
      return [{ id: generateId('page'), contentUrl: module.contentUrl, durationSeconds: 5 }];
    }
    return [];
  };

  const setAnnouncementPages = (pages: IFloatModulePage[], nextActiveIndex = activePageIndex) => {
    updateFloatModule(module.id, {
      pages,
      contentUrl: pages[0]?.contentUrl ?? '',
      carouselTransition: announcementTransition,
    });
    setActivePageIndex(Math.max(0, Math.min(nextActiveIndex, Math.max(0, pages.length - 1))));
  };

  const addAnnouncementPage = () => {
    const pages = getStoredAnnouncementPages();
    const nextPages = [...pages, { id: generateId('page'), contentUrl: '', durationSeconds: 5 }];
    setAnnouncementPages(nextPages, nextPages.length - 1);
  };

  const updateAnnouncementPage = (pageId: string, patch: Partial<IFloatModulePage>) => {
    const pages = getStoredAnnouncementPages();
    setAnnouncementPages(pages.map((page) => (page.id === pageId ? { ...page, ...patch } : page)));
  };

  const removeAnnouncementPage = (pageId: string) => {
    const pages = getStoredAnnouncementPages();
    const targetIndex = pages.findIndex((page) => page.id === pageId);
    const nextPages = pages.filter((page) => page.id !== pageId);
    setAnnouncementPages(nextPages, Math.max(0, targetIndex - 1));
  };

  const openUploadForPage = (pageId: string | null) => {
    setUploadTargetPageId(pageId);
    fileInputRef.current?.click();
  };

  return (
    <div
      className={cn(
        'float-module absolute z-30 flex flex-col rounded-2xl backdrop-blur-xl overflow-hidden',
        isTicker && 'float-module--ticker',
        isEditMode && !module.minimized && 'cursor-grab active:cursor-grabbing',
        (isDragging || isResizing) && 'opacity-90',
      )}
      style={style}
      onMouseDown={handleDragStart}
    >
      {module.minimized && (
        <div className="flex items-center gap-2 px-4 py-2.5 shrink-0" style={{ backgroundColor: theme.floatBgColor }} onMouseDown={handleDragStart}>
          {getModuleIcon(module.type)}
          <span className="flex-1 text-sm font-medium text-foreground truncate">{module.title}</span>
          {isEditMode && (
            <div className="flex items-center gap-1 shrink-0">
              <Button type="button" size="icon" variant="ghost" className="h-6 w-6 rounded-full" onClick={toggleMinimize} title="展开">
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="h-6 w-6 rounded-full text-destructive hover:text-destructive" onClick={handleClose} title="关闭">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}

      {!module.minimized && (
        <div className={cn('relative h-full min-h-0 flex-1 bg-muted/30 overflow-hidden', isTicker && 'overflow-visible')}>
          {isEditMode && (
            <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
              {module.type === 'image' && (
                <Button type="button" size="icon" variant="secondary" className="h-7 w-7 rounded-full shadow-md bg-white/80 backdrop-blur-sm" onClick={handleOrientationToggle} title="切换横竖版">
                  <RotateCw className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button type="button" size="icon" variant="secondary" className="h-7 w-7 rounded-full shadow-md bg-white/80 backdrop-blur-sm" onClick={toggleMinimize} title="最小化">
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <Button type="button" size="icon" variant="secondary" className="h-7 w-7 rounded-full shadow-md bg-white/80 backdrop-blur-sm text-destructive hover:text-destructive" onClick={handleClose} title="关闭">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          {isTicker ? (
            <div className="ticker-module" style={tickerStyle}>
              <div className="ticker-viewport">
                <div className={cn('ticker-track', shouldScroll && 'is-scrolling')}>
                  {(tickerRows.length ? tickerRows : [{ id: 'empty', name: '姓名', content: '改善内容' }]).map((item, index) => (
                    <div className="ticker-row" key={`${item.id}-${index}`}>
                      <strong>{item.name}</strong>
                      <span>{item.content}</span>
                    </div>
                  ))}
                </div>
              </div>

              {isEditMode && (
                <div className="ticker-editor" data-module-editor>
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-xs">显示条数：{visibleRows}</Label>
                    <Slider
                      value={[visibleRows]}
                      min={1}
                      max={6}
                      step={1}
                      onValueChange={([v]) => updateFloatModule(module.id, { visibleRows: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-xs">滚动速度：{tickerSpeed}s</Label>
                    <Slider
                      value={[tickerSpeed]}
                      min={4}
                      max={60}
                      step={1}
                      onValueChange={([v]) => updateFloatModule(module.id, { tickerSpeed: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-xs">文字大小：{tickerFontSize}px</Label>
                    <Slider
                      value={[tickerFontSize]}
                      min={10}
                      max={36}
                      step={1}
                      onValueChange={([v]) => updateFloatModule(module.id, { tickerFontSize: v })}
                    />
                  </div>
                  <div className="grid grid-cols-[72px_1fr] items-center gap-2">
                    <Label className="text-xs">玻璃颜色</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={tickerGlassHex}
                        onChange={(e) => updateTickerGlass({ backgroundColor: toRgba(e.target.value, tickerGlassAlpha) })}
                        className="h-8 w-10 cursor-pointer rounded-md border border-white/50 bg-transparent"
                      />
                      <span className="text-[11px] text-muted-foreground tabular-nums">透明 {Math.round(tickerGlassAlpha * 100)}%</span>
                    </div>
                    <Label className="text-xs">透明度</Label>
                    <Slider
                      value={[tickerGlassAlpha]}
                      min={0}
                      max={0.85}
                      step={0.01}
                      onValueChange={([v]) => updateTickerGlass({ backgroundColor: toRgba(tickerGlassHex, v) })}
                    />
                    <Label className="text-xs">背景模糊</Label>
                    <Slider
                      value={[tickerGlass.blur]}
                      min={0}
                      max={48}
                      step={1}
                      onValueChange={([v]) => updateTickerGlass({ blur: v })}
                    />
                    <Label className="text-xs">内框边线</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[tickerInnerBorderOpacity]}
                        min={0}
                        max={1}
                        step={0.01}
                        onValueChange={([v]) => updateTickerGlass({ innerBorderOpacity: v })}
                      />
                      <span className="w-9 text-right text-[11px] text-muted-foreground tabular-nums">
                        {Math.round(tickerInnerBorderOpacity * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {scrollItems.map((item) => (
                      <div key={item.id} className="grid grid-cols-[78px_1fr_28px] gap-2">
                        <Input value={item.name} onChange={(e) => updateTickerItem(item.id, { name: e.target.value })} placeholder="姓名" />
                        <Input value={item.content} onChange={(e) => updateTickerItem(item.id, { content: e.target.value })} placeholder="改善内容" />
                        <Button type="button" size="icon" variant="ghost" className="h-9 w-7 text-destructive" onClick={() => removeTickerItem(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button type="button" size="sm" variant="secondary" className="w-full gap-1.5" onClick={addTickerItem}>
                    <Plus className="w-3.5 h-3.5" />新增信息
                  </Button>
                </div>
              )}
            </div>
          ) : activeAnnouncementPage?.contentUrl ? (
            <div
              key={`${activeAnnouncementPage.id}-${activePageIndex}-${announcementTransition}`}
              className={cn('announcement-page', `announcement-page--${announcementTransition}`)}
            >
              {module.type === 'image' ? (
                <img src={activeAnnouncementPage.contentUrl} alt={module.title} />
              ) : (
                <video
                  src={activeAnnouncementPage.contentUrl}
                  controls={isEditMode}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  onMouseDown={(e) => e.stopPropagation()}
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-4 text-center">
              {module.type === 'image' ? <ImageIcon className="w-10 h-10 text-muted-foreground/50" /> : <Video className="w-10 h-10 text-muted-foreground/50" />}
              <p className="text-sm text-muted-foreground">{module.type === 'image' ? '暂无图片' : '暂无视频'}</p>
              {isEditMode && (
                <Button type="button" size="sm" variant="secondary" onClick={() => openUploadForPage(null)} className="gap-1.5">
                  <Upload className="w-3.5 h-3.5" />上传{module.type === 'image' ? '图片' : '视频'}
                </Button>
              )}
            </div>
          )}

          {isEditMode && !isTicker && activeAnnouncementPage?.contentUrl && (
            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <Button type="button" size="sm" variant="secondary" onClick={() => openUploadForPage(activeAnnouncementPage.id)} className="gap-1.5 shadow-lg">
                <Upload className="w-3.5 h-3.5" />替换
              </Button>
            </div>
          )}

          {isEditMode && isAnnouncement && (
            <div className="announcement-carousel-editor" data-module-editor onMouseDown={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-[11px] font-semibold">公告轮播</Label>
                <Button type="button" size="sm" variant="secondary" className="h-7 gap-1 px-2 text-[11px]" onClick={addAnnouncementPage}>
                  <Plus className="w-3.5 h-3.5" />新增页面
                </Button>
              </div>
              <div className="grid grid-cols-[64px_1fr] items-center gap-2">
                <Label className="text-[11px]">切换效果</Label>
                <select
                  value={announcementTransition}
                  onChange={(e) => updateFloatModule(module.id, { carouselTransition: e.target.value as AnnouncementTransition })}
                  className="h-8 rounded-md border border-white/50 bg-white/85 px-2 text-[12px] text-foreground outline-none"
                >
                  {TRANSITION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="announcement-page-list">
                {(module.pages?.length ? module.pages : announcementPages).map((page, index) => (
                  <div key={page.id} className={cn('announcement-page-row', index === activePageIndex && 'is-active')}>
                    <Button
                      type="button"
                      size="sm"
                      variant={index === activePageIndex ? 'default' : 'secondary'}
                      className="h-7 px-2 text-[11px]"
                      onClick={() => setActivePageIndex(index)}
                    >
                      第{index + 1}页
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-7 gap-1 px-2 text-[11px]"
                      onClick={() => openUploadForPage(page.id)}
                    >
                      <Upload className="w-3.5 h-3.5" />{page.contentUrl ? '替换' : '上传'}
                    </Button>
                    <label className="flex items-center gap-1 text-[11px] text-foreground/80">
                      停留
                      <Input
                        type="number"
                        min={1}
                        max={120}
                        value={page.durationSeconds}
                        onChange={(e) => updateAnnouncementPage(page.id, { durationSeconds: Math.max(1, Math.min(120, Number(e.target.value) || 1)) })}
                        className="h-7 w-14 px-1 text-center text-[11px]"
                      />
                      秒
                    </label>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeAnnouncementPage(page.id)}
                      disabled={(module.pages?.length ?? announcementPages.length) <= 1}
                      title="删除页面"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isEditMode && (
            <div className="module-shadow-editor" data-module-editor>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                <Label className="text-[11px]">阴影左右 {moduleShadow.x}</Label>
                <Label className="text-[11px]">阴影上下 {moduleShadow.y}</Label>
                <Slider value={[moduleShadow.x]} min={-60} max={60} step={1} onValueChange={([v]) => updateShadow({ x: v })} />
                <Slider value={[moduleShadow.y]} min={-60} max={60} step={1} onValueChange={([v]) => updateShadow({ y: v })} />
                <Label className="text-[11px]">模糊 {moduleShadow.blur}</Label>
                <Label className="text-[11px]">深浅 {Math.round(moduleShadow.opacity * 100)}%</Label>
                <Slider value={[moduleShadow.blur]} min={0} max={90} step={1} onValueChange={([v]) => updateShadow({ blur: v })} />
                <Slider value={[moduleShadow.opacity]} min={0} max={0.8} step={0.02} onValueChange={([v]) => updateShadow({ opacity: v })} />
              </div>
            </div>
          )}

          {isEditMode && (
            <div
              data-resize-handle
              className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize z-30 group"
              onMouseDown={handleResizeStart}
              title="拖拽调整大小"
            >
              <svg
                className="absolute bottom-1 right-1 w-3.5 h-3.5 text-foreground/30 group-hover:text-foreground/60 transition-colors"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM22 14H20V12H22V14ZM18 22H16V20H18V22ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
              </svg>
            </div>
          )}
        </div>
      )}

      {!isTicker && <input ref={fileInputRef} type="file" accept={module.type === 'image' ? 'image/png,image/jpeg,image/gif' : 'video/*'} className="hidden" onChange={handleFileChange} />}
    </div>
  );
}
