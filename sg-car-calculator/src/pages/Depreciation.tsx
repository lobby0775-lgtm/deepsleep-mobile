import { PARF_REGIMES, type ParfRegime } from '../calc/defaults';
import { newCarDepreciation, usedCarDepreciation, type DepreciationResult } from '../calc/depreciation';
import { addYears, parfRebate, parfRegimeFor } from '../calc/rebates';
import { money } from '../calc/format';
import { Check, DateField, NumberField, Segmented, SelectField, Stat } from '../components/Fields';
import { LineChart } from '../components/Charts';
import { usePersistentState, todayIso } from '../state';
import { CALC_DEFAULTS, computeOwnership, type CalcState } from './Calculator';

function calculatorCar() {
  let s: CalcState = CALC_DEFAULTS;
  try {
    const raw = localStorage.getItem('calc');
    if (raw) s = { ...CALC_DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* storage unavailable */
  }
  const r = computeOwnership(s);
  return { price: s.dealerPrice, arfPaid: r.breakdown.arf.paid, coePaid: s.coe };
}

const car = calculatorCar();
const DEFAULTS = {
  mode: 'new' as 'new' | 'used',
  price: car.price,
  arfPaid: car.arfPaid,
  coePaid: car.coePaid,
  regime: 'budget2026' as ParfRegime,
  usedPrice: 68_000,
  regDate: '2019-06-15',
  coeExpiry: '2029-06-15',
  usedArf: 28_000,
  usedCoe: 36_000,
  coeRenewed: false,
  renewalYears: 10 as 5 | 10,
  autoRegime: true,
};

const regimeOptions = (Object.keys(PARF_REGIMES) as ParfRegime[]).map((k) => ({ value: k, label: PARF_REGIMES[k].label }));

function Schedule({ d, startLabel, price, startPaper }: { d: DepreciationResult; startLabel: string; price: number; startPaper: number }) {
  const x = [startLabel, ...d.schedule.map((r) => `Yr ${r.year}`)];
  return (
    <>
      <LineChart
        ariaLabel="Estimated market value and paper value by year"
        x={x}
        series={[
          { name: 'Estimated market value', color: 'var(--s1)', values: [price, ...d.schedule.map((r) => r.marketValue)] },
          { name: 'Paper value (deregistration floor)', color: 'var(--s2)', dashed: true, values: [startPaper, ...d.schedule.map((r) => r.paperValue)] },
        ]}
      />
      <div className="table-scroll" style={{ marginTop: 16 }}>
        <table className="data">
          <thead>
            <tr>
              <th>End of</th>
              <th>Market value</th>
              <th>Lost that year</th>
              <th>Total lost</th>
              <th>PARF</th>
              <th>COE rebate</th>
              <th>Paper value</th>
            </tr>
          </thead>
          <tbody>
            {d.schedule.map((r) => (
              <tr key={r.year}>
                <td>Year {r.year}</td>
                <td>{money(r.marketValue)}</td>
                <td>{money(r.lost)}</td>
                <td>{money(r.cumulativeLost)}</td>
                <td>{money(r.parf)}</td>
                <td>{money(r.coeRebate)}</td>
                <td>{money(r.paperValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function Depreciation() {
  const [s, setAll, set] = usePersistentState('depreciation', DEFAULTS, 'depreciation');

  const isNew = s.mode === 'new';
  const newDep = newCarDepreciation({ price: s.price, arfPaid: s.arfPaid, coePaid: s.coePaid, regime: s.regime });
  const oldRules = newCarDepreciation({ price: s.price, arfPaid: s.arfPaid, coePaid: s.coePaid, regime: 'cap60k' });
  const today = todayIso();
  const usedRegime = s.autoRegime ? parfRegimeFor(s.regDate) : s.regime;
  const used = usedCarDepreciation({
    price: s.usedPrice, regDate: s.regDate, coeExpiry: s.coeExpiry, arfPaid: s.usedArf, coePaid: s.usedCoe,
    coeRenewed: s.coeRenewed, renewalYears: s.renewalYears, today, regime: usedRegime,
  });
  const d = isNew ? newDep : used;
  // A new car's paper value on day one is its full PARF plus the whole COE.
  const startPaper = isNew ? parfRebate(s.arfPaid, 0, s.regime) + s.coePaid : used.paperValueToday;

  return (
    <>
      <div className="page-head">
        <h1>Depreciation</h1>
        <p>
          In Singapore a car's value runs down on a timetable. The COE expires after 10 years, and when you deregister you
          only get back the PARF and COE rebates. So you can work out almost exactly how much value you lose each year.
        </p>
        <Segmented label="Car type" value={s.mode} onChange={(v) => set('mode', v)} options={[{ value: 'new', label: 'New car' }, { value: 'used', label: 'Used car' }]} />
      </div>

      <div className="cols results-first">
        <div className="stack">
          <section>
            {isNew ? (
              <>
                <div className="rule-head">
                  <h2>New car</h2>
                  <button className="btn btn-ghost btn-sm" onClick={() => setAll((p) => ({ ...p, ...calculatorCar() }))}>Use my calculator car</button>
                </div>
                <div className="grid-2">
                  <NumberField label="Price paid" prefix="$" value={s.price} onChange={(v) => set('price', v)} />
                  <NumberField label="ARF paid" help="arf" prefix="$" value={s.arfPaid} onChange={(v) => set('arfPaid', v)} hint="After VES rebates or surcharges" />
                  <NumberField label="COE paid" prefix="$" value={s.coePaid} onChange={(v) => set('coePaid', v)} />
                  <SelectField label="PARF rules" help="parf" value={s.regime} onChange={(v) => set('regime', v)} options={regimeOptions} hint="New cars today fall under the Budget 2026 rules" />
                </div>
              </>
            ) : (
              <>
                <div className="rule-head"><h2>Used car</h2></div>
                <div className="grid-2">
                  <NumberField label="Asking price" prefix="$" value={s.usedPrice} onChange={(v) => set('usedPrice', v)} />
                  <DateField label="Registration date" value={s.regDate} onChange={(v) => setAll((p) => ({ ...p, regDate: v, coeExpiry: p.coeRenewed ? p.coeExpiry : addYears(v, 10) }))} />
                  <DateField label="COE expiry" value={s.coeExpiry} onChange={(v) => set('coeExpiry', v)} />
                  <NumberField label="ARF paid" help="arf" prefix="$" value={s.usedArf} onChange={(v) => set('usedArf', v)} hint="On the listing or LTA's vehicle records" />
                  <NumberField label={s.coeRenewed ? 'COE renewal (PQP) paid' : 'COE paid'} prefix="$" value={s.usedCoe} onChange={(v) => set('usedCoe', v)} />
                </div>
                <div className="stack" style={{ marginTop: 16 }}>
                  <Check checked={s.coeRenewed} onChange={(v) => set('coeRenewed', v)}>The COE has been renewed (no PARF left)</Check>
                  {s.coeRenewed && (
                    <Segmented label="Renewal length" value={s.renewalYears} onChange={(v) => set('renewalYears', v)} options={[{ value: 5, label: '5-year renewal' }, { value: 10, label: '10-year renewal' }]} />
                  )}
                  {!s.coeRenewed && (
                    <Check checked={s.autoRegime} onChange={(v) => set('autoRegime', v)}>
                      Work out PARF rules from the registration date ({PARF_REGIMES[parfRegimeFor(s.regDate)].label})
                    </Check>
                  )}
                  {!s.coeRenewed && !s.autoRegime && (
                    <SelectField label="PARF rules" value={s.regime} onChange={(v) => set('regime', v)} options={regimeOptions} />
                  )}
                </div>
              </>
            )}
          </section>

          <section>
            <div className="rule-head"><h2>Year by year</h2></div>
            <p className="small muted">
              <b>Market value</b> falls in a straight line to what the car is worth when its COE runs out. That's how dealers and
              listing sites price cars. <b>Paper value</b> is the guaranteed floor: what LTA refunds if you deregister that year.
            </p>
            {d.schedule.length ? <Schedule d={d} price={isNew ? s.price : s.usedPrice} startLabel={isNew ? 'New' : 'Now'} startPaper={startPaper} /> : <p>The COE has expired.</p>}
          </section>
        </div>

        <aside className="stack sticky">
          <section>
            <div className="rule-head"><h2>Depreciation</h2></div>
            <div className="figure-xl">{money(d.annual)}<span className="figure-unit"> / year</span></div>
            <p className="muted small">
              ({money(isNew ? s.price : s.usedPrice)} − {money(d.residual)} left at COE expiry) ÷ {d.yearsLeft.toFixed(1)} years
              = {money(d.annual / 12)} a month.
            </p>
            <div className="stats">
              <Stat label="Value at COE expiry" value={money(d.residual)} sub={s.coeRenewed && !isNew ? 'Renewed COE: no PARF' : 'PARF rebate only'} />
              <Stat label="COE left" value={`${d.yearsLeft.toFixed(1)} yrs`} />
              {!isNew && <Stat label="Paper value today" value={money(used.paperValueToday)} sub={`You pay ${money(used.premiumOverPaper)} above it`} />}
            </div>
          </section>

          {isNew && s.regime === 'budget2026' && (
            <section>
              <h2 style={{ borderTop: '1px solid var(--ink)', paddingTop: 12 }}>Budget 2026 made new cars depreciate faster</h2>
              <p className="small">
                Cars with COEs from February 2026 get back at most 30% of ARF, falling to 5% by year 10 and capped at $30,000.
                Before, it was 75%, falling to 50%. For this car:
              </p>
              <table className="lines">
                <tbody>
                  <tr><td>Depreciation, new rules</td><td>{money(newDep.annual)}/yr</td></tr>
                  <tr><td>Same car under the old rules</td><td>{money(oldRules.annual)}/yr</td></tr>
                  <tr className="total"><td>Extra cost over 10 years</td><td>{money((newDep.annual - oldRules.annual) * 10)}</td></tr>
                </tbody>
              </table>
            </section>
          )}

          {!isNew && (
            <section>
              <h2 style={{ borderTop: '1px solid var(--ink)', paddingTop: 12 }}>Reading a used-car listing</h2>
              <p className="small">
                Listing sites show "depreciation per year" using this same formula. It lets you compare a cheap car with 3 years of
                COE against a pricier one with 7. The lower number is better value, all else equal.
              </p>
              <p className="small" style={{ marginBottom: 0 }}>
                The <b>{money(used.premiumOverPaper)}</b> above paper value is what you're really paying for the car itself. If you
                scrapped it tomorrow, that's what you'd lose.
              </p>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
