import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { MET_DEPARTMENTS, QUOTAS, groupCards } from './card-selection.mjs';

const API = 'https://collectionapi.metmuseum.org/public/collection/v1/objects/';
const OUTPUT = process.argv[2] ?? 'public/data/artworks.json';
const CARDS = process.argv[3] ?? 'Specs/Cards_data/out/cartes.json';

const DELAY_MS = 1100;
const BLOCKED_PAUSE_MS = 30_000;
const MAX_ATTEMPTS = 4;
const MAX_TRIES_PER_SLOT = 25;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let nextRequestAt = 0;
let requestCount = 0;

async function fetchObject(id) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const wait = nextRequestAt - Date.now();
    if (wait > 0) {
      await sleep(wait);
    }
    nextRequestAt = Date.now() + DELAY_MS;
    requestCount++;
    try {
      const response = await fetch(API + id);
      if (response.status === 404) {
        return null;
      }
      if (response.status === 403 || response.status === 429) {
        console.warn(`  Bloqué par le serveur du Met (HTTP ${response.status}), pause de ${BLOCKED_PAUSE_MS / 1000} s…`);
        nextRequestAt = Date.now() + BLOCKED_PAUSE_MS;
        continue;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`  Échec (${error.message}) sur l'objet ${id}, essai ${attempt}/${MAX_ATTEMPTS}`);
      nextRequestAt = Date.now() + DELAY_MS * 2 ** attempt;
    }
  }
  throw new Error(`Abandon après ${MAX_ATTEMPTS} essais sur l'objet ${id}`);
}

function yearOf(object) {
  const { objectBeginDate: begin, objectEndDate: end } = object;
  if (!Number.isInteger(begin) || !Number.isInteger(end) || (begin === 0 && end === 0)) {
    return null;
  }
  return Math.round((begin + end) / 2);
}

function toArtwork(object, card, department, rarity) {
  return {
    id: object.objectID,
    title: object.title || card.title || 'Sans titre',
    artist: object.artistDisplayName || null,
    date: object.objectDate || null,
    year: yearOf(object),
    department,
    rarity,
    imageSmall: object.primaryImageSmall,
    image: object.primaryImage || object.primaryImageSmall,
    metUrl: object.objectURL || `https://www.metmuseum.org/art/collection/search/${object.objectID}`,
  };
}

async function pickSlot(candidates, quota, department, rarity) {
  const picked = [];
  const maxTries = quota * MAX_TRIES_PER_SLOT;
  for (const card of candidates.slice(0, maxTries)) {
    if (picked.length >= quota) {
      break;
    }
    const object = await fetchObject(card.objectID);
    if (object?.isPublicDomain && object.primaryImageSmall) {
      picked.push(toArtwork(object, card, department, rarity));
    }
  }
  return picked;
}

async function main() {
  const startedAt = Date.now();
  console.log(`Lecture de ${CARDS}…`);
  const groups = groupCards(JSON.parse(readFileSync(CARDS, 'utf8')));

  const artworks = [];
  const warnings = [];
  for (const department of Object.values(MET_DEPARTMENTS)) {
    console.log(`${department}…`);
    for (const [rarity, quota] of Object.entries(QUOTAS)) {
      try {
        const picked = await pickSlot(groups.get(`${department}|${rarity}`) ?? [], quota, department, rarity);
        artworks.push(...picked);
        console.log(`  ${rarity} : ${picked.length}/${quota}`);
        if (picked.length < quota) {
          warnings.push(`${department} / ${rarity} : ${picked.length} sur ${quota}`);
        }
      } catch (error) {
        warnings.push(`${department} / ${rarity} : ignoré (${error.message})`);
        console.error(`  ${error.message}`);
      }
    }
  }

  if (artworks.length === 0) {
    console.error('Aucune œuvre récupérée, le fichier n’a pas été écrit.');
    process.exitCode = 1;
    return;
  }

  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, `${JSON.stringify(artworks, null, 2)}\n`);

  const seconds = Math.round((Date.now() - startedAt) / 1000);
  console.log(`\n${artworks.length} œuvres écrites dans ${OUTPUT} (${requestCount} requêtes, ${seconds} s).`);
  for (const warning of warnings) {
    console.warn(`Attention : ${warning}`);
  }
}

main();
