import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useMountainRanking } from '@/context/MountainRankingContext';

export default function TitleHeader() {
  const { theme, setTheme, isEditMode } = useMountainRanking();
  const [editingMain, setEditingMain] = useState(false);
  const [editingSub, setEditingSub] = useState(false);
  const [mainValue, setMainValue] = useState(theme.mainTitle);
  const [subValue, setSubValue] = useState(theme.subTitle);
  const mainInputRef = useRef<HTMLInputElement>(null);
  const subInputRef = useRef<HTMLInputElement>(null);
  const responsiveSize = (size: number, maxScale = 1.45) =>
    `clamp(${size}px, ${(size / 1920) * 100}vw, ${Math.round(size * maxScale)}px)`;

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

  return (
    <div className="title-header-layer absolute top-0 left-0 right-0 z-30 pt-6 md:pt-10 pointer-events-none">
      <div className="relative mx-auto max-w-5xl px-6 text-center pointer-events-auto">
        <div className="relative inline-block">
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

        <div className="relative mt-2 inline-block">
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
              style={{ fontSize: responsiveSize(theme.subTitleSize, 1.5), color: theme.subTitleColor, lineHeight: 1.4 }}
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
