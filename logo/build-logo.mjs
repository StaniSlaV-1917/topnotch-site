// Generates the Top Notch BIM logo files from geometry.
// The wordmark is drawn from strokes on a 20-unit cap height, so the SVGs do not depend on fonts.
// Run: node logo/build-logo.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));
const PRIMARY = '#00d1b2';
const INK = '#14161a';
const HEADING = '#363636';
const TEXT = '#4a4a4a';

const r = 3; // corner radius of bowls and round letters
const n = (v) => +v.toFixed(2);

// Each glyph: (half stroke) -> { w, d }
const glyphs = {
  T: (i) => ({ w: 14, d: `M0 ${i}H14M7 ${i}V20` }),
  O: (i) => {
    const x0 = i, x1 = 15 - i, y0 = i, y1 = 20 - i, R = 3.5;
    return { w: 15, d: `M${x0 + R} ${y0}H${x1 - R}A${R} ${R} 0 0 1 ${x1} ${y0 + R}V${y1 - R}A${R} ${R} 0 0 1 ${x1 - R} ${y1}H${x0 + R}A${R} ${R} 0 0 1 ${x0} ${y1 - R}V${y0 + R}A${R} ${R} 0 0 1 ${x0 + R} ${y0}Z` };
  },
  P: (i) => {
    const x1 = 13 - i, yb = 11.5;
    return { w: 13, d: `M${i} 20V${i}H${x1 - r}A${r} ${r} 0 0 1 ${x1} ${i + r}V${yb - r}A${r} ${r} 0 0 1 ${x1 - r} ${yb}H${i}` };
  },
  N: (i) => ({ w: 15, d: `M${i} 0V20M${15 - i} 0V20M${i} ${i}L${15 - i} ${20 - i}` }),
  C: (i) => ({ w: 13, d: `M13 ${i}H${i + r}A${r} ${r} 0 0 0 ${i} ${i + r}V${20 - i - r}A${r} ${r} 0 0 0 ${i + r} ${20 - i}H13` }),
  H: (i) => ({ w: 14, d: `M${i} 0V20M${14 - i} 0V20M${i} 10H${14 - i}` }),
  B: (i) => {
    const xt = 12 - i, xb = 13.5 - i;
    return { w: 13.5, d: `M${i} 0V20M${i} ${i}H${xt - r}A${r} ${r} 0 0 1 ${xt} ${i + r}V${10 - r}A${r} ${r} 0 0 1 ${xt - r} 10H${i}M${i} 10H${xb - r}A${r} ${r} 0 0 1 ${xb} ${10 + r}V${20 - i - r}A${r} ${r} 0 0 1 ${xb - r} ${20 - i}H${i}` };
  },
  I: (i) => ({ w: i * 2, d: `M${i} 0V20` }),
  M: (i) => ({ w: 17, d: `M${i} 0V20M${17 - i} 0V20M${i} ${i}L8.5 12.5L${17 - i} ${i}` }),
};

// Lays out a word; returns { d (translated path), width }
function word(text, sw, x0, tracking) {
  const i = sw / 2;
  let x = x0;
  const parts = [];
  for (const ch of text) {
    if (ch === ' ') { x += 8 - tracking; continue; }
    const g = glyphs[ch](i);
    parts.push(g.d.replace(/([MHLVAZ])([^MHLVAZ]*)/g, (m, cmd, args) => {
      if (!args.trim()) return cmd;
      const nums = args.trim().split(/[\s,]+/).map(Number);
      const shift = (k, isY) => isY ? nums[k] : n(nums[k] + x);
      switch (cmd) {
        case 'M': case 'L': return cmd + shift(0) + ' ' + nums[1];
        case 'H': return cmd + shift(0);
        case 'V': return cmd + nums[0];
        case 'A': return `A${nums[0]} ${nums[1]} ${nums[2]} ${nums[3]} ${nums[4]} ${shift(5)} ${nums[6]}`;
      }
    }));
    x += g.w + tracking;
  }
  return { d: parts.join(''), end: x - tracking };
}

// Mark "Route node": a duct run and a pipe run turning together, with a node at the junction.
const mark = (c) =>
  `<path d="M4 28H26V4" fill="none" stroke="${c}" stroke-width="6"/>` +
  `<path d="M4 40H38V4" fill="none" stroke="${c}" stroke-width="3"/>` +
  `<circle cx="26" cy="28" r="6.5" fill="${c}"/>`;

// Heavier geometry for small sizes (favicon), so the thin pipe survives 16 px.
const markBold = (c) =>
  `<path d="M4 27H25V4" fill="none" stroke="${c}" stroke-width="7"/>` +
  `<path d="M4 40H38V4" fill="none" stroke="${c}" stroke-width="4.5"/>` +
  `<circle cx="25" cy="27" r="7.5" fill="${c}"/>`;

const top = word('TOP NOTCH', 3.6, 54, 3.6);
const bim = word('BIM', 2, top.end + 10, 3.4);
const W = Math.ceil(bim.end + 1);

const wordmark = (cTop, cBim) =>
  `<g transform="translate(0 14)" fill="none" stroke-linejoin="miter">` +
  `<path d="${top.d}" stroke="${cTop}" stroke-width="3.6"/>` +
  `<path d="${bim.d}" stroke="${cBim}" stroke-width="2"/></g>`;

const svg = (vb, body, label = 'Top Notch BIM') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${label}">${body}</svg>\n`;

const files = {
  'logo.svg': svg(`0 0 ${W} 48`, mark(PRIMARY) + wordmark(HEADING, TEXT)),
  'logo-on-dark.svg': svg(`0 0 ${W} 48`, mark(PRIMARY) + wordmark('#ffffff', '#c8ccd2')),
  'logo-mono.svg': svg(`0 0 ${W} 48`, mark(INK) + wordmark(INK, INK)),
  'logo-mono-white.svg': svg(`0 0 ${W} 48`, mark('#ffffff') + wordmark('#ffffff', '#ffffff')),
  'mark.svg': svg('0 0 48 48', mark(PRIMARY)),
  'mark-mono.svg': svg('0 0 48 48', mark(INK)),
  'favicon.svg': svg('0 0 48 48', `<rect width="48" height="48" rx="10" fill="${INK}"/><g transform="translate(6.7 6.7) scale(.72)">${markBold(PRIMARY)}</g>`),
};
for (const [name, content] of Object.entries(files)) writeFileSync(join(OUT, name), content);

// Inline snippet for the page: mark uses --tn-logo-mark, wordmark follows currentColor.
const inline = `<svg class="tn-logo" viewBox="0 0 ${W} 48" role="img" aria-label="Top Notch BIM">` +
  mark('var(--tn-logo-mark)').replaceAll('stroke="var(--tn-logo-mark)"', 'style="stroke:var(--tn-logo-mark)"').replaceAll('fill="var(--tn-logo-mark)"', 'style="fill:var(--tn-logo-mark)"') +
  wordmark('currentColor', 'currentColor') + `</svg>`;
writeFileSync(join(OUT, 'inline-snippet.txt'), inline + '\n');
console.log('width', W, '\n' + Object.keys(files).join('\n'));
