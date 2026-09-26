import { COE_LATEST, MARKET_FLAT_RATE, type CoeCategory } from '../calc/defaults';
import { decodeDeal, type Freebie } from '../calc/deal';
import { money, pct } from '../calc/format';
import { Check, NumberField, Segmented, SelectField, Stat } from '../components/Fields';
import { usePersistentState } from '../state';

const DEFAULTS = {
  packagePrice: 209_999,
  omv: 22_000,
  category: 'A' as CoeCategory,
  coeGuaranteed: false,
  bidsIncluded: 2,
  coeInPackage: 125_000,
  coeLatest: COE_LATEST.A,
  topUpPaidBy: 'buyer' as 'dealer' | 'buyer',
  extraFees: 1_800,
  freebies: [
    { name: 'Solar film', statedValue: 1_200, wanted: true },
    { name: 'Paint protection coating', statedValue: 1_500, wanted: false },
    { name: 'In-car camera', statedValue: 600, wanted: true },
    { name: 'Floor mats & accessories', statedValue: 800, wanted: false },
  ] as Freebie[],
  takeLoan: true,
  loanAmount: 125_000,
  loanFlatRate: 2.98,
  loanYears: 7,
  loanTiedDiscount: 2_000,
  insuranceRequired: true,
  insuranceYears: 3,
  insurancePremium: 2_200,
  insuranceEstimate: 1_700,
  hasTradeIn: false,
  tradeInOffer: 0,
  tradeInPaperValue: 0,
  depositRefundable: false,
};

const Icon = { danger: '!', warn: '!', info: 'i', good: '✓' } as const;

