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
  const { sortedDepartments, floatModules, isManualMode, resetToAutoRanking, departments, isEditMode, isLoadingCloud } = useMountainRanking();
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
      {sortedDepartments.map((dept) => (
        <RankingLabel key={dept.id} department={dept} canvasRef={canvasRef} />
      ))}
      {floatModules.map((mod) => (
        <FloatModule key={mod.id} module={mod} canvasRef={canvasRef} />
      ))}
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
