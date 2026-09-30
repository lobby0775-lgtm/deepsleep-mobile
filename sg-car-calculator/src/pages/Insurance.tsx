import { breakdownOfExcess, costOfClaim, grossPremium, premiumAtNcd } from '../calc/running';
import { INSURANCE_OMV_BANDS } from '../calc/defaults';
import { money, pct } from '../calc/format';
import { Check, FlagList, NumberField, SelectField, Stat } from '../components/Fields';
import { StackedBar } from '../components/Charts';
import { usePersistentState } from '../state';

/**
 * The premium is the part you can see. This page is about the rest: the
 * discount you would lose, the excess you would pay, and what a claim
 * actually costs once both are counted.
 */

const DEFAULTS = {
  premium: 2400,
  ncdPct: 50,
  otherDiscountPct: 5,
  omv: 22_000,
  excess: 2000,
  theftPct: 10,
  ncdLostPct: 50,
  damage: 8000,
  yearsOwned: 5,
  lockedIn: true,
  usedWhenBuying: true,
};

const ncdOptions = [0, 10, 20, 30, 40, 50].map((n) => ({ value: n, label: `${n}%` }));

export function Insurance() {
  const [s, , set] = usePersistentState('insurance', DEFAULTS, 'insurance');

  const gross = grossPremium({ premium: s.premium, ncdPct: s.ncdPct, otherDiscountPct: s.otherDiscountPct });
  const ex = breakdownOfExcess({ damageExcess: s.excess, omv: s.omv, theftPct: s.theftPct / 100 });
  const claim = costOfClaim({
    damage: s.damage,
    excess: s.excess,
    premium: s.premium,
    ncdPct: s.ncdPct,
    otherDiscountPct: s.otherDiscountPct,
    ncdLostPct: s.ncdLostPct,
    yearsOwned: s.yearsOwned,
  });

  // What you'd pay for the identical car with a clean record.
  const ncdLadder = [0, 10, 20, 30, 40, 50].map((n) => ({
    label: n === s.ncdPct ? `${n}% (you)` : `${n}%`,
    value: premiumAtNcd(gross, n) * (1 - Math.min(50, Math.max(0, s.otherDiscountPct)) / 100),
  }));

  const ncdAtRisk = s.ncdPct;
  const findings = [
    {
      severity: (claim.worthClaiming ? 'info' : 'warn') as 'info' | 'warn',
      title: claim.worthClaiming
        ? `On a ${money(s.damage)} claim, you would be ${money(-claim.claimOverhead)} better off claiming`
        : `On a ${money(s.damage)} claim, claiming costs you ${money(claim.claimOverhead)} more than paying`,
      detail: claim.worthClaiming
        ? `The ${money(s.excess)} excess plus ${money(claim.ncdCostOverYears)} of lost discount over ${s.yearsOwned} years is ${money(claim.claimCost)}, against ${money(claim.selfPayCost)} to fix it yourself.`
        : `The ${money(s.excess)} excess plus ${money(claim.ncdCostOverYears)} of lost discount over ${s.yearsOwned} years comes to ${money(claim.claimCost)}. Paying the ${money(claim.selfPayCost)} yourself and keeping your ${ncdAtRisk}% NCD is cheaper.`,
    },
    {
      severity: ex.theftExcess > s.excess ? ('warn' as const) : ('info' as const),
      title: ex.theftExcess > s.excess
        ? `Theft and total loss cost you ${money(ex.theftExcess)}, not ${money(s.excess)}`
        : `Your excess is the bigger of the two`,
      detail: ex.theftExcess > s.excess
        ? `Damage claims are capped at ${money(s.excess)}, but theft and total loss are usually a share of the car's value. At ${s.theftPct}% that is ${money(ex.theftExcess)} — ${pct(ex.worstCasePctOfValue, 0)} of a ${money(s.omv)} car.`
        : `At ${s.theftPct}% of value the theft excess is ${money(ex.theftExcess)}, below your ${money(s.excess)} damage excess.`,
    },
    {
      severity: (s.usedWhenBuying && ncdAtRisk >= 30 ? 'warn' : 'info') as 'warn' | 'info',
      title: s.usedWhenBuying
        ? `You have ${money(gross - s.premium)} of discount already earned`
        : `A fresh policy starts your NCD at zero`,
      detail: s.usedWhenBuying
        ? `Without your ${ncdAtRisk}% no-claim discount and ${pct(s.otherDiscountPct, 0)} safe-driver discount, the same cover would be ${money(gross)}. That is ${money(gross - s.premium)} a year of clean driving already paid for.`
        : `Buying this car transfers no history. The first driver at ${pct(gross, 0)} before discounts will be you.`,
    },
    ...(s.lockedIn
      ? [{
          severity: 'warn' as const,
          title: 'This rate is locked in',
          detail: `Many Singapore policies lock the premium for the term. You cannot shop around until renewal, so the ${money(s.premium)} is committed, and rising premiums at renewal are not in your control.`,
        }]
      : []),
  ];

  return (
    <>
      <div className="page-head">
        <h1>What your insurance really costs</h1>
        <p>
          The premium is the smallest part. The expensive parts are the discount you would lose by claiming, the excess you pay
          on every claim, and the fact that most policies price theft and total loss as a share of the car's value rather than
          the flat excess quoted for damage.
        </p>
      </div>

      <div className="cols">
        <div className="stack">
          <section>
            <div className="rule-head"><h2><span className="step">01</span>Your policy</h2></div>
            <div className="grid-2">
              <NumberField label="Premium" prefix="$" suffix="/yr" value={s.premium} onChange={(v) => set('premium', v)}
                hint="What you actually pay, after all discounts" />
              <SelectField label="No-claim discount" help="ncd" value={s.ncdPct} onChange={(v) => set('ncdPct', v)} options={ncdOptions} />
              <NumberField label="Other discounts" suffix="%" value={s.otherDiscountPct} onChange={(v) => set('otherDiscountPct', v)}
                hint="Safe driver, loyalty, age" />
              <NumberField label="Excess" prefix="$" value={s.excess} onChange={(v) => set('excess', v)}
                hint="What you pay on a damage claim" />
            </div>
            <div className="stats" style={{ marginTop: 24 }}>
              <Stat label="You pay" value={money(s.premium)} sub="after discounts" />
              <Stat label="Before discounts" value={money(gross)} sub="the same car, no NCD" />
              <Stat label="Discount earned" value={money(gross - s.premium)} sub={`${pct((1 - s.premium / Math.max(1, gross)) * 100, 0)} off`} />
            </div>
            <div style={{ marginTop: 24 }}>
              <h3 style={{ marginBottom: 8 }}>What the same cover costs at each no-claim level</h3>
              <StackedBar
                segments={ncdLadder.map((l) => ({ label: l.label, value: l.value }))}
                ariaLabel="Premium at each no-claim discount level"
              />
              <p className="chart-note">
                Each bar is the premium for the identical car at that no-claim level, with your {pct(s.otherDiscountPct, 0)} other
                discount applied. The gaps are what a clean record is worth.
              </p>
            </div>
          </section>

          <section>
            <div className="rule-head"><h2><span className="step">02</span>Your excess</h2></div>
            <div className="grid-2">
              <NumberField label="Car's value (OMV)" prefix="$" value={s.omv} onChange={(v) => set('omv', v)}
                hint="Theft and total loss are a share of this" />
              <NumberField label="Theft / total-loss excess" suffix="% of value" value={s.theftPct} onChange={(v) => set('theftPct', v)}
                hint="Usually 10–20%. Check your policy." />
            </div>
            <table className="lines" style={{ marginTop: 20 }}>
              <tbody>
                <tr><td>Damage claim excess</td><td>{money(s.excess)}</td></tr>
                <tr><td>Theft and total loss ({s.theftPct}% of {money(s.omv)})</td><td>{money(ex.theftExcess)}</td></tr>
                <tr className="total"><td>Most you can be left holding</td><td>{money(ex.worstCaseExcess)}</td></tr>
              </tbody>
            </table>
            <p className="small muted" style={{ marginTop: 12, marginBottom: 0, maxWidth: '58ch' }}>
              On a total loss of this car you would be paid {money(ex.totalLossPayout)} and still hand over{' '}
              {money(ex.worstCaseExcess)}. Check the theft excess on your policy — it is usually a percentage of the car's
              value, and it is rarely the number on the front page.
            </p>
          </section>

          <section>
            <div className="rule-head"><h2><span className="step">03</span>What a claim costs</h2></div>
            <div className="grid-2">
              <NumberField label="Repair bill" prefix="$" value={s.damage} onChange={(v) => set('damage', v)}
                hint="The damage, not the excess" />
              <NumberField label="NCD forfeited" suffix="%" value={s.ncdLostPct} onChange={(v) => set('ncdLostPct', v)}
                hint="Many insurers void the whole NCD" />
              <NumberField label="Years you'll keep the car" suffix="yrs" value={s.yearsOwned} onChange={(v) => set('yearsOwned', v)} min={1} max={10} />
            </div>
            <div className="stack" style={{ marginTop: 16 }}>
              <Check checked={s.lockedIn} onChange={(v) => set('lockedIn', v)}>This rate is locked in for the policy term</Check>
              <Check checked={s.usedWhenBuying} onChange={(v) => set('usedWhenBuying', v)}>I bought this car and brought my NCD with me</Check>
            </div>
            <table className="lines" style={{ marginTop: 24 }}>
              <tbody>
                <tr className="hi"><td>You hand over</td><td>{money(claim.excessPaid)}</td></tr>
                <tr className="sub"><td>the excess, once</td><td>&nbsp;</td></tr>
                <tr className="hi"><td>Your premium then rises by</td><td>{money(claim.annualNcdCost)}/yr</td></tr>
                <tr className="sub"><td>the lost no-claim discount, every year</td><td>{money(claim.ncdCostOverYears)} over {s.yearsOwned} yrs</td></tr>
                <tr className="total"><td>Total cost of claiming</td><td>{money(claim.claimCost)}</td></tr>
                <tr><td>Paying the repair yourself</td><td>{money(claim.selfPayCost)}</td></tr>
                <tr className="sub">
                  <td>and you keep your {ncdAtRisk}% NCD</td>
                  <td>{claim.claimOverhead > 0 ? `${money(claim.claimOverhead)} better off` : `${money(-claim.claimOverhead)} worse off`}</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>

        <aside className="stack sticky">
          <section>
            <div className="rule-head"><h2>The finding</h2></div>
            <FlagList items={findings} />
          </section>

          <section>
            <div className="rule-head"><h2>Your position</h2></div>
            <div className="stats">
              <Stat label="Premium" value={money(s.premium)} sub="per year" />
              <Stat label="NCD" value={`${s.ncdPct}%`} sub={s.ncdPct >= 40 ? 'top band' : s.ncdPct >= 20 ? 'mid band' : 'low'} />
              <Stat label="Excess" value={money(ex.worstCaseExcess)} sub="worst case" />
            </div>
            <table className="lines" style={{ marginTop: 20 }}>
              <tbody>
                <tr><td>Premium, {s.yearsOwned} years</td><td>{money(s.premium * s.yearsOwned)}</td></tr>
                <tr><td>Value of the NCD over that time</td><td>{money((gross - s.premium) * s.yearsOwned)}</td></tr>
                <tr className="total"><td>What clean driving is worth</td><td>{money((gross - s.premium) * s.yearsOwned)}</td></tr>
              </tbody>
            </table>
            <p className="small muted" style={{ marginTop: 12, marginBottom: 0, maxWidth: '58ch' }}>
              Over {s.yearsOwned} years this no-claim discount is worth {money((gross - s.premium) * s.yearsOwned)} — more than a
              single bad claim would cost you to fix, and the largest number in this page. It is not on the quote, and it is the
              one thing worth protecting.
            </p>
          </section>

          <section>
            <h2 style={{ borderTop: '1px solid var(--ink)', paddingTop: 12 }}>Rate bands used</h2>
            <p className="small muted">
              For a starting estimate only, comprehensive cover is priced roughly as a share of the car's value, falling as
              the car gets dearer:
            </p>
            <table className="lines">
              <tbody>
                {INSURANCE_OMV_BANDS.map((b) => (
                  <tr key={b.upTo}>
                    <td>Up to {b.upTo === Infinity ? 'any value' : money(b.upTo)}</td>
                    <td>{pct(b.ratePct, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="small muted" style={{ marginTop: 12, marginBottom: 0 }}>
              These are market shape, not quotes. Insurers rate off OMV, model, age and your record — never the sticker price.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
