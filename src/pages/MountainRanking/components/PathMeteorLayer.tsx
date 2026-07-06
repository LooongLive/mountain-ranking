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
  const flashStart = clamp(travelRatio, 0.2, 0.96);
  const flashPeak = clamp(flashStart + 0.025, 0.22, 0.98);
  const flashEnd = clamp(flashStart + 0.12, 0.28, 0.995);
  const topPoint = pathPoints[pathPoints.length - 1];
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
        <filter id={`${svgId}-card-flash`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="1.2" result="softGlow" />
          <feMerge>
            <feMergeNode in="softGlow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id={`${svgId}-head-gradient`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="38%" stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <mask id={`${svgId}-card-mask`} maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width="100" height="100" fill="white" />
          {pathPoints.map((point) => {
            const width = clamp(12 + point.name.length * 1.1, 15, 28);
            return (
              <rect
                key={`${point.name}-${point.x}-${point.y}`}
                x={point.x - width / 2}
                y={point.y - 4.6}
                width={width}
                height="9.2"
                rx="2.8"
                fill="black"
              />
            );
          })}
        </mask>
      </defs>

      <g mask={`url(#${svgId}-card-mask)`}>
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeDasharray="8 116"
          strokeDashoffset="116"
          opacity="0"
          filter={`url(#${svgId}-meteor-blur)`}
        >
          <animate
            attributeName="stroke-dashoffset"
            values="116;0;0"
            keyTimes={`0;${travelRatio};1`}
            dur={`${cycleDuration}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;0.92;0.92;0;0"
            keyTimes={`0;${fadeInRatio};${fadeOutRatio};${travelRatio};1`}
            dur={`${cycleDuration}s`}
            repeatCount="indefinite"
          />
        </path>

        <circle r="1.6" fill={`url(#${svgId}-head-gradient)`} opacity="0" filter={`url(#${svgId}-meteor-blur)`}>
          <animateMotion
            dur={`${cycleDuration}s`}
            repeatCount="indefinite"
            keyPoints={`0;1;1`}
            keyTimes={`0;${travelRatio};1`}
            calcMode="linear"
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
        </circle>
      </g>

      <rect
        x={topPoint.x - 12}
        y={topPoint.y - 5.4}
        width="24"
        height="10.8"
        rx="3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.55"
        opacity="0"
        filter={`url(#${svgId}-card-flash)`}
      >
        <animate
          attributeName="opacity"
          values="0;0;0.95;0.22;0"
          keyTimes={`0;${flashStart};${flashPeak};${flashEnd};1`}
          dur={`${cycleDuration}s`}
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke-width"
          values="0.45;0.45;1.05;0.55;0.45"
          keyTimes={`0;${flashStart};${flashPeak};${flashEnd};1`}
          dur={`${cycleDuration}s`}
          repeatCount="indefinite"
        />
      </rect>
    </svg>
  );
}
