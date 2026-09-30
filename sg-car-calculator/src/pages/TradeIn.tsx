import { PARF_REGIMES } from '../calc/defaults';
import { addYears, monthsBetween, paperValue, parfRegimeFor } from '../calc/rebates';
import { money } from '../calc/format';
import { Check, DateField, FlagList, NumberField, Segmented, Tier } from '../components/Fields';
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
  const [s, setAll, set] = usePersistentState('tradein', DEFAULTS, 'trade-in');
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
        <div className="stack">
          <div className="answer">
            <div className="figure-xl">{money(pv.total)}</div>
            <div>
              <div className="label small muted">Paper value, your guaranteed floor</div>
              <div className="small num">Offer {money(s.offer)} · {premium >= 0 ? `${money(premium)} above` : `${money(-premium)} below`}</div>
            </div>
          </div>

          <section>
            <div className="grid-2">
              <NumberField label="Dealer's trade-in offer" prefix="$" value={s.offer} onChange={(v) => set('offer', v)} />
              <NumberField label="Loan still owed" prefix="$" value={s.outstandingLoan} onChange={(v) => set('outstandingLoan', v)}
                hint="Ask your bank for the settlement figure" />
            </div>
            <p className="small muted" style={{ marginTop: 12, marginBottom: 0, maxWidth: '54ch' }}>
              Enter the offer and what's still owed. The paper value underneath is worked out from your car's own COE, PARF and
              ARF — open the section below if you want to check them.
            </p>
          </section>

          <div className="tiers">
            <Tier
              label="Your car's COE and PARF"
              badge={s.coeRenewed ? 'COE renewed' : 'original COE'}
              summary={s.coeRenewed
                ? `Renewed to ${s.coeExpiry} at ${money(s.coePaid)} · ARF ${money(s.arfPaid)}`
                : `Paid ${money(s.coePaid)}, expires ${s.coeExpiry} · ARF ${money(s.arfPaid)}`}
            >
              <p className="small muted" style={{ marginTop: 0 }}>On the log card, or OneMotoring under "Vehicle Details".</p>
              <div className="grid-2">
                <DateField label="Registration date" value={s.regDate} onChange={(v) => setAll((p) => ({ ...p, regDate: v, coeExpiry: p.coeRenewed ? p.coeExpiry : addYears(v, 10) }))} />
                <DateField label="COE expiry" value={s.coeExpiry} onChange={(v) => set('coeExpiry', v)} />
                <NumberField label="ARF paid" help="arf" prefix="$" value={s.arfPaid} onChange={(v) => set('arfPaid', v)} />
                <NumberField label={s.coeRenewed ? 'Renewal PQP paid' : 'COE paid'} help="coe" prefix="$" value={s.coePaid} onChange={(v) => set('coePaid', v)} />
                <DateField label="Handover date" value={s.handover} onChange={(v) => set('handover', v)} hint="When the dealer takes the car" />
              </div>
              <div className="stack">
                <Check checked={s.coeRenewed} onChange={(v) => set('coeRenewed', v)}>The COE has been renewed (no PARF)</Check>
                {s.coeRenewed && (
                  <Segmented label="Renewal length" value={s.renewalYears} onChange={(v) => set('renewalYears', v)} options={[{ value: 5, label: '5-year renewal' }, { value: 10, label: '10-year renewal' }]} />
                )}
              </div>
            </Tier>
          </div>
        </div>

        <aside className="stack sticky">
          <section>
            <div className="rule-head"><h2>Is the offer fair?</h2></div>
            <div className="hbar" style={{ margin: '16px 0 8px' }} aria-hidden="true">
              {[
                { label: 'Paper value', v: pv.total, floor: true },
                { label: 'Dealer offer', v: s.offer, floor: false },
              ].map((b) => (
                <div key={b.label} className="hbar-row">
                  <span className="hbar-label">{b.label}</span>
                  <div className="hbar-track">
                    <div className={`hbar-fill${b.floor ? ' is-floor' : ''}`} style={{ width: `${Math.min(100, (b.v / max) * 100)}%` }} />
                  </div>
                  <span className="hbar-val">{money(b.v)}</span>
                </div>
              ))}
            </div>
            <p className="small muted" style={{ marginTop: 0, marginBottom: 0 }}>
              {premium >= 0
                ? `The offer clears the floor by ${money(premium)}. That gap is the car's actual worth above scrap value.`
                : `The offer falls ${money(-premium)} short of the floor you are guaranteed on paper.`}
            </p>
            <FlagList items={[premium < 0
              ? { severity: 'danger' as const,
                  title: `The offer is ${money(-premium)} below paper value`,
                  detail: `Deregistering the car yourself (scrap or export) returns more. Reject the offer, or ask for at least ${money(pv.total)}.`,
                }
              : { severity: 'info' as const,
                  title: `The dealer is paying ${money(premium)} for the car itself`,
                  detail: `That is the part to negotiate. Get two or three quotes from used-car dealers, or a direct-to-buyer platform, to compare.`,
                }]} />
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

          <section>
            <h2 style={{ borderTop: '1px solid var(--ink)', paddingTop: 12 }}>Watch for the swap trick</h2>
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
