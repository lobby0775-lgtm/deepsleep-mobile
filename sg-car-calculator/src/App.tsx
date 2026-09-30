import { useEffect, useState } from 'react';
import { DATA_AS_OF } from './calc/defaults';
import { Home } from './pages/Home';
import { Calculator } from './pages/Calculator';
import { DealDecoder } from './pages/DealDecoder';
import { Depreciation } from './pages/Depreciation';
import { TradeIn } from './pages/TradeIn';
import { Insurance } from './pages/Insurance';
import { InsuranceQuotes } from './pages/InsuranceQuotes';
import { Guides } from './pages/Guides';

const NAV = [
  { path: 'calculator', label: 'True cost' },
  { path: 'deal', label: 'Deal decoder' },
  { path: 'depreciation', label: 'Depreciation' },
  { path: 'trade-in', label: 'Trade-in' },
  { path: 'insurance', label: 'Insurance' },
  { path: 'quotes', label: 'Compare quotes' },
  { path: 'guides', label: 'Guide' },
];

function readRoute() {
  const [path] = window.location.hash.replace(/^#\/?/, '').split('?');
  const [page, sub] = path.split('/');
  return { page: page || '', sub };
}

export function App() {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const onChange = () => {
      const next = readRoute();
      setRoute((prev) => {
        if (prev.page !== next.page) window.scrollTo(0, 0);
        return next;
      });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  let page;
  switch (route.page) {
    case 'calculator': page = <Calculator />; break;
    case 'deal': page = <DealDecoder />; break;
    case 'depreciation': page = <Depreciation />; break;
    case 'trade-in': page = <TradeIn />; break;
    case 'insurance': page = <Insurance />; break;
    case 'quotes': page = <InsuranceQuotes />; break;
    case 'guides': page = <Guides term={route.sub} />; break;
    default: page = <Home />;
  }

  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <a className="brand" href="#/">Open<span>Bonnet</span></a>
          <nav className="nav" aria-label="Main">
            {NAV.map((n) => (
              <a key={n.path} href={`#/${n.path}`} aria-current={route.page === n.path ? 'page' : undefined}>{n.label}</a>
            ))}
          </nav>
        </div>
      </header>
      <main className="wrap">{page}</main>
      <footer className="site-footer">
        <div className="wrap">
          <p>
            OpenBonnet is an independent tool for Singapore car buyers. We're not affiliated with any dealer, bank or insurer.
            Rules and COE prices as of {DATA_AS_OF}, from LTA and MAS. All figures are estimates, not financial advice. Your
            inputs stay in your browser.
          </p>
        </div>
      </footer>
    </>
  );
}
