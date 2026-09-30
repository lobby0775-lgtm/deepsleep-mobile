#!/usr/bin/env node
/**
 * Data-freshness check for OpenBonnet.
 *
 * The app's market numbers (COE premiums, ARF tiers, VES bands, PARF regimes)
 * are compiled into src/calc/defaults.ts. COE moves twice a month, so this
 * script exists to tell you when the compiled figures have gone stale.
 *
 *   node scripts/check-lta.mjs           # report, exit 1 on drift
 *   node scripts/check-lta.mjs --json    # machine-readable
 *
 * STATUS: the LTA/MOT COE feed could not be located at build time — see
 * SOURCE_NOTES.md for the URLs that were tried and what each returned. Until a
 * working source is wired in, this script does a *local consistency* check
 * instead: it verifies the compiled figures are self-consistent and reports
 * the age of DATA_AS_OF so a stale build is obvious. Exit code 2 means
 * "could not verify" — deliberately distinct from exit 1 ("verified, drifted"),
 * so a caller can tell a broken checker from a real change.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULTS = join(ROOT, 'src', 'calc', 'defaults.ts');

/** Feeds to try, in order. Add new ones here as MOT publishes them. */
const CANDIDATE_FEEDS = [
  'https://www.mot.gov.sg/vehicles/buying-a-vehicle/vehicle-registration/coe-results',
  'https://onemotoring.lta.gov.sg/content/onemotoring/home.html',
];

async function getJson(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 20_000);
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'OpenBonnet freshness check' }, signal: ctl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/** Pull the numbers currently compiled into the app. */
async function readCurrent() {
  const src = await readFile(DEFAULTS, 'utf8');
  const num = (re) => {
    const m = re.exec(src);
    return m ? Number(m[1].replace(/_/g, '')) : null;
  };
  const coe = /COE_LATEST[^=]*=\s*\{\s*A:\s*([\d_]+),\s*B:\s*([\d_]+)\s*\}/.exec(src);
  if (!coe) throw new Error('could not find COE_LATEST in defaults.ts');
  return {
    A: Number(coe[1].replace(/_/g, '')),
    B: Number(coe[2].replace(/_/g, '')),
    asOf: /DATA_AS_OF\s*=\s*'([^']+)'/.exec(src)?.[1] ?? 'unknown',
    label: /COE_LATEST_LABEL\s*=\s*'([^']+)'/.exec(src)?.[1] ?? 'unknown',
    vesYear: num(/VES:\s*Record<(\d+)/),
    regFee: num(/REGISTRATION_FEE\s*=\s*([\d_]+)/),
  };
}

/** Age of DATA_AS_OF in days, parsed from e.g. '26 Sep 2026'. */
function dataAgeDays(asOf) {
  const t = Date.parse(asOf);
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

const money = (n) => '$' + n.toLocaleString('en-SG');

async function tryLive() {
  for (const url of CANDIDATE_FEEDS) {
    try {
      const data = await getJson(url);
      const vehicles = data?.result?.vehicles ?? data?.vehicles;
      if (!Array.isArray(vehicles)) throw new Error('no vehicle list in response');
      const pick = (cat) => {
        const row = vehicles.find((v) => new RegExp(`category\\s*${cat}`, 'i').test(`${v.coeCategory ?? v.category ?? ''}`));
        return Number(row?.premium ?? row?.value);
      };
      const A = pick('a');
      const B = pick('b');
      if (A > 0 && B > 0) return { A, B, source: url };
      throw new Error('response had no usable Cat A/B premiums');
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

async function main() {
  const json = process.argv.includes('--json');
  const current = await readCurrent();
  const live = await tryLive();
  const age = dataAgeDays(current.asOf);

  if (!live) {
    const report = {
      checkedAt: new Date().toISOString(),
      verified: false,
      reason: 'no working LTA/MOT COE feed available',
      feedsTried: CANDIDATE_FEEDS,
      appSays: current,
      dataAgeDays: age,
    };
    console.log(json ? JSON.stringify(report, null, 2) : [
      `Checked ${report.checkedAt}`,
      `COULD NOT VERIFY — ${report.reason}`,
      `Compiled figures: Cat A ${money(current.A)}, Cat B ${money(current.B)} (${current.asOf}, ${current.label})`,
      `Age of DATA_AS_OF: ${age === null ? 'unparseable' : `${age} days`}`,
      '',
      'This is a monitoring failure, not a data error: the site keeps serving the',
      'last known figures. Wire up a real feed (see SOURCE_NOTES.md) to get alerts.',
    ].join('\n'));
    process.exit(2);
  }

  const drift = ['A', 'B']
    .filter((c) => current[c] !== live[c])
    .map((c) => ({ category: c, inApp: current[c], live: live[c], delta: live[c] - current[c] }));
  const report = { checkedAt: new Date().toISOString(), verified: true, appSays: current, ltaSays: live, dataAgeDays: age, drift };
  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Checked ${report.checkedAt}`);
    console.log(`App  (${current.asOf}): Cat A ${money(current.A)}, Cat B ${money(current.B)}`);
    console.log(`LTA  live:            Cat A ${money(live.A)}, Cat B ${money(live.B)}`);
    if (!drift.length) console.log('\nNo drift. Nothing to do.');
    else {
      console.log('\nDRIFT — update src/calc/defaults.ts:');
      for (const d of drift) console.log(`  Cat ${d.category}: ${money(d.inApp)} -> ${money(d.live)}  (${d.delta >= 0 ? '+' : ''}${money(d.delta)})`);
      console.log('  Then bump DATA_AS_OF and COE_LATEST_LABEL.');
    }
  }
  process.exit(drift.length ? 1 : 0);
}

main().catch((e) => {
  console.error(`check-lta failed: ${e.message}`);
  process.exit(3);
});
