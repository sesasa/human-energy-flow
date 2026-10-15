import { foodById, type Meal } from '../model/diet';

// Illustrated meal plates: inline SVG (viewBox 0 0 320 240) drawn from the actual portions of a meal.
// Each food is drawn around the origin at "unit" size (roughly ±30 × ±22) and scaled into a planned slot.

interface Item { id: string; name: string; visual: string; grams: number }
type Url = (id: string) => string;
type Draw = (u: Url, R: () => number, it: Item) => string;
type Slot = [number, number, number];

let plateCounter = 0;
// Typical single-serving mass per visual; drawn area grows with grams / typical.
const TYPICAL: Record<string, number> = {
 chicken: 120, steak: 150, fish: 140, egg: 50, bread: 40, rice: 250, potato: 300, pasta: 250, oats: 80, lentils: 150,
 broccoli: 120, carrot: 120, leaves: 80, tomato: 120, apple: 180, banana: 120, orange: 150, nuts: 25, cheese: 30,
 cake: 80, chocolate: 25, milk: 250, yogurt: 200, oil: 10, salt: 1,
 bun: 80, burger: 100, fries: 150, pizza: 300, 'fried-chicken': 180, sausage: 75, cola: 330, tea: 300,
};
const BIG = new Set(['chicken', 'steak', 'fish', 'egg', 'bread', 'rice', 'potato', 'pasta', 'oats', 'lentils', 'cake',
 'bun', 'burger', 'fries', 'pizza', 'fried-chicken', 'sausage']);
const COUNTED: Record<string, number> = { egg: 50, bread: 40 };
// Drinks and pots are drawn beside the plate, never on it.
const SIDE_KINDS = ['milk', 'yogurt', 'cola', 'tea'];
const OFF_PLATE = [...SIDE_KINDS, 'oil', 'salt'];
const LIQUID = new Set(['cola', 'tea']);
const BUN_G = 80;
// Slot plans (x, y, radius) inside the plate well (rx 86, ry 62), largest slots first.
const LAYOUTS: Slot[][] = [
 [[0, 0, 56]],
 [[-34, 0, 42], [40, 2, 36]],
 [[-34, -12, 40], [40, -14, 34], [2, 34, 32]],
 [[-36, -16, 38], [38, -18, 34], [-28, 32, 30], [36, 30, 28]],
 [[-40, -10, 36], [28, -26, 30], [-14, 38, 24], [30, 30, 24], [66, 0, 18]],
 [[-40, -12, 34], [26, -28, 28], [-12, 36, 24], [32, 28, 24], [66, -2, 18], [-58, 34, 16]],
 [[-40, -12, 34], [26, -28, 28], [-12, 36, 24], [32, 28, 24], [66, -2, 18], [-58, 34, 16], [0, 4, 14]],
];
// [id, kind, stops]: l = vertical, d = diagonal, r = highlighted radial, c = centred radial; "colour:opacity".
const GRADS: [string, string, string][] = [
 ['bg', 'c', '#5a7462 #3a4d40 #27352c'], ['plate', 'r', '#fffbf3 #f5ebd8 #dccbab'], ['well', 'c', '#fbf5ea #f3e9d6 #e6d7bb'],
 ['shadow', 'c', '#1a2219:.5 #1a2219:0'], ['chicken', 'l', '#f6cf8c #dfa159 #b97a3c'], ['steak', 'd', '#9a4630 #6a2a1a #4e1d12'],
 ['salmon', 'l', '#ffb08a #f2875c #dd6a40'], ['mackerel', 'l', '#cfd8dc #8c9aa2 #5f6d75'], ['yolk', 'r', '#ffe27a #f7b52a #e9961a'],
 ['white', 'r', '#ffffff #f2ede2'], ['rice', 'r', '#ffffff #f4efe4 #ddd3bf'], ['brice', 'r', '#f1e3c4 #d9c296 #bfa473'],
 ['potato', 'l', '#f9d98a #e6b25a #c98f3c'], ['bread', 'r', '#f5e2b8 #e3c38c #cfa66a'], ['oats', 'r', '#f1dfb8 #dcc08c #c4a26e'],
 ['lentil', 'r', '#a3845a #7d6440 #5f4b30'], ['green', 'r', '#7dbb55 #3f7f32 #295a24'], ['leaf', 'd', '#5c9c45 #336b30 #1f4a22'],
 ['carrot', 'r', '#ffbe6e #f5862c #df6a16'], ['tomato', 'r', '#ff7d68 #e23a2c #b7241c'], ['apple', 'r', '#ff8a72 #d93a32 #a3221f'],
 ['orange', 'r', '#ffc766 #f99a24 #e57d0e'], ['banana', 'r', '#fffbe0 #f6e8ad #ead48a'], ['nut', 'l', '#cf9660 #a66a35 #7d4a22'],
 ['choc', 'd', '#7a4428 #4f2816 #33190d'], ['sponge', 'l', '#dc9452 #b56a32 #94522a'], ['icing', 'l', '#fffdf6 #f1e7d4'],
 ['milk', 'l', '#ffffff #f3efe6 #e3ddd0'], ['glass', 'd', '#ffffff:.38 #ffffff:.08 #ffffff:.28'], ['yog', 'r', '#ffffff #f6f1e8 #e7dfd1'],
 ['pasta', 'r', '#d9ad70 #bf8f52'],
 ['bun', 'r', '#f7cf8a #e0a352 #b8722c'], ['crumb', 'l', '#fff3d9 #f1d9a8'], ['patty', 'd', '#8a4a2c #5c2c18 #3a1a0e'],
 ['cheddar', 'l', '#ffd866 #f7b52a #e69a1a'], ['fries', 'l', '#fff0a8 #f7cd5a #e2a434'], ['crust', 'r', '#f3cd8a #dca050 #bb7a34'],
 ['sauce', 'r', '#f0603e #cf3a24 #a8281a'], ['mozz', 'r', '#fffbe6 #fde9b0 #f2cf78'], ['batter', 'r', '#f5c070 #d08a34 #9c5a1c'],
 ['sausage', 'l', '#cf8058 #9e4c2c #6a2c14'], ['cola', 'l', '#6a3416 #3c1a0a #1e0a04'], ['tea', 'l', '#d88a3a #a85a1c #74360c'],
];

