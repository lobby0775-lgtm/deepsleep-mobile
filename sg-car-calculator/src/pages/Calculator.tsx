import { useState } from 'react';
import { COE_LATEST, COE_LATEST_LABEL, DATA_AS_OF, MARKET_FLAT_RATE, RUNNING_DEFAULTS, type CoeCategory, type Fuel, type VesBand } from '../calc/defaults';
import { priceBreakdown, roadTaxPerYear } from '../calc/tax';
import { earlySettlement, flatRateLoan, maxLoan } from '../calc/loan';
import { newCarDepreciation } from '../calc/depreciation';
import { estimateInsurance, insuranceRatePct, runningCostsPerYear } from '../calc/running';
import { money, pct, fmtMoney, num } from '../calc/format';
import { Check, FlagList, NumberField, Segmented, SelectField, Stat, Tier } from '../components/Fields';
import { Breakdown } from '../components/Breakdown';
import { StackedBar } from '../components/Charts';
import { PRESETS } from '../presets';
import { shareUrl, usePersistentState } from '../state';

const first = PRESETS[0];
export const CALC_DEFAULTS = {
  preset: first.id,
  dealerPrice: first.dealerPrice,
  omv: first.omv,
  category: first.category as CoeCategory,
  fuel: first.fuel as Fuel,
  vesBand: first.vesBand as VesBand,
  engineCc: first.engineCc,
  powerKW: first.powerKW,
  regYear: 2026,
  coe: COE_LATEST[first.category],
  takeLoan: true,
  /** 'pct' keeps loanPct as the source of truth; 'amount' keeps loanAmount. */
  loanInput: 'pct' as 'pct' | 'amount',
  loanPct: 60,
  loanAmountOverride: 0,
  flatRate: MARKET_FLAT_RATE,
  loanYears: 7,
  keepYears: 10,
  ncdPct: 0,
  driverAge: 35,
  yearsLicensed: 10,
  insuranceOverride: 0,
  kmPerYear: RUNNING_DEFAULTS.kmPerYear,
  litresPer100km: RUNNING_DEFAULTS.litresPer100km.petrol,
  petrolPerLitre: RUNNING_DEFAULTS.petrolPerLitre,
  kWhPer100km: RUNNING_DEFAULTS.kWhPer100km,
  electricityPerKWh: RUNNING_DEFAULTS.electricityPerKWh,
  parkingPerMonth: RUNNING_DEFAULTS.parkingPerMonth,
  erpPerMonth: RUNNING_DEFAULTS.erpPerMonth,
  servicingPerYear: RUNNING_DEFAULTS.servicingPerYear,
};
export type CalcState = typeof CALC_DEFAULTS;

/**
 * Resolve the loan from whichever input the user is driving.
 *
 * Both a percentage and a dollar amount are accepted because lenders quote
 * both, and the amount is usually what the buyer is actually approved for.
 * Either way the MAS loan-to-value cap wins, so the number shown can never
 * exceed what a bank will legally lend.
 */
export function resolveLoan(s: CalcState, cap: { ltv: number; amount: number; maxYears: number }) {
  const byAmount = s.loanInput === 'amount';
  const raw = byAmount ? s.loanAmountOverride : (s.dealerPrice * s.loanPct) / 100;
  const loanAmount = Math.max(0, Math.min(Math.round(raw), cap.amount));
  const loanPct = s.dealerPrice > 0 ? Math.round((loanAmount / s.dealerPrice) * 100) : 0;
  const overCap = byAmount && s.loanAmountOverride > cap.amount;
  return { byAmount, loanAmount, loanPct, overCap, maxYears: cap.maxYears };
}

