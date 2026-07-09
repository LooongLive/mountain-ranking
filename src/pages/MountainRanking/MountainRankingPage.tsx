import { useMemo, useRef, useEffect, useState } from 'react';
import { MountainRankingProvider, useMountainRanking } from '@/context/MountainRankingContext';
import BackgroundLayer from './components/BackgroundLayer';
import RankingLabel from './components/RankingLabel';
import DashedPathLayer from './components/DashedPathLayer';
import PathMeteorLayer from './components/PathMeteorLayer';
import TitleHeader from './components/TitleHeader';
import FloatModule from './components/FloatModule';
import ControlToolbar from './components/ControlToolbar';
import { cn } from '@/lib/utils';
import type { IFloatModule } from '@/types/mountain-ranking';

function getFloatModuleContentUrl(module: IFloatModule) {
  return module.pages?.find((page) => page.contentUrl)?.contentUrl ?? module.contentUrl;
}

function MobileFloatModuleCard({ module, theme }: { module: IFloatModule; theme: ReturnType<typeof useMountainRanking>['theme'] }) {
  const [activePageIndex, setActivePageIndex] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isAnnouncement = module.type === 'image' || module.type === 'video';
  const pages = useMemo(() => {
    if (!isAnnouncement) return [];
    if (module.pages?.length) return module.pages;
    if (module.contentUrl) return [{ id: 'legacy', contentUrl: module.contentUrl, durationSeconds: 5 }];
    return [];
  }, [isAnnouncement, module.contentUrl, module.pages]);
  const activePage = pages[activePageIndex] ?? pages[0];
  const visibleRows = Math.max(1, Math.min(8, module.visibleRows ?? 2));
  const scrollItems = module.scrollItems ?? [];
  const shouldScroll = scrollItems.length > visibleRows && scrollItems.length > 2;
  const tickerRows = shouldScroll ? [...scrollItems, ...scrollItems] : scrollItems;
  const tickerSpeed = Math.max(4, Math.min(90, module.tickerSpeed ?? 12));
  const tickerFontSize = Math.max(10, Math.min(36, module.tickerFontSize ?? 15));

  useEffect(() => {
    if (!isAnnouncement || pages.length <= 1) return;
    const duration = Math.max(1, Math.min(120, activePage?.durationSeconds ?? 5)) * 1000;
    const timer = window.setTimeout(() => {
      setActivePageIndex((index) => (index + 1) % pages.length);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [activePage?.durationSeconds, isAnnouncement, pages.length]);

  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (!touchStartRef.current || pages.length <= 1) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    if (Math.abs(dx) < 36 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    setActivePageIndex((index) => (dx < 0 ? (index + 1) % pages.length : (index - 1 + pages.length) % pages.length));
  };

  const tickerStyle = {
    '--ticker-visible-rows': visibleRows,
    '--ticker-duration': `${tickerSpeed}s`,
    '--ticker-font-size': `${tickerFontSize}px`,
    '--ticker-row-height': `${Math.max(42, tickerFontSize * 2.8)}px`,
  } as React.CSSProperties;

  return (
    <article
      className="mobile-dashboard__module"
      style={{
        backgroundColor: theme.floatBgColor,
        borderColor: theme.floatBorderColor,
      }}
    >
      <h2>{module.title}</h2>
      <div
        className={cn('mobile-dashboard__media', isAnnouncement && pages.length > 1 && 'is-swipeable')}
        onTouchStart={isAnnouncement ? handleTouchStart : undefined}
        onTouchEnd={isAnnouncement ? handleTouchEnd : undefined}
      >
        {module.type === 'ticker' ? (
          <div className="mobile-dashboard__ticker ticker-module" style={tickerStyle}>
            <div className="mobile-dashboard__ticker-viewport ticker-viewport">
              <div className={cn('ticker-track', shouldScroll && 'is-scrolling')}>
                {(tickerRows.length ? tickerRows : [{ id: 'empty', name: '姓名', content: '改善内容' }]).map((item, index) => (
                  <div className="ticker-row" key={`${item.id}-${index}`}>
                    <strong>{item.name}</strong>
                    <span>{item.content}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activePage?.contentUrl ? (
          <>
            {module.type === 'image' ? (
              <img key={`${activePage.id}-${activePageIndex}`} src={activePage.contentUrl} alt={module.title} />
            ) : (
              <video key={`${activePage.id}-${activePageIndex}`} src={activePage.contentUrl} autoPlay loop muted playsInline preload="auto" />
            )}
            {pages.length > 1 && (
              <div className="mobile-dashboard__module-dots" aria-hidden="true">
                {pages.map((page, index) => (
                  <span key={page.id} className={cn(index === activePageIndex && 'is-active')} />
                ))}
              </div>
            )}
          </>
        ) : (
          <span>{module.type === 'image' ? '暂无图片' : '暂无视频'}</span>
        )}
      </div>
    </article>
  );
}

function MountainRankingCanvas() {
  const { sortedDepartments, floatModules, isManualMode, resetToAutoRanking, departments, isEditMode, isLoadingCloud, theme } = useMountainRanking();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);

  useEffect(() => {
    if (isManualMode) return;
    const allAuto = departments.every((d) => !d.position.isManual);
    if (allAuto) {
      resetToAutoRanking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departments.length, isManualMode]);

  useEffect(() => {
    const detectMobileLandscape = () => {
      const viewport = window.visualViewport;
      const width = viewport?.width ?? window.innerWidth;
      const height = viewport?.height ?? window.innerHeight;
      const hasTouch = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
      const isShortLandscape = width > height && height <= 720;
      setIsMobileLandscape(isShortLandscape && hasTouch);
    };

    detectMobileLandscape();
    const updateSoon = () => window.setTimeout(detectMobileLandscape, 80);
    window.addEventListener('resize', updateSoon);
    window.addEventListener('orientationchange', updateSoon);
    window.visualViewport?.addEventListener('resize', updateSoon);

    return () => {
      window.removeEventListener('resize', updateSoon);
      window.removeEventListener('orientationchange', updateSoon);
      window.visualViewport?.removeEventListener('resize', updateSoon);
    };
  }, []);

  const dashboardStyle = {
    '--ranking-card-scale': String(theme.labelScale ?? 1),
    '--ranking-font-scale': String(theme.labelFontScale ?? 1),
  } as React.CSSProperties;

  return (
    <div
      ref={canvasRef}
      className={cn(
        'mountain-dashboard relative w-full h-screen overflow-hidden bg-background',
        isEditMode ? 'is-editing' : 'is-preview',
        isMobileLandscape && 'is-mobile-landscape',
      )}
      style={dashboardStyle}
    >
      <BackgroundLayer />
      <TitleHeader />
      <DashedPathLayer />
      <PathMeteorLayer />
      {isLoadingCloud && (
        <div className="absolute left-1/2 top-4 z-40 -translate-x-1/2 rounded-md bg-background/80 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
          正在加载云端数据...
        </div>
      )}
      <div className="desktop-dashboard-layer">
        {sortedDepartments.map((dept) => (
          <RankingLabel key={dept.id} department={dept} canvasRef={canvasRef} />
        ))}
        {floatModules.map((mod) => (
          <FloatModule key={mod.id} module={mod} canvasRef={canvasRef} />
        ))}
      </div>
      {!isEditMode && isMobileLandscape && (
        <div className="landscape-dashboard">
          <header className="landscape-dashboard__header">
            <h1 style={{ color: theme.mainTitleColor }}>{theme.mainTitle}</h1>
            <p style={{ color: theme.subTitleColor }}>{theme.subTitle}</p>
          </header>

          <section className="landscape-dashboard__ranking" style={{ color: theme.labelTextColor }}>
            {sortedDepartments.map((dept, index) => (
              <article
                key={dept.id}
                className="landscape-dashboard__rank-card"
                style={{
                  backgroundColor: theme.labelBgColor,
                  borderColor: theme.labelShowBorder ? theme.labelBorderColor : 'transparent',
                }}
              >
                <span className="landscape-dashboard__rank-no">{index + 1}</span>
                <span className="landscape-dashboard__icon" aria-hidden="true">
                  {dept.climberImage ? (
                    <img src={dept.climberImage} alt="" />
                  ) : (
                    <svg viewBox="0 0 24 32" fill="currentColor">
                      <path d="M12 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-5 9a2 2 0 0 1 1.8-2h6.4a2 2 0 0 1 1.9 2.6L16 18h-2l-.5-2h-3L10 18H8l-1.1-4.4A2 2 0 0 1 7 11Zm-2 13a1 1 0 0 1-1-1v-5a1 1 0 0 1 2 0v3.2l1.2-1.6 2.6-3.6 1.4 1.4-2 2.6-1.8 2.4.2 1.6H5Zm14 0h-3.6l.2-1.6-1.8-2.4-2-2.6 1.4-1.4 2.6 3.6 1.2 1.6V18a1 1 0 1 1 2 0v5a1 1 0 0 1-1 1Z" />
                      <path d="M3 28a1 1 0 0 1-.2-1.4l8-10a1 1 0 0 1 1.4.2l.2.2a1 1 0 0 1-.2 1.4l-8 10A1 1 0 0 1 3 28Zm18 0a1 1 0 0 1-.8-1.6l-7-9a1 1 0 1 1 1.4-1.4l7 9A1 1 0 0 1 21 28Z" />
                    </svg>
                  )}
                </span>
                <strong>{dept.name}</strong>
                <span className="landscape-dashboard__value">
                  <b>{dept.count}</b>
                  <small>{dept.unit}</small>
                </span>
              </article>
            ))}
          </section>

          {floatModules.some((mod) => !mod.minimized && (getFloatModuleContentUrl(mod) || mod.type === 'ticker')) && (
            <section className="landscape-dashboard__media-grid">
              {floatModules.filter((mod) => !mod.minimized && (getFloatModuleContentUrl(mod) || mod.type === 'ticker')).slice(0, 2).map((mod) => (
                <article
                  key={mod.id}
                  className="landscape-dashboard__media-card"
                  style={{
                    backgroundColor: theme.floatBgColor,
                    borderColor: theme.floatBorderColor,
                  }}
                >
                  {mod.type === 'ticker' ? (
                    <div className="landscape-dashboard__ticker">
                      {(mod.scrollItems ?? []).slice(0, mod.visibleRows ?? 2).map((item) => (
                        <div key={item.id}><strong>{item.name}</strong><span>{item.content}</span></div>
                      ))}
                    </div>
                  ) : mod.type === 'image' ? (
                    <img src={getFloatModuleContentUrl(mod)} alt={mod.title} />
                  ) : (
                    <video src={getFloatModuleContentUrl(mod)} autoPlay loop muted playsInline preload="auto" />
                  )}
                </article>
              ))}
            </section>
          )}
        </div>
      )}
      {!isEditMode && (
        <div className="mobile-dashboard">
          <header className="mobile-dashboard__header">
            <h1 style={{ color: theme.mainTitleColor }}>{theme.mainTitle}</h1>
            <p style={{ color: theme.subTitleColor }}>{theme.subTitle}</p>
          </header>

          <section className="mobile-dashboard__ranking" style={{ color: theme.labelTextColor }}>
            {sortedDepartments.map((dept, index) => (
              <article
                key={dept.id}
                className="mobile-dashboard__rank-row"
                style={{
                  backgroundColor: theme.labelBgColor,
                  borderColor: theme.labelShowBorder ? theme.labelBorderColor : 'transparent',
                }}
              >
                <div className="mobile-dashboard__rank-index">{index + 1}</div>
                <div className="mobile-dashboard__climber" aria-hidden="true">
                  {dept.climberImage ? (
                    <img src={dept.climberImage} alt="" />
                  ) : (
                    <svg viewBox="0 0 24 32" fill="currentColor">
                      <path d="M12 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-5 9a2 2 0 0 1 1.8-2h6.4a2 2 0 0 1 1.9 2.6L16 18h-2l-.5-2h-3L10 18H8l-1.1-4.4A2 2 0 0 1 7 11Zm-2 13a1 1 0 0 1-1-1v-5a1 1 0 0 1 2 0v3.2l1.2-1.6 2.6-3.6 1.4 1.4-2 2.6-1.8 2.4.2 1.6H5Zm14 0h-3.6l.2-1.6-1.8-2.4-2-2.6 1.4-1.4 2.6 3.6 1.2 1.6V18a1 1 0 1 1 2 0v5a1 1 0 0 1-1 1Z" />
                      <path d="M3 28a1 1 0 0 1-.2-1.4l8-10a1 1 0 0 1 1.4.2l.2.2a1 1 0 0 1-.2 1.4l-8 10A1 1 0 0 1 3 28Zm18 0a1 1 0 0 1-.8-1.6l-7-9a1 1 0 1 1 1.4-1.4l7 9A1 1 0 0 1 21 28Z" />
                    </svg>
                  )}
                </div>
                <div className="mobile-dashboard__dept">
                  <strong>{dept.name}</strong>
                  {dept.avatars.length > 0 && (
                    <div className="mobile-dashboard__avatars">
                      {dept.avatars.slice(0, 5).map((avatar) => (
                        <img key={avatar.id} src={avatar.imageUrl} alt="" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="mobile-dashboard__count">
                  <strong>{dept.count}</strong>
                  <span>{dept.unit}</span>
                </div>
              </article>
            ))}
          </section>

          {floatModules.some((mod) => !mod.minimized) && (
            <section className="mobile-dashboard__modules">
              {floatModules.filter((mod) => !mod.minimized).map((mod) => (
                <MobileFloatModuleCard key={mod.id} module={mod} theme={theme} />
              ))}
            </section>
          )}
        </div>
      )}
      <ControlToolbar />
    </div>
  );
}

export default function MountainRankingPage() {
  return (
    <MountainRankingProvider>
      <MountainRankingCanvas />
    </MountainRankingProvider>
  );
}
