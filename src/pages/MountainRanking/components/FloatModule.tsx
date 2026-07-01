import { useRef, useState, type MouseEvent } from 'react';
import { X, Minus, Image as ImageIcon, Video, Upload, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { IFloatModule } from '@/types/mountain-ranking';
import { useMountainRanking } from '@/context/MountainRankingContext';

interface FloatModuleProps {
  module: IFloatModule;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export default function FloatModule({ module }: FloatModuleProps) {
  const { isEditMode, updateFloatModule, removeFloatModule, toggleFloatOrientation, theme, uploadFile } = useMountainRanking();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  const handleOrientationToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFloatOrientation(module.id);
  };

  const handleDragStart = (e: MouseEvent<HTMLDivElement>) => {
    if (!isEditMode || module.minimized) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('video') || target.closest('input') || target.closest('[data-resize-handle]')) return;
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
      const newWidth = Math.max(120, resizeStartRef.current.width + dx);
      const newHeight = Math.max(80, resizeStartRef.current.height + dy);
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
    if (!file) return;
    try {
      const url = await uploadFile(file, module.type === 'image' ? 'modules/images' : 'modules/videos');
      updateFloatModule(module.id, { contentUrl: url });
    } catch (error) {
      alert(error instanceof Error ? error.message : '文件上传失败');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleMinimize = (e: React.MouseEvent) => { e.stopPropagation(); updateFloatModule(module.id, { minimized: !module.minimized }); };
  const handleClose = (e: React.MouseEvent) => { e.stopPropagation(); removeFloatModule(module.id); };

  const style: React.CSSProperties = {
    left: module.position.x,
    top: module.position.y,
    width: module.size.width,
    height: module.minimized ? undefined : module.size.height,
    backgroundColor: theme.floatBgColor,
    borderColor: theme.floatBorderColor,
    borderWidth: '1px',
    borderStyle: 'solid',
  };

  return (
    <div
      className={cn(
        'absolute z-30 flex flex-col rounded-2xl backdrop-blur-xl shadow-[0_10px_40px_rgba(0_0_0_0.12),0_2px_8px_rgba(0_0_0_0.06)] overflow-hidden',
        isEditMode && !module.minimized && 'cursor-grab active:cursor-grabbing',
        (isDragging || isResizing) && 'opacity-90 shadow-[0_20px_60px_rgba(0_0_0_0.18),0_4px_12px_rgba(0_0_0_0.08)]',
      )}
      style={style}
      onMouseDown={handleDragStart}
    >
      {module.minimized && (
        <div className="flex items-center gap-2 px-4 py-2.5 shrink-0" style={{ backgroundColor: theme.floatBgColor }} onMouseDown={handleDragStart}>
          {module.type === 'image' ? <ImageIcon className="w-4 h-4 text-primary shrink-0" /> : <Video className="w-4 h-4 text-primary shrink-0" />}
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
        <div className="relative flex-1 bg-muted/30 overflow-hidden">
          {isEditMode && (
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
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

          {module.contentUrl ? (
            module.type === 'image' ? (
              <img src={module.contentUrl} alt={module.title} className="w-full h-full object-contain" />
            ) : (
              <video
                src={module.contentUrl}
                controls={isEditMode}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="w-full h-full object-contain bg-black"
                onMouseDown={(e) => e.stopPropagation()}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-4 text-center">
              {module.type === 'image' ? <ImageIcon className="w-10 h-10 text-muted-foreground/50" /> : <Video className="w-10 h-10 text-muted-foreground/50" />}
              <p className="text-sm text-muted-foreground">{module.type === 'image' ? '暂无图片' : '暂无视频'}</p>
              {isEditMode && (
                <Button type="button" size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
                  <Upload className="w-3.5 h-3.5" />上传{module.type === 'image' ? '图片' : '视频'}
                </Button>
              )}
            </div>
          )}

          {isEditMode && module.contentUrl && (
            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <Button type="button" size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} className="gap-1.5 shadow-lg">
                <Upload className="w-3.5 h-3.5" />替换
              </Button>
            </div>
          )}

          {isEditMode && (
            <div
              data-resize-handle
              className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize z-20 group"
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

      <input ref={fileInputRef} type="file" accept={module.type === 'image' ? 'image/png,image/jpeg,image/gif' : 'video/*'} className="hidden" onChange={handleFileChange} />
    </div>
  );
}
