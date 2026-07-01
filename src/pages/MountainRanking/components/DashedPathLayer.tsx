import { useMemo } from 'react';
import { useMountainRanking } from '@/context/MountainRankingContext';
import type { PathStyle } from '@/types/mountain-ranking';

const PATH_PRESETS: Record<PathStyle, { dashArray?: string; strokeLinecap?: 'round' | 'butt' | 'square' }> = {
  dashed: { dashArray: '1.2 0.8', strokeLinecap: 'round' },
  dots: { dashArray: '0.2 0.6', strokeLinecap: 'round' },
  solid: { dashArray: undefined, strokeLinecap: 'round' },
  wave: { dashArray: '0.6 0.4 0.1 0.4', strokeLinecap: 'round' },
  arrow: { dashArray: undefined, strokeLinecap: 'round' },
  footprint: { dashArray: '0.3 0.9', strokeLinecap: 'round' },
};

export default function DashedPathLayer() {
  const { sortedDepartments, isEditMode, theme } = useMountainRanking();

  const pathPoints = useMemo(() => {
    return sortedDepartments.map((d) => ({ x: d.position.x, y: d.position.y }));
  }, [sortedDepartments]);

  if (pathPoints.length < 2) return null;

  const pathD = useMemo(() => {
    if (pathPoints.length < 2) return '';
    let d = `M ${pathPoints[0].x} ${pathPoints[0].y}`;
    for (let i = 1; i < pathPoints.length; i++) {
      const prev = pathPoints[i - 1];
      const curr = pathPoints[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      d += ` Q ${midX} ${midY - 2} ${curr.x} ${curr.y}`;
    }
    return d;
  }, [pathPoints]);

  const preset = PATH_PRESETS[theme.pathStyle] ?? PATH_PRESETS.dashed;
  const useFootprintMarkers = theme.pathStyle === 'footprint';
  const useArrowMarkers = theme.pathStyle === 'arrow';

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <filter id="path-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="0.5" floodOpacity="0.3" />
        </filter>

        {useFootprintMarkers && (
          <>
            <marker id="footprint-marker" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="1.2" markerHeight="1.2" orient="auto-start-reverse">
              <path d="M5 1.5 C3.5 1.5 2.5 2.8 2.5 4.5 C2.5 6.5 4 8.5 5 9 C6 8.5 7.5 6.5 7.5 4.5 C7.5 2.8 6.5 1.5 5 1.5 Z M3.5 3.5 L6.5 3.5 M3.5 5 L6.5 5 M3.5 6.5 L6 6.5"
                fill="none" stroke="currentColor" strokeWidth="0.4" strokeLinecap="round" />
            </marker>
            <marker id="footprint-marker-start" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="1.2" markerHeight="1.2" orient="auto">
              <path d="M5 1.5 C3.5 1.5 2.5 2.8 2.5 4.5 C2.5 6.5 4 8.5 5 9 C6 8.5 7.5 6.5 7.5 4.5 C7.5 2.8 6.5 1.5 5 1.5 Z"
                fill="currentColor" opacity="0.8" />
            </marker>
          </>
        )}

        {useArrowMarkers && (
          <marker id="arrow-marker" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="1.5" markerHeight="1.5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
          </marker>
        )}
      </defs>

      <g style={{ color: theme.pathColor }}>
        <path d={pathD} fill="none" stroke="currentColor" strokeWidth={theme.pathWidth}
          strokeDasharray={preset.dashArray} strokeLinecap={preset.strokeLinecap}
          filter="url(#path-shadow)" className="opacity-80"
          markerEnd={useArrowMarkers ? 'url(#arrow-marker)' : undefined}
          markerMid={useFootprintMarkers ? 'url(#footprint-marker)' : undefined} />

        {useFootprintMarkers && (
          <path d={pathD} fill="none" stroke="currentColor" strokeWidth="0.15"
            strokeDasharray="0.1 2.5" strokeLinecap="round"
            markerMid="url(#footprint-marker)" markerStart="url(#footprint-marker-start)" className="opacity-70" />
        )}
      </g>

      {isEditMode && (
        <path d={pathD} fill="none" stroke={theme.pathColor} strokeWidth="0.15"
          strokeDasharray="0.4 0.6" strokeLinecap="round" className="opacity-40" />
      )}
    </svg>
  );
}
