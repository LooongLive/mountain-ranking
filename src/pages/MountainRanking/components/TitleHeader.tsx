import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useMountainRanking } from '@/context/MountainRankingContext';

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;

export default function TitleHeader() {
  const { theme, setTheme, isEditMode } = useMountainRanking();
  const [editingMain, setEditingMain] = useState(false);
  const [editingSub, setEditingSub] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [mainValue, setMainValue] = useState(theme.mainTitle);
  const [subValue, setSubValue] = useState(theme.subTitle);
  const mainInputRef = useRef<HTMLInputElement>(null);
  const subInputRef = useRef<HTMLInputElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const responsiveSize = (size: number, minScale = 0.42) =>
    `clamp(${Math.max(12, Math.round(size * minScale))}px, ${(size / 1920) * 100}vw, ${size}px)`;

  useEffect(() => { setMainValue(theme.mainTitle); }, [theme.mainTitle]);
  useEffect(() => { setSubValue(theme.subTitle); }, [theme.subTitle]);
  useEffect(() => { if (editingMain) { mainInputRef.current?.focus(); mainInputRef.current?.select(); } }, [editingMain]);
  useEffect(() => { if (editingSub) { subInputRef.current?.focus(); subInputRef.current?.select(); } }, [editingSub]);

  const submitMain = () => {
    const trimmed = mainValue.trim();
    if (trimmed && trimmed !== theme.mainTitle) {
      setTheme((prev) => ({ ...prev, mainTitle: trimmed }));
    } else {
      setMainValue(theme.mainTitle);
    }
    setEditingMain(false);
  };

  const submitSub = () => {
    const trimmed = subValue.trim();
    if (trimmed && trimmed !== theme.subTitle) {
      setTheme((prev) => ({ ...prev, subTitle: trimmed }));
    } else {
      setSubValue(theme.subTitle);
    }
    setEditingSub(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, submit: () => void) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
    else if (e.key === 'Escape') { setMainValue(theme.mainTitle); setSubValue(theme.subTitle); setEditingMain(false); setEditingSub(false); }
  };

  const handleTitleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditMode || editingMain || editingSub) return;
    const target = e.target as HTMLElement;
    if (target.closest('input')) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      px: theme.titlePositionX ?? DESIGN_WIDTH / 2,
      py: theme.titlePositionY ?? 42,
    };

    const handleMouseMove = (ev: globalThis.MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = (ev.clientX - dragStartRef.current.x) * (DESIGN_WIDTH / window.innerWidth);
      const dy = (ev.clientY - dragStartRef.current.y) * (DESIGN_HEIGHT / window.innerHeight);
      setTheme((prev) => ({
        ...prev,
        titlePositionX: Math.max(160, Math.min(DESIGN_WIDTH - 160, dragStartRef.current!.px + dx)),
        titlePositionY: Math.max(8, Math.min(DESIGN_HEIGHT - 160, dragStartRef.current!.py + dy)),
      }));
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

  return (
    <div
      className="title-header-layer absolute z-30 pointer-events-none"
      style={{
        left: `${((theme.titlePositionX ?? DESIGN_WIDTH / 2) / DESIGN_WIDTH) * 100}%`,
        top: `${((theme.titlePositionY ?? 42) / DESIGN_HEIGHT) * 100}%`,
        transform: 'translateX(-50%)',
      }}
    >
      <div
        className={cn(
          'relative flex w-[min(88vw,1180px)] flex-col items-center px-6 text-center pointer-events-auto',
          isEditMode && 'cursor-move',
          isDragging && 'opacity-90',
        )}
        onMouseDown={handleTitleDragStart}
        title={isEditMode ? '拖动调整标题位置' : undefined}
      >
        <div className="relative block w-full">
          {editingMain ? (
            <Input
              ref={mainInputRef}
              value={mainValue}
              onChange={(e) => setMainValue(e.target.value)}
              onBlur={submitMain}
              onKeyDown={(e) => handleKeyDown(e, submitMain)}
              className="text-center font-bold bg-white/80 backdrop-blur-sm border-primary/40"
              style={{ fontSize: `${theme.mainTitleSize}px`, color: theme.mainTitleColor, height: `${theme.mainTitleSize + 16}px` }}
            />
          ) : (
            <h1
              className={cn('font-bold tracking-tight drop-shadow-sm', isEditMode && 'cursor-pointer hover:opacity-80 transition-opacity')}
              style={{ fontSize: responsiveSize(theme.mainTitleSize), color: theme.mainTitleColor, lineHeight: 1.2 }}
              onClick={() => isEditMode && setEditingMain(true)}
              title={isEditMode ? '点击编辑标题' : undefined}
            >
              {theme.mainTitle}
            </h1>
          )}
        </div>

        <div className="relative mt-2 block w-full">
          {editingSub ? (
            <Input
              ref={subInputRef}
              value={subValue}
              onChange={(e) => setSubValue(e.target.value)}
              onBlur={submitSub}
              onKeyDown={(e) => handleKeyDown(e, submitSub)}
              className="text-center font-medium bg-white/70 backdrop-blur-sm border-primary/30"
              style={{ fontSize: `${theme.subTitleSize}px`, color: theme.subTitleColor, height: `${theme.subTitleSize + 12}px` }}
            />
          ) : (
            <p
              className={cn('font-medium tracking-wide opacity-90 drop-shadow-sm', isEditMode && 'cursor-pointer hover:opacity-70 transition-opacity')}
              style={{ fontSize: responsiveSize(theme.subTitleSize, 0.48), color: theme.subTitleColor, lineHeight: 1.4 }}
              onClick={() => isEditMode && setEditingSub(true)}
              title={isEditMode ? '点击编辑副标题' : undefined}
            >
              {theme.subTitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
