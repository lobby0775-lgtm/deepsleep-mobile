import { useState } from 'react';
import { compareQuotes, type CarContext, type Quote } from '../calc/quote-rate';
import { money, pct } from '../calc/format';
import { NumberField, SelectField, Stat, Tier } from '../components/Fields';

/**
 * Compare insurance quotes on what they actually cost.
 *
 * The premium is the only number an insurer advertises, so it is the number
 * buyers compare — and the one easiest to disguise. Every quote is restated
 * before ranking: discounts stripped out, excess measured against the car's
 * value, the term multiplied out, and lock-in priced.
 */

const CAR_DEFAULTS = { omv: 22_000, marketValue: 22_000, keepYears: 5 };

/** Two example quotes, built so the comparison shows a real trade-off. */
function seedQuotes(): Quote[] {
  return [
    {
      id: 'q1', insurer: 'Insurer A', premium: 2400, premiumIsNet: true,
      ncdPct: 50, otherDiscountPct: 5, excess: 2000, theftExcessPct: 10,
      lockedYears: 1, sumInsured: 22_000,
    },
    {
      id: 'q2', insurer: 'Insurer B', premium: 1900, premiumIsNet: true,
      ncdPct: 50, otherDiscountPct: 30, excess: 2000, theftExcessPct: 10,
      lockedYears: 3, sumInsured: 22_000,
    },
  ];
}

