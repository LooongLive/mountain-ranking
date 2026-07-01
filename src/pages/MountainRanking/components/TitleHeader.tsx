import { useState, useRef, useEffect } from 'react';
import { Settings, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
    <div className="absolute top-0 left-0 right-0 z-30 pt-6 md:pt-10 pointer-events-none">
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

        {isEditMode && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" size="sm" variant="secondary" className="gap-1.5 bg-white/80 backdrop-blur-sm border border-border/60 shadow-sm">
                  <Settings className="h-4 w-4" />
                  <span className="text-xs">标题样式</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-4 space-y-4 bg-white/95 backdrop-blur-md" align="end">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Type className="h-4 w-4" />主标题
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground w-12 shrink-0">颜色</label>
                    <input type="color" value={theme.mainTitleColor}
                      onChange={(e) => setTheme((prev) => ({ ...prev, mainTitleColor: e.target.value }))}
                      className="h-8 w-12 rounded border border-border cursor-pointer bg-transparent" />
                    <Input type="text" value={theme.mainTitleColor}
                      onChange={(e) => setTheme((prev) => ({ ...prev, mainTitleColor: e.target.value }))}
                      className="h-8 text-xs font-mono" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground w-12 shrink-0">字号</label>
                    <input type="range" min={20} max={72} value={theme.mainTitleSize}
                      onChange={(e) => setTheme((prev) => ({ ...prev, mainTitleSize: Number(e.target.value) }))}
                      className="flex-1 accent-primary" />
                    <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">{theme.mainTitleSize}px</span>
                  </div>
                </div>

                <div className="border-t border-border/60" />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Type className="h-4 w-4" />副标题
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground w-12 shrink-0">颜色</label>
                    <input type="color" value={theme.subTitleColor}
                      onChange={(e) => setTheme((prev) => ({ ...prev, subTitleColor: e.target.value }))}
                      className="h-8 w-12 rounded border border-border cursor-pointer bg-transparent" />
                    <Input type="text" value={theme.subTitleColor}
                      onChange={(e) => setTheme((prev) => ({ ...prev, subTitleColor: e.target.value }))}
                      className="h-8 text-xs font-mono" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground w-12 shrink-0">字号</label>
                    <input type="range" min={12} max={36} value={theme.subTitleSize}
                      onChange={(e) => setTheme((prev) => ({ ...prev, subTitleSize: Number(e.target.value) }))}
                      className="flex-1 accent-primary" />
                    <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">{theme.subTitleSize}px</span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
}
