import { useEffect, useId, useState, type ReactNode } from 'react';

function Help({ term }: { term?: string }) {
  if (!term) return null;
  return (
    <a className="help" href={`#/guides/${term}`} title="What is this?" aria-label="What is this?">
      ?
    </a>
  );
}

const fmt = (n: number) => (Number.isFinite(n) ? n.toLocaleString('en-SG', { maximumFractionDigits: 2 }) : '');

export function NumberField(props: {
  label: ReactNode;
  value: number;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
  hint?: ReactNode;
  help?: string;
  min?: number;
  max?: number;
}) {
  const id = useId();
  const [text, setText] = useState(fmt(props.value));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(fmt(props.value));
  }, [props.value, focused]);

  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {props.label}
        <Help term={props.help} />
      </label>
      <div className="input-wrap">
        {props.prefix && <span className="affix">{props.prefix}</span>}
        <input
          id={id}
          inputMode="decimal"
          value={text}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setText(fmt(props.value));
          }}
          onChange={(e) => {
            setText(e.target.value);
            const n = parseFloat(e.target.value.replace(/[^0-9.\-]/g, ''));
            let v = Number.isFinite(n) ? n : 0;
            if (props.min !== undefined) v = Math.max(props.min, v);
            if (props.max !== undefined) v = Math.min(props.max, v);
            props.onChange(v);
          }}
        />
        {props.suffix && <span className="affix affix-suffix">{props.suffix}</span>}
      </div>
      {props.hint && <span className="field-hint">{props.hint}</span>}
    </div>
  );
}

export function SelectField<T extends string | number>(props: {
  label: ReactNode;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  hint?: ReactNode;
  help?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {props.label}
        <Help term={props.help} />
      </label>
      <div className="input-wrap">
        <select
          id={id}
          value={String(props.value)}
          onChange={(e) => {
            const opt = props.options.find((o) => String(o.value) === e.target.value);
            if (opt) props.onChange(opt.value);
          }}
        >
          {props.options.map((o) => (
            <option key={String(o.value)} value={String(o.value)}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {props.hint && <span className="field-hint">{props.hint}</span>}
    </div>
  );
}

export function DateField(props: { label: ReactNode; value: string; onChange: (v: string) => void; hint?: ReactNode; help?: string }) {
  const id = useId();
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {props.label}
        <Help term={props.help} />
      </label>
      <div className="input-wrap">
        <input id={id} type="date" value={props.value} onChange={(e) => e.target.value && props.onChange(e.target.value)} />
      </div>
      {props.hint && <span className="field-hint">{props.hint}</span>}
    </div>
  );
}

export function Segmented<T extends string | number>(props: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label?: string;
}) {
  return (
    <div className="seg" role="group" aria-label={props.label}>
      {props.options.map((o) => (
        <button key={String(o.value)} type="button" aria-pressed={o.value === props.value} onClick={() => props.onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Check(props: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="check">
      <input type="checkbox" checked={props.checked} onChange={(e) => props.onChange(e.target.checked)} />
      <span>{props.children}</span>
    </label>
  );
}

export function Stat(props: { label: ReactNode; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="stat">
      <div className="label">{props.label}</div>
      <div className="value">{props.value}</div>
      {props.sub && <div className="sub">{props.sub}</div>}
    </div>
  );
}

/**
 * A finding worth surfacing: severity, one-line headline, one paragraph of
 * why it matters. Rendered as a left rule rather than a coloured bubble, so a
 * page full of them reads as a list of findings rather than a wall of alerts.
 */
export function FlagList({ items }: { items: { severity: 'danger' | 'warn' | 'info' | 'good'; title: string; detail: string }[] }) {
  const TAG = { danger: 'Problem', warn: 'Watch', info: 'Note', good: 'Good' } as const;
  return (
    <div>
      {items.map((f) => (
        <div key={f.title} className={`flag flag-${f.severity}`}>
          <div className="flag-head">
            <span className="tag">{TAG[f.severity]}</span>
            <strong>{f.title}</strong>
          </div>
          <p>{f.detail}</p>
        </div>
      ))}
    </div>
  );
}