export function InsuranceQuotes() {
  const [car, setCar] = useState(CAR_DEFAULTS);
  const [quotes, setQuotes] = useState<Quote[]>(seedQuotes);

  const setQ = (i: number, patch: Partial<Quote>) =>
    setQuotes((qs) => qs.map((q, j) => (j === i ? { ...q, ...patch } : q)));

  const result = compareQuotes(quotes, car as CarContext);

  return (
    <>
      <div className="page-head">
        <h1>Which quote is actually cheapest</h1>
        <p>
          Two quotes for the same car can differ by thousands and still be identical in substance. Each one is restated before
          ranking: your discounts removed, excess measured against what the car is worth, the term multiplied out, and lock-in
          priced as the real cost it is.
        </p>
      </div>

      <div className="cols results-first">
        <div className="stack">
          <section>
            <div className="grid-2">
              <NumberField label="Car's value (OMV)" prefix="$" value={car.omv} onChange={(v) => setCar({ ...car, omv: v, marketValue: v })} />
              <NumberField label="You'll keep it for" suffix="years" value={car.keepYears} onChange={(v) => setCar({ ...car, keepYears: v })} min={1} max={10} />
            </div>
            <p className="small muted" style={{ marginTop: 12, marginBottom: 0, maxWidth: '54ch' }}>
              Insurers price off the car's value and how long you will own it, not the price you paid. Set those two and add a
              quote below.
            </p>
          </section>

          {quotes.map((q, i) => {
            const s = result.ranked.find((x) => x.quote.id === q.id);
            return (
              <Tier
                key={q.id}
                label={q.insurer || `Quote ${i + 1}`}
                badge={s ? money(s.grossPremium) : ''}
                summary={s ? `${money(s.netPremium)}/yr · ${q.lockedYears}yr · excess ${pct(s.excessPctOfValue, 1)} of value` : ''}
              >
                <div className="grid-2">
                  <div className="field">
                    <label className="field-label" htmlFor={`ins-${q.id}`}>Insurer</label>
                    <div className="input-wrap">
                      <input id={`ins-${q.id}`} value={q.insurer} onChange={(e) => setQ(i, { insurer: e.target.value })} />
                    </div>
                  </div>
                  <NumberField label="Quoted premium" prefix="$" suffix="/yr" value={q.premium} onChange={(v) => setQ(i, { premium: v })} />
                  <NumberField label="Your NCD" suffix="%" value={q.ncdPct} onChange={(v) => setQ(i, { ncdPct: v })} min={0} max={50} />
                  <NumberField label="Other discounts" suffix="%" value={q.otherDiscountPct} onChange={(v) => setQ(i, { otherDiscountPct: v })} hint="Loyalty, safe driver, age" />
                  <NumberField label="Excess" prefix="$" value={q.excess} onChange={(v) => setQ(i, { excess: v })} />
                  <NumberField label="Theft excess" suffix="% of value" value={q.theftExcessPct} onChange={(v) => setQ(i, { theftExcessPct: v })} />
                  <SelectField label="Premium locked for" value={q.lockedYears} onChange={(v) => setQ(i, { lockedYears: v })}
                    options={[{ value: 1, label: '1 year, renewable' }, { value: 3, label: '3 years' }, { value: 5, label: '5 years' }]} />
                  <SelectField label="Is the quote" value={q.premiumIsNet ? 'net' : 'gross'} onChange={(v) => setQ(i, { premiumIsNet: v === 'net' })}
                    options={[{ value: 'net', label: 'After discounts' }, { value: 'gross', label: 'Before discounts' }]}
                    hint="Most quotes are after. Check the wording." />
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setQuotes(qs => qs.filter((_, j) => j !== i))}>Remove quote</button>
              </Tier>
            );
          })}

          <div>
            <button className="btn" onClick={() => setQuotes((qs) => [...qs, {
              id: `q${Date.now()}`, insurer: '', premium: 0, premiumIsNet: true, ncdPct: 50,
              otherDiscountPct: 0, excess: 2000, theftExcessPct: 10, lockedYears: 1, sumInsured: car.marketValue,
            }])}>+ Add quote</button>
          </div>
        </div>

        <aside className="stack sticky">
          <section>
            <div className="rule-head"><h2>The finding</h2></div>
            <p style={{ marginTop: 0 }}>{result.finding}</p>
            {result.best && (
              <div className="stats">
                <Stat label="Best rate" value={money(result.best.grossPremium)} sub={`${result.best.quote.insurer}, before discounts`} />
                <Stat label="You'd pay" value={money(result.best.netPremium)} sub="per year with your discounts" />
              </div>
            )}
          </section>

          {result.ranked.length > 0 && (
            <section>
              <div className="rule-head"><h2>All quotes, restated</h2></div>
              <div style={{ overflowX: 'auto' }}>
                <table className="lines">
                  <thead>
                    <tr>
                      <th>Insurer</th>
                      <th>Rate</th>
                      <th>You pay</th>
                      <th>Excess</th>
                      <th>Term</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.ranked.map((s) => (
                      <tr key={s.quote.id} className={s === result.best ? 'total' : ''}>
                        <td>
                          {s.quote.insurer}
                          {s.flags.length > 0 && (
                            <div style={{ fontSize: '0.6875rem', color: 'var(--muted)', marginTop: 2 }}>
                              {[...s.flags].map(flagLabel).join(' · ')}
                            </div>
                          )}
                        </td>
                        <td>{money(s.grossPremium)}</td>
                        <td>{money(s.netPremium)}</td>
                        <td>{pct(s.excessPctOfValue, 1)}</td>
                        <td>{s.quote.lockedYears}yr</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="chart-note">
                Rate is the premium before your discounts. Excess is measured against the car's value so a small car and a big
                car compare fairly.
              </p>
            </section>
          )}

          {result.questions.length > 0 && (
            <section>
              <div className="rule-head"><h2>Ask before signing</h2></div>
              <ul className="questions">
                {result.questions.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}

function flagLabel(f: string): string {
  const map: Record<string, string> = {
    expensive: 'costs more',
    'cheap-for-a-reason': 'cheaper on price only',
    'long-lock': 'long lock-in',
    'lock-in-penalty': 'lock-in penalty',
    'high-excess': 'high excess',
    underinsured: 'under-insured',
    'excess-buydown': 'excess buy-down offered',
    extras: 'bundled extras',
    'outlives-car': 'term outlasts the car',
  };
  return map[f] ?? f;
}
