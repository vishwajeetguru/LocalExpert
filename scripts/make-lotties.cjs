/**
 * Generates SevaSathi's on-brand Lottie animations (ink #131313 + ember #FF4D24).
 * Why generated, not downloaded: zero network/license risk, tiny files, offline-first,
 * and every frame matches the Atelier palette. Run: node scripts/make-lotties.cjs
 * Output: assets/animations/*.json — rendered by lottie-react-native (LottieMoment).
 */
const fs = require('fs');
const path = require('path');

const EMBER = [1, 0.302, 0.141, 1];
const INK = [0.078, 0.078, 0.078, 1];
const SOFT = [0.604, 0.627, 0.651, 1];
const GOLD = [0.961, 0.62, 0.043, 1];
const WHITE = [1, 1, 1, 1];

const EI = { x: [0.667], y: [1] };
const EO = { x: [0.333], y: [0] };
const kf = (t, s) => ({ i: { ...EI }, o: { ...EO }, t, s });

let IX = 0;
const nx = () => ++IX;

function doc(nm, op, layers) {
  return { v: '5.7.4', fr: 60, ip: 0, op, w: 200, h: 200, nm, ddd: 0, assets: [], layers };
}
function layer(ind, nm, shapes, ks, ip, op) {
  IX = 0;
  return {
    ddd: 0, ind, ty: 4, nm, sr: 1,
    ks: {
      o: ks.o || { a: 0, k: 100 },
      r: ks.r || { a: 0, k: 0 },
      p: ks.p || { a: 0, k: [100, 100, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: ks.s || { a: 0, k: [100, 100, 100] },
    },
    ao: 0, shapes, ip: ip || 0, op, st: 0, bm: 0,
  };
}
function grp(items, tr) {
  const list = items.map((it) => ({ ...it, ix: nx() }));
  list.push({ ...trObj(tr), ix: nx() });
  return { ty: 'gr', nm: 'g', np: list.length, cix: 2, bm: 0, ix: 1, mn: 'ADBE Vector Group', it: list };
}
function trObj(tr) {
  tr = tr || {};
  return {
    ty: 'tr', nm: 't', np: 2, cix: 2, bm: 0, ix: 1, mn: 'ADBE Vector Transform Group',
    p: tr.p || { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] },
    s: tr.s || { a: 0, k: [100, 100] }, r: tr.r || { a: 0, k: 0 },
    o: tr.o || { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 },
  };
}
function pathItem(v, closed) {
  const n = v.length;
  const io = v.map(() => [0, 0]);
  return { ty: 'sh', nm: 'p', np: 3, cix: 2, bm: 0, ix: 1, mn: 'ADBE Vector Shape', ks: { a: 0, k: { i: io, o: io, v, c: !!closed } } };
}
function stroke(color, w) {
  return { ty: 'st', nm: 's', np: 3, cix: 2, bm: 0, ix: 1, mn: 'ADBE Vector Graphic - Stroke', c: { a: 0, k: color }, o: { a: 0, k: 100 }, w: { a: 0, k: w }, lc: 2, lj: 2, bm: 0 };
}
function fill(color, opacity) {
  return { ty: 'fl', nm: 'f', np: 4, cix: 2, bm: 0, ix: 1, mn: 'ADBE Vector Graphic - Fill', c: { a: 0, k: color }, o: { a: 0, k: opacity == null ? 100 : opacity }, r: 1, bm: 0 };
}
function ellipse(d) {
  return { ty: 'el', nm: 'e', np: 3, cix: 2, bm: 0, ix: 1, mn: 'ADBE Vector Shape - Ellipse', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [d, d] } };
}
function rect(w, h, r) {
  return { ty: 'rc', nm: 'r', np: 3, cix: 2, bm: 0, ix: 1, mn: 'ADBE Vector Shape - Rect', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [w, h] }, r: { a: 0, k: r } };
}
function trim(t0, t1) {
  return { ty: 'tm', nm: 'trim', np: 2, cix: 2, bm: 0, ix: 1, mn: 'ADBE Vector Graphic - Trim', s: { a: 0, k: 0 }, e: { a: 1, k: [kf(t0, [0]), kf(t1, [100])] }, o: { a: 0, k: 0 }, m: 1 };
}
function mulberry(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* 1 — success check: ember pop + white draw-on check + sparkles */
function successCheck() {
  const layers = [
    layer(1, 'pop', [grp([ellipse(132), fill(EMBER)], {})],
      { s: { a: 1, k: [kf(0, [0, 0, 100]), kf(16, [110, 110, 100]), kf(30, [100, 100, 100])] } }, 0, 100),
    layer(2, 'check', [grp([pathItem([[-32, 4], [-10, 26], [36, -24]], false), stroke(WHITE, 13), trim(28, 56)], {})], {}, 0, 100),
    layer(3, 'ring', [grp([ellipse(160), stroke(EMBER, 6)], {})], {
      s: { a: 1, k: [kf(36, [62, 62, 100]), kf(78, [108, 108, 100])] },
      o: { a: 1, k: [kf(36, [70]), kf(78, [0])] },
    }, 0, 100),
    layer(4, 'spark-a', [
      grp([ellipse(12), fill(GOLD)], { p: { a: 0, k: [-72, -64] } }),
      grp([ellipse(10), fill(EMBER)], { p: { a: 0, k: [74, -58] } }),
    ], { o: { a: 1, k: [kf(52, [0]), kf(64, [100]), kf(82, [100]), kf(96, [0])] } }, 0, 100),
    layer(5, 'spark-b', [
      grp([ellipse(10), fill(SOFT)], { p: { a: 0, k: [-78, 52] } }),
      grp([ellipse(12), fill(GOLD)], { p: { a: 0, k: [70, 62] } }),
    ], { o: { a: 1, k: [kf(58, [0]), kf(70, [100]), kf(86, [100]), kf(99, [0])] } }, 0, 100),
  ];
  return doc('success-check', 100, layers);
}

/* 2 — celebration confetti burst (loop) */
function celebration() {
  const rnd = mulberry(7);
  const cols = [EMBER, INK, GOLD, SOFT, EMBER, GOLD];
  const layers = [];
  for (let i = 0; i < 16; i++) {
    const x0 = 12 + rnd() * 176;
    const drift = (rnd() - 0.5) * 70;
    const rot = (rnd() > 0.5 ? 1 : -1) * (200 + rnd() * 260);
    const shape = rnd() > 0.45
      ? grp([rect(11, 15, 3), fill(cols[i % cols.length])], {})
      : grp([ellipse(11), fill(cols[i % cols.length])], {});
    layers.push(layer(i + 1, 'c' + i, [shape], {
      p: { a: 1, k: [kf(0, [x0, -24, 0]), kf(120, [x0 + drift, 224, 0])] },
      r: { a: 1, k: [kf(0, [0]), kf(120, [rot])] },
      o: { a: 1, k: [kf(0, [100]), kf(104, [100]), kf(120, [0])] },
    }, i * 2, 140));
  }
  return doc('celebration', 140, layers);
}

/* 3 — empty search: floating magnifier + ember echo + sparkles */
function emptySearch() {
  const floatY = { a: 1, k: [kf(0, [0, 9]), kf(75, [0, -9]), kf(150, [0, 9])] };
  return doc('empty-search', 150, [
    layer(1, 'shadow', [grp([ellipse(1), fill(SOFT, 22)], { p: { a: 0, k: [0, 78] }, s: { a: 1, k: [kf(0, [104, 15]), kf(75, [82, 12]), kf(150, [104, 15])] } })], {}, 0, 150),
    layer(2, 'glass', [
      grp([ellipse(88), stroke(SOFT, 10)], { p: { a: 0, k: [-14, -8] } }),
      grp([pathItem([[16, 22], [50, 56]], false), stroke(SOFT, 12)], {}),
      grp([ellipse(22), fill(EMBER)], { p: { a: 0, k: [34, -52] } }),
    ], { p: floatY }, 0, 150),
    layer(3, 'spark-a', [grp([ellipse(11), fill(GOLD)], { p: { a: 0, k: [-72, -52] } })],
      { o: { a: 1, k: [kf(0, [20]), kf(50, [100]), kf(100, [20]), kf(150, [20])] } }, 0, 150),
    layer(4, 'spark-b', [grp([ellipse(9), fill(EMBER)], { p: { a: 0, k: [66, 44] } })],
      { o: { a: 1, k: [kf(0, [100]), kf(50, [20]), kf(100, [100]), kf(150, [100])] } }, 0, 150),
  ]);
}

/* 4 — empty chat: bubble + bouncing dots */
function emptyChat() {
  const dots = (x0, color, off) => grp([ellipse(18), fill(color)], {
    p: { a: 1, k: [kf(off, [x0, 0]), kf(off + 15, [x0, -13]), kf(off + 30, [x0, 0]), kf(150, [x0, 0])] },
  });
  return doc('empty-chat', 150, [
    layer(1, 'shadow', [grp([ellipse(1), fill(SOFT, 22)], { p: { a: 0, k: [0, 66] }, s: { a: 0, k: [120, 14] } })], {}, 0, 150),
    layer(2, 'bubble', [
      grp([rect(134, 96, 30), stroke(SOFT, 10)], { p: { a: 0, k: [0, -8] } }),
      grp([pathItem([[-38, 34], [-56, 62], [-12, 36]], false), stroke(SOFT, 10)], {}),
    ], { p: { a: 1, k: [kf(0, [100, 106, 0]), kf(75, [100, 94, 0]), kf(150, [100, 106, 0])] } }, 0, 150),
    layer(3, 'dots', [dots(-28, EMBER, 0), dots(0, GOLD, 18), dots(28, SOFT, 36)],
      { p: { a: 1, k: [kf(0, [100, 92, 0]), kf(75, [100, 80, 0]), kf(150, [100, 92, 0])] } }, 0, 150),
  ]);
}

/* 5 — empty inbox: tray + bouncing parcel + sparkles */
function emptyInbox() {
  return doc('empty-inbox', 150, [
    layer(1, 'shadow', [grp([ellipse(1), fill(SOFT, 22)], { p: { a: 0, k: [0, 62] }, s: { a: 0, k: [128, 15] } })], {}, 0, 150),
    layer(2, 'tray', [
      grp([pathItem([[-62, -12], [-62, 42], [62, 42], [62, -12]], false), stroke(SOFT, 10)], {}),
      grp([pathItem([[-62, -12], [62, -12]], false), stroke(SOFT, 7)], {}),
    ], {}, 0, 150),
    layer(3, 'parcel', [grp([rect(44, 44, 12), fill(EMBER)], {})], {
      p: { a: 1, k: [kf(0, [100, 40, 0]), kf(45, [100, 66, 0]), kf(60, [100, 58, 0]), kf(75, [100, 66, 0]), kf(120, [100, 40, 0]), kf(150, [100, 40, 0])] },
      r: { a: 1, k: [kf(0, [0]), kf(45, [0]), kf(60, [8]), kf(75, [0]), kf(150, [0])] },
    }, 0, 150),
    layer(4, 'spark', [
      grp([ellipse(10), fill(GOLD)], { p: { a: 0, k: [-84, -34] } }),
      grp([ellipse(9), fill(EMBER)], { p: { a: 0, k: [86, -40] } }),
    ], { o: { a: 1, k: [kf(0, [25]), kf(50, [100]), kf(100, [25]), kf(150, [25])] } }, 0, 150),
  ]);
}

const out = path.join(__dirname, '..', 'assets', 'animations');
fs.mkdirSync(out, { recursive: true });
const files = {
  'success-check.json': successCheck(),
  'celebration.json': celebration(),
  'empty-search.json': emptySearch(),
  'empty-chat.json': emptyChat(),
  'empty-inbox.json': emptyInbox(),
};
for (const [name, json] of Object.entries(files)) {
  const text = JSON.stringify(json);
  JSON.parse(text);
  fs.writeFileSync(path.join(out, name), text);
  console.log(name, (text.length / 1024).toFixed(1) + 'kb');
}
