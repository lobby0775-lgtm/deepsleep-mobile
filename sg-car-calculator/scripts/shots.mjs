import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL = process.argv[2] ?? 'https://openbonnet.pages.dev';
const OUT = 'shots';
mkdirSync(OUT, { recursive: true });

const pages = [
  ['home', '#/'],
  ['calculator', '#/calculator'],
  ['deal', '#/deal'],
  ['depreciation', '#/depreciation'],
  ['tradein', '#/trade-in'],
  ['guides', '#/guides'],
];

const browser = await chromium.launch();
for (const vp of [{ w: 1440, h: 1200, tag: 'desktop' }, { w: 390, h: 844, tag: 'mobile' }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  for (const [name, hash] of pages) {
    await page.goto(`${URL}/${hash}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/${vp.tag}-${name}.png`, fullPage: false });
  }
  await ctx.close();
}
await browser.close();
console.log('shots written to', OUT);