const n = (v: number) => Math.round(v * 100) / 100;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as Record<string, string>)[c]);
const map = <T>(xs: T[], fn: (x: T, i: number) => string) => xs.map(fn).join('');
const at = (x: number, y: number, a: number, body: string) => `<g transform="translate(${x} ${y}) rotate(${a})">${body}</g>`;
// Deterministic pseudo-random sequence so a given meal always renders identically.
function rng(text: string): () => number {
 let s = 7;
 for (const ch of text) s = (s * 31 + ch.charCodeAt(0)) % 2147483647;
 s = s || 1;
 return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
function scatter(R: () => number, count: number, rx: number, ry: number, fn: (x: number, y: number, i: number) => string): string {
 return Array.from({ length: count }, (_, i) => {
  const a = R() * Math.PI * 2, d = Math.sqrt(R());
  return fn(n(Math.cos(a) * d * rx), n(Math.sin(a) * d * ry), i);
 }).join('');
}
function defs(p: string): string {
 return `<defs>${map(GRADS, ([id, kind, stops]) => {
  const st = map(stops.split(' '), (s, i) => {
   const [c, o = '1'] = s.split(':'), all = stops.split(' ').length;
   return `<stop offset="${n(i / (all - 1))}" stop-color="${c}" stop-opacity="${o}"/>`;
  });
  if (kind === 'l') return `<linearGradient id="${p}-${id}" x1="0" y1="0" x2="0" y2="1">${st}</linearGradient>`;
  if (kind === 'd') return `<linearGradient id="${p}-${id}" x1="0" y1="0" x2="1" y2="1">${st}</linearGradient>`;
  const pos = kind === 'r' ? 'cx=".38" cy=".32" r=".78"' : 'cx=".5" cy=".5" r=".5"';
  return `<radialGradient id="${p}-${id}" ${pos}>${st}</radialGradient>`;
 })}</defs>`;
}

const SLICE = 'M-14,13L-14,-3C-19,-5 -19,-15 -10,-16C-4,-19 4,-19 10,-16C19,-15 19,-5 14,-3L14,13Z';
const EGGS: [number, number][][] = [[[0, 0]], [[-13, -1], [13, 1]], [[-13, -6], [13, -5], [0, 9]], [[-13, -8], [13, -8], [-13, 9], [13, 9]]];
const countOf = (it: Item) => Math.max(1, Math.round(it.grams / (COUNTED[it.visual] ?? 1)));
const tag = (count: number, shown: number) => count > shown
 ? `<text y="34" text-anchor="middle" font-family="system-ui,sans-serif" font-size="9" font-weight="600" fill="#6b5536" opacity=".75">×${count}</text>` : '';
const mound = (fill: string, rx = 29, ry = 20) =>
 `<ellipse cy="2" rx="${rx}" ry="${ry}" fill="${fill}"/><ellipse cx="-6" cy="-5" rx="${n(rx * .55)}" ry="${n(ry * .35)}" fill="#fff" opacity=".18"/>`;
const oatsBed = (u: Url, R: () => number, rx: number, ry: number, count: number) => mound(u('oats'), rx, ry)
 + scatter(R, count, rx * .88, ry * .82, (x, y) => `<ellipse cx="${x}" cy="${y}" rx="2.8" ry="1.9" transform="rotate(${Math.round(R() * 180)} ${x} ${y})" fill="#f6e6c3" stroke="#c2a06a" stroke-width=".4"/>`);
// Irregular closed outline (melted cheese, batter): k jittered points joined by quadratic bulges.
function blob(R: () => number, rx: number, ry: number, k: number, out: number, jit: number): string {
 const pts = Array.from({ length: k }, (_, i) => {
  const a = i / k * Math.PI * 2, j = 1 - jit / 2 + R() * jit;
  return [Math.cos(a) * rx * j, Math.sin(a) * ry * j];
 });
 const mid = (i: number) => { const [a, b] = pts[i % k], [c, d] = pts[(i + 1) % k]; return `${n((a + c) / 2)},${n((b + d) / 2)}`; };
 return `M${mid(k - 1)}` + map(pts, ([x, y], i) => `Q${n(x * out)},${n(y * out)} ${mid(i)}`) + 'Z';
}
// Side-view burger layers, baseline at y = 0, growing upwards.
const HEEL = (u: Url) => `<path d="M-29,-8C-30,-2 -27,2 -20,2H20C27,2 30,-2 29,-8Z" fill="${u('bun')}" stroke="#9a5a1e" stroke-width=".8"/>`
 + `<ellipse cy="-8" rx="29" ry="3.6" fill="${u('crumb')}" stroke="#d9b47a" stroke-width=".6"/>`;
const CROWN = (u: Url) => `<path d="M-30,0C-31,-13 -18,-24 0,-24C18,-24 31,-13 30,0C20,3 -20,3 -30,0Z" fill="${u('bun')}" stroke="#9a5a1e" stroke-width=".8"/>`
 + '<path d="M-28,-.5C-18,2 18,2 28,-.5" stroke="#f6e1b4" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".85"/>'
 + '<ellipse cx="-9" cy="-15" rx="12" ry="4.5" transform="rotate(-14 -9 -15)" fill="#fff" opacity=".3"/>'
 + map([[-14, -8], [-4, -19], [8, -16], [17, -9], [2, -10], [-20, -4]], ([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.3" ry=".7" fill="#fff6e4" opacity=".7"/>`);
const PATTY = (u: Url, R: () => number) => `<path d="M-31,-8C-33,-3 -31,1 -25,1.5C-10,3 10,3 25,1.5C31,1 33,-3 31,-8C20,-12.5 -20,-12.5 -31,-8Z" fill="${u('patty')}" stroke="#2e140a" stroke-width=".8"/>`
 + '<path d="M-28,-8.5C-16,-11.5 16,-11.5 28,-8.5" stroke="#a5603a" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/>'
 + `<g transform="translate(0 -4)">${scatter(R, 16, 26, 3, (x, y, i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? .9 : .6}" fill="${i % 2 ? '#2a1008' : '#a8643c'}" opacity=".7"/>`)}</g>`;
const SLICE_MELT = (u: Url) => `<path d="M-31,-2.5L31,-2.5L30,1.5L25,2L23,8Q21.5,10 20,8L18,2L-10,2.5L-13,6.5Q-14.5,8.5 -16,6.5L-18,2.5L-30,1.5Z" fill="${u('cheddar')}" stroke="#d48a12" stroke-width=".6" stroke-linejoin="round"/>`
 + '<path d="M-28,-1.5H28" stroke="#ffe9a8" stroke-width="1" opacity=".7"/>';
const BONE = '<rect x="9" y="-2.2" width="13" height="4.4" rx="2" fill="#f1e4c8" stroke="#c4ae86" stroke-width=".5"/>'
 + map([-2.6, 2.6], y => `<circle cx="22" cy="${y}" r="2.8" fill="#f5ead3" stroke="#c4ae86" stroke-width=".5"/>`);

const DRAW: Record<string, Draw> = {
 chicken: u => map([0, 1, 2, 3], i => at(-15 + i * 10, -3 + i * 2, -58,
  `<rect x="-21" y="-7" width="42" height="14" rx="7" fill="${u('chicken')}" stroke="#a8692f" stroke-width=".8"/><path d="M-16,-2H16" stroke="#fde6bd" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>`
  + map([-12, -3, 6, 15], x => `<path d="M${x},-6l-4,12" stroke="#6b3d17" stroke-width="2" stroke-linecap="round" opacity=".55"/>`))),
 steak: u => `<path d="M-30,-2C-30,-16 -10,-22 8,-20C24,-19 32,-8 29,4C26,16 8,21 -8,19C-22,17 -30,10 -30,-2Z" fill="${u('steak')}" stroke="#ead6b4" stroke-width="3.5"/>`
  + map([-16, -5, 6, 17], x => `<path d="M${x - 6},-12l11,22" stroke="#2a0f08" stroke-width="2.6" stroke-linecap="round" opacity=".5"/>`)
  + '<ellipse cx="-6" cy="-10" rx="13" ry="4" fill="#fff" opacity=".12"/>',
 fish: (u, _R, it) => {
  const mk = it.id === 'mackerel';
  return `<path d="M-30,4C-30,-10 -14,-18 6,-17C22,-16 31,-8 30,2C29,12 16,17 0,16C-18,15 -30,14 -30,4Z" fill="${u(mk ? 'mackerel' : 'salmon')}" stroke="${mk ? '#46525a' : '#c95a35'}" stroke-width="1.2"/>`
   + (mk ? map([-18, -8, 2, 12], x => `<path d="M${x},-11q5,4 1,10" stroke="#27323a" stroke-width="2" fill="none" stroke-linecap="round"/>`)
     + '<path d="M-24,7Q0,13 26,3" stroke="#eef3f5" stroke-width="2" fill="none" opacity=".5"/>'
    : map([-18, -8, 2, 12], x => `<path d="M${x},-12q5,12 -1,24" stroke="#ffe3d2" stroke-width="1.6" fill="none" opacity=".75"/>`)
     + '<path d="M-26,0C-18,-12 10,-16 26,-6" stroke="#b5532c" stroke-width="3" fill="none" opacity=".3" stroke-linecap="round"/>');
 },
 egg: (u, _R, it) => {
  const c = countOf(it);
  return map(EGGS[Math.min(c, 4) - 1], ([x, y]) => `<g transform="translate(${x} ${y})"><ellipse rx="13" ry="9.5" fill="${u('white')}" stroke="#d6ccb9" stroke-width=".8"/><circle cx="1" cy=".5" r="6" fill="${u('yolk')}"/><ellipse cx="-5" cy="-4.5" rx="4" ry="1.5" fill="#fff" opacity=".85"/></g>`) + tag(c, 4);
 },
 bread: (u, _R, it) => {
  const c = countOf(it), s = Math.min(c, 4);
  return map(Array.from({ length: s }, (_, i) => i - (s - 1) / 2), (o, i) => at(n(o * 8), n(o * -3), -10 + i * 6,
   `<path d="${SLICE}" transform="scale(1 .86)" fill="${u('bread')}" stroke="#8a5a2b" stroke-width="2.6" stroke-linejoin="round"/>`
   + map([[-6, -6], [5, -3], [-3, 5], [7, 6]], ([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.4" ry=".8" fill="#a77a45"/>`))) + tag(c, 4);
 },
 rice: (u, R, it) => {
  const br = it.id === 'brown-rice';
  return mound(u(br ? 'brice' : 'rice')) + scatter(R, 48, 25, 16, (x, y) => `<ellipse cx="${x}" cy="${y}" rx="2.6" ry="1.1" transform="rotate(${Math.round(R() * 180)} ${x} ${y})" fill="${br ? '#ecdcb6' : '#fffefa'}" stroke="${br ? '#b39a6a' : '#d9d0bf'}" stroke-width=".4"/>`);
 },
 lentils: (u, R) => mound(u('lentil'), 28, 19)
  + scatter(R, 64, 25, 15, (x, y, i) => `<ellipse cx="${x}" cy="${y}" rx="1.9" ry="1.5" fill="${['#8c6b3f', '#6f5631', '#a58552', '#5f6b3a'][i % 4]}"/>`),
 oats: (u, R) => oatsBed(u, R, 29, 20, 30),
 potato: u => map([[-15, -9, -18], [10, -12, 12], [-17, 8, 8], [4, 6, -12], [20, 3, 35]], ([x, y, a]) => at(x, y, a,
  `<path d="M-13,3Q-12,-8 0,-9Q12,-8 13,3Q0,7 -13,3Z" fill="${u('potato')}"/><path d="M-13,3Q-12,-8 0,-9Q12,-8 13,3" fill="none" stroke="#8a5a24" stroke-width="2.4" stroke-linecap="round"/><path d="M-8,0Q0,-4 8,0" stroke="#fff3cf" stroke-width="1.4" fill="none" opacity=".55"/>`)),
 pasta: (u, R) => `<ellipse cy="2" rx="28" ry="19" fill="${u('pasta')}"/>` + scatter(R, 18, 16, 9, (x, y, i) => {
  const rx = n(7 + R() * 7), ry = n(4 + R() * 4);
  return `<path d="M${n(x - rx)},${y}A${rx} ${ry} 0 0 ${i % 2} ${n(x + rx)},${y}" fill="none" stroke="${['#e2b878', '#c4955a', '#f0cf98'][i % 3]}" stroke-width="2.2" stroke-linecap="round"/>`;
 }),
 broccoli: u => map([[-12, -3], [11, -7], [1, 8]], ([x, y]) => `<g transform="translate(${x} ${y})"><path d="M-3.5,13L-2.5,2H2.5L3.5,13Z" fill="#a8cf79" stroke="#6f9a46" stroke-width=".6"/>`
  + map([[-6, -2, 6], [6, -2, 6], [0, -7, 6.5], [0, 0, 6]], ([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${u('green')}" stroke="#285222" stroke-width=".6"/>`)
  + map([[-5, -4], [1, -9], [5, -3], [-1, -1]], ([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="1.3" fill="#a6d673" opacity=".55"/>`) + '</g>'),
 leaves: u => map([[-14, -6, -25], [6, -10, 20], [16, 2, -10], [-6, 6, 35], [-18, 8, 5], [6, 10, -40]], ([x, y, a]) => at(x, y, a,
  `<path d="M-15,0C-8,-10 8,-10 15,0C8,10 -8,10 -15,0Z" fill="${u('leaf')}" stroke="#1c3d1e" stroke-width=".7"/><path d="M-13,0H12M-4,0l-4,-4M3,0l4,-4M-4,0l-4,4M3,0l4,4" stroke="#86b46f" stroke-width=".8" fill="none" opacity=".65"/>`)),
 carrot: u => map([[-14, -8], [1, -11], [15, -6], [-18, 5], [-3, 3], [12, 7], [0, 14]], ([x, y]) =>
  `<g transform="translate(${x} ${y})"><ellipse cy="1.8" rx="7.6" ry="6" fill="#c4560f"/><ellipse rx="7.6" ry="6" fill="${u('carrot')}"/><ellipse rx="3.4" ry="2.6" fill="#ffc98a" opacity=".7"/></g>`),
 tomato: u => map([[-12, -6], [8, -8], [-5, 8], [14, 7]], ([x, y]) => `<g transform="translate(${x} ${y}) scale(1 .8)"><circle r="10.5" fill="${u('tomato')}" stroke="#9e1d16"/><circle r="7.4" fill="#ff8f78" opacity=".55"/>`
  + map([0, 120, 240], a => `<ellipse cy="-4.2" rx="2.3" ry="3.2" transform="rotate(${a})" fill="#f7d774" opacity=".85"/>`) + '<circle r="1.8" fill="#ffc2b0"/></g>'),
 apple: u => `<g transform="translate(-6 -2)"><path d="M0,-12C-6,-17 -18,-14 -18,-1C-18,12 -8,18 0,15C8,18 18,12 18,-1C18,-14 6,-17 0,-12Z" fill="${u('apple')}" stroke="#8c1f1f"/>`
  + '<path d="M0,-12q1,-5 3,-8" stroke="#5a3a1a" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M2,-16q8,-6 12,-1q-7,4 -12,1Z" fill="#5f9a3a"/><ellipse cx="-8" cy="-5" rx="4" ry="6" fill="#fff" opacity=".25"/></g>'
  + at(18, 10, 18, '<path d="M-11,1A11,8 0 0 1 11,1Q0,4 -11,1Z" fill="#fbeec8" stroke="#b52a2a" stroke-width="2"/><circle cy="-2.5" r="1" fill="#5a3a1a"/>'),
 banana: u => map([[-14, -6], [-2, -9], [10, -5], [-8, 5], [4, 4], [16, 6], [-2, 14]], ([x, y]) => `<g transform="translate(${x} ${y})"><ellipse cy="1.4" rx="7" ry="5.6" fill="#d9c07a"/><ellipse rx="7" ry="5.6" fill="${u('banana')}"/><ellipse rx="2.4" ry="1.9" fill="none" stroke="#c8ad66" stroke-width=".7"/>`
  + map([0, 120, 240], a => `<circle cy="-1" r=".5" transform="rotate(${a})" fill="#8a7440"/>`) + '</g>'),
 orange: u => map([[-14, 0, -60], [-6, -8, -25], [6, -8, 15], [14, 0, 55], [0, 8, 180]], ([x, y, a]) => at(x, y, a,
  `<path d="M-12,3Q0,-14 12,3Q0,-2 -12,3Z" fill="${u('orange')}" stroke="#d9730d" stroke-width=".9"/><path d="M-7,-2Q0,-8 7,-2" stroke="#ffe0a8" stroke-width="1" fill="none" opacity=".7"/>`)),
 nuts: (u, R, it) => it.id === 'walnuts'
  ? scatter(R, 7, 16, 11, (x, y) => at(x, y, Math.round(R() * 360), '<path d="M-6,-4C-6,-8 6,-8 6,-4C8,0 6,6 0,6C-6,6 -8,0 -6,-4Z" fill="#c9995c" stroke="#7a5228" stroke-width=".7"/><path d="M0,-6V6M-4,-2q2,2 0,4M4,-2q-2,2 0,4" stroke="#8a5d2e" stroke-width=".8" fill="none"/>'))
  : scatter(R, 9, 17, 11, (x, y) => at(x, y, Math.round(R() * 360), `<path d="M0,-7.5C4.5,-5 4.5,4 0,7.5C-4.5,4 -4.5,-5 0,-7.5Z" fill="${u('nut')}" stroke="#6e3f1c" stroke-width=".6"/><path d="M-1,-4Q1,0 -1,4" stroke="#e0b07a" stroke-width=".8" fill="none" opacity=".6"/>`)),
 cheese: () => map([[-10, -4], [6, -7], [-2, 6], [13, 4]], ([x, y]) => `<g transform="translate(${x} ${y}) scale(1.3)"><path d="M0,-6L7,-3L0,0L-7,-3Z" fill="#ffe08a"/><path d="M-7,-3L0,0L0,7L-7,4Z" fill="#f5b83d"/><path d="M0,0L7,-3L7,4L0,7Z" fill="#dd9420"/></g>`),
 chocolate: u => `<g transform="rotate(-12)">${map([[-14, -12], [1, -12], [-14, 1], [1, 1]], ([x, y]) => `<rect x="${x}" y="${y}" width="13" height="11" rx="1.6" fill="${u('choc')}" stroke="#24110a" stroke-width=".7"/><rect x="${x + 2}" y="${y + 2}" width="9" height="7" rx="1" fill="none" stroke="#9a6440" stroke-width=".8" opacity=".6"/>`)}</g>`,
 cake: u => `<g transform="translate(0 -3)"><path d="M-24,2L22,4L22,18L-24,16Z" fill="${u('sponge')}" stroke="#7a4420" stroke-width=".7"/><path d="M-24,9L22,11" stroke="#fff4e2" stroke-width="2.6"/>`
  + map([[-16, 13], [-6, 6], [6, 14], [14, 7]], ([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="#f08a2c"/>`)
  + `<path d="M-24,2L20,-12L22,4Z" fill="${u('icing')}" stroke="#d9cbb0" stroke-width=".7"/><path d="M-24,2L22,4L22,6.5L-24,4.5Z" fill="#fffaf0"/><ellipse cx="8" cy="-3" rx="3.5" ry="2.4" fill="#b07a45"/></g>`,
 // A whole soft roll, its split showing as a pale crumb line.
 bun: u => `<g transform="translate(0 13)">${HEEL(u)}</g><g transform="translate(0 5)">${CROWN(u)}</g>`,
 // A patty on its own: seared top seen from above with its thick side band.
 burger: (u, R) => `<path d="M-28,-3V3C-28,12 28,12 28,3V-3Z" fill="#3e1c10"/><ellipse cy="-3" rx="28" ry="15" fill="${u('patty')}" stroke="#2e140a" stroke-width=".8"/>`
  + `<g transform="translate(0 -3)">${scatter(R, 30, 24, 12, (x, y, i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? .8 : 1.2}" fill="${i % 3 ? '#a8643c' : '#2a1008'}" opacity=".65"/>`)}</g>`
  + '<ellipse cx="-8" cy="-9" rx="12" ry="4" fill="#fff" opacity=".12"/>',
 fries: (u, R) => map([[13, 22, 13], [10, 15, 9], [7, 9, 5]], ([count, rx, ry], layer) => scatter(R, count, rx, ry, (x, y) => {
  const l = n(9 + R() * 4);
  return at(x, n(y - layer * 3), Math.round(R() * 140 - 70), `<rect x="${-l}" y="-2.2" width="${n(l * 2)}" height="4.4" rx="1.2" fill="${u('fries')}" stroke="#c4862a" stroke-width=".5"/>`
   + `<path d="M${n(2 - l)},-1H${n(l - 3)}" stroke="#fff3c4" stroke-width=".8" opacity=".6"/><path d="M${n(l - .6)},-2v4.4" stroke="#b9772a" stroke-width="1.2"/>`);
 })),
 // Whole cheese & tomato pizza, cut into eight slices.
 pizza: (u, R) => `<ellipse cy="1.5" rx="38" ry="27" fill="#a8692c"/><ellipse rx="38" ry="27" fill="${u('crust')}" stroke="#9a5f24" stroke-width=".8"/>`
  + `<ellipse rx="35.5" ry="25" fill="none" stroke="#f6d49a" stroke-width="1.2" opacity=".55"/><ellipse cy=".5" rx="32" ry="22.5" fill="${u('sauce')}"/>`
  + `<path d="${blob(R, 29, 20, 18, 1.05, .14)}" fill="${u('mozz')}"/>`
  + scatter(R, 9, 22, 14, (x, y) => `<ellipse cx="${x}" cy="${y}" rx="${n(1.6 + R() * 1.6)}" ry="${n(1.2 + R())}" fill="#d9452e" opacity=".75"/>`)
  + scatter(R, 10, 24, 16, (x, y) => `<ellipse cx="${x}" cy="${y}" rx="${n(1.5 + R() * 2)}" ry="${n(1 + R())}" fill="#d99a4a" opacity=".45"/>`)
  + map([0, 45, 90, 135], a => {
   const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180);
   return `<path d="M${n(-35.5 * c)},${n(-25 * s)}L${n(35.5 * c)},${n(25 * s)}" stroke="#8a5420" stroke-width=".9" opacity=".4"/>`;
  }) + '<ellipse cx="-12" cy="-10" rx="12" ry="4" fill="#fff" opacity=".18"/>',
 // Two battered drumsticks and a thigh piece with craggy coating.
 'fried-chicken': (u, R) => {
  const piece = (rx: number, ry: number) => `<path d="${blob(R, rx, ry, 15, 1.13, .16)}" fill="${u('batter')}" stroke="#7d4210" stroke-width=".8"/>`
   + scatter(R, 14, rx * .75, ry * .7, (x, y, i) => `<circle cx="${x}" cy="${y}" r="${n(.8 + R() * 1.1)}" fill="${i % 3 ? '#f6c46e' : '#8a4a14'}" opacity=".7"/>`)
   + `<ellipse cx="${n(-rx * .3)}" cy="${n(-ry * .4)}" rx="${n(rx * .4)}" ry="${n(ry * .22)}" fill="#fff" opacity=".2"/>`;
  const drum = () => BONE + `<g transform="translate(-4 0)">${piece(14, 9.5)}</g>`;
  return at(-10, -7, 200, drum()) + at(-6, 9, 160, drum()) + at(14, 0, 10, piece(14, 12));
 },
 // Two grilled sausages with twisted ends and grill marks.
 sausage: u => map([[-2, -7, -6], [2, 7, 5]], ([x, y, a]) => at(x, y, a,
  `<path d="M-26,-1C-24,-7 -12,-8 0,-7.5S24,-7 26,-2C27,3 24,6 20,5.5C8,4 -8,4 -20,6C-25,6.5 -27,3 -26,-1Z" fill="${u('sausage')}" stroke="#5a2410" stroke-width=".8"/>`
  + '<path d="M-26,-1l-2.5,-.8M26.4,0l2.5,.8" stroke="#6e3018" stroke-width="2" stroke-linecap="round"/>'
  + map([-15, -5, 5, 15], x => `<path d="M${x - 2},-5l4,9" stroke="#3a1608" stroke-width="2" stroke-linecap="round" opacity=".45"/>`)
  + '<path d="M-19,-4C-8,-5.5 8,-5.5 19,-4.5" stroke="#f0b48a" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".45"/>')),
 fallback: u => mound(u('oats')),
};

function plateVessel(u: Url): string {
 return `<ellipse cx="5" cy="14" rx="118" ry="84" fill="${u('shadow')}"/><ellipse rx="114" ry="84" fill="${u('plate')}" stroke="#cdbb98" stroke-width="1"/>`
  + `<ellipse cy="3" rx="86" ry="62" fill="${u('well')}" stroke="#d2c2a2" stroke-opacity=".7"/><path d="M-94,-25A100 73 0 0 1 -34,-69" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".75"/>`
  + '<path d="M60,62A86 62 0 0 0 84,18" stroke="#c2ae88" stroke-width="2" fill="none" opacity=".35"/>';
}
function bowlVessel(u: Url, R: () => number, oats: Item): string {
 const k = clamp(Math.sqrt(oats.grams / 150) * .98, .08, .98);
 return `<ellipse cx="5" cy="84" rx="84" ry="16" fill="${u('shadow')}"/><path d="M-108,-8C-106,52 -56,86 0,86C56,86 106,52 108,-8Z" fill="${u('plate')}" stroke="#cdbb98"/>`
  + '<path d="M-92,28C-74,60 -42,74 -12,78" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".35"/>'
  + `<ellipse cy="-8" rx="108" ry="70" fill="#f8f0e1" stroke="#d4c3a3"/><ellipse cy="-6" rx="98" ry="62" fill="${u('well')}"/>`
  + `<g transform="translate(0 ${n(-6 + (1 - k) * 14)})">${oatsBed(u, R, n(86 * k), n(55 * k), Math.round(90 * k))}</g>`;
}
function milkGlass(u: Url, g: number): string {
 const s = clamp(Math.sqrt(g / 250), .75, 1.2), fill = clamp(g / (320 * s * s), .15, .92), yt = n(32 - 64 * fill), w = n(13 + 3 * (34 - yt) / 68);
 return `<g transform="scale(${n(s)})"><ellipse cy="36" rx="20" ry="5" fill="${u('shadow')}"/><path d="M${-w},${yt}L-13,32Q0,36 13,32L${w},${yt}Z" fill="${u('milk')}"/><ellipse cy="${yt}" rx="${w}" ry="3.5" fill="#fff" stroke="#e6e0d4" stroke-width=".6"/>`
  + `<path d="M-16,-34L-13,32Q0,36 13,32L16,-34" fill="${u('glass')}" stroke="#fff" stroke-opacity=".6"/><ellipse cy="-34" rx="16" ry="4" fill="none" stroke="#fff" stroke-opacity=".7"/><path d="M-11,-28L-9,26" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".4"/></g>`;
}
function yogurtBowl(u: Url, g: number): string {
 const s = clamp(Math.sqrt(g / 200), .75, 1.1);
 return `<g transform="scale(${n(s)})"><ellipse cy="24" rx="34" ry="7" fill="${u('shadow')}"/><path d="M-30,0C-30,18 -14,26 0,26C14,26 30,18 30,0Z" fill="${u('plate')}" stroke="#cbbb9c"/>`
  + `<ellipse rx="30" ry="10" fill="#efe4cf" stroke="#d8c9ab"/><ellipse cy="1" rx="26" ry="8" fill="${u('yog')}"/><path d="M-12,1q6,-5 12,0t12,0" stroke="#e3d9c8" stroke-width="1.6" fill="none"/><ellipse cx="-9" cy="-1" rx="6" ry="2" fill="#fff" opacity=".85"/></g>`;
}
// Tumbler of cola with ice and a straw; glass size and fill level follow the volume.
function colaGlass(u: Url, g: number): string {
 const s = clamp(Math.sqrt(g / 330), .75, 1.25), fill = clamp(g / (400 * s * s), .12, .9), yt = n(32 - 64 * fill), w = n(13 + 3 * (34 - yt) / 68);
 const bubbles = map([[-7, 24, 1], [5, 18, .8], [-2, 8, 1.1], [8, 2, .7], [-9, -6, .9], [3, -14, .8], [-4, -22, .7], [9, -26, 1]], ([x, y, r]) =>
  y > yt + 4 ? `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#e8b98a" stroke-width=".5" opacity=".7"/>` : '');
 const ice = map([[-5, 3, -12], [6, 5, 18]], ([x, dy, a]) => at(x, n(yt + dy), a, '<rect x="-5" y="-5" width="10" height="10" rx="2" fill="#fff" fill-opacity=".22" stroke="#fff" stroke-opacity=".55" stroke-width=".7"/>'));
 const straw = `M3,${n(yt + 10)}L12,-46`;
 return `<g transform="scale(${n(s)})"><ellipse cy="36" rx="20" ry="5" fill="${u('shadow')}"/><path d="M${-w},${yt}L-13,32Q0,36 13,32L${w},${yt}Z" fill="${u('cola')}"/>${bubbles}`
  + `<ellipse cy="${yt}" rx="${w}" ry="3.5" fill="#5a2a12" stroke="#c48a58" stroke-width=".8" stroke-opacity=".7"/>${ice}`
  + `<path d="${straw}" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="${straw}" stroke="#e23a2c" stroke-width="3" stroke-dasharray="4 4"/>`
  + `<path d="M-16,-34L-13,32Q0,36 13,32L16,-34" fill="${u('glass')}" stroke="#fff" stroke-opacity=".6"/><ellipse cy="-34" rx="16" ry="4" fill="none" stroke="#fff" stroke-opacity=".7"/><path d="M-11,-28L-9,26" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".4"/></g>`;
}
// Glass mug of black tea with a handle and steam; size and fill level follow the volume.
function teaGlass(u: Url, g: number): string {
 const s = clamp(Math.sqrt(g / 300), .75, 1.25), fill = clamp(g / (360 * s * s), .12, .9), yt = n(30 - 58 * fill), w = n(14 + 2 * (30 - yt) / 60);
 const handle = 'M16,-20C31,-20 31,14 15,14';
 return `<g transform="scale(${n(s)})"><ellipse cy="34" rx="22" ry="5" fill="${u('shadow')}"/>`
  + `<path d="${handle}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="5" stroke-linecap="round"/><path d="${handle}" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1"/>`
  + `<path d="M${-w},${yt}L-14,30Q0,34 14,30L${w},${yt}Z" fill="${u('tea')}" opacity=".92"/><ellipse cy="${yt}" rx="${w}" ry="3.2" fill="#b5601e" stroke="#e8a35a" stroke-width=".7"/>`
  + `<ellipse cx="${n(-w * .35)}" cy="${n(yt - .6)}" rx="${n(w * .3)}" ry="1" fill="#fff" opacity=".35"/>`
  + `<path d="M-16,-30L-14,30Q0,34 14,30L16,-30" fill="${u('glass')}" stroke="#fff" stroke-opacity=".6"/><ellipse cy="-30" rx="16" ry="4" fill="none" stroke="#fff" stroke-opacity=".7"/><path d="M-11,-24L-9,24" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".4"/>`
  + '<path d="M-5,-36c-5,-6 4,-10 -1,-17M5,-37c-5,-6 4,-10 -1,-17" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".3"/></g>';
}
const SIDES: Record<string, (u: Url, g: number) => string> = { milk: milkGlass, yogurt: yogurtBowl, cola: colaGlass, tea: teaGlass };
// Assembled burger: every real food keeps its own grams-based layer scale; the bun supplies heel and crown.
function burgerStack(u: Url, [bun, patty, slice]: Item[], scaleOf: (i: Item) => number): { svg: string; base: number; width: number } {
 const sb = scaleOf(bun), sp = scaleOf(patty), sc = slice ? scaleOf(slice) : 0;
 const layers: [Item, number, number, string, boolean][] = [[bun, sb, 8, HEEL(u), true], [patty, sp, 9, PATTY(u, rng(patty.id)), true]];
 if (slice) layers.push([slice, sc, 1.5, SLICE_MELT(u), true]);
 layers.push([bun, sb, 24, CROWN(u), false]);
 const height = layers.reduce((h, [, s, rise]) => h + s * rise, 0);
 let y = height / 2, svg = '';
 for (const [it, s, rise, body, tagged] of layers) {
  const attrs = tagged ? `data-food="${it.id}" data-grams="${it.grams}" data-portion-scale="${n(s)}"` : `data-food-part="${it.id}"`;
  svg += `<g ${attrs} transform="translate(0 ${n(y)}) scale(${n(s)})">${body}</g>`;
  y -= s * rise;
 }
 return { svg, base: height / 2, width: Math.max(sb, sp, sc) };
}

export function mealPlate(meal: Meal, idPrefix?: string): string {
 const p = (idPrefix ?? `meal-plate-${++plateCounter}`).replace(/[^\w-]/g, '_');
 const u: Url = id => `url(#${p}-${id})`;
 const merged = new Map<string, number>();
 for (const f of meal.foods) if (foodById[f.foodId] && Number.isFinite(f.grams) && f.grams > 0) merged.set(f.foodId, (merged.get(f.foodId) ?? 0) + f.grams);
 const items: Item[] = [...merged].map(([id, grams]) => ({ id, grams, name: foodById[id].name, visual: foodById[id].visual }));
 const by = (v: string) => items.find(i => i.visual === v);
 const oil = by('oil'), salt = by('salt'), oats = by('oats');
 // A bun with a beef patty (plus cheese, if present) is drawn as one assembled burger.
 const patty = by('burger'), bun = by('bun'), slice = by('cheese');
 const burger = patty && bun ? [bun, patty, ...(slice ? [slice] : [])] : [];
 const weight = (i: Item) => i.grams / (TYPICAL[i.visual] ?? 100);
 // Portion area depends on mass, never on slot order or other foods on the plate.
 // Discrete pieces change count; partial pieces also change their drawn area.
 const portion = (it: Item) => {
  const pieces=COUNTED[it.visual] ? countOf(it) : 1;
  return COUNTED[it.visual] ? 1.35*Math.sqrt(weight(it)/pieces) : 1.18*Math.sqrt(weight(it));
 };
 // Main foods take the big slots; small accompaniments fill the rest; at most 7 on the plate.
 const plateable = items.filter(i => !OFF_PLATE.includes(i.visual) && i !== oats && (i === bun || !burger.includes(i)));
 const onPlate = [...plateable].sort((a, b) => Number(BIG.has(b.visual)) - Number(BIG.has(a.visual))).slice(0, 7);
 const sides = SIDE_KINDS.map(v => by(v)).filter((s): s is Item => !!s);
 const cx = sides.length ? 128 : 160, cy = oats ? 118 : 122, ps = 1;
 const slots = LAYOUTS[onPlate.length - 1] ?? [], k = oats ? .78 : 1, oy = oats ? -6 : 0;
 let shadows = '', foods = '';
 onPlate.forEach((it, i) => {
  const [sx, sy] = slots[i], x = sx * k, y = sy * k + oy;
  if (it === bun && burger.length) {
   const b = burgerStack(u, burger, portion);
   shadows += `<ellipse cx="${n(x + 2)}" cy="${n(y + b.base - 1)}" rx="${n(b.width * 31)}" ry="${n(b.width * 9)}" fill="${u('shadow')}" opacity=".45"/>`;
   foods += `<g data-food-group="${slice ? 'cheeseburger' : 'burger'}" transform="translate(${n(x)} ${n(y)})">${b.svg}</g>`;
   return;
  }
  const scale = portion(it);
  shadows += `<ellipse cx="${n(x + 2)}" cy="${n(y + scale * 12)}" rx="${n(scale * 30)}" ry="${n(scale * 12)}" fill="${u('shadow')}" opacity=".45"/>`;
  foods += `<g data-food="${it.id}" data-grams="${it.grams}" data-portion-scale="${n(scale)}" transform="translate(${n(x)} ${n(y)}) scale(${n(scale)})">${(DRAW[it.visual] ?? DRAW.fallback)(u, rng(it.id + i), it)}</g>`;
 });
 let garnish = '';
 if (oil) {
  const ko = clamp(Math.sqrt(oil.grams / 10), .5, 1.8), R = rng('oil' + oil.grams);
  garnish += `<path d="M-62,26C-40,4 -18,40 6,22S48,-4 64,14" fill="none" stroke="#e9c046" stroke-opacity=".5" stroke-width="${n(2 * ko)}" stroke-linecap="round"/>`
   + scatter(R, Math.round(2 + 2 * ko), 66, 46, (x, y) => `<ellipse cx="${x}" cy="${y}" rx="${n(3 * ko)}" ry="${n(2 * ko)}" fill="#f2cf55" opacity=".45"/><circle cx="${n(x - ko)}" cy="${n(y - ko * .6)}" r="${n(.7 * ko)}" fill="#fff" opacity=".7"/>`);
 }
 if (salt) garnish += scatter(rng('salt'), clamp(Math.round(8 * Math.sqrt(salt.grams)), 4, 28), 70, 46,
  (x, y) => `<circle cx="${x}" cy="${y}" r=".9" fill="#fff" stroke="#b9ae9c" stroke-width=".3"/>`);
 const sideYs = [[122], [76, 180], [52, 122, 192], [40, 98, 156, 214]][sides.length - 1] ?? [], sk = sides.length > 3 ? .5 : sides.length > 2 ? .72 : 1;
 const sideSvg = map(sides, (s, i) => `<g transform="translate(284 ${sideYs[i]})${sk < 1 ? ` scale(${sk})` : ''}">${SIDES[s.visual](u, s.grams)}</g>`);
 const describe = (i: Item) => `${i.name} ${n(i.grams)} g${COUNTED[i.visual] ? ` (${n(i.grams / COUNTED[i.visual])} ${i.visual === 'egg' ? 'egg' : 'slice'}${countOf(i) > 1 ? 's' : ''})` : ''}`
  + (i.visual === 'bun' ? ` (${n(i.grams / BUN_G)} bun${i.grams > BUN_G ? 's' : ''})` : '') + (LIQUID.has(i.visual) ? ` (about ${n(i.grams)} ml)` : '');
 // Burger components stay individually listed, grouped where the first one appears in the meal.
 const firstPart = items.find(i => burger.includes(i));
 const parts = items.flatMap(i => !burger.includes(i) ? [describe(i)]
  : i === firstPart ? [`${slice ? 'Cheeseburger' : 'Burger'}: ${burger.map(describe).join(' + ')}`] : []);
 const label = esc(`${meal.title || meal.name}: ${items.length ? parts.join(', ') : 'empty plate'}`);
 const overflow=Math.max(0,plateable.length-7);
 const extra=overflow?`<text x="160" y="229" text-anchor="middle" fill="#dce7cf" font-family="system-ui" font-size="10">+ ${overflow} foods in the list</text>`:'';
 const vessel = oats ? bowlVessel(u, rng('oats' + oats.grams), oats) : plateVessel(u);
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" role="img" aria-label="${label}"><title>${label}</title>${defs(p)}`
  + `<rect width="320" height="240" rx="14" fill="${u('bg')}"/>`
  + `<g transform="translate(${cx} ${cy}) scale(${ps})">${vessel}${shadows}${foods}${garnish}</g>${sideSvg}${extra}</svg>`;
}
