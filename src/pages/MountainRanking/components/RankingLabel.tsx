import { useState, useRef, useEffect, useCallback } from 'react';
import { X, UserPlus, GripVertical, RotateCcw, ImagePlus, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, clamp } from '@/lib/utils';
import type { IDepartment } from '@/types/mountain-ranking';
import { useMountainRanking } from '@/context/MountainRankingContext';

interface RankingLabelProps {
  department: IDepartment;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export default function RankingLabel({ department, canvasRef }: RankingLabelProps) {
  const { isEditMode, isManualMode, updateDepartment, removeDepartment, updateDepartmentPosition,
    addAvatar, removeAvatar, updateAvatarPosition, theme, setTheme, uploadFile, sortedDepartments } = useMountainRanking();

  const [editingName, setEditingName] = useState(false);
  const [editingCount, setEditingCount] = useState(false);
  const [editingUnit, setEditingUnit] = useState(false);
  const [nameValue, setNameValue] = useState(department.name);
  const [countValue, setCountValue] = useState(String(department.count));
  const [unitValue, setUnitValue] = useState(department.unit);
  const [isDragging, setIsDragging] = useState(false);
  const [isFlowBorderActive, setIsFlowBorderActive] = useState(false);
  const [bubbleEditorOpen, setBubbleEditorOpen] = useState(false);
  const [cardEditorOpen, setCardEditorOpen] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [activeBubbleText, setActiveBubbleText] = useState('');
  const [activeBubblePosition, setActiveBubblePosition] = useState<'top' | 'right' | 'bottom' | 'left' | 'top-right' | 'top-left'>('top');
  const labelRef = useRef<HTMLDivElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const climberFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNameValue(department.name);
    setCountValue(String(department.count));
    setUnitValue(department.unit);
  }, [department.name, department.count, department.unit]);

  const isTopDepartment = sortedDepartments[0]?.id === department.id;
  const departmentRank = sortedDepartments.findIndex((dept) => dept.id === department.id);
  const bubbleConfig = department.speechBubble ?? {};
  const bubbleEnabled = bubbleConfig.enabled ?? true;
  const isTopRankBubble = departmentRank === 0;
  const rankBubbleMessages = isTopRankBubble ? theme.speechBubbleMessagesTop : theme.speechBubbleMessagesNormal;
  const bubbleMessages = rankBubbleMessages
    .filter((message) => message.trim());
  const bubbleStyle = bubbleConfig.style ?? theme.speechBubbleStyle ?? 'comic';
  const bubbleBackgroundColor = bubbleConfig.backgroundColor ?? theme.speechBubbleColor;
  const bubbleTextColor = bubbleConfig.textColor ?? theme.speechBubbleTextColor;
  const bubbleOpacity = bubbleConfig.opacity ?? theme.speechBubbleOpacity ?? 0.92;
  const bubbleScale = bubbleConfig.scale ?? theme.speechBubbleScale ?? 1;
  const bubbleBlur = bubbleConfig.blur ?? theme.speechBubbleBlur ?? 22;
  const bubbleHoldSeconds = bubbleConfig.holdSeconds ?? theme.speechBubbleHoldSeconds ?? 2.6;
  const bubbleIntervalSeconds = bubbleConfig.intervalSeconds ?? theme.speechBubbleIntervalSeconds ?? 5;
  const departmentCardScale = department.cardScale ?? 1;
  const departmentCardFontScale = department.cardFontScale ?? 1;
  const speechBubblePositions: Array<typeof activeBubblePosition> = ['top', 'right', 'bottom', 'left', 'top-right', 'top-left'];

  useEffect(() => {
    if (!theme.speechBubblesEnabled || !bubbleEnabled || bubbleMessages.length === 0) {
      setBubbleVisible(false);
      return;
    }

    let showTimer: number | undefined;
    let hideTimer: number | undefined;
    let disposed = false;

    const schedule = (delayMs: number) => {
      showTimer = window.setTimeout(() => {
        if (disposed) return;
        const textIndex = Math.floor(Math.random() * bubbleMessages.length);
        const positionIndex = Math.floor(Math.random() * speechBubblePositions.length);
        setActiveBubbleText(bubbleMessages[textIndex]);
        setActiveBubblePosition(speechBubblePositions[positionIndex]);
        setBubbleVisible(true);
        hideTimer = window.setTimeout(() => {
          if (disposed) return;
          setBubbleVisible(false);
          const nextDelay = Math.max(1.5, bubbleIntervalSeconds) * 1000 + Math.random() * 2200;
          schedule(nextDelay);
        }, Math.max(1.5, bubbleHoldSeconds) * 1000);
      }, delayMs);
    };

    schedule(800 + Math.random() * 2600);
    return () => {
      disposed = true;
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [bubbleEnabled, bubbleHoldSeconds, bubbleIntervalSeconds, bubbleMessages.join('|'), speechBubblePositions.length, theme.speechBubblesEnabled]);

  useEffect(() => {
    if (!isTopDepartment || !theme.pathGlowEnabled) {
      setIsFlowBorderActive(false);
      return;
    }

    const travelMs = Math.max(4, Math.min(40, theme.pathGlowDuration)) * 1000;
    const intervalMs = Math.max(0, Math.min(90, theme.pathGlowInterval)) * 1000;
    const activeMs = Math.max(1, Math.min(12, theme.pathGlowBorderDuration ?? 3)) * 1000;
    const cycleMs = travelMs + intervalMs;
    let startTimer: number | undefined;
    let endTimer: number | undefined;

    const run = () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(endTimer);
      setIsFlowBorderActive(false);
      startTimer = window.setTimeout(() => {
        setIsFlowBorderActive(true);
        endTimer = window.setTimeout(() => setIsFlowBorderActive(false), activeMs);
      }, travelMs);
    };

    run();
    const timer = window.setInterval(run, cycleMs);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(startTimer);
      window.clearTimeout(endTimer);
    };
  }, [isTopDepartment, theme.pathGlowBorderDuration, theme.pathGlowDuration, theme.pathGlowEnabled, theme.pathGlowInterval]);

  const handleNameSubmit = useCallback(() => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== department.name) { updateDepartment(department.id, { name: trimmed }); }
    else { setNameValue(department.name); }
    setEditingName(false);
  }, [nameValue, department.id, department.name, updateDepartment]);

  const handleCountSubmit = useCallback(() => {
    const num = parseInt(countValue, 10);
    if (!Number.isNaN(num) && num !== department.count) { updateDepartment(department.id, { count: Math.max(0, num) }); }
    else { setCountValue(String(department.count)); }
    setEditingCount(false);
  }, [countValue, department.id, department.count, updateDepartment]);

  const handleUnitSubmit = useCallback(() => {
    const trimmed = unitValue.trim();
    if (trimmed !== department.unit) {
      updateDepartment(department.id, { unit: trimmed || '件' });
    } else {
      setUnitValue(department.unit);
    }
    setEditingUnit(false);
  }, [unitValue, department.id, department.unit, updateDepartment]);

  const handleKeyDown = (e: React.KeyboardEvent, submit: () => void) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
    else if (e.key === 'Escape') {
      setNameValue(department.name);
      setCountValue(String(department.count));
      setUnitValue(department.unit);
      setEditingName(false);
      setEditingCount(false);
      setEditingUnit(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file, 'department-avatars');
      addAvatar(department.id, url);
    } catch (error) {
      alert(error instanceof Error ? error.message : '头像上传失败');
    }
    if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
  };

  const handleClimberUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file, 'climbers');
      updateDepartment(department.id, { climberImage: url });
    } catch (error) {
      alert(error instanceof Error ? error.message : '攀登者图片上传失败');
    }
    if (climberFileInputRef.current) climberFileInputRef.current.value = '';
  };

  const resetClimberImage = () => { updateDepartment(department.id, { climberImage: undefined }); };

  const bubbleColorMatch = bubbleBackgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  const bubbleBgHex = bubbleColorMatch
    ? `#${Number(bubbleColorMatch[1]).toString(16).padStart(2, '0')}${Number(bubbleColorMatch[2]).toString(16).padStart(2, '0')}${Number(bubbleColorMatch[3]).toString(16).padStart(2, '0')}`
    : bubbleBackgroundColor;
  const bubbleBgAlpha = bubbleColorMatch?.[4] ? Number(bubbleColorMatch[4]) : 0.58;
  const setBubbleConfig = (patch: NonNullable<IDepartment['speechBubble']>) => {
    updateDepartment(department.id, { speechBubble: { ...department.speechBubble, ...patch } });
  };
  const updateBubbleBg = (hex: string, alpha = bubbleBgAlpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    setBubbleConfig({ backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})` });
  };
  const updateRankBubbleMessages = (value: string) => {
    const messages = value.split(/\n|[｜|]/).map((item) => item.trim()).filter(Boolean);
    setTheme((prev) => ({
      ...prev,
      [isTopRankBubble ? 'speechBubbleMessagesTop' : 'speechBubbleMessagesNormal']: messages,
    }));
  };

  const onDragStart = (e: React.MouseEvent) => {
    if (!isEditMode || !isManualMode) return;
    e.preventDefault(); e.stopPropagation();
    setIsDragging(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const startX = e.clientX; const startY = e.clientY;
    const startPosX = department.position.x; const startPosY = department.position.y;

    const onMove = (ev: MouseEvent) => {
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      const dy = ((ev.clientY - startY) / rect.height) * 100;
      const nx = clamp(startPosX + dx, 5, 95);
      const ny = clamp(startPosY + dy, 5, 92);
      updateDepartmentPosition(department.id, nx, ny, true);
    };
    const onUp = () => { setIsDragging(false); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleAvatarDrag = (e: React.MouseEvent, avatarId: string, initOffsetX: number, initOffsetY: number) => {
    if (!isEditMode) return;
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX; const startY = e.clientY;
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX; const dy = ev.clientY - startY;
      updateAvatarPosition(department.id, avatarId, initOffsetX + dx, initOffsetY + dy);
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const style: React.CSSProperties = {
    left: `${department.position.x}%`,
    top: `${department.position.y}%`,
    transform: 'translate(-50%, -50%) scale(calc(var(--ranking-card-scale, 1) * var(--department-card-scale, 1)))',
    '--department-card-scale': departmentCardScale,
    '--department-font-scale': departmentCardFontScale,
  } as React.CSSProperties;
  const shouldRenderBubble = theme.speechBubblesEnabled && bubbleEnabled && (bubbleVisible || isEditMode);
  const renderedBubbleText = activeBubbleText || bubbleMessages[0] || '加油';

  return (
    <div
      ref={labelRef}
      className={cn('ranking-label absolute z-20 select-none', isEditMode && isManualMode && 'cursor-grab active:cursor-grabbing', isDragging && 'opacity-80')}
      style={style}
      onMouseDown={onDragStart}
    >
      {department.avatars.map((avatar) => (
        <div key={avatar.id}
          className={cn('absolute z-30 rounded-full border-2 border-white shadow-md overflow-hidden bg-muted', isEditMode && 'cursor-grab active:cursor-grabbing ring-2 ring-primary/30')}
          style={{ width: 44, height: 44, left: avatar.offsetX, top: avatar.offsetY }}
          onMouseDown={(e) => handleAvatarDrag(e, avatar.id, avatar.offsetX, avatar.offsetY)}
        >
          <img src={avatar.imageUrl} alt="avatar" className="w-full h-full object-cover" />
          {isEditMode && (
            <button type="button"
              onClick={(e) => { e.stopPropagation(); removeAvatar(department.id, avatar.id); }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center text-[10px] shadow-sm hover:bg-destructive/90"
              aria-label="删除大头贴"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}

      <div
        className={cn('ranking-card-shell', isTopDepartment && 'ranking-card-shell--top', isFlowBorderActive && 'ranking-card-shell--flow-active')}
        style={{
          '--flow-border-a': theme.pathGlowBorderColorA ?? '#E2CBFF',
          '--flow-border-b': theme.pathGlowBorderColorB ?? '#393BB2',
          '--flow-border-active-duration': `${Math.max(1, Math.min(12, theme.pathGlowBorderDuration ?? 3))}s`,
        } as React.CSSProperties}
      >
        {shouldRenderBubble && (
          <button
            type="button"
            className={cn(
              'speech-bubble',
              `speech-bubble--${bubbleStyle}`,
              `speech-bubble--pos-${isEditMode && !bubbleVisible ? 'top' : activeBubblePosition}`,
              bubbleVisible ? 'speech-bubble--visible' : 'speech-bubble--editing',
              isEditMode && 'speech-bubble--editable',
            )}
            key={`${department.id}-${renderedBubbleText}-${activeBubblePosition}-${bubbleVisible ? 'show' : 'edit'}`}
            style={{
              color: bubbleTextColor,
              backgroundColor: bubbleBackgroundColor,
              opacity: bubbleOpacity,
              '--speech-tail-fill': bubbleBackgroundColor,
              '--speech-bubble-scale': bubbleScale,
              '--speech-bubble-blur': `${bubbleBlur}px`,
              '--speech-pop-duration': `${Math.max(1.5, bubbleHoldSeconds)}s`,
            } as React.CSSProperties}
            title={isEditMode ? '点击单独设置这个部门的气泡' : undefined}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              if (isEditMode) setBubbleEditorOpen((open) => !open);
            }}
          >
            {renderedBubbleText}
          </button>
        )}
        {theme.speechBubblesEnabled && isEditMode && bubbleEditorOpen && (
          <div
            className="speech-bubble-editor"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="speech-bubble-editor__row">
              <span>启用</span>
              <input type="checkbox" checked={bubbleEnabled} onChange={(e) => setBubbleConfig({ enabled: e.target.checked })} />
            </div>
            <div className="speech-bubble-editor__row">
              <span>款式</span>
              <select value={bubbleStyle} onChange={(e) => setBubbleConfig({ style: e.target.value as typeof bubbleStyle })}>
                <option value="comic">漫画</option>
                <option value="rounded">圆润</option>
                <option value="cloud">云朵</option>
                <option value="burst">爆炸</option>
                <option value="caption">对白框</option>
              </select>
            </div>
            <div className="speech-bubble-editor__row">
              <span>背景</span>
              <input type="color" value={bubbleBgHex} onChange={(e) => updateBubbleBg(e.target.value)} />
            </div>
            <div className="speech-bubble-editor__row">
              <span>文字</span>
              <input type="color" value={bubbleTextColor} onChange={(e) => setBubbleConfig({ textColor: e.target.value })} />
            </div>
            <label>
              背景透明
              <input type="range" min="0" max="1" step="0.05" value={bubbleBgAlpha} onChange={(e) => updateBubbleBg(bubbleBgHex, Number(e.target.value))} />
            </label>
            <label>
              整体透明
              <input type="range" min="0.2" max="1" step="0.05" value={bubbleOpacity} onChange={(e) => setBubbleConfig({ opacity: Number(e.target.value) })} />
            </label>
            <label>
              大小
              <input type="range" min="0.65" max="1.8" step="0.05" value={bubbleScale} onChange={(e) => setBubbleConfig({ scale: Number(e.target.value) })} />
            </label>
            <label>
              停留秒
              <input type="range" min="1.5" max="5" step="0.1" value={bubbleHoldSeconds} onChange={(e) => setBubbleConfig({ holdSeconds: Number(e.target.value) })} />
            </label>
            <label>
              间隔秒
              <input type="range" min="2" max="12" step="0.5" value={bubbleIntervalSeconds} onChange={(e) => setBubbleConfig({ intervalSeconds: Number(e.target.value) })} />
            </label>
            <div className="speech-bubble-editor__stack">
              <span>{isTopRankBubble ? '第一名文案' : '普通文案'}</span>
              <textarea
                value={rankBubbleMessages.join('\n')}
                onChange={(e) => updateRankBubbleMessages(e.target.value)}
                rows={4}
                placeholder={isTopRankBubble ? '第一名会随机显示这些文案' : '非第一名会随机显示这些文案'}
              />
            </div>
          </div>
        )}
        {isEditMode && cardEditorOpen && (
          <div
            className="department-card-editor"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <label>
              单卡尺寸
              <span>{Math.round(departmentCardScale * 100)}%</span>
              <input
                type="range"
                min="0.55"
                max="2.8"
                step="0.05"
                value={departmentCardScale}
                onChange={(e) => updateDepartment(department.id, { cardScale: Number(e.target.value) })}
              />
            </label>
            <label>
              单卡字体
              <span>{Math.round(departmentCardFontScale * 100)}%</span>
              <input
                type="range"
                min="0.7"
                max="2.6"
                step="0.05"
                value={departmentCardFontScale}
                onChange={(e) => updateDepartment(department.id, { cardFontScale: Number(e.target.value) })}
              />
            </label>
            <button
              type="button"
              onClick={() => updateDepartment(department.id, { cardScale: undefined, cardFontScale: undefined })}
            >
              恢复全局默认
            </button>
          </div>
        )}
        <div
        className={cn(
          'ranking-card relative flex items-center gap-3 px-4 py-2.5 rounded-2xl',
          isEditMode && 'hover:shadow-[0_8px_32px_rgba(0_0_0_0.12),0_2px_4px_rgba(0_0_0_0.06)] hover:-translate-y-0.5 transition-all duration-300 ease-out',
        )}
        style={{
          '--card-glass-bg': theme.labelBgColor,
          '--label-glass-blur': `${theme.labelBlur ?? 35}px`,
          backgroundColor: theme.labelBgColor,
          background:
            `linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08) 48%, rgba(255,255,255,0.18)), ${theme.labelBgColor}`,
          borderColor: theme.labelShowBorder ? theme.labelBorderColor : 'transparent',
          borderWidth: theme.labelShowBorder ? '2px' : '0px',
          borderStyle: 'solid',
          color: theme.labelTextColor,
          backdropFilter: `blur(${theme.labelBlur ?? 35}px) saturate(1.35)`,
          WebkitBackdropFilter: `blur(${theme.labelBlur ?? 35}px) saturate(1.35)`,
          boxShadow: theme.labelShowBorder
            ? '0 0 80px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.48), inset 0 -18px 42px rgba(255,255,255,0.08)'
            : '0 16px 44px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.42)',
        } as React.CSSProperties}
      >
        <div className="shrink-0 relative group">
          <div className="w-10 h-12 flex items-end justify-center overflow-hidden rounded-md" style={{ color: theme.labelTextColor }}>
            {department.climberImage ? (
              <img src={department.climberImage} alt="攀登者" className="w-full h-full object-contain" />
            ) : (
              <svg viewBox="0 0 24 32" fill="currentColor" className="w-9 h-11" style={{ color: theme.labelTextColor }} aria-hidden="true">
                <path d="M12 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-5 9a2 2 0 0 1 1.8-2h6.4a2 2 0 0 1 1.9 2.6L16 18h-2l-.5-2h-3L10 18H8l-1.1-4.4A2 2 0 0 1 7 11Zm-2 13a1 1 0 0 1-1-1v-5a1 1 0 0 1 2 0v3.2l1.2-1.6 2.6-3.6 1.4 1.4-2 2.6-1.8 2.4.2 1.6H5Zm14 0h-3.6l.2-1.6-1.8-2.4-2-2.6 1.4-1.4 2.6 3.6 1.2 1.6V18a1 1 0 1 1 2 0v5a1 1 0 0 1-1 1Z" />
                <path d="M3 28a1 1 0 0 1-.2-1.4l8-10a1 1 0 0 1 1.4.2l.2.2a1 1 0 0 1-.2 1.4l-8 10A1 1 0 0 1 3 28Zm18 0a1 1 0 0 1-.8-1.6l-7-9a1 1 0 1 1 1.4-1.4l7 9A1 1 0 0 1 21 28Z" />
              </svg>
            )}
          </div>
          {isEditMode && (
            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
              <button type="button" onClick={(e) => { e.stopPropagation(); climberFileInputRef.current?.click(); }}
                className="p-1 text-white hover:text-accent transition-colors" title="替换攀登者图片">
                <ImagePlus className="w-4 h-4" />
              </button>
              {department.climberImage && (
                <button type="button" onClick={(e) => { e.stopPropagation(); resetClimberImage(); }}
                  className="p-1 text-white hover:text-accent transition-colors" title="恢复默认">
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2 min-w-0">
          {editingName ? (
            <Input autoFocus value={nameValue} onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleNameSubmit} onKeyDown={(e) => handleKeyDown(e, handleNameSubmit)}
              className="h-7 w-20 text-sm font-semibold px-2"
              onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} />
          ) : (
            <span className={cn('font-semibold whitespace-nowrap', isEditMode && 'cursor-pointer hover:opacity-80')}
              style={{ color: theme.labelTextColor }}
              onClick={(e) => { e.stopPropagation(); if (isEditMode) setEditingName(true); }}
            >
              {department.name}
            </span>
          )}
          <span className="text-sm" style={{ color: theme.labelTextColor, opacity: 0.6 }}>:</span>
          {editingCount ? (
            <Input autoFocus type="number" min={0} value={countValue} onChange={(e) => setCountValue(e.target.value)}
              onBlur={handleCountSubmit} onKeyDown={(e) => handleKeyDown(e, handleCountSubmit)}
              className="h-7 w-16 text-sm font-bold px-2 tabular-nums"
              onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} />
          ) : (
            <span className={cn('font-bold tabular-nums', isEditMode && 'cursor-pointer hover:opacity-80')}
              style={{ color: theme.labelTextColor }}
              onClick={(e) => { e.stopPropagation(); if (isEditMode) setEditingCount(true); }}
            >
              {department.count}
            </span>
          )}
          {editingUnit ? (
            <Input autoFocus value={unitValue} onChange={(e) => setUnitValue(e.target.value)}
              onBlur={handleUnitSubmit} onKeyDown={(e) => handleKeyDown(e, handleUnitSubmit)}
              className="h-7 w-16 text-sm font-medium px-2"
              onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} />
          ) : (
            <span
              className={cn(
                'text-sm font-medium ml-1 px-1.5 py-0.5 rounded-md border border-dashed',
                isEditMode && 'cursor-pointer hover:bg-accent/20 hover:border-accent',
              )}
              style={{
                color: theme.labelTextColor,
                borderColor: isEditMode ? undefined : 'transparent',
              }}
              onClick={(e) => { e.stopPropagation(); if (isEditMode) setEditingUnit(true); }}
              title={isEditMode ? '点击编辑单位' : undefined}
            >
              {department.unit}
            </span>
          )}
        </div>

        {isEditMode && (
          <div className="flex items-center gap-1 shrink-0">
            <Button type="button" size="icon" variant="ghost" className="h-6 w-6 rounded-full"
              onClick={(e) => { e.stopPropagation(); setCardEditorOpen((open) => !open); }} title="单独调整卡片">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </Button>
            <Button type="button" size="icon" variant="ghost" className="h-6 w-6 rounded-full"
              onClick={(e) => { e.stopPropagation(); avatarFileInputRef.current?.click(); }} title="添加大头贴">
              <UserPlus className="w-3.5 h-3.5" />
            </Button>
            <Button type="button" size="icon" variant="ghost" className="h-6 w-6 rounded-full text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); removeDepartment(department.id); }} title="删除部门">
              <X className="w-3.5 h-3.5" />
            </Button>
            {isManualMode && <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />}
          </div>
        )}
        </div>
      </div>

      <input ref={avatarFileInputRef} type="file" accept="image/png,image/jpeg,image/gif" className="hidden" onChange={handleAvatarUpload} />
      <input ref={climberFileInputRef} type="file" accept="image/png,image/jpeg,image/gif" className="hidden" onChange={handleClimberUpload} />
    </div>
  );
}
