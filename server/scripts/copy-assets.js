// Copies non-TypeScript build assets (e.g. SQL schema files) into dist/.
// tsc only emits compiled .ts files, so anything else referenced at
// runtime by relative path (see src/config/database.ts's pg-mem
// fallback) has to be copied over explicitly after `tsc` runs.
const fs = require('fs');
const path = require('path');

const ASSETS = [
  { from: 'src/db/schema.sql', to: 'dist/db/schema.sql' },
];

for (const { from, to } of ASSETS) {
  const src = path.resolve(__dirname, '..', from);
  const dest = path.resolve(__dirname, '..', to);

  if (!fs.existsSync(src)) {
    console.warn(`[copy-assets] Skipping missing asset: ${from}`);
    continue;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`[copy-assets] Copied ${from} -> ${to}`);
}
