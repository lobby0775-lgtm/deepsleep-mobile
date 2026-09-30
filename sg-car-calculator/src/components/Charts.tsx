import { useEffect, useRef, useState } from 'react';
import { money } from '../calc/format';

export interface Segment {
  label: string;
  value: number;
  /** Optional override; by default segments are shaded on one ink ramp. */
  color?: string;
  /** Nudge the shade when a segment would otherwise collide with a neighbour. */
  tone?: number;
}

/**
 * Where each dollar goes, as one 100% bar.
 *
 * The segments are shaded on a single ink ramp ordered by size rather than
 * given five unrelated hues: the eye should read "how big is the biggest
 * slice", and hairlines do the separating. A legend is not rendered because
 * every caller already prints the same figures in a table directly below, and
 * a second colour key next to the first is noise.
 */
export function StackedBar({ segments, ariaLabel }: { segments: Segment[]; ariaLabel: string }) {
  const shown = segments.filter((s) => s.value > 0);
  const total = shown.reduce((a, s) => a + s.value, 0);
  const [tip, setTip] = useState<{ x: number; s: Segment } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Darkest for the largest slice, lightest for the smallest. Monochrome on
  // purpose: the ramp encodes magnitude, and any hue in here would be read as
  // "this segment means something" when it does not.
  const ordered = [...shown].sort((a, b) => b.value - a.value);
  const shades = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)'];
  const shadeFor = new Map(ordered.map((s, i) => [s.label, s.color ?? shades[Math.min(i, shades.length - 1)]]));

  const show = (s: Segment, el: HTMLElement) => {
    const box = ref.current!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const x = Math.min(Math.max(r.left + r.width / 2 - box.left, 80), Math.max(80, box.width - 80));
    setTip({ x, s });
  };

  if (!shown.length) return null;

  return (
    <div className="chart" ref={ref}>
      <div className="stackbar" role="img" aria-label={ariaLabel}>
        {shown.map((s) => (
          <div
            key={s.label}
            tabIndex={0}
            style={{ flexGrow: s.value, flexBasis: 0, background: shadeFor.get(s.label) }}
            aria-label={`${s.label}: ${money(s.value)}`}
            onPointerEnter={(e) => show(s, e.currentTarget)}
            onPointerLeave={() => setTip(null)}
            onFocus={(e) => show(s, e.currentTarget)}
            onBlur={() => setTip(null)}
          />
        ))}
      </div>
      {tip && (
        <div className="tooltip" style={{ left: tip.x, top: 34, transform: 'translateX(-50%)' }}>
          <div className="t-title">{tip.s.label}</div>
          <div className="t-row">
            <span className="t-key" style={{ background: shadeFor.get(tip.s.label) }} />
            <b>{money(tip.s.value)}</b>
            <span className="muted">{total ? Math.round((tip.s.value / total) * 100) : 0}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * One series over time. Gridlines are hairlines in a very light ink, tick
 * labels are mono and small, and the plot has no frame — a chart in a
 * financial report does not sit in a box.
 */
export function LineChart({
  x,
  series,
  height = 260,
  ariaLabel,
}: {
  x: string[];
  series: { name: string; color?: string; values: number[]; dashed?: boolean }[];
  height?: number;
  ariaLabel: string;
}) {
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

  const pad = { l: 52, r: 16, t: 16, b: 30 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;

  const niceStep = (v: number) => {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
    return 10 * p;
  };
  const step = niceStep(Math.max(...series.flatMap((s) => s.values)) / 4);
  const max = step * 4;
  const n = x.length;
  const px = (i: number) => pad.l + (n > 1 ? (i / (n - 1)) * w : 0);
  const py = (v: number) => pad.t + h - (v / max) * h;
  const ticks = [0, 1, 2, 3, 4].map((k) => k * step);
  const labelEvery = Math.ceil(n / Math.max(2, Math.floor(w / 52)));

  const onMove = (e: React.PointerEvent) => {
    const r = (e.currentTarget as SVGElement).getBoundingClientRect();
    const rel = (e.clientX - r.left - pad.l) / w;
    setHover(Math.min(n - 1, Math.max(0, Math.round(rel * (n - 1)))));
  };

  return (
    <div className="chart" ref={ref}>
      <svg width={width} height={height} role="img" aria-label={ariaLabel} onPointerMove={onMove} onPointerLeave={() => setHover(null)} style={{ display: 'block', touchAction: 'pan-y' }}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={pad.l + w} y1={py(t)} y2={py(t)} stroke={t === 0 ? 'var(--axis)' : 'var(--grid)'} strokeWidth={1} />
            <text x={pad.l - 10} y={py(t)} dy="0.32em" textAnchor="end" fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">
              {t >= 1000 ? `$${Math.round(t / 1000)}k` : `$${Math.round(t)}`}
            </text>
          </g>
        ))}
        {x.map((lab, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text key={i} x={px(i)} y={height - 10} textAnchor="middle" fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">
              {lab}
            </text>
          ) : null,
        )}
        {hover !== null && <line x1={px(hover)} x2={px(hover)} y1={pad.t} y2={pad.t + h} stroke="var(--axis)" strokeWidth={1} />}
        {series.map((s) => (
          <polyline
            key={s.name}
            fill="none"
            stroke={s.color ?? 'var(--s1)'}
            strokeWidth={1.75}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={s.dashed ? '5 4' : undefined}
            points={s.values.map((v, i) => `${px(i)},${py(v)}`).join(' ')}
          />
        ))}
        {hover !== null &&
          series.map((s) => (
            <circle key={s.name} cx={px(hover)} cy={py(s.values[hover])} r={3.5} fill={s.color ?? 'var(--s1)'} stroke="var(--page)" strokeWidth={2} />
          ))}
        <rect x={pad.l} y={pad.t} width={w} height={h} fill="transparent" />
      </svg>
      {hover !== null && (
        <div className="tooltip" style={{ left: Math.min(px(hover) + 12, Math.max(0, width - 180)), top: 40 }}>
          <div className="t-title">{x[hover]}</div>
          {series.map((s) => (
            <div className="t-row" key={s.name}>
              <span className="t-key" style={{ background: s.color ?? 'var(--s1)' }} />
              <span className="muted">{s.name}</span>
              <b>{money(s.values[hover])}</b>
            </div>
          ))}
        </div>
      )}
      <div className="legend">
        {series.map((s) => (
          <span key={s.name}>
            <i className={s.dashed ? 'dash' : 'line'} style={{ background: s.color ?? 'var(--s1)', borderColor: s.color ?? 'var(--s1)' }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
