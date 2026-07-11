import {
  type CategoryKey,
  type Exercise,
  formatMonthShort,
} from "@/lib/coe";

const SERIES: { key: CategoryKey; label: string; color: string }[] = [
  { key: "A", label: "Cat A", color: "#171717" },
  { key: "B", label: "Cat B", color: "#a3a3a3" },
  { key: "E", label: "Cat E", color: "#b5484d" },
];

const W = 640;
const H = 260;
const PAD = { top: 14, right: 14, bottom: 30, left: 46 };

export default function TrendChart({ exercises }: { exercises: Exercise[] }) {
  const recent = exercises.slice(-24);
  if (recent.length < 2) return null;

  const values: number[] = [];
  for (const ex of recent) {
    for (const s of SERIES) {
      const premium = ex.categories[s.key]?.premium;
      if (premium !== undefined) values.push(premium);
    }
  }
  if (values.length === 0) return null;

  const step = 10000;
  const yMin = Math.floor(Math.min(...values) / step) * step;
  const yMax = Math.ceil(Math.max(...values) / step) * step;
  const yRange = Math.max(yMax - yMin, step);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / (recent.length - 1)) * innerW;
  const y = (v: number) => PAD.top + (1 - (v - yMin) / yRange) * innerH;

  // Keep gridlines readable: thin them out if the range spans many steps.
  const gridStep = yRange / step > 6 ? step * 2 : step;
  const gridValues: number[] = [];
  for (let v = yMin; v <= yMax; v += gridStep) gridValues.push(v);

  const lines = SERIES.map((s) => {
    const points = recent
      .map((ex, i) => {
        const premium = ex.categories[s.key]?.premium;
        return premium === undefined ? null : { x: x(i), y: y(premium) };
      })
      .filter((p): p is { x: number; y: number } => p !== null);
    return { ...s, points };
  }).filter((s) => s.points.length >= 2);

  return (
    <div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-xs text-neutral-500">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block w-3 h-0.5 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {s.label}
          </span>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="COE premium trend for Categories A, B and E over the last 24 bidding exercises"
      >
        {gridValues.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              y1={y(v)}
              x2={W - PAD.right}
              y2={y(v)}
              stroke="#e5e5e5"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 8}
              y={y(v) + 3.5}
              textAnchor="end"
              fontSize="10"
              fill="#737373"
            >
              {v / 1000}k
            </text>
          </g>
        ))}
        {recent.map((ex, i) =>
          i % 4 === 0 ? (
            <text
              key={`${ex.month}-${ex.biddingNo}`}
              x={x(i)}
              y={H - 10}
              textAnchor="middle"
              fontSize="10"
              fill="#737373"
            >
              {formatMonthShort(ex.month)}
            </text>
          ) : null,
        )}
        {lines.map((s) => (
          <g key={s.key}>
            <polyline
              points={s.points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={s.color}
              strokeWidth="1.75"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <circle
              cx={s.points[s.points.length - 1].x}
              cy={s.points[s.points.length - 1].y}
              r="3"
              fill={s.color}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
