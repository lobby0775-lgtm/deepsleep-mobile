import { COE_LATEST, COE_LATEST_LABEL } from '../calc/defaults';
import { priceBreakdown } from '../calc/tax';
import { newCarDepreciation } from '../calc/depreciation';
import { money } from '../calc/format';
import { Breakdown } from '../components/Breakdown';
import { PRESETS } from '../presets';

const TOOLS = [
  { href: '#/calculator', emoji: '🧮', title: 'True cost calculator', text: 'Price, loan, insurance, running costs and depreciation, added up to one monthly figure.' },
  { href: '#/deal', emoji: '🔍', title: 'Deal decoder', text: 'Enter a dealer quote line by line. See the real total and the traps in the fine print.' },
  { href: '#/depreciation', emoji: '📉', title: 'Depreciation', text: 'How much value a new or used car loses each year, and what it will be worth.' },
  { href: '#/trade-in', emoji: '🔄', title: 'Trade-in checker', text: "Work out your car's guaranteed floor value and see if the offer beats it." },
];

export function Home() {
  const car = PRESETS[0];
  const b = priceBreakdown({ omv: car.omv, coe: COE_LATEST[car.category], fuel: car.fuel, vesBand: car.vesBand, regYear: 2026, dealerPrice: car.dealerPrice });
  const dep = newCarDepreciation({ price: car.dealerPrice, arfPaid: b.arf.paid, coePaid: COE_LATEST[car.category], regime: 'budget2026' });

  return (
    <>
      <section className="hero">
        <h1>Know what a car really costs before you sign.</h1>
        <p>
          A Singapore car price is mostly taxes and the COE, then a loan, insurance and add-ons get bundled on top. These free
          tools split every quote into its parts, so you can see where your money goes and which deal is really cheaper.
        </p>
        <div className="row">
          <a className="btn btn-primary" href="#/calculator">Work out my true cost</a>
          <a className="btn" href="#/deal">Check a dealer quote</a>
        </div>
      </section>

      <section className="section">
        <div className="tools">
          {TOOLS.map((t) => (
            <a key={t.href} className="tool" href={t.href}>
              <div className="emoji" aria-hidden="true">{t.emoji}</div>
              <h3>{t.title}</h3>
              <p>{t.text}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="section cols">
        <div className="card">
          <h2>Where {money(car.dealerPrice)} goes</h2>
          <p className="small muted">A typical {car.label.toLowerCase()} at the latest Cat A COE ({COE_LATEST_LABEL}). Hover over the bar for details.</p>
          <Breakdown b={b} dealerPrice={car.dealerPrice} />
        </div>
        <div className="stack">
          <h2>What the showroom won't tell you</h2>
          <div className="secrets">
            <div className="card">
              <h3>The car is the cheap part</h3>
              <p className="small" style={{ margin: 0 }}>
                Only {Math.round((b.omv / car.dealerPrice) * 100)}% of this price is the car. The rest is taxes, the COE, and the
                dealer's share of about {money(b.dealerShare ?? 0)}, which is where the room to negotiate is.
              </p>
            </div>
            <div className="card">
              <h3>"2.5%" is really about 4.8%</h3>
              <p className="small" style={{ margin: 0 }}>
                Car loans quote a flat rate, which charges interest on the full amount for the whole loan. The real rate is
                nearly double. <a href="#/guides/flat-rate">How it works</a>
              </p>
            </div>
            <div className="card">
              <h3>New cars now lose {money(dep.annual)} a year</h3>
              <p className="small" style={{ margin: 0 }}>
                Budget 2026 cut the PARF rebate from 75% of ARF to 30%. After 10 years this car is worth about {money(dep.residual)}{' '}
                on paper. <a href="#/depreciation">See the year-by-year drop</a>
              </p>
            </div>
            <div className="card">
              <h3>Discounts often come with strings</h3>
              <p className="small" style={{ margin: 0 }}>
                "$2,000 off with in-house financing" can cost more in extra interest than it saves. The decoder checks the maths.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
