import { useId, useMemo } from 'react';
import { useMountainRanking } from '@/context/MountainRankingContext';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function PathMeteorLayer() {
  const { sortedDepartments, theme } = useMountainRanking();
  const svgId = useId().replace(/:/g, '');

  const pathPoints = useMemo(() => {
    return [...sortedDepartments]
      .reverse()
      .map((dept) => ({ x: dept.position.x, y: dept.position.y, name: dept.name }));
  }, [sortedDepartments]);

  const pathD = useMemo(() => {
    if (pathPoints.length < 2) return '';
    let d = `M ${pathPoints[0].x} ${pathPoints[0].y}`;
    for (let i = 1; i < pathPoints.length; i += 1) {
      const prev = pathPoints[i - 1];
      const curr = pathPoints[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2 - 2;
      d += ` Q ${midX} ${midY} ${curr.x} ${curr.y}`;
    }
    return d;
  }, [pathPoints]);

  if (!theme.pathGlowEnabled || pathPoints.length < 2 || !pathD) return null;

  const cycleDuration = clamp(theme.pathGlowDuration, 4, 40) + clamp(theme.pathGlowInterval, 0, 90);
  const travelRatio = clamp(theme.pathGlowDuration / cycleDuration, 0.2, 0.96);
  const fadeInRatio = clamp(0.04 / travelRatio, 0.02, 0.08);
  const fadeOutRatio = clamp(travelRatio - 0.025, 0.1, 0.94);
  const glowColor = theme.pathGlowColor || '#8bdcff';

  return (
    <svg
      className="path-meteor-layer pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ color: glowColor }}
    >
      <defs>
        <path id={`${svgId}-meteor-path`} d={pathD} />
        <filter id={`${svgId}-meteor-blur`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="0.45" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0.06  0 0 1 0 0.18  0 0 0 1.35 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={`${svgId}-tail-gradient`} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="36%" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="78%" stopColor="currentColor" stopOpacity="0.76" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.98" />
        </linearGradient>
        <radialGradient id={`${svgId}-head-gradient`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="38%" stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <mask id={`${svgId}-card-mask`} maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width="100" height="100" fill="white" />
          {pathPoints.map((point) => {
            const width = clamp(9.6 + point.name.length * 0.72, 12.6, 23.6);
            return (
              <rect
                key={`${point.name}-${point.x}-${point.y}`}
                x={point.x - width / 2}
                y={point.y - 3.45}
                width={width}
                height="6.9"
                rx="2.15"
                fill="black"
              />
            );
          })}
        </mask>
      </defs>

      <g mask={`url(#${svgId}-card-mask)`}>
        <g opacity="0" filter={`url(#${svgId}-meteor-blur)`}>
          <animateMotion
            dur={`${cycleDuration}s`}
            repeatCount="indefinite"
            keyPoints={`0;1;1`}
            keyTimes={`0;${travelRatio};1`}
            calcMode="linear"
            rotate="auto"
          >
            <mpath href={`#${svgId}-meteor-path`} />
          </animateMotion>
          <animate
            attributeName="opacity"
            values="0;1;1;0;0"
            keyTimes={`0;${fadeInRatio};${fadeOutRatio};${travelRatio};1`}
            dur={`${cycleDuration}s`}
            repeatCount="indefinite"
          />
          <path d="M -12.4 0 C -9.2 -1.24 -3.65 -1.42 0.28 -0.08 C -0.12 0.92 -2.9 1.46 -6.2 1.12 C -8.55 0.86 -10.7 0.44 -12.4 0 Z" fill={`url(#${svgId}-tail-gradient)`} opacity="0.9" />
          <path d="M -8.7 0 C -6.3 -0.42 -2.35 -0.48 0 0 C -2.35 0.48 -6.3 0.42 -8.7 0 Z" fill="#ffffff" opacity="0.2" />
          <ellipse cx="-1.1" cy="0" rx="4.25" ry="0.76" fill="currentColor" opacity="0.38" />
          <ellipse cx="0.05" cy="0" rx="1.82" ry="1.28" fill={`url(#${svgId}-head-gradient)`} />
          <circle r="0.52" fill="#ffffff" opacity="0.96" />
        </g>
      </g>
    </svg>
  );
}
