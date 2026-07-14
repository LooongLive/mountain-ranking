import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Edit3, Image as ImageIcon, LogOut, Plus, Save, Settings, TimerReset, Trash2, Video, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/utils';
import { useMountainRanking } from '@/context/MountainRankingContext';
import type { IAgendaItem, IFloatModule } from '@/types/mountain-ranking';

const INFO_EDIT_PASSWORD = 'MyAgenda2026!';
const INFO_BACKGROUND_PRESETS = [
  { name: '冰川蓝', value: 'linear-gradient(135deg, #07111f 0%, #1d4ed8 48%, #bfdbfe 100%)' },
  { name: '雾灰银', value: 'linear-gradient(135deg, #111827 0%, #64748b 52%, #e2e8f0 100%)' },
  { name: '暮紫蓝', value: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 48%, #ddd6fe 100%)' },
  { name: '松石绿', value: 'linear-gradient(135deg, #042f2e 0%, #0f766e 48%, #ccfbf1 100%)' },
  { name: '暖金橙', value: 'linear-gradient(135deg, #3b2503 0%, #b45309 52%, #fed7aa 100%)' },
];

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function monthLabel(date: Date) {
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月`;
}

function buildMonth(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const offset = first.getDay();
  const cells: Array<Date | null> = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= days; day += 1) {
    cells.push(new Date(date.getFullYear(), date.getMonth(), day));
  }
  while (cells.length < 42) cells.push(null);
  return cells;
}

function getWeekNumber(date: Date) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const currentDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfYear = Math.floor((currentDay.getTime() - startOfYear.getTime()) / 86400000) + 1;
  return Math.floor((dayOfYear + startOfYear.getDay() - 1) / 7) + 1;
}

function getMonthWeekLabels(cells: Array<Date | null>) {
  const labels: number[] = [];
  for (let row = 0; row < 6; row += 1) {
    const rowCells = cells.slice(row * 7, row * 7 + 7);
    const firstDate = rowCells.find((cell): cell is Date => Boolean(cell));
    labels.push(firstDate ? getWeekNumber(firstDate) : 0);
  }
  return labels;
}

function addMinutes(time: string, minutes: number) {
  const [hour = '0', minute = '0'] = time.split(':');
  const current = Number(hour) * 60 + Number(minute);
  const snapped = Math.round(current / 30) * 30;
  const next = Math.max(0, Math.min(23 * 60 + 30, snapped + minutes));
  return `${`${Math.floor(next / 60)}`.padStart(2, '0')}:${`${next % 60}`.padStart(2, '0')}`;
}

function TimeStepper({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return (
    <div className="info-page__time-stepper">
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={label} />
      <div>
        <button type="button" aria-label={`${label}增加30分钟`} onClick={() => onChange(addMinutes(value, 30))}>▲</button>
        <button type="button" aria-label={`${label}减少30分钟`} onClick={() => onChange(addMinutes(value, -30))}>▼</button>
      </div>
    </div>
  );
}

function hasConflict(items: IAgendaItem[], item: IAgendaItem) {
  return items.some((other) => {
    if (other.id === item.id || other.date !== item.date) return false;
    return item.startTime < other.endTime && item.endTime > other.startTime;
  });
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

function InfoMediaModule({ module, canEdit, onUpdate, onRemove }: {
  module: IFloatModule;
  canEdit: boolean;
  onUpdate: (patch: Partial<IFloatModule>) => void;
  onRemove: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const dragRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const activeUrl = module.pages?.find((page) => page.contentUrl)?.contentUrl ?? module.contentUrl;

  const beginDrag = (event: React.PointerEvent) => {
    if (!canEdit) return;
    dragRef.current = { x: event.clientX, y: event.clientY, startX: module.position.x, startY: module.position.y };
    ref.current?.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: React.PointerEvent) => {
    if (!dragRef.current) return;
    const nextX = dragRef.current.startX + event.clientX - dragRef.current.x;
    const nextY = dragRef.current.startY + event.clientY - dragRef.current.y;
    onUpdate({ position: { x: Math.max(0, Math.min(1600, nextX)), y: Math.max(0, Math.min(880, nextY)) } });
  };

  const endDrag = (event: React.PointerEvent) => {
    dragRef.current = null;
    ref.current?.releasePointerCapture(event.pointerId);
  };

  return (
    <article
      ref={ref}
      className={cn('info-media-module', canEdit && 'is-editable')}
      style={{
        left: `${module.position.x}px`,
        top: `${module.position.y}px`,
        width: `${module.size.width}px`,
        height: `${module.size.height}px`,
      }}
      onPointerDown={beginDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
    >
      {canEdit && (
        <button type="button" className="info-media-module__delete" onClick={(event) => { event.stopPropagation(); onRemove(); }}>
          <Trash2 size={15} />
        </button>
      )}
      {activeUrl ? (
        module.type === 'video'
          ? <video src={activeUrl} autoPlay loop muted playsInline preload="auto" />
          : <img src={activeUrl} alt={module.title} />
      ) : (
        <span>{module.type === 'video' ? '视频公告' : '图片公告'}</span>
      )}
    </article>
  );
}

export default function InfoDisplayPage({ active, onEditingChange }: { active: boolean; onEditingChange?: (editing: boolean) => void }) {
  const { infoPage, setInfoPage, saveToCloudWithPassword } = useMountainRanking();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAgendaEditor, setShowAgendaEditor] = useState(false);
  const [showMobileAgenda, setShowMobileAgenda] = useState(false);
  const [focusedAgendaDates, setFocusedAgendaDates] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [infoEditPassword, setInfoEditPassword] = useState('');
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [draft, setDraft] = useState<IAgendaItem>(() => ({
    id: generateId('agenda'),
    date: toDateKey(new Date()),
    startTime: '09:00',
    endTime: '10:00',
    title: '',
    owner: '',
    location: '',
    note: '',
    color: '#60a5fa',
  }));
  const bgInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const mediaTypeRef = useRef<'image' | 'video'>('image');
  const titleDragRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const titleRef = useRef<HTMLElement>(null);
  const agendaListRef = useRef<HTMLDivElement>(null);
  const agendaScrollTopRef = useRef(0);
  const [calendarBaseDate, setCalendarBaseDate] = useState(() => new Date());

  const months = useMemo(() => {
    return [0, 1, 2].map((offset) => new Date(calendarBaseDate.getFullYear(), calendarBaseDate.getMonth() + offset, 1));
  }, [calendarBaseDate]);
  const itemsByDate = useMemo(() => {
    const map = new Map<string, IAgendaItem[]>();
    infoPage.agendaItems.forEach((item) => {
      map.set(item.date, [...(map.get(item.date) ?? []), item].sort((a, b) => a.startTime.localeCompare(b.startTime)));
    });
    return map;
  }, [infoPage.agendaItems]);
  const selectedItems = itemsByDate.get(selectedDate) ?? [];
  const allAgendaItems = useMemo(() => (
    [...infoPage.agendaItems].sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))
  ), [infoPage.agendaItems]);
  const todayKey = toDateKey(calendarBaseDate);
  const visibleAgendaItems = useMemo(() => (
    allAgendaItems.filter((item) => item.date >= todayKey)
  ), [allAgendaItems, todayKey]);
  const conflict = hasConflict(infoPage.agendaItems, { ...draft, date: selectedDate });
  const mainTitleSize = infoPage.mainTitleSize ?? 72;
  const subTitleSize = infoPage.subTitleSize ?? 20;
  const titlePositionX = infoPage.titlePositionX ?? 4;
  const titlePositionY = infoPage.titlePositionY ?? 5;
  const switchTransition = infoPage.switchTransition ?? 'fade';

  useEffect(() => {
    const timer = window.setInterval(() => setCalendarBaseDate(new Date()), 60 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const list = agendaListRef.current;
    if (!active || !list) return undefined;

    const maxScrollTop = Math.max(0, list.scrollHeight - list.clientHeight);
    list.scrollTop = Math.min(agendaScrollTopRef.current, maxScrollTop);
    updateFocusedAgendaDates(list);

    if (isEditing || visibleAgendaItems.length < 3 || list.scrollHeight <= list.clientHeight) return undefined;
    const timer = window.setInterval(() => {
      if (list.scrollTop + list.clientHeight >= list.scrollHeight - 2) {
        list.scrollTop = 0;
        agendaScrollTopRef.current = 0;
        updateFocusedAgendaDates(list);
        return;
      }
      list.scrollTop += 1;
      agendaScrollTopRef.current = list.scrollTop;
      updateFocusedAgendaDates(list);
    }, 90);
    return () => window.clearInterval(timer);
  }, [active, isEditing, visibleAgendaItems.length]);

  const unlock = () => {
    if (password.trim() !== INFO_EDIT_PASSWORD) {
      alert('信息展示密码不正确。');
      return;
    }
    setInfoEditPassword(password.trim());
    setPassword('');
    setIsUnlocked(true);
    setIsEditing(true);
    setShowLogin(false);
    onEditingChange?.(true);
  };

  const addAgenda = () => {
    if (!draft.title.trim()) return;
    setInfoPage((prev) => ({ ...prev, agendaItems: [...prev.agendaItems, { ...draft, date: selectedDate, id: generateId('agenda') }] }));
    setDraft((prev) => ({ ...prev, id: generateId('agenda'), title: '', owner: '', location: '', note: '' }));
  };

  const removeAgenda = (id: string) => {
    setInfoPage((prev) => ({ ...prev, agendaItems: prev.agendaItems.filter((item) => item.id !== id) }));
  };

  const updateAgenda = (id: string, patch: Partial<IAgendaItem>) => {
    setInfoPage((prev) => ({
      ...prev,
      agendaItems: prev.agendaItems.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const handleBackground = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = await fileToDataUrl(file);
    setInfoPage((prev) => ({ ...prev, backgroundImage: url, backgroundVideo: '', backgroundGradient: '' }));
    event.target.value = '';
  };

  const handleMedia = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = await fileToDataUrl(file);
    const type = mediaTypeRef.current;
    const mod: IFloatModule = {
      id: generateId('info_mod'),
      type,
      title: type === 'video' ? '视频公告' : '图片公告',
      contentUrl: url,
      position: { x: 1220 + infoPage.floatModules.length * 18, y: 250 + infoPage.floatModules.length * 18 },
      size: type === 'video' ? { width: 320, height: 180 } : { width: 270, height: 360 },
      minimized: false,
      orientation: type === 'video' ? 'landscape' : 'portrait',
    };
    setInfoPage((prev) => ({ ...prev, floatModules: [...prev.floatModules, mod] }));
    event.target.value = '';
  };

  const handleSave = async () => {
    try {
      await saveToCloudWithPassword(infoEditPassword);
      alert('已保存到云端。');
    } catch (error) {
      alert(error instanceof Error ? error.message : '保存失败。');
    }
  };

  const beginTitleDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (!isEditing) return;
    titleDragRef.current = { x: event.clientX, y: event.clientY, startX: titlePositionX, startY: titlePositionY };
    titleRef.current?.setPointerCapture(event.pointerId);
  };

  const moveTitleDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (!titleDragRef.current) return;
    const nextX = titleDragRef.current.startX + ((event.clientX - titleDragRef.current.x) / window.innerWidth) * 100;
    const nextY = titleDragRef.current.startY + ((event.clientY - titleDragRef.current.y) / window.innerHeight) * 100;
    setInfoPage((prev) => ({
      ...prev,
      titlePositionX: Math.max(0, Math.min(70, nextX)),
      titlePositionY: Math.max(1, Math.min(28, nextY)),
    }));
  };

  const endTitleDrag = (event: React.PointerEvent<HTMLElement>) => {
    titleDragRef.current = null;
    titleRef.current?.releasePointerCapture(event.pointerId);
  };

  const updateFocusedAgendaDates = (container: HTMLDivElement) => {
    const cards = Array.from(container.querySelectorAll<HTMLElement>('[data-agenda-date]'));
    const containerRect = container.getBoundingClientRect();
    const visibleDates = cards
      .filter((card) => {
        const cardRect = card.getBoundingClientRect();
        return cardRect.bottom > containerRect.top + 8 && cardRect.top < containerRect.bottom - 8;
      })
      .map((card) => card.dataset.agendaDate)
      .filter((date): date is string => Boolean(date));
    setFocusedAgendaDates(Array.from(new Set(visibleDates)));
  };

  const handleAgendaScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    agendaScrollTopRef.current = container.scrollTop;
    updateFocusedAgendaDates(container);
  };

  return (
    <section
      className={cn('info-page', active && 'is-active', isEditing && 'is-editing')}
      onPointerDown={(event) => {
        const target = event.target as HTMLElement;
        if (isEditing && showAgendaEditor && !target.closest('.info-page__agenda-popover') && !target.closest('.info-page__days button')) {
          setShowAgendaEditor(false);
        }
        if (showMobileAgenda && !target.closest('.info-page__mobile-agenda') && !target.closest('.info-page__days button')) {
          setShowMobileAgenda(false);
        }
      }}
    >
      {infoPage.backgroundVideo ? (
        <video className="info-page__background" src={infoPage.backgroundVideo} autoPlay loop muted playsInline />
      ) : infoPage.backgroundGradient ? (
        <div className="info-page__background info-page__background--gradient" style={{ background: infoPage.backgroundGradient }} />
      ) : (
        <img className="info-page__background" src={infoPage.backgroundImage} alt="" />
      )}
      <div className="info-page__wash" />

      <div className="info-page__toolbar">
        {!isUnlocked ? (
          <>
            <Button size="sm" variant="secondary" className="jump-login-button" aria-label="Join" onClick={() => setShowLogin(true)}>
              <span aria-hidden="true">Join</span>
              <span aria-hidden="true">Join</span>
              <span aria-hidden="true">Join</span>
              <span aria-hidden="true">Join</span>
            </Button>
            {showLogin && (
              <div className="info-page__login-popover">
                <strong>信息展示编辑</strong>
                <Input
                  type="password"
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') unlock(); }}
                  placeholder="请输入编辑密码"
                />
                <div>
                  <Button size="sm" variant="secondary" onClick={() => { setShowLogin(false); setPassword(''); }}>取消</Button>
                  <Button size="sm" onClick={unlock}>登录</Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <Button size="sm" variant={isEditing ? 'default' : 'secondary'} onClick={() => setIsEditing((v) => {
              onEditingChange?.(!v);
              return !v;
            })}>
              <Edit3 size={15} /> {isEditing ? '预览' : '编辑'}
            </Button>
            {isEditing && (
              <Button size="sm" variant={showSettings ? 'default' : 'secondary'} onClick={() => setShowSettings((v) => !v)}>
                <Settings size={15} />
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => { setIsUnlocked(false); setIsEditing(false); setShowSettings(false); setShowAgendaEditor(false); setInfoEditPassword(''); onEditingChange?.(false); }}>
              <LogOut size={15} /> 退出
            </Button>
          </>
        )}
      </div>

      <header
        ref={titleRef}
        className={cn('info-page__title', isEditing && 'is-draggable')}
        style={{ left: `${titlePositionX}vw`, top: `${titlePositionY}vh` }}
        onPointerDown={beginTitleDrag}
        onPointerMove={moveTitleDrag}
        onPointerUp={endTitleDrag}
      >
        <p style={{ color: infoPage.subTitleColor, fontSize: `${subTitleSize}px` }}>{infoPage.subTitle}</p>
        <h1 style={{ color: infoPage.mainTitleColor, fontSize: `${mainTitleSize}px` }}>{infoPage.mainTitle}</h1>
      </header>

      <main className="info-page__layout" onPointerDown={(event) => {
        const target = event.target as HTMLElement;
        if (isEditing && showAgendaEditor && !target.closest('.info-page__agenda-popover') && !target.closest('.info-page__days button')) {
          setShowAgendaEditor(false);
        }
        if (showMobileAgenda && !target.closest('.info-page__mobile-agenda') && !target.closest('.info-page__days button')) {
          setShowMobileAgenda(false);
        }
      }}>
        <section className="info-page__calendar-shell">
          <div className="info-page__months">
            {months.map((month) => {
              const monthCells = buildMonth(month);
              const weekLabels = getMonthWeekLabels(monthCells);
              return (
                <section className="info-page__month" key={month.toISOString()}>
                  <h2>{monthLabel(month)}</h2>
                  <div className="info-page__month-body">
                    <div className="info-page__weeknums" aria-hidden="true">
                      <span>周</span>
                      {weekLabels.map((week, index) => <b key={`${month.toISOString()}-${index}`}>{week ? week : ''}</b>)}
                    </div>
                    <div className="info-page__month-grid">
                      <div className="info-page__weekdays">{['日', '一', '二', '三', '四', '五', '六'].map((d) => <span key={d}>{d}</span>)}</div>
                      <div className="info-page__days">
                        {monthCells.map((date, index) => {
                    const key = date ? toDateKey(date) : `blank-${index}`;
                    const dayItems = date ? itemsByDate.get(key) ?? [] : [];
                    const isToday = date ? key === todayKey : false;
                    const isPastDate = Boolean(date && key < todayKey);
                    const isPastAgenda = Boolean(isPastDate && dayItems.length);
                    const weekStart = Math.floor(index / 7) * 7;
                    const selectedInWeek = monthCells
                      .slice(weekStart, weekStart + 7)
                      .some((cell) => cell && toDateKey(cell) === selectedDate);
                    const shouldShowInlineAgenda = !isEditing
                      && showMobileAgenda
                      && selectedItems.length > 0
                      && selectedInWeek
                      && index % 7 === 6;
                    return (
                      <Fragment key={key}>
                        <button
                          type="button"
                          disabled={!date}
                          className={cn(
                            dayItems.length && 'has-agenda',
                            isPastDate && 'is-past-date',
                            isPastAgenda && 'is-past-agenda',
                            isToday && 'is-today',
                            selectedDate === key && 'is-selected',
                            focusedAgendaDates.includes(key) && 'is-in-view',
                          )}
                          onClick={() => {
                            if (!date) return;
                            setSelectedDate(key);
                            setDraft((prev) => ({ ...prev, date: key }));
                            if (isEditing) setShowAgendaEditor(true);
                            if (!isEditing && dayItems.length > 0 && typeof window !== 'undefined' && window.matchMedia('(max-width: 720px) and (orientation: portrait)').matches) {
                              setShowMobileAgenda(true);
                            }
                          }}
                        >
                          {isToday && <em>今日</em>}
                          {date && <span>{date.getDate()}</span>}
                          {dayItems.length > 0 && <i style={{ background: dayItems[0].color }}>{dayItems.length}</i>}
                        </button>
                        {shouldShowInlineAgenda && (
                          <div className="info-page__mobile-agenda info-page__mobile-agenda--inline" role="dialog" aria-label="当日议程">
                            <button type="button" className="info-page__panel-close" onClick={() => setShowMobileAgenda(false)}><X size={14} /></button>
                            <strong>{selectedDate}　第 {getWeekNumber(new Date(selectedDate))} 周</strong>
                            <div>
                              {selectedItems.map((item) => (
                                <article key={item.id} style={{ '--agenda-color': item.color } as React.CSSProperties}>
                                  <time>{item.startTime} - {item.endTime}</time>
                                  <h3>{item.title || '未命名议程'}</h3>
                                  <p>{item.owner} · {item.location}</p>
                                  {item.note && <small>{item.note}</small>}
                                </article>
                              ))}
                            </div>
                          </div>
                        )}
                      </Fragment>
                    );
                        })}
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        <section className="info-page__agenda-panel">
          <div className="info-page__agenda-title">
            <span>详细日程</span>
            <strong>{visibleAgendaItems.length ? `${visibleAgendaItems.length} 项安排` : '暂无安排'}</strong>
          </div>
          <div className="info-page__agenda-list" ref={agendaListRef} onScroll={handleAgendaScroll}>
            {visibleAgendaItems.map((item) => (
              <article key={item.id} data-agenda-date={item.date} style={{ '--agenda-color': item.color } as React.CSSProperties}>
                <time>{item.date}　第 {getWeekNumber(new Date(item.date))} 周　{item.startTime} - {item.endTime}</time>
                <h3>{item.title}</h3>
                <p>{item.owner} · {item.location}</p>
                {item.note && <small>{item.note}</small>}
              </article>
            ))}
            {!visibleAgendaItems.length && (
              <article style={{ '--agenda-color': '#60a5fa' } as React.CSSProperties}>
                <time>点击左侧日期</time>
                <h3>登录编辑后添加客户访问、审核或会议安排</h3>
                <p>系统会自动提示同日时间冲突。</p>
              </article>
            )}
          </div>
        </section>

        <aside className="info-page__media-zone">
        </aside>
      </main>

      {infoPage.floatModules.map((module) => (
        <InfoMediaModule
          key={module.id}
          module={module}
          canEdit={isEditing}
          onUpdate={(patch) => setInfoPage((prev) => ({
            ...prev,
            floatModules: prev.floatModules.map((m) => (m.id === module.id ? { ...m, ...patch } : m)),
          }))}
          onRemove={() => setInfoPage((prev) => ({ ...prev, floatModules: prev.floatModules.filter((m) => m.id !== module.id) }))}
        />
      ))}

      {isEditing && showAgendaEditor && (
        <div className="info-page__agenda-popover">
          <button type="button" className="info-page__panel-close" onClick={() => setShowAgendaEditor(false)}><X size={14} /></button>
          <div className="info-page__edit-section">
            <strong>新增议程</strong>
            <Label>选中日期</Label>
            <Input type="date" value={selectedDate} onChange={(e) => {
              setSelectedDate(e.target.value);
              setDraft((prev) => ({ ...prev, date: e.target.value }));
            }} />
            <div className="grid grid-cols-2 gap-2">
              <TimeStepper value={draft.startTime} onChange={(value) => setDraft((prev) => ({ ...prev, startTime: value }))} label="开始 09:00" />
              <TimeStepper value={draft.endTime} onChange={(value) => setDraft((prev) => ({ ...prev, endTime: value }))} label="结束 10:00" />
            </div>
            <Input value={draft.title} onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))} placeholder="议程标题" />
            <Input value={draft.owner} onChange={(e) => setDraft((prev) => ({ ...prev, owner: e.target.value }))} placeholder="负责部门/人员" />
            <Input value={draft.location} onChange={(e) => setDraft((prev) => ({ ...prev, location: e.target.value }))} placeholder="地点" />
            <Input value={draft.note} onChange={(e) => setDraft((prev) => ({ ...prev, note: e.target.value }))} placeholder="备注" />
            {conflict && <p className="info-page__conflict">该时间段与当日已有安排重叠，请谨慎添加。</p>}
            <Button size="sm" onClick={addAgenda}><Plus size={15} /> 添加议程</Button>
          </div>
          <div className="info-page__edit-section">
            <strong>选中日期安排</strong>
            <div className="info-page__agenda-edit-list">
              {selectedItems.map((item) => (
                <article key={item.id}>
                  <div className="info-page__agenda-row">
                    <TimeStepper value={item.startTime} onChange={(value) => updateAgenda(item.id, { startTime: value })} label="开始" />
                    <TimeStepper value={item.endTime} onChange={(value) => updateAgenda(item.id, { endTime: value })} label="结束" />
                    <button type="button" onClick={() => removeAgenda(item.id)}><Trash2 size={15} /></button>
                  </div>
                  <Input value={item.title} onChange={(e) => updateAgenda(item.id, { title: e.target.value })} />
                  <Input value={item.owner} onChange={(e) => updateAgenda(item.id, { owner: e.target.value })} />
                </article>
              ))}
              {!selectedItems.length && <span>当前日期暂无安排</span>}
            </div>
          </div>
        </div>
      )}

      {isEditing && showSettings && (
        <div className="info-page__edit-dock">
          <button type="button" className="info-page__panel-close" onClick={() => setShowSettings(false)}><X size={14} /></button>
          <div className="info-page__edit-section info-page__edit-section--secondary">
            <strong>页面设置</strong>
            <div className="info-page__edit-actions">
              <Button size="sm" variant="secondary" onClick={() => bgInputRef.current?.click()}><ImageIcon size={15} /> 背景</Button>
              <Button size="sm" variant="secondary" onClick={() => { mediaTypeRef.current = 'image'; mediaInputRef.current?.click(); }}><ImageIcon size={15} /> 图片公告</Button>
              <Button size="sm" variant="secondary" onClick={() => { mediaTypeRef.current = 'video'; mediaInputRef.current?.click(); }}><Video size={15} /> 视频公告</Button>
            </div>
            <div className="info-page__gradient-presets">
              <span>渐变背景</span>
              <div>
                {INFO_BACKGROUND_PRESETS.map((preset) => (
                  <button
                    type="button"
                    key={preset.name}
                    className={cn(infoPage.backgroundGradient === preset.value && 'is-active')}
                    onClick={() => setInfoPage((prev) => ({ ...prev, backgroundGradient: preset.value, backgroundVideo: '' }))}
                  >
                    <i style={{ background: preset.value }} />
                    {preset.name}
                  </button>
                ))}
                <button type="button" onClick={() => setInfoPage((prev) => ({ ...prev, backgroundGradient: '', backgroundVideo: '' }))}>
                  使用图片
                </button>
              </div>
            </div>
            <label className="info-page__switch-setting">
              <span>标题</span>
              <input
                value={infoPage.mainTitle}
                onChange={(e) => setInfoPage((prev) => ({ ...prev, mainTitle: e.target.value }))}
                aria-label="信息展示标题"
              />
            </label>
            <label className="info-page__switch-setting">
              <span>副标题</span>
              <input
                value={infoPage.subTitle}
                onChange={(e) => setInfoPage((prev) => ({ ...prev, subTitle: e.target.value }))}
                aria-label="信息展示副标题"
              />
            </label>
            <label className="info-page__switch-setting">
              <span>标题色</span>
              <input
                type="color"
                value={infoPage.mainTitleColor}
                onChange={(e) => setInfoPage((prev) => ({ ...prev, mainTitleColor: e.target.value }))}
                aria-label="信息展示标题颜色"
              />
            </label>
            <label className="info-page__switch-setting">
              <span>副标题色</span>
              <input
                type="color"
                value={infoPage.subTitleColor}
                onChange={(e) => setInfoPage((prev) => ({ ...prev, subTitleColor: e.target.value }))}
                aria-label="信息展示副标题颜色"
              />
            </label>
            <label className="info-page__switch-setting">
              <span>标题字号</span>
              <input
                type="number"
                min={28}
                max={140}
                value={mainTitleSize}
                onChange={(e) => setInfoPage((prev) => ({ ...prev, mainTitleSize: Number(e.target.value) || 72 }))}
              />
            </label>
            <label className="info-page__switch-setting">
              <span>副标题字号</span>
              <input
                type="number"
                min={12}
                max={52}
                value={subTitleSize}
                onChange={(e) => setInfoPage((prev) => ({ ...prev, subTitleSize: Number(e.target.value) || 20 }))}
              />
            </label>
            <label className="info-page__switch-setting">
              <TimerReset size={14} />
              <span>排名</span>
              <input
                type="number"
                min={5}
                max={600}
                value={infoPage.rankingHoldSeconds}
                onChange={(e) => setInfoPage((prev) => ({ ...prev, rankingHoldSeconds: Number(e.target.value) || 5 }))}
              />
              <span>秒</span>
            </label>
            <label className="info-page__switch-setting">
              <TimerReset size={14} />
              <span>信息</span>
              <input
                type="number"
                min={5}
                max={600}
                value={infoPage.infoHoldSeconds}
                onChange={(e) => setInfoPage((prev) => ({ ...prev, infoHoldSeconds: Number(e.target.value) || 5 }))}
              />
              <span>秒</span>
            </label>
            <label className="info-page__switch-setting">
              <span>切换效果</span>
              <select
                value={switchTransition}
                onChange={(e) => setInfoPage((prev) => ({ ...prev, switchTransition: e.target.value as typeof switchTransition }))}
              >
                <option value="fade">柔和淡入</option>
                <option value="slide">横向滑入</option>
                <option value="glass">玻璃浮现</option>
                <option value="zoom">轻微缩放</option>
              </select>
            </label>
            <Button
              size="sm"
              variant={infoPage.autoSwitchEnabled ? 'default' : 'secondary'}
              onClick={() => setInfoPage((prev) => ({ ...prev, autoSwitchEnabled: !prev.autoSwitchEnabled }))}
            >
              自动切换
            </Button>
          </div>
          <Button className="info-page__save-button" size="sm" variant="secondary" onClick={handleSave}><Save size={15} /> 保存云端</Button>
        </div>
      )}

      <input ref={bgInputRef} type="file" accept="image/png,image/jpeg,image/gif" className="hidden" onChange={handleBackground} />
      <input ref={mediaInputRef} type="file" accept="image/png,image/jpeg,image/gif,video/*" className="hidden" onChange={handleMedia} />
    </section>
  );
}