/** Everything the calculator derives from its inputs. Shared with the depreciation page. */
export function computeOwnership(s: CalcState) {
  const breakdown = priceBreakdown({ omv: s.omv, coe: s.coe, fuel: s.fuel, vesBand: s.vesBand, regYear: s.regYear, dealerPrice: s.dealerPrice });
  const cap = maxLoan(s.dealerPrice, s.omv);
  const l = resolveLoan(s, cap);
  const loanAmount = s.takeLoan ? l.loanAmount : 0;
  const loanYears = Math.min(s.loanYears, l.maxYears);
  const loan = flatRateLoan(loanAmount, s.flatRate, loanYears);
  const keepMonths = s.keepYears * 12;
  const interestPaid = keepMonths >= loan.months ? loan.totalInterest : earlySettlement(loan, keepMonths).interestPaid;

  const dep = newCarDepreciation({ price: s.dealerPrice, arfPaid: breakdown.arf.paid, coePaid: s.coe, regime: 'budget2026' });
  const exit = dep.schedule[s.keepYears - 1];

  const insuranceEstimate = estimateInsurance({
    omv: s.omv, ncdPct: s.ncdPct, driverAge: s.driverAge, yearsLicensed: s.yearsLicensed,
    engineCc: s.engineCc, powerKW: s.powerKW,
  });
  const roadTax = roadTaxPerYear(s.fuel, s.engineCc, s.powerKW);
  const running = runningCostsPerYear({
    fuel: s.fuel,
    kmPerYear: s.kmPerYear,
    litresPer100km: s.litresPer100km,
    petrolPerLitre: s.petrolPerLitre,
    kWhPer100km: s.kWhPer100km,
    electricityPerKWh: s.electricityPerKWh,
    parkingPerMonth: s.parkingPerMonth,
    erpPerMonth: s.erpPerMonth,
    servicingPerYear: s.servicingPerYear,
    insurancePerYear: s.insuranceOverride || insuranceEstimate,
    roadTaxPerYear: roadTax,
  });

  const depreciation = s.dealerPrice - exit.marketValue;
  const runningTotal = running.total * s.keepYears;
  const total = depreciation + interestPaid + runningTotal;
  return {
    breakdown, cap, loanPct: l.loanPct, loanAmount, loanYears, loan, interestPaid, dep, exit,
    loanOverCap: l.overCap, loanByAmount: l.byAmount,
    insuranceEstimate, insuranceRate: insuranceRatePct(s.omv), roadTax, running, depreciation, runningTotal, total,
    perMonth: total / keepMonths,
    downpayment: s.dealerPrice - loanAmount,
    monthlyOutgoing: (keepMonths >= 1 && loan.months > 0 ? loan.monthly : 0) + running.total / 12,
  };
}

