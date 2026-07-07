import { useRef, useEffect, useState } from 'react';
import { MountainRankingProvider, useMountainRanking } from '@/context/MountainRankingContext';
import BackgroundLayer from './components/BackgroundLayer';
import RankingLabel from './components/RankingLabel';
import DashedPathLayer from './components/DashedPathLayer';
import PathMeteorLayer from './components/PathMeteorLayer';
import TitleHeader from './components/TitleHeader';
import FloatModule from './components/FloatModule';
import ControlToolbar from './components/ControlToolbar';
import { cn } from '@/lib/utils';

function MountainRankingCanvas() {
  const { sortedDepartments, floatModules, isManualMode, resetToAutoRanking, departments, isEditMode, isLoadingCloud, theme } = useMountainRanking();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const [isTvDisplay, setIsTvDisplay] = useState(false);

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

  useEffect(() => {
    const detectTvDisplay = () => {
      const viewport = window.visualViewport;
      const width = viewport?.width ?? window.innerWidth;
      const height = viewport?.height ?? window.innerHeight;
      const ua = navigator.userAgent || '';
      const isAndroidTv = /Android/i.test(ua) && !/Mobile/i.test(ua);
      const isTvUa = /(TV|TCL|MiTV|MiBOX|BRAVIA|SmartTV|HbbTV|Web0S|NetCast|Hisense|AFT|AppleTV)/i.test(ua);
      setIsTvDisplay(width >= 960 && height >= 520 && (isAndroidTv || isTvUa));
    };

    detectTvDisplay();
    const updateSoon = () => window.setTimeout(detectTvDisplay, 80);
    window.addEventListener('resize', updateSoon);
    window.addEventListener('orientationchange', updateSoon);
    window.visualViewport?.addEventListener('resize', updateSoon);

    return () => {
      window.removeEventListener('resize', updateSoon);
      window.removeEventListener('orientationchange', updateSoon);
      window.visualViewport?.removeEventListener('resize', updateSoon);
    };
  }, []);

  const baseCardScale = isTvDisplay
    ? (isEditMode ? 0.76 : 1.58)
    : 1;
  const dashboardStyle = {
    '--ranking-card-scale': String(baseCardScale * (theme.labelScale ?? 1)),
    '--ranking-font-scale': String(theme.labelFontScale ?? 1),
  } as React.CSSProperties;

  return (
    <div
      ref={canvasRef}
      className={cn(
        'mountain-dashboard relative w-full h-screen overflow-hidden bg-background',
        isEditMode ? 'is-editing' : 'is-preview',
        isMobileLandscape && 'is-mobile-landscape',
        isTvDisplay && 'is-tv-display',
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

          {floatModules.some((mod) => !mod.minimized && (mod.contentUrl || mod.type === 'ticker')) && (
            <section className="landscape-dashboard__media-grid">
              {floatModules.filter((mod) => !mod.minimized && (mod.contentUrl || mod.type === 'ticker')).slice(0, 2).map((mod) => (
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
                    <img src={mod.contentUrl} alt={mod.title} />
                  ) : (
                    <video src={mod.contentUrl} autoPlay loop muted playsInline preload="auto" />
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
                <article
                  key={mod.id}
                  className="mobile-dashboard__module"
                  style={{
                    backgroundColor: theme.floatBgColor,
                    borderColor: theme.floatBorderColor,
                  }}
                >
                  <h2>{mod.title}</h2>
                  <div className="mobile-dashboard__media">
                    {mod.type === 'ticker' ? (
                      <div className="mobile-dashboard__ticker">
                        {(mod.scrollItems ?? []).slice(0, mod.visibleRows ?? 2).map((item) => (
                          <div key={item.id}><strong>{item.name}</strong><span>{item.content}</span></div>
                        ))}
                      </div>
                    ) : mod.contentUrl ? (
                      mod.type === 'image' ? (
                        <img src={mod.contentUrl} alt={mod.title} />
                      ) : (
                        <video src={mod.contentUrl} autoPlay loop muted playsInline preload="auto" />
                      )
                    ) : (
                      <span>{mod.type === 'image' ? '暂无图片' : '暂无视频'}</span>
                    )}
                  </div>
                </article>
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
