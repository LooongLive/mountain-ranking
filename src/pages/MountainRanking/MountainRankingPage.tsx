import { useRef, useEffect } from 'react';
import { MountainRankingProvider, useMountainRanking } from '@/context/MountainRankingContext';
import BackgroundLayer from './components/BackgroundLayer';
import RankingLabel from './components/RankingLabel';
import DashedPathLayer from './components/DashedPathLayer';
import TitleHeader from './components/TitleHeader';
import FloatModule from './components/FloatModule';
import ControlToolbar from './components/ControlToolbar';
import { cn } from '@/lib/utils';

function MountainRankingCanvas() {
  const { sortedDepartments, floatModules, isManualMode, resetToAutoRanking, departments, isEditMode, isLoadingCloud, theme } = useMountainRanking();
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isManualMode) return;
    const allAuto = departments.every((d) => !d.position.isManual);
    if (allAuto) {
      resetToAutoRanking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departments.length, isManualMode]);

  return (
    <div ref={canvasRef} className={cn('mountain-dashboard relative w-full h-screen overflow-hidden bg-background', isEditMode ? 'is-editing' : 'is-preview')}>
      <BackgroundLayer />
      <TitleHeader />
      <DashedPathLayer />
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
                    {mod.contentUrl ? (
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
