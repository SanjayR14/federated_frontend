export function HbA1cGauge({ value, max = 15, min = 4 }) {
  const v = Number(value);
  if (!Number.isFinite(v)) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No prediction
      </div>
    );
  }

  const pct = Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100));
  const angle = -90 + (pct / 100) * 180;
  const rad = (angle * Math.PI) / 180;
  const cx = 100;
  const cy = 100;
  const r = 72;
  const nx = cx + r * Math.cos(rad);
  const ny = cy + r * Math.sin(rad);

  let stroke = "#22c55e";
  if (v >= 8.5) stroke = "#ef4444";
  else if (v >= 6.5) stroke = "#f97316";
  else if (v >= 5.7) stroke = "#eab308";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="h-36 w-full max-w-xs">
        <path
          d="M 28 100 A 72 72 0 0 1 172 100"
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 28 100 A 72 72 0 0 1 172 100"
          fill="none"
          stroke={stroke}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 226} 226`}
        />
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke="#334155"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="6" fill="#334155" />
        <text x={cx} y="112" textAnchor="middle" className="fill-slate-600 text-[11px]">
          {min}% — {max}%
        </text>
      </svg>
      <p className="text-3xl font-bold tabular-nums text-slate-900">
        {v.toFixed(1)}
        <span className="text-lg font-semibold text-muted-foreground">%</span>
      </p>
      <p className="text-xs text-muted-foreground">Predicted HbA1c</p>
    </div>
  );
}
