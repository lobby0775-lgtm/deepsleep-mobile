import { useEffect, useRef, useState } from 'react';
import { money } from '../calc/format';

export interface Segment {
  label: string;
  value: number;
  color: string;
}

/** One horizontal 100% bar: where each dollar of the price goes. */
export function StackedBar({ segments, ariaLabel }: { segments: Segment[]; ariaLabel: string }) {
  const total = segments.reduce((a, s) => a + Math.max(0, s.value), 0);
  const [tip, setTip] = useState<{ x: number; s: Segment } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const show = (s: Segment, el: HTMLElement) => {
    const box = ref.current!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const x = Math.min(Math.max(r.left + r.width / 2 - box.left, 80), box.width - 80);
    setTip({ x, s });
  };

  return (
    <div className="chart" ref={ref}>
      <div className="stackbar" role="img" aria-label={ariaLabel}>
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <div
              key={s.label}
              tabIndex={0}
              style={{ flexGrow: s.value, flexBasis: 0, background: s.color }}
              aria-label={`${s.label}: ${money(s.value)}`}
              onPointerEnter={(e) => show(s, e.currentTarget)}
              onPointerLeave={() => setTip(null)}
              onFocus={(e) => show(s, e.currentTarget)}
              onBlur={() => setTip(null)}
            />
          ))}
      </div>
      {tip && (
        <div className="tooltip" style={{ left: tip.x, top: 32, transform: 'translateX(-50%)' }}>
          <div className="t-title">{tip.s.label}</div>
          <div className="t-row">
            <span className="t-key" style={{ background: tip.s.color }} />
            <b>{money(tip.s.value)}</b>
            <span className="muted">{Math.round((tip.s.value / total) * 100)}%</span>
          </div>
        </div>
      )}
      <div className="legend">
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <span key={s.label}>
              <i style={{ background: s.color }} />
              {s.label} {Math.round((s.value / total) * 100)}%
            </span>
          ))}
      </div>
    </div>
  );
}

export interface Series {
  name: string;
  color: string;
  values: number[];
  dashed?: boolean;
}

/** Round tick step so four gridlines land on readable values. */
function niceStep(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

const short = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${Math.round(n)}`);

/** Value over time with a crosshair tooltip. x[0] is the starting point. */
export function LineChart({ x, series, height = 240, ariaLabel }: { x: string[]; series: Series[]; height?: number; ariaLabel: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pad = { l: 48, r: 22, t: 12, b: 28 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const step = niceStep(Math.max(...series.flatMap((s) => s.values)) / 4);
  const max = step * 4;
  const n = x.length;
  const px = (i: number) => pad.l + (n > 1 ? (i / (n - 1)) * w : 0);
  const py = (v: number) => pad.t + h - (v / max) * h;
  const ticks = [0, 1, 2, 3, 4].map((k) => k * step);
  const labelEvery = Math.ceil(n / Math.max(2, Math.floor(w / 44)));

  const onMove = (e: React.PointerEvent) => {
    const r = (e.currentTarget as SVGElement).getBoundingClientRect();
    const rel = (e.clientX - r.left - pad.l) / w;
    setHover(Math.min(n - 1, Math.max(0, Math.round(rel * (n - 1)))));
  };

  return (
    <div className="chart" ref={ref}>
      <div className="legend">
        {series.map((s) => (
          <span key={s.name}>
            <i className={s.dashed ? 'dash' : 'line'} style={{ background: s.color, borderColor: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
      <svg width={width} height={height} role="img" aria-label={ariaLabel} onPointerMove={onMove} onPointerLeave={() => setHover(null)} style={{ display: 'block', touchAction: 'pan-y' }}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={pad.l + w} y1={py(t)} y2={py(t)} stroke={t === 0 ? 'var(--axis)' : 'var(--grid)'} strokeWidth={1} />
            <text x={pad.l - 8} y={py(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--muted)">
              {short(t)}
            </text>
          </g>
        ))}
        {x.map((lab, i) =>
          (i % labelEvery === 0 && n - 1 - i >= labelEvery) || i === n - 1 ? (
            <text key={i} x={px(i)} y={height - 8} textAnchor="middle" fontSize={11} fill="var(--muted)">
              {lab}
            </text>
          ) : null,
        )}
        {hover !== null && <line x1={px(hover)} x2={px(hover)} y1={pad.t} y2={pad.t + h} stroke="var(--axis)" strokeWidth={1} />}
        {series.map((s) => (
          <polyline
            key={s.name}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={s.dashed ? '5 4' : undefined}
            points={s.values.map((v, i) => `${px(i)},${py(v)}`).join(' ')}
          />
        ))}
        {hover !== null &&
          series.map((s) => (
            <circle key={s.name} cx={px(hover)} cy={py(s.values[hover])} r={4} fill={s.color} stroke="var(--surface)" strokeWidth={2} />
          ))}
        <rect x={pad.l} y={pad.t} width={w} height={h} fill="transparent" />
      </svg>
      {hover !== null && (
        <div className="tooltip" style={{ left: Math.min(px(hover) + 12, width - 170), top: 36 }}>
          <div className="t-title">{x[hover]}</div>
          {series.map((s) => (
            <div className="t-row" key={s.name}>
              <span className="t-key" style={{ background: s.color }} />
              <span className="muted">{s.name}</span>
              <b>{money(s.values[hover])}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
