import type { PriceBreakdown } from '../calc/tax';
import { money } from '../calc/format';
import { StackedBar } from './Charts';

/** Where the sticker price goes, as a bar and an itemised list. */
export function Breakdown({ b, dealerPrice }: { b: PriceBreakdown; dealerPrice: number }) {
  const taxes = b.exciseDuty + b.gst + b.registrationFee;
  const dealer = b.dealerShare ?? 0;
  const segments = [
    { label: 'Car (OMV)', value: b.omv, color: 'var(--s1)' },
    { label: 'Import taxes', value: taxes, color: 'var(--s2)' },
    { label: 'ARF', value: b.arf.paid, color: 'var(--s3)' },
    { label: 'COE', value: b.coe, color: 'var(--s4)' },
    { label: 'Dealer share', value: Math.max(0, dealer), color: 'var(--s5)' },
  ];
  const govt = taxes + b.arf.paid;

  return (
    <div>
      <StackedBar segments={segments} ariaLabel={`Price breakdown of ${money(dealerPrice)}`} />
      <table className="lines">
        <tbody>
          <tr>
            <td><span className="key" style={{ background: 'var(--s1)' }} />The car itself (OMV) <a className="help" href="#/guides/omv">?</a></td>
            <td>{money(b.omv)}</td>
          </tr>
          <tr>
            <td><span className="key" style={{ background: 'var(--s2)' }} />Import taxes and fees</td>
            <td>{money(taxes)}</td>
          </tr>
          <tr className="sub"><td>Excise duty (20% of OMV)</td><td>{money(b.exciseDuty)}</td></tr>
          <tr className="sub"><td>GST (9% of OMV + duty)</td><td>{money(b.gst)}</td></tr>
          <tr className="sub"><td>Registration fee</td><td>{money(b.registrationFee)}</td></tr>
          <tr>
            <td><span className="key" style={{ background: 'var(--s3)' }} />Additional Registration Fee <a className="help" href="#/guides/arf">?</a></td>
            <td>{money(b.arf.paid)}</td>
          </tr>
          <tr className="sub"><td>ARF on tiered rates</td><td>{money(b.arf.gross)}</td></tr>
          {b.arf.ves !== 0 && (
            <tr className="sub">
              <td>VES {b.arf.ves < 0 ? 'rebate' : 'surcharge'} <a className="help" href="#/guides/ves">?</a></td>
              <td>{b.arf.ves > 0 ? '+' : ''}{money(b.arf.ves)}</td>
            </tr>
          )}
          {b.arf.eeai > 0 && <tr className="sub"><td>EV Early Adoption Incentive</td><td>{money(-b.arf.eeai)}</td></tr>}
          {b.arf.gross + b.arf.ves - b.arf.eeai !== b.arf.paid && (
            <tr className="sub"><td>Floored at minimum ARF</td><td>{money(b.arf.paid)}</td></tr>
          )}
          <tr>
            <td><span className="key" style={{ background: 'var(--s4)' }} />Certificate of Entitlement <a className="help" href="#/guides/coe">?</a></td>
            <td>{money(b.coe)}</td>
          </tr>
          <tr>
            <td>
              <span className="key" style={{ background: 'var(--s5)' }} />
              Dealer share <span className="muted small">shipping, warranty, freebies, profit</span>
            </td>
            <td>{money(dealer)}</td>
          </tr>
          <tr className="total"><td>Price you're quoted</td><td>{money(dealerPrice)}</td></tr>
        </tbody>
      </table>
      <p className="small muted" style={{ marginTop: 12 }}>
        Government takes {money(govt)} in taxes plus {money(b.coe)} for the COE:{' '}
        <b>{Math.round(((govt + b.coe) / dealerPrice) * 100)}% of the price</b>. The car itself is{' '}
        {Math.round((b.omv / dealerPrice) * 100)}%.
      </p>
      {dealer < 0 && (
        <div className="callout callout-warn small">
          The price is below OMV + taxes + COE. Check the OMV and COE figures. If the quote assumes a lower COE than the latest
          result, you may be asked to top up.
        </div>
      )}
    </div>
  );
}
