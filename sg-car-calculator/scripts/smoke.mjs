/**
 * Smoke test the deployed site: the loan-amount field, the over-cap warning and
 * the insurance estimate, all driven through a real browser against production.
 *
 *   node scripts/smoke.mjs [url]
 *
 * Fails loudly on any page error, so a broken bundle is caught here rather than
 * by whoever happens to open the site next.
 */
import { chromium } from 'playwright';

const URL = process.argv[2] ?? 'https://openbonnet.pages.dev';

const check = (name, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
};

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await page.goto(`${URL}/#/calculator`, { waitUntil: 'networkidle' });
check('calculator loads', (await page.locator('h1').innerText()) === 'True cost calculator');

/* --- detail is collapsed by default, but the tier summary still states the
       current assumption, so the OMV rate is readable without opening it --- */
const tierText = await page.locator('details.tier', { hasText: 'Insurance' }).first().innerText();
check('insurance tier states its OMV rate', /% of OMV/.test(tierText), tierText.replace(/\n/g, ' | ').trim());

/* --- and opening it exposes the controls --- */
await page.locator('details.tier', { hasText: 'Insurance' }).first().click();
await page.waitForTimeout(200);
const insPrem = await page.getByLabel(/Your actual premium/).inputValue();
const insHint = await page.locator('.field-hint', { hasText: /estimate of/ }).first().innerText();
check('insurance override accepts a real quote', insPrem === '0', `default ${insPrem} — ${insHint.trim()}`);

/* --- loan amount field --- */
await page.locator('details.tier', { hasText: 'Financing' }).first().click();
await page.waitForTimeout(200);
await page.getByRole('button', { name: 'By amount' }).click();
await page.waitForTimeout(200);
const loan = page.getByLabel(/Loan amount/);
check('loan amount field appears', await loan.isVisible());
const carried = await loan.inputValue();
const pctHint = await page.locator('.field-hint', { hasText: 'of the price' }).first().innerText();
check('loan amount carries over from the slider', /\d/.test(carried), `$${carried} — ${pctHint.trim()}`);

/* --- typing a new amount recalculates --- */
await loan.fill('95000');
await page.waitForTimeout(250);
const monthly = (await page.locator('.stat').first().innerText()).replace(/\n/g, ' | ');
check('instalment recalculates', /\$1,3\d\d/.test(monthly), monthly);

/* --- over-cap warning --- */
await loan.fill('250000');
await page.waitForTimeout(250);
const warn = await page.locator('.flag-warn').first();
check('over-cap warning fires', await warn.isVisible(), (await warn.innerText()).replace(/\s+/g, ' ').slice(0, 90));

/* --- share link scoping: a calculator payload must not reach trade-in --- */
await page.evaluate(() => localStorage.clear());
const payload = await page.evaluate(() =>
  btoa(unescape(encodeURIComponent(JSON.stringify({ r: 'calculator', s: { dealerPrice: 999999, omv: 88888 } })))),
);
await page.goto(`${URL}/#/trade-in?s=${payload}`, { waitUntil: 'networkidle' });
const leaked = await page.evaluate(() => {
  const o = JSON.parse(localStorage.getItem('tradein') || '{}');
  return Object.keys(o).filter((k) => ['dealerPrice', 'omv', 'keepYears'].includes(k));
});
check('share payload does not leak across pages', leaked.length === 0, leaked.length ? `leaked: ${leaked}` : 'clean');

check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(process.exitCode ? '\nSMOKE FAILED' : '\nAll smoke checks passed.');
