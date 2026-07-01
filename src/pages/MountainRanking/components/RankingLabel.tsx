import { useState, useRef, useEffect, useCallback } from 'react';
import { X, UserPlus, GripVertical, RotateCcw, ImagePlus } from 'lucide-react';
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
    addAvatar, removeAvatar, updateAvatarPosition, theme, uploadFile } = useMountainRanking();

  const [editingName, setEditingName] = useState(false);
  const [editingCount, setEditingCount] = useState(false);
  const [editingUnit, setEditingUnit] = useState(false);
  const [nameValue, setNameValue] = useState(department.name);
  const [countValue, setCountValue] = useState(String(department.count));
  const [unitValue, setUnitValue] = useState(department.unit);
  const [isDragging, setIsDragging] = useState(false);
  const labelRef = useRef<HTMLDivElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const climberFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNameValue(department.name);
    setCountValue(String(department.count));
    setUnitValue(department.unit);
  }, [department.name, department.count, department.unit]);

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
    transform: 'translate(-50%, -50%)',
  };

  return (
    <div
      ref={labelRef}
      className={cn('absolute z-20 select-none', isEditMode && isManualMode && 'cursor-grab active:cursor-grabbing', isDragging && 'opacity-80')}
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
        className={cn(
          'relative flex items-center gap-3 px-4 py-2.5 rounded-2xl backdrop-blur-xl',
          isEditMode && 'hover:shadow-[0_8px_32px_rgba(0_0_0_0.12),0_2px_4px_rgba(0_0_0_0.06)] hover:-translate-y-0.5 transition-all duration-300 ease-out',
        )}
        style={{
          backgroundColor: theme.labelBgColor,
          borderColor: theme.labelShowBorder ? theme.labelBorderColor : 'transparent',
          borderWidth: theme.labelShowBorder ? '1px' : '0px',
          borderStyle: 'solid',
          color: theme.labelTextColor,
          boxShadow: theme.labelShowBorder
            ? '0 4px 24px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)'
            : 'none',
        }}
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

      <input ref={avatarFileInputRef} type="file" accept="image/png,image/jpeg,image/gif" className="hidden" onChange={handleAvatarUpload} />
      <input ref={climberFileInputRef} type="file" accept="image/png,image/jpeg,image/gif" className="hidden" onChange={handleClimberUpload} />
    </div>
  );
}
