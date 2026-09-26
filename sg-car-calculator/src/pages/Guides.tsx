import { useEffect, type ReactNode } from 'react';
import { COE_LATEST, COE_LATEST_LABEL, DATA_AS_OF } from '../calc/defaults';
import { money } from '../calc/format';

const GUIDES: { id: string; title: string; body: ReactNode }[] = [
  {
    id: 'omv',
    title: 'OMV: Open Market Value',
    body: (
      <>
        <p>
          The car's value as assessed by Singapore Customs when it's imported: the purchase price plus freight, insurance and
          other costs to bring it here. It's the only part of the price that pays for the car itself. Almost every tax is
          worked out from it.
        </p>
        <p>A car sold for $200,000 in Singapore often has an OMV of only $20,000–$30,000.</p>
      </>
    ),
  },
  {
    id: 'arf',
    title: 'ARF: Additional Registration Fee',
    body: (
      <>
        <p>A tax on registering the car, charged as a percentage of OMV in tiers:</p>
        <table className="lines">
          <tbody>
            <tr><td>First $20,000 of OMV</td><td>100%</td></tr>
            <tr><td>$20,001 – $40,000</td><td>140%</td></tr>
            <tr><td>$40,001 – $60,000</td><td>190%</td></tr>
            <tr><td>$60,001 – $80,000</td><td>250%</td></tr>
            <tr><td>Above $80,000</td><td>320%</td></tr>
          </tbody>
        </table>
        <p style={{ marginTop: 12 }}>
          A car with a $30,000 OMV pays $34,000 ARF. Part of the ARF comes back as the PARF rebate if you deregister the car
          within 10 years.
        </p>
      </>
    ),
  },
  {
    id: 'ves',
    title: 'VES: Vehicular Emissions Scheme',
    body: (
      <>
        <p>
          A rebate or surcharge on ARF based on the car's worst-rated pollutant (CO₂, HC, CO, NOx or particulates). Since 2026,
          only electric cars qualify for the rebate. Hybrids now usually land in the neutral band.
        </p>
        <table className="lines">
          <tbody>
            <tr><td>Band A (cleanest)</td><td>−$22,500 (2026) · −$20,000 (2027)</td></tr>
            <tr><td>Band B</td><td>$0</td></tr>
            <tr><td>Band C1</td><td>+$7,500 · +$15,000</td></tr>
            <tr><td>Band C2</td><td>+$22,500 · +$30,000</td></tr>
            <tr><td>Band C3</td><td>+$35,000 · +$45,000</td></tr>
          </tbody>
        </table>
        <p style={{ marginTop: 12 }}>
          Rebates can't take ARF below $5,000 ($0 for EVs until end-2027). Electric cars registered in 2026 also get the EV
          Early Adoption Incentive: 45% off ARF, up to $7,500. Every model's band is listed on the dealer's price list.
        </p>
      </>
    ),
  },
  {
    id: 'coe',
    title: 'COE: Certificate of Entitlement',
    body: (
      <>
        <p>
          The right to own a car for 10 years, bought through a government auction held twice a month. Cat A is for cars up to
          1,600cc and 97kW (110kW for EVs). Cat B is for everything bigger. The latest results ({COE_LATEST_LABEL}) were{' '}
          {money(COE_LATEST.A)} for Cat A and {money(COE_LATEST.B)} for Cat B.
        </p>
        <p>
          <b>Guaranteed COE</b> packages fix the price whatever the auction does. <b>Non-guaranteed</b> packages price the car
          on an assumed COE and bid for you a set number of times. If the auction goes higher, you may have to top up or wait.
          A non-guaranteed deal is only cheaper if COE prices stay flat or fall.
        </p>
      </>
    ),
  },
  {
    id: 'parf',
    title: 'PARF rebate',
    body: (
      <>
        <p>
          The share of ARF LTA refunds when you deregister a car (scrap or export it) before it's 10 years old. Budget 2026 cut
          it sharply for cars with COEs from the second February 2026 bidding onward:
        </p>
        <table className="lines">
          <tbody>
            <tr><td>Age at deregistration</td><td>Before Feb 2026 · From Feb 2026</td></tr>
            <tr><td>Up to 5 years</td><td>75% · 30%</td></tr>
            <tr><td>5–6 years</td><td>70% · 25%</td></tr>
            <tr><td>6–7 years</td><td>65% · 20%</td></tr>
            <tr><td>7–8 years</td><td>60% · 15%</td></tr>
            <tr><td>8–9 years</td><td>55% · 10%</td></tr>
            <tr><td>9–10 years</td><td>50% · 5%</td></tr>
            <tr><td>Cap</td><td>$60,000* · $30,000</td></tr>
          </tbody>
        </table>
        <p className="small muted" style={{ marginTop: 8 }}>*No cap for COEs obtained before February 2023.</p>
        <p>If you renew the COE after 10 years, the car loses its PARF rebate for good.</p>
      </>
    ),
  },
  {
    id: 'paper-value',
    title: 'Paper value',
    body: (
      <p>
        PARF rebate + COE rebate: what LTA pays back if the car is deregistered today. The COE rebate is the unused part of the
        COE, pro-rated by months left. Paper value is the floor on any car's worth, so a trade-in offer below it is a bad deal.
      </p>
    ),
  },
  {
    id: 'depreciation',
    title: 'Depreciation',
    body: (
      <>
        <p>
          Singapore's standard figure is <b>(price − value left at COE expiry) ÷ years of COE left</b>. For a car on its
          original COE, the value left is its 10-year PARF rebate. For a renewed COE it's zero.
        </p>
        <p>
          It's the fairest way to compare cars of different ages, and for most owners it's the biggest cost of all. Under the
          2026 PARF rules, a new $200,000 car loses almost all of that price over 10 years.
        </p>
      </>
    ),
  },
  {
    id: 'loan',
    title: 'Loan limits',
    body: (
      <p>
        MAS caps car loans at 70% of the price if OMV is $20,000 or less, and 60% if it's higher, for at most 7 years. If a
        dealer offers "low downpayment" beyond this, the rest is usually a separate personal loan at a much higher rate.
      </p>
    ),
  },
  {
    id: 'flat-rate',
    title: 'Flat rate vs EIR',
    body: (
      <>
        <p>
          Car loans are quoted as a <b>flat rate</b>: interest is charged on the full original amount every year, even though
          you're paying it down. The <b>effective interest rate (EIR)</b> is the real cost, and it's close to double the flat
          rate. For example, 2.5% flat over 7 years is about 4.8% EIR.
        </p>
        <p>
          Paying off early rarely saves as much as you'd expect. Lenders use the <b>Rule of 78</b>, which puts most of the
          interest in the early months, and many keep 20% of the unearned interest as a penalty.
        </p>
      </>
    ),
  },
  {
    id: 'ncd',
    title: 'NCD: No-Claim Discount',
    body: (
      <p>
        Your insurance discount for claim-free years: 10% after one year, rising to 50% after five. It's tied to you, not the
        car, so it moves with you when you change cars. One claim usually knocks it down by 20–30 points unless you've paid for
        NCD protection.
      </p>
    ),
  },
];

export function Guides({ term }: { term?: string }) {
  useEffect(() => {
    if (term) document.getElementById(term)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo(0, 0);
  }, [term]);

  return (
    <>
      <div className="page-head">
        <h1>Plain-English guide</h1>
        <p>Every acronym on a Singapore car price list, explained.</p>
        <nav className="toc" aria-label="Topics">
          {GUIDES.map((g) => <a key={g.id} href={`#/guides/${g.id}`}>{g.title.split(':')[0]}</a>)}
        </nav>
      </div>
      <div className="stack" style={{ maxWidth: 760 }}>
        {GUIDES.map((g) => (
          <section key={g.id} id={g.id} className="card guide" style={term === g.id ? { borderColor: 'var(--accent)' } : undefined}>
            <h2>{g.title}</h2>
            {g.body}
          </section>
        ))}
        <p className="small muted">
          Rules as of {DATA_AS_OF}, from LTA (onemotoring.lta.gov.sg) and MAS. Check the latest figures before you sign.
        </p>
      </div>
    </>
  );
}
