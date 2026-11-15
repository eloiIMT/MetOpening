import { createReadStream, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { DEPARTMENT_IDS, TIER_NAMES, centuryOfYears, encodeIndex } from './index-format.mjs';

const OUTPUT = process.argv[2] ?? 'public/data/card-index.json';
const CARDS = process.argv[3] ?? 'Specs/Cards_data/out/cartes.json';
const CSV = process.argv[4] ?? 'Specs/Cards_data/MetObjects.csv';

const SHOP_DEPARTMENTS = [
  'american-wing',
  'arms-armor',
  'asian-art',
  'drawings-prints',
  'egyptian-art',
  'european-paintings',
  'european-sculpture',
  'greek-roman',
  'islamic-art',
  'musical-instruments',
  'photographs',
];

async function readCenturies(path) {
  const centuries = new Map();
  const stream = createReadStream(path, { encoding: 'utf8' });
  let header = null;
  let columns = null;
  let fields = [];
  let field = '';
  let inQuotes = false;
  let afterQuote = false;
  let first = true;

  const endRecord = () => {
    fields.push(field);
    field = '';
    if (header === null) {
      header = fields;
      columns = {
        id: header.indexOf('Object ID'),
        begin: header.indexOf('Object Begin Date'),
        end: header.indexOf('Object End Date'),
      };
      if (Object.values(columns).includes(-1)) {
        throw new Error('Colonnes attendues introuvables dans le CSV');
      }
    } else if (fields.length > columns.end) {
      const id = Number(fields[columns.id]);
      const century = centuryOfYears(Number(fields[columns.begin]), Number(fields[columns.end]));
      if (Number.isInteger(id)) {
        centuries.set(id, century);
      }
    }
    fields = [];
  };

  for await (const chunk of stream) {
    for (let index = 0; index < chunk.length; index++) {
      let char = chunk[index];
      if (first) {
        first = false;
        if (char === '﻿') {
          continue;
        }
      }
      if (inQuotes) {
        if (char === '"') {
          inQuotes = false;
          afterQuote = true;
        } else {
          field += char;
        }
        continue;
      }
      if (char === '"') {
        if (afterQuote) {
          field += '"';
        }
        inQuotes = true;
        afterQuote = false;
        continue;
      }
      afterQuote = false;
      if (char === ',') {
        fields.push(field);
        field = '';
      } else if (char === '\n') {
        endRecord();
      } else if (char !== '\r') {
        field += char;
      }
    }
  }
  if (field !== '' || fields.length > 0) {
    endRecord();
  }
  return centuries;
}

async function main() {
  const startedAt = Date.now();
  console.log(`Lecture de ${CARDS}…`);
  const cards = JSON.parse(readFileSync(CARDS, 'utf8'));
  console.log(`Lecture des dates dans ${CSV}…`);
  const centuries = await readCenturies(CSV);

  const rows = [];
  let skipped = 0;
  for (const card of cards) {
    const tier = TIER_NAMES.indexOf(card.tier);
    const department = DEPARTMENT_IDS[card.department];
    if (!card.title?.trim() || tier === -1 || !department) {
      skipped++;
      continue;
    }
    rows.push({ id: card.objectID, tier, department, century: centuries.get(card.objectID) ?? 0 });
  }

  const missing = [];
  for (const department of SHOP_DEPARTMENTS) {
    for (let tier = 0; tier < TIER_NAMES.length; tier++) {
      if (!rows.some((row) => row.department === department && row.tier === tier)) {
        missing.push(`${department} / ${TIER_NAMES[tier]}`);
      }
    }
  }
  if (missing.length > 0) {
    console.error(`Index non écrit : il manque des paliers dans la boutique (${missing.join(', ')}).`);
    process.exitCode = 1;
    return;
  }

  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(encodeIndex(rows)));

  const perTier = TIER_NAMES.map((name, tier) => `${name} ${rows.filter((row) => row.tier === tier).length}`);
  const dated = rows.filter((row) => row.century !== 0).length;
  const seconds = Math.round((Date.now() - startedAt) / 1000);
  console.log(`\n${rows.length} œuvres dans ${OUTPUT} (${Math.round(statSync(OUTPUT).size / 1024)} Ko, ${seconds} s).`);
  console.log(`  ${perTier.join(' · ')}`);
  console.log(`  ${skipped} œuvres écartées (sans titre ou hors palier), ${((dated / rows.length) * 100).toFixed(1)} % datées.`);
}

main();