export function Calculator() {
  const [s, setAll, set] = usePersistentState('calc', CALC_DEFAULTS, 'calculator');
  const [copied, setCopied] = useState(false);
  const r = computeOwnership(s);

  const applyPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setAll((prev) => ({
      ...prev,
      preset: id,
      dealerPrice: p.dealerPrice,
      omv: p.omv,
      category: p.category,
      fuel: p.fuel,
      vesBand: p.vesBand,
      engineCc: p.engineCc,
      powerKW: p.powerKW,
      coe: COE_LATEST[p.category],
      litresPer100km: RUNNING_DEFAULTS.litresPer100km[p.fuel],
    }));
  };

  const share = async () => {
    const url = shareUrl('calculator', s);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link', url);
    }
  };

  const costSegments = [
    { label: 'Depreciation', value: r.depreciation },
    { label: 'Loan interest', value: r.interestPaid },
    { label: 'Insurance', value: r.running.insurance * s.keepYears },
    { label: s.fuel === 'ev' ? 'Charging' : 'Petrol', value: r.running.energy * s.keepYears },
    { label: 'Parking, ERP, road tax, servicing', value: (r.running.parking + r.running.erp + r.running.roadTax + r.running.servicing) * s.keepYears },
  ];

  return (
    <>
      <div className="page-head">
        <h1>True cost calculator</h1>
        <p>
          Start from the dealer's price and work through every cost you'll pay: taxes, loan interest, insurance, running costs and
          depreciation. Pick an example to start, then put in your own quote.
        </p>
        <div className="row">
          <Segmented label="Example car" value={s.preset} onChange={applyPreset} options={PRESETS.map((p) => ({ value: p.id, label: p.label }))} />
        </div>
      </div>

      <div className="cols">
        <div className="stack">
          {/*
            The answer first, then three fields, then everything else behind
            tiers. The tiers carry a summary line showing what is currently
            assumed, so collapsing them hides controls but never the
            assumptions behind the number.
          */}
          <div className="answer">
            <div className="figure-xl">{money(r.perMonth)}<span className="figure-unit"> / month</span></div>
            <div>
              <div className="label small muted">Over {s.keepYears} years</div>
              <div className="small num">{money(r.total)} all in</div>
            </div>
          </div>

          <section>
            <div className="grid-2">
              <NumberField label="Dealer's price" prefix="$" value={s.dealerPrice} onChange={(v) => set('dealerPrice', v)}
                hint="The on-the-road price, COE included" />
              <NumberField label="Keep it for" suffix="years" value={s.keepYears} onChange={(v) => set('keepYears', v)} min={1} max={10} />
            </div>
            <div className="field" style={{ marginTop: 16 }}>
              <label className="field-label" htmlFor="keep-range">Ownership period</label>
              <input id="keep-range" type="range" min={1} max={10} value={s.keepYears} onChange={(e) => set('keepYears', +e.target.value)} />
            </div>
            <p className="small muted" style={{ marginTop: 12, marginBottom: 0, maxWidth: '54ch' }}>
              Those two figures are enough for a solid answer. Everything else below is already set to a sensible Singapore
              default and only changes the result slightly — open a section if yours differs.
            </p>
          </section>

          <div className="tiers">
            <Tier
              label="The car"
              badge={s.fuel === 'ev' ? 'EV' : s.category}
              summary={`OMV ${money(s.omv)} · COE ${money(s.coe)} · ${s.vesBand} · ${s.regYear}`}
            >
              <div className="grid-2">
                <NumberField label="OMV" help="omv" prefix="$" value={s.omv} onChange={(v) => set('omv', v)} hint="On the price list or LTA's records" />
                <SelectField label="COE category" help="coe" value={s.category}
                  onChange={(v) => { set('category', v); set('coe', COE_LATEST[v]); }}
                  options={[{ value: 'A', label: 'Cat A (≤1,600cc, ≤97kW)' }, { value: 'B', label: 'Cat B (bigger engines)' }]} />
                <NumberField label="COE premium" prefix="$" value={s.coe} onChange={(v) => set('coe', v)}
                  hint={`Latest: ${money(COE_LATEST[s.category])} (${COE_LATEST_LABEL})`} />
                <SelectField label="VES band" help="ves" value={s.vesBand} onChange={(v) => set('vesBand', v)}
                  options={[
                    { value: 'A', label: 'A: rebate (cleanest, EVs)' },
                    { value: 'B', label: 'B: neutral' },
                    { value: 'C1', label: 'C1: surcharge' },
                    { value: 'C2', label: 'C2: higher surcharge' },
                    { value: 'C3', label: 'C3: highest surcharge' },
                  ]} />
                <SelectField label="Fuel" value={s.fuel}
                  onChange={(v) => { set('fuel', v); set('litresPer100km', RUNNING_DEFAULTS.litresPer100km[v]); }}
                  options={[{ value: 'petrol', label: 'Petrol' }, { value: 'hybrid', label: 'Hybrid' }, { value: 'ev', label: 'Electric' }]} />
                {s.fuel === 'ev' ? (
                  <NumberField label="Motor power" suffix="kW" value={s.powerKW} onChange={(v) => set('powerKW', v)} hint="Sets road tax" />
                ) : (
                  <NumberField label="Engine capacity" suffix="cc" value={s.engineCc} onChange={(v) => set('engineCc', v)} hint="Sets road tax" />
                )}
                <SelectField label="Registration year" value={s.regYear} onChange={(v) => set('regYear', v)}
                  options={[{ value: 2026, label: '2026' }, { value: 2027, label: '2027' }]} hint="VES and EV incentives change yearly" />
              </div>
            </Tier>

            <Tier
              label="Financing"
              badge={s.takeLoan ? `${pct(r.loanPct, 0)} loan` : 'no loan'}
              summary={s.takeLoan
                ? `${money(r.loan.monthly)}/mo · ${s.loanYears} yrs at ${pct(s.flatRate, 2)} flat (${pct(r.loan.eir, 2)} real)`
                : 'Paying in full'}
            >
              <Check checked={s.takeLoan} onChange={(v) => set('takeLoan', v)}>I'm taking a car loan</Check>
              {s.takeLoan && (
                <div className="stack">
                  <Segmented label="How do you want to set the loan?" value={s.loanInput}
                    onChange={(v) => setAll((p) => ({ ...p, loanInput: v, loanAmountOverride: v === 'amount' ? Math.round((p.dealerPrice * p.loanPct) / 100) : 0 }))}
                    options={[{ value: 'pct', label: 'By percentage' }, { value: 'amount', label: 'By amount' }]} />
                  {s.loanInput === 'pct' ? (
                    <div className="field">
                      <label className="field-label" htmlFor="loanpct">
                        Loan: {pct(r.loanPct, 0)} of price ({money(r.loanAmount)}) <a className="help" href="#/guides/loan">?</a>
                      </label>
                      <input id="loanpct" type="range" min={0} max={r.cap.ltv * 100} step={1} value={r.loanPct} onChange={(e) => set('loanPct', +e.target.value)} />
                      <span className="field-hint">
                        MAS caps loans at {pct(r.cap.ltv * 100, 0)} of the price for cars with OMV {s.omv <= 20_000 ? 'up to' : 'above'} $20,000.
                        You need at least {money(s.dealerPrice - r.cap.amount)} in cash.
                      </span>
                    </div>
                  ) : (
                    <div className="grid-2">
                      <NumberField label="Loan amount" prefix="$" value={s.loanAmountOverride} onChange={(v) => set('loanAmountOverride', v)}
                        hint={`${pct(r.loanPct, 0)} of the price. What's on your approval letter.`} />
                      <div className="field">
                        <label className="field-label">Downpayment</label>
                        <div className="input-wrap">
                          <span className="affix">$</span>
                          <input readOnly value={fmtMoney(s.dealerPrice - r.loanAmount)} aria-label="Downpayment" />
                        </div>
                        <span className="field-hint">Cash you hand over at signing.</span>
                      </div>
                    </div>
                  )}
                  {r.loanOverCap && (
                    <FlagList items={[{
                      severity: 'warn',
                      title: `${money(s.loanAmountOverride - r.cap.amount)} over the legal limit`,
                      detail: `MAS caps car loans at ${pct(r.cap.ltv * 100, 0)} of the price (${money(r.cap.amount)}) for this OMV. A bigger "loan" is usually a second, pricier personal loan bundled into the deal.`,
                    }]} />
                  )}
                  <div className="grid-2">
                    <NumberField label="Flat interest rate" help="flat-rate" suffix="% p.a." value={s.flatRate} onChange={(v) => set('flatRate', v)} min={0} max={20} />
                    <SelectField label="Loan tenure" value={r.loanYears} onChange={(v) => set('loanYears', v)}
                      options={[1, 2, 3, 4, 5, 6, 7].map((y) => ({ value: y, label: `${y} year${y > 1 ? 's' : ''}` }))} hint="7 years is the legal maximum" />
                  </div>
                  <div className="stats">
                    <Stat label="Monthly instalment" value={money(r.loan.monthly)} />
                    <Stat label="Total interest" value={money(r.loan.totalInterest)} />
                    <Stat label="Real rate (EIR)" value={pct(r.loan.eir, 2)} sub={`vs ${pct(s.flatRate, 2)} flat quoted`} />
                  </div>
                </div>
              )}
            </Tier>

            <Tier
              label="Insurance"
              badge={`${s.ncdPct}% NCD`}
              summary={s.insuranceOverride > 0
                ? `Your quote ${money(s.insuranceOverride)}/yr`
                : `Est. ${money(r.insuranceEstimate)}/yr at ${pct(r.insuranceRate, 1)} of OMV`}
            >
              <div className="grid-2">
                <NumberField label="Your actual premium" prefix="$" suffix="/yr" value={s.insuranceOverride} onChange={(v) => set('insuranceOverride', v)}
                  hint={`Leave at zero to use the estimate of ${money(r.insuranceEstimate)}.`} />
                <SelectField label="No-Claim Discount" help="ncd" value={s.ncdPct} onChange={(v) => set('ncdPct', v)}
                  options={[0, 10, 20, 30, 40, 50].map((n) => ({ value: n, label: `${n}%` }))} />
                <NumberField label="Main driver's age" value={s.driverAge} onChange={(v) => set('driverAge', v)} min={18} max={99} />
                <NumberField label="Years since licence" value={s.yearsLicensed} onChange={(v) => set('yearsLicensed', v)} min={0} max={80} />
              </div>
              <p className="small muted" style={{ marginBottom: 0 }}>
                <a href="#/insurance">What the premium hides &rarr;</a>
              </p>
            </Tier>

            <Tier
              label="Running costs"
              badge={`${num(s.kmPerYear)} km/yr`}
              summary={`${money(r.running.energy)} fuel · ${money(r.running.parking + r.running.erp)} park/ERP · ${money(r.roadTax)} tax`}
            >
              <div className="grid-2">
                <NumberField label="Driving per year" suffix="km" value={s.kmPerYear} onChange={(v) => set('kmPerYear', v)} />
                {s.fuel === 'ev' ? (
                  <>
                    <NumberField label="Consumption" suffix="kWh/100km" value={s.kWhPer100km} onChange={(v) => set('kWhPer100km', v)} />
                    <NumberField label="Charging price" prefix="$" suffix="/kWh" value={s.electricityPerKWh} onChange={(v) => set('electricityPerKWh', v)} hint="Public chargers ~$0.55–0.70; home ~$0.33" />
                  </>
                ) : (
                  <>
                    <NumberField label="Fuel use" suffix="L/100km" value={s.litresPer100km} onChange={(v) => set('litresPer100km', v)} />
                    <NumberField label="Petrol price" prefix="$" suffix="/L" value={s.petrolPerLitre} onChange={(v) => set('petrolPerLitre', v)} hint="After typical card discounts" />
                  </>
                )}
                <NumberField label="Parking" prefix="$" suffix="/month" value={s.parkingPerMonth} onChange={(v) => set('parkingPerMonth', v)} hint="HDB season parking is $80–$110" />
                <NumberField label="ERP" prefix="$" suffix="/month" value={s.erpPerMonth} onChange={(v) => set('erpPerMonth', v)} />
                <NumberField label="Servicing & repairs" prefix="$" suffix="/yr" value={s.servicingPerYear} onChange={(v) => set('servicingPerYear', v)} />
              </div>
              <p className="small muted" style={{ marginBottom: 0 }}>Road tax works out to {money(r.roadTax)} a year for this car.</p>
            </Tier>
          </div>
        </div>

        <aside className="stack sticky">
          <section>
            <div className="rule-head">
              <h2>Where it goes</h2>
              <button className="btn btn-ghost btn-sm" onClick={share}>{copied ? 'Copied' : 'Copy link'}</button>
            </div>
            <p className="muted small" style={{ marginTop: 0 }}>
              {money(r.total)} in total over {s.keepYears} years, all costs included.
            </p>
            <div className="stats">
              <Stat label="Cash upfront" value={money(r.downpayment)} sub="Downpayment" />
              <Stat label="Monthly outgoings" value={money(r.monthlyOutgoing)} sub="Instalment + running costs" />
              <Stat label="Depreciation" value={`${money(r.dep.annual)}/yr`} sub={<a href="#/depreciation">Year-by-year view →</a>} />
            </div>
            <hr />
            <StackedBar segments={costSegments} ariaLabel="Total cost of ownership breakdown" />
            <table className="lines">
              <tbody>
                {costSegments.map((c) => (
                  <tr key={c.label}><td>{c.label}</td><td>{money(c.value)}</td></tr>
                ))}
                <tr className="total"><td>Total over {s.keepYears} years</td><td>{money(r.total)}</td></tr>
              </tbody>
            </table>
            <p className="small muted" style={{ marginTop: 12 }}>
              Depreciation assumes you sell for about {money(r.exit.marketValue)} after {s.keepYears} years.
              {s.keepYears < r.loanYears && s.takeLoan && ' Interest shown is what you pay if you settle the loan early (Rule of 78 plus a typical 20% penalty).'}
            </p>
          </section>

          <section>
            <h2>Where the {money(s.dealerPrice)} goes</h2>
            <Breakdown b={r.breakdown} dealerPrice={s.dealerPrice} />
          </section>
          <p className="small muted">Figures as of {DATA_AS_OF}. Estimates only, not financial advice.</p>
        </aside>
      </div>

      <div className="summary-bar" aria-hidden="true">
        <div>
          <div className="label">True cost, {s.keepYears} yrs</div>
          <div className="value num">{money(r.perMonth)}/mo</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="label">Total</div>
          <div className="value num">{money(r.total)}</div>
        </div>
      </div>
    </>
  );
}
