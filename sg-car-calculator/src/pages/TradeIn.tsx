import { PARF_REGIMES } from '../calc/defaults';
import { addYears, monthsBetween, paperValue, parfRegimeFor } from '../calc/rebates';
import { money } from '../calc/format';
import { Check, DateField, NumberField, Segmented, Stat } from '../components/Fields';
import { usePersistentState, todayIso } from '../state';

const DEFAULTS = {
  regDate: '2018-03-10',
  coeExpiry: '2028-03-10',
  arfPaid: 26_000,
  coePaid: 42_000,
  coeRenewed: false,
  renewalYears: 10 as 5 | 10,
  handover: todayIso(),
  offer: 30_000,
  outstandingLoan: 0,
};

export function TradeIn() {
  const [s, setAll, set] = usePersistentState('tradein', DEFAULTS);
  const regime = parfRegimeFor(s.regDate);
  const ageMonths = monthsBetween(s.regDate, s.handover);
  const monthsLeft = monthsBetween(s.handover, s.coeExpiry);
  const coeMonths = s.coeRenewed ? s.renewalYears * 12 : Math.max(1, monthsBetween(s.regDate, s.coeExpiry));
  const pv = paperValue({
    arfPaid: s.arfPaid, coePaid: s.coePaid, ageYears: ageMonths / 12, coeMonthsLeft: monthsLeft, regime, coeRenewed: s.coeRenewed, coeMonths,
  });
  const premium = s.offer - pv.total;
  const equity = s.offer - s.outstandingLoan;
  const max = Math.max(s.offer, pv.total, 1);

  return (
    <>
      <div className="page-head">
        <h1>Trade-in checker</h1>
        <p>
          Your current car has a guaranteed minimum value: the PARF and COE rebates LTA pays when it's deregistered. A dealer's
          trade-in offer is only worth what it pays <em>above</em> that.
        </p>
      </div>

      <div className="cols results-first">
        <section className="card">
          <h2>Your current car</h2>
          <p className="small muted">You'll find these on the car's log card or on OneMotoring under "Vehicle Details".</p>
          <div className="grid-2">
            <DateField label="Registration date" value={s.regDate} onChange={(v) => setAll((p) => ({ ...p, regDate: v, coeExpiry: p.coeRenewed ? p.coeExpiry : addYears(v, 10) }))} />
            <DateField label="COE expiry" value={s.coeExpiry} onChange={(v) => set('coeExpiry', v)} />
            <NumberField label="ARF paid" help="arf" prefix="$" value={s.arfPaid} onChange={(v) => set('arfPaid', v)} />
            <NumberField label={s.coeRenewed ? 'Renewal PQP paid' : 'COE paid'} help="coe" prefix="$" value={s.coePaid} onChange={(v) => set('coePaid', v)} />
            <DateField label="Handover date" value={s.handover} onChange={(v) => set('handover', v)} hint="When the dealer takes the car" />
          </div>
          <div className="stack" style={{ marginTop: 16 }}>
            <Check checked={s.coeRenewed} onChange={(v) => set('coeRenewed', v)}>The COE has been renewed (no PARF)</Check>
            {s.coeRenewed && (
              <Segmented label="Renewal length" value={s.renewalYears} onChange={(v) => set('renewalYears', v)} options={[{ value: 5, label: '5-year renewal' }, { value: 10, label: '10-year renewal' }]} />
            )}
          </div>
          <hr />
          <h2>The offer</h2>
          <div className="grid-2">
            <NumberField label="Dealer's trade-in offer" prefix="$" value={s.offer} onChange={(v) => set('offer', v)} />
            <NumberField label="Loan still owed" prefix="$" value={s.outstandingLoan} onChange={(v) => set('outstandingLoan', v)} hint="Ask your bank for the settlement amount" />
          </div>
        </section>

        <aside className="stack sticky">
          <section className="card">
            <h2>Is the offer fair?</h2>
            <div className="stats">
              <Stat label="Paper value" value={money(pv.total)} sub="Guaranteed floor" />
              <Stat label="Offer" value={money(s.offer)} />
              <Stat label={premium >= 0 ? 'Above paper value' : 'Below paper value'} value={money(Math.abs(premium))} />
            </div>
            <div style={{ margin: '16px 0' }} aria-hidden="true">
              {[
                { label: 'Paper value', v: pv.total, c: 'var(--s2)' },
                { label: 'Offer', v: s.offer, c: 'var(--s1)' },
              ].map((b) => (
                <div key={b.label} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span className="small muted">{b.label}</span>
                  <div style={{ height: 20, width: `${(b.v / max) * 100}%`, background: b.c, borderRadius: '0 4px 4px 0', minWidth: 2 }} />
                </div>
              ))}
            </div>
            {premium < 0 ? (
              <div className="flag flag-danger">
                <span className="icon">!</span>
                <div>
                  <strong>The offer is {money(-premium)} below paper value</strong>
                  <p>Deregistering the car yourself (scrap or export) returns more. Reject the offer or ask for at least {money(pv.total)}.</p>
                </div>
              </div>
            ) : (
              <div className="flag flag-info">
                <span className="icon">i</span>
                <div>
                  <strong>The dealer is paying {money(premium)} for the car itself</strong>
                  <p>That's the part to negotiate. Get 2–3 quotes from used-car dealers or a direct-to-buyer platform to compare.</p>
                </div>
              </div>
            )}
            <table className="lines" style={{ marginTop: 12 }}>
              <tbody>
                <tr><td>PARF rebate <a className="help" href="#/guides/parf">?</a><div className="small muted">{s.coeRenewed ? 'None after COE renewal' : `${(ageMonths / 12).toFixed(1)} yrs old · ${PARF_REGIMES[regime].label}`}</div></td><td>{money(pv.parf)}</td></tr>
                <tr><td>COE rebate<div className="small muted">{monthsLeft} of {coeMonths} months left</div></td><td>{money(pv.coe)}</td></tr>
                <tr className="total"><td>Paper value</td><td>{money(pv.total)}</td></tr>
              </tbody>
            </table>
            {s.outstandingLoan > 0 && (
              <p className="small" style={{ marginTop: 12, marginBottom: 0 }}>
                After settling your loan you'd have <b>{money(equity)}</b> {equity < 0 ? 'still to pay' : 'to put towards the new car'}.
              </p>
            )}
          </section>

          <section className="card">
            <h3>Watch for the swap trick</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              A dealer can offer a generous trade-in and give a smaller discount on the new car, or the other way round. Only the
              net figure matters: <b>new car price − trade-in</b>. Ask for the new-car price without a trade-in, then sell your car
              separately and compare.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
