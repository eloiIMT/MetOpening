import { copyFileSync, writeFileSync } from 'node:fs';

const dir = 'dist/met-opening/browser';

copyFileSync(`${dir}/index.html`, `${dir}/404.html`);
writeFileSync(`${dir}/.nojekyll`, '');
