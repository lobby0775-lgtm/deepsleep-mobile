import type { PriceBreakdown } from '../calc/tax';
import { money } from '../calc/format';
import { StackedBar } from './Charts';

/** Where the sticker price goes, as one bar and an itemised statement. */
export function Breakdown({ b, dealerPrice }: { b: PriceBreakdown; dealerPrice: number }) {
  const taxes = b.exciseDuty + b.gst + b.registrationFee;
  const dealer = b.dealerShare ?? 0;
  // Shades are assigned largest-first by the chart, so a small tax line never
  // shouts louder than the COE that dwarfs it.
  const segments = [
    { label: 'Car (OMV)', value: b.omv },
    { label: 'Import taxes', value: taxes },
    { label: 'ARF', value: b.arf.paid },
    { label: 'COE', value: b.coe },
    { label: 'Dealer share', value: Math.max(0, dealer) },
  ];
  const govt = taxes + b.arf.paid;
  const share = (v: number) => (dealerPrice > 0 ? Math.round((v / dealerPrice) * 100) : 0);

  return (
    <div>
      <StackedBar segments={segments} ariaLabel={`Price breakdown of ${money(dealerPrice)}`} />
      <table className="lines" style={{ marginTop: 16 }}>
        <tbody>
          <tr className="hi">
            <td>The car itself (OMV) <a className="help" href="#/guides/omv">?</a></td>
            <td>{money(b.omv)}</td>
          </tr>
          <tr>
            <td>Import taxes and fees</td>
            <td>{money(taxes)}</td>
          </tr>
          <tr className="sub"><td>Excise duty, 20% of OMV</td><td>{money(b.exciseDuty)}</td></tr>
          <tr className="sub"><td>GST, 9% of OMV plus duty</td><td>{money(b.gst)}</td></tr>
          <tr className="sub"><td>Registration fee</td><td>{money(b.registrationFee)}</td></tr>
          <tr className="hi">
            <td>Additional Registration Fee <a className="help" href="#/guides/arf">?</a></td>
            <td>{money(b.arf.paid)}</td>
          </tr>
          <tr className="sub"><td>ARF on tiered rates</td><td>{money(b.arf.gross)}</td></tr>
          {b.arf.ves !== 0 && (
            <tr className="sub">
              <td>VES {b.arf.ves < 0 ? 'rebate' : 'surcharge'} <a className="help" href="#/guides/ves">?</a></td>
              <td>{b.arf.ves > 0 ? '+' : '−'}{money(Math.abs(b.arf.ves))}</td>
            </tr>
          )}
          {b.arf.eeai > 0 && <tr className="sub"><td>EV Early Adoption Incentive</td><td>−{money(b.arf.eeai)}</td></tr>}
          {b.arf.gross + b.arf.ves - b.arf.eeai !== b.arf.paid && (
            <tr className="sub"><td>Floored at minimum ARF</td><td>{money(b.arf.paid)}</td></tr>
          )}
          <tr className="hi">
            <td>Certificate of Entitlement <a className="help" href="#/guides/coe">?</a></td>
            <td>{money(b.coe)}</td>
          </tr>
          <tr className="hi">
            <td>Dealer share <span className="muted small">shipping, warranty, freebies, margin</span></td>
            <td>{money(dealer)}</td>
          </tr>
          <tr className="total"><td>Price you're quoted</td><td>{money(dealerPrice)}</td></tr>
        </tbody>
      </table>
      <p className="small muted" style={{ marginTop: 16, marginBottom: 0, maxWidth: '58ch' }}>
        Government takes {money(govt)} in taxes plus {money(b.coe)} for the COE — <b>{share(govt + b.coe)}% of the price</b>.
        The car itself is {share(b.omv)}%. The dealer's {share(dealer)}% is the part you can negotiate.
      </p>
      {dealer < 0 && (
        <div className="callout callout-warn small" style={{ marginTop: 12 }}>
          The price is below OMV plus taxes plus COE. Check the OMV and COE figures. If the quote assumes a lower COE than the
          latest result, you may be asked to top up.
        </div>
      )}
    </div>
  );
}
