import { COE_LATEST, COE_LATEST_LABEL } from '../calc/defaults';
import { priceBreakdown } from '../calc/tax';
import { newCarDepreciation } from '../calc/depreciation';
import { money } from '../calc/format';
import { Breakdown } from '../components/Breakdown';
import { PRESETS } from '../presets';

const TOOLS = [
  { href: '#/calculator', title: 'Calculator', text: 'Price, loan, insurance, running costs and depreciation, added up to one monthly figure.' },
  { href: '#/deal', title: 'Deal decoder', text: 'Enter a dealer quote line by line. See the real total and the traps in the fine print.' },
  { href: '#/depreciation', title: 'Depreciation', text: 'How much value a new or used car loses each year, and what it will be worth when you sell.' },
  { href: '#/trade-in', title: 'Trade-in', text: "Your car's guaranteed floor value, and whether the offer is any better than that." },
  { href: '#/insurance', title: 'Insurance', text: 'What the premium hides: the discount you lose, the excess you pay, and what a claim really costs.' },
  { href: '#/quotes', title: 'Compare quotes', text: 'Restate several quotes on the same basis and see which is genuinely cheapest, not just lowest.' },
];

export function Home() {
  const car = PRESETS[0];
  const b = priceBreakdown({ omv: car.omv, coe: COE_LATEST[car.category], fuel: car.fuel, vesBand: car.vesBand, regYear: 2026, dealerPrice: car.dealerPrice });
  const dep = newCarDepreciation({ price: car.dealerPrice, arfPaid: b.arf.paid, coePaid: COE_LATEST[car.category], regime: 'budget2026' });
  const pct = (v: number) => Math.round((v / car.dealerPrice) * 100);

  return (
    <>
      <section className="hero">
        <h1>Know what a car really costs before you sign.</h1>
        <p>
          A Singapore car price is mostly taxes and the COE, with a loan, insurance and add-ons bundled on top. These free tools
          take any quote apart, line by line.
        </p>
        <div className="row">
          <a className="btn btn-primary" href="#/calculator">Work out my true cost</a>
          <a className="btn" href="#/deal">Check a dealer quote</a>
        </div>
      </section>

      <section className="section">
        <h2>Tools</h2>
        <nav className="tools">
          {TOOLS.map((t, i) => (
            <a key={t.href} className="tool" href={t.href}>
              <span className="tool-index" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <span>
                <span className="tool-title">{t.title}</span>
                <p>{t.text}</p>
              </span>
            </a>
          ))}
        </nav>
      </section>

      <section className="section cols">
        <div>
          <h2>Where {money(car.dealerPrice)} goes</h2>
          <p className="small muted" style={{ maxWidth: '58ch' }}>
            A typical {car.label.toLowerCase()} at the latest Cat A COE ({COE_LATEST_LABEL}). Hover the bar for detail.
          </p>
          <Breakdown b={b} dealerPrice={car.dealerPrice} />
        </div>

        <div>
          <h2>Four things the showroom won't say</h2>
          <div className="secrets">
            <div className="secret">
              <h3>The car is the cheap part</h3>
              <p>
                Only {pct(b.omv)}% of this price is the car. Taxes and the COE take {pct(b.exciseDuty + b.gst + b.registrationFee + b.arf.paid + b.coe)}%.
                The dealer's {pct(b.dealerShare ?? 0)}% — about {money(b.dealerShare ?? 0)} — is the part you can negotiate.
              </p>
            </div>
            <div className="secret">
              <h3>“2.5% flat” is really about 4.8% a year</h3>
              <p>
                Car loans quote a flat rate, which charges interest on the full amount for the whole term. The real rate is nearly
                double. <a href="#/guides/flat-rate">How it works</a>
              </p>
            </div>
            <div className="secret">
              <h3>New cars now lose {money(dep.annual)} a year</h3>
              <p>
                Budget 2026 cut the PARF rebate from 75% of ARF to 30%. After ten years this car is worth about {money(dep.residual)} on
                paper. <a href="#/depreciation">See the year-by-year drop</a>
              </p>
            </div>
            <div className="secret">
              <h3>Discounts come with strings</h3>
              <p>
                “$2,000 off with in-house financing” can cost more in extra interest than it saves. The decoder does the arithmetic.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