export function DealDecoder() {
  const [s, , set] = usePersistentState('deal', DEFAULTS);
  const r = decodeDeal({
    ...s,
    loanAmount: s.takeLoan ? s.loanAmount : 0,
    loanTiedDiscount: s.takeLoan ? s.loanTiedDiscount : 0,
    marketFlatRate: MARKET_FLAT_RATE,
    tradeInOffer: s.hasTradeIn ? s.tradeInOffer : 0,
    tradeInPaperValue: s.hasTradeIn ? s.tradeInPaperValue : 0,
  });
  const setFreebie = (i: number, f: Partial<Freebie>) => set('freebies', s.freebies.map((x, j) => (j === i ? { ...x, ...f } : x)));
  const order = { danger: 0, warn: 1, info: 2, good: 3 };
  const flags = [...r.flags].sort((a, b) => order[a.severity] - order[b.severity]);
  const dangers = flags.filter((f) => f.severity === 'danger').length;

  return (
    <>
      <div className="page-head">
        <h1>Deal decoder</h1>
        <p>
          Go through the dealer's quote line by line, fine print included. The decoder adds up what you'll really pay and
          flags the terms that usually cost buyers money.
        </p>
      </div>

      <div className="cols">
        <div className="stack">
          <section className="card">
            <h2>Price and COE</h2>
            <div className="grid-2">
              <NumberField label="Package price" prefix="$" value={s.packagePrice} onChange={(v) => set('packagePrice', v)} />
              <NumberField label="OMV" help="omv" prefix="$" value={s.omv} onChange={(v) => set('omv', v)} hint="Sets how much you can borrow" />
              <SelectField label="COE category" value={s.category} onChange={(v) => { set('category', v); set('coeLatest', COE_LATEST[v]); }}
                options={[{ value: 'A', label: 'Cat A' }, { value: 'B', label: 'Cat B' }]} />
              <NumberField label="Admin, handling & other fees" prefix="$" value={s.extraFees} onChange={(v) => set('extraFees', v)} hint="Anything added on top of the package price" />
            </div>
            <div className="stack" style={{ marginTop: 16 }}>
              <Segmented label="COE guarantee" value={s.coeGuaranteed ? 'yes' : 'no'} onChange={(v) => set('coeGuaranteed', v === 'yes')}
                options={[{ value: 'yes', label: 'Guaranteed COE' }, { value: 'no', label: 'Non-guaranteed COE' }]} />
              {!s.coeGuaranteed && (
                <div className="grid-2">
                  <NumberField label="COE the price assumes" prefix="$" value={s.coeInPackage} onChange={(v) => set('coeInPackage', v)} hint="Ask the salesperson" />
                  <NumberField label="Latest COE" prefix="$" value={s.coeLatest} onChange={(v) => set('coeLatest', v)} />
                  <NumberField label="Bids included" value={s.bidsIncluded} onChange={(v) => set('bidsIncluded', v)} min={0} max={24} />
                  <SelectField label="If COE goes higher, who pays?" value={s.topUpPaidBy} onChange={(v) => set('topUpPaidBy', v)}
                    options={[{ value: 'buyer', label: 'I top up' }, { value: 'dealer', label: 'Dealer absorbs it' }]} />
                </div>
              )}
              <Check checked={s.depositRefundable} onChange={(v) => set('depositRefundable', v)}>
                Deposit is refunded if COE isn't won or my loan isn't approved (in writing)
              </Check>
            </div>
          </section>

          <section className="card">
            <h2>Loan</h2>
            <Check checked={s.takeLoan} onChange={(v) => set('takeLoan', v)}>The deal includes the dealer's loan</Check>
            {s.takeLoan && (
              <div className="grid-2" style={{ marginTop: 12 }}>
                <NumberField label="Loan amount" prefix="$" value={s.loanAmount} onChange={(v) => set('loanAmount', v)} />
                <NumberField label="Flat rate" help="flat-rate" suffix="%" value={s.loanFlatRate} onChange={(v) => set('loanFlatRate', v)} />
                <NumberField label="Tenure" suffix="years" value={s.loanYears} onChange={(v) => set('loanYears', v)} min={1} max={10} />
                <NumberField label="Discount only if I take this loan" prefix="$" value={s.loanTiedDiscount} onChange={(v) => set('loanTiedDiscount', v)} />
              </div>
            )}
          </section>

          <section className="card">
            <h2>Insurance</h2>
            <Check checked={s.insuranceRequired} onChange={(v) => set('insuranceRequired', v)}>I must take the dealer's insurance</Check>
            {s.insuranceRequired && (
              <div className="grid-2" style={{ marginTop: 12 }}>
                <NumberField label="Premium" prefix="$" suffix="/yr" value={s.insurancePremium} onChange={(v) => set('insurancePremium', v)} />
                <NumberField label="Locked in for" suffix="years" value={s.insuranceYears} onChange={(v) => set('insuranceYears', v)} />
                <NumberField label="Your own quote or estimate" prefix="$" suffix="/yr" value={s.insuranceEstimate} onChange={(v) => set('insuranceEstimate', v)} hint={<a href="#/calculator">Estimate one in the calculator</a>} />
              </div>
            )}
          </section>

          <section className="card">
            <h2>Freebies</h2>
            <p className="small muted">Tick only the ones you'd pay for yourself.</p>
            <div className="stack">
              {s.freebies.map((f, i) => (
                <div key={i} className="row" style={{ alignItems: 'flex-end' }}>
                  <input type="checkbox" aria-label={`I want ${f.name}`} checked={f.wanted} onChange={(e) => setFreebie(i, { wanted: e.target.checked })} style={{ width: 18, height: 18, marginBottom: 12, accentColor: 'var(--accent)' }} />
                  <div className="input-wrap" style={{ flex: '2 1 140px' }}>
                    <input aria-label="Item" value={f.name} onChange={(e) => setFreebie(i, { name: e.target.value })} />
                  </div>
                  <div style={{ flex: '1 1 100px' }}>
                    <NumberField label="" prefix="$" value={f.statedValue} onChange={(v) => setFreebie(i, { statedValue: v })} />
                  </div>
                  <button className="btn btn-ghost btn-sm" aria-label={`Remove ${f.name}`} onClick={() => set('freebies', s.freebies.filter((_, j) => j !== i))} style={{ marginBottom: 6 }}>✕</button>
                </div>
              ))}
              <div>
                <button className="btn btn-sm" onClick={() => set('freebies', [...s.freebies, { name: 'New item', statedValue: 0, wanted: false }])}>+ Add item</button>
              </div>
            </div>
          </section>

          <section className="card">
            <h2>Trade-in</h2>
            <Check checked={s.hasTradeIn} onChange={(v) => set('hasTradeIn', v)}>I'm trading in my current car</Check>
            {s.hasTradeIn && (
              <div className="grid-2" style={{ marginTop: 12 }}>
                <NumberField label="Trade-in offer" prefix="$" value={s.tradeInOffer} onChange={(v) => set('tradeInOffer', v)} />
                <NumberField label="Paper value" help="paper-value" prefix="$" value={s.tradeInPaperValue} onChange={(v) => set('tradeInPaperValue', v)} hint={<a href="#/trade-in">Work it out in the trade-in checker</a>} />
              </div>
            )}
          </section>
        </div>

        <aside className="stack sticky">
          <section className="card">
            <h2>What this deal really costs</h2>
            <div className="hero-num">{money(r.totalOutlay)}</div>
            <p className="muted small">Price + fees + loan interest + required insurance{s.hasTradeIn ? ' − trade-in' : ''}.</p>
            <div className="stats">
              <Stat label="Price incl. fees" value={money(r.allInPrice)} />
              {s.takeLoan && <Stat label="Loan interest" value={money(r.interest)} sub={`${pct(r.eir, 2)} real rate`} />}
              {s.takeLoan && <Stat label="Monthly" value={money(r.monthly)} />}
              <Stat label="Freebies you want" value={money(r.freebiesUseful)} sub={`of ${money(r.freebiesStated)} "worth"`} />
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Red flags</h2>
              <span className="small muted">{dangers ? `${dangers} serious` : 'None serious'}</span>
            </div>
            {flags.map((f) => (
              <div key={f.title} className={`flag flag-${f.severity}`}>
                <span className="icon" aria-hidden="true">{Icon[f.severity]}</span>
                <div>
                  <strong>{f.title}</strong>
                  <p>{f.detail}</p>
                </div>
              </div>
            ))}
          </section>

          <section className="card">
            <h3>Questions to ask the salesperson</h3>
            <ul className="small" style={{ paddingLeft: 18, margin: 0 }}>
              <li>What COE does this price assume, and what happens if I don't get one?</li>
              <li>What's the price without your loan, insurance or trade-in?</li>
              <li>What's the effective interest rate (EIR), and is there an early-repayment penalty?</li>
              <li>Can I have cash off instead of the freebies?</li>
              <li>Is my deposit refundable, and under what conditions? Please put it in writing.</li>
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
