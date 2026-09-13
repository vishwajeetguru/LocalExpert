/**
 * Fetches freely-licensed topical images for each service category from
 * Wikimedia Commons and bundles them offline into assets/categories/.
 * Run: node scripts/fetch-category-images.cjs [--force] [--only slug,slug]
 * Skips slugs that already downloaded (unless --force). Polite 1.5s delay.
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'assets', 'categories');

const JOBS = [
  ['ac-repair', 'air conditioner'],
  ['bike-repair', 'motorcycle side view'],
  ['car-repair', 'white hatchback car front view'],
  ['carpenter', 'hammer tool'],
  ['cleaning', 'cleaning mop bucket'],
  ['computer-repair', 'laptop computer front view'],
  ['cooler-repair', 'pedestal fan'],
  ['dentist', 'healthy smile teeth'],
  ['doctor', 'stethoscope'],
  ['electrician', 'glowing light bulb'],
  ['fan-repair', 'ceiling fan'],
  ['fridge-repair', 'refrigerator front view'],
  ['mobile-repair', 'cell phone closeup'],
  ['plumber', 'water faucet'],
  ['tailor', 'sewing machine'],
  ['salon', 'hairdressing scissors comb'],
  ['painter', 'paint roller'],
  ['tutor', 'stack of books'],
  ['photographer', 'camera'],
  ['printing', 'photocopier machine'],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pickImage(query) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json' +
    '&generator=search&gsrnamespace=6&gsrlimit=12' +
    '&gsrsearch=' + encodeURIComponent(query + ' filetype:bitmap') +
    '&prop=pageimages&pithumbsize=700';
  let lastErr = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'SevaSathi/1.0 (local dev bundle)' } });
      if (res.status === 429) {
        await sleep(4000);
        continue;
      }
      if (!res.ok) throw new Error('search http ' + res.status);
      const json = await res.json();
      const pages = json.query ? Object.values(json.query.pages) : [];
      const withThumb = pages.filter((p) => p.thumbnail && p.thumbnail.source);
      if (!withThumb.length) throw new Error('no thumbnail for: ' + query);
      withThumb.sort((a, b) => (b.thumbnail.width || 0) - (a.thumbnail.width || 0));
      return withThumb.slice(0, 4);
    } catch (e) {
      lastErr = e;
      await sleep(2000);
    }
  }
  throw lastErr || new Error('rate limited, retry later');
}

const MAX_BYTES = 2500000;

async function download(url, dest) {
  if (url.toLowerCase().endsWith('.gif') || url.toLowerCase().endsWith('.svg')) {
    throw new Error('skipping vector/animation format');
  }
  const res = await fetch(url, { headers: { 'User-Agent': 'SevaSathi/1.0 (local dev bundle)' } });
  if (!res.ok || !String(res.headers.get('content-type') || '').startsWith('image/')) {
    throw new Error('bad image response for ' + url);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 6000) throw new Error('image too small, likely placeholder');
  if (buf.length > MAX_BYTES) throw new Error('image too large (' + (buf.length / 1024).toFixed(0) + 'kb)');
  fs.writeFileSync(dest, buf);
  return buf.length;
}

(async () => {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const onlyArg = args.find((a) => a.startsWith('--only='));
  const only = onlyArg ? onlyArg.slice('--only='.length).split(',') : null;
  fs.mkdirSync(OUT, { recursive: true });
  let ok = 0;
  let skip = 0;
  for (const [slug, query] of JOBS) {
    if (only && !only.includes(slug)) continue;
    const dest = path.join(OUT, slug + '.png');
    if (!force && fs.existsSync(dest) && fs.statSync(dest).size > 6000) {
      skip++;
      continue;
    }
    try {
      const candidates = await pickImage(query);
      let done = null;
      let failed = [];
      for (const picked of candidates) {
        try {
          const bytes = await download(picked.thumbnail.source, dest);
          done = { picked, bytes };
          break;
        } catch (e) {
          failed.push(picked.title.slice(0, 40) + ' (' + e.message + ')');
        }
      }
      if (!done) throw new Error('all candidates failed: ' + failed.join('; '));
      console.log('OK  ', slug, (done.bytes / 1024).toFixed(0) + 'kb', '<-', done.picked.title.slice(0, 80));
      ok++;
    } catch (e) {
      console.log('FAIL', slug, '-', e.message);
    }
    await sleep(1500);
  }
  console.log(`done: ${ok} fetched, ${skip} kept`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
