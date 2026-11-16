import { DepartmentId } from './artwork';
import { RARITIES, Rarity } from '../game/game-rules';

const CARD_INDEX_VERSION = 1;

export interface CardIndexFile {
  readonly version: number;
  readonly departments: readonly DepartmentId[];
  readonly objectIdDeltas: readonly number[];
  readonly tiers: string;
  readonly departmentCodes: string;
  readonly centuries: readonly number[];
}

export interface CardIndex {
  readonly size: number;
  readonly ids: Int32Array;
  readonly tiers: Uint8Array;
  readonly departments: Uint8Array;
  readonly centuries: Int8Array;
  readonly departmentNames: readonly DepartmentId[];
}

export interface IndexEntry {
  readonly id: number;
  readonly rarity: Rarity;
  readonly department: DepartmentId;
  readonly century: number | null;
}

export function decodeCardIndex(file: CardIndexFile): CardIndex {
  if (file.version !== CARD_INDEX_VERSION) {
    throw new Error(`Unsupported card index version ${file.version}`);
  }
  const size = file.objectIdDeltas.length;
  const ids = new Int32Array(size);
  const tiers = new Uint8Array(size);
  const departments = new Uint8Array(size);
  const centuries = new Int8Array(size);
  let id = 0;
  for (let index = 0; index < size; index++) {
    id += file.objectIdDeltas[index];
    ids[index] = id;
    tiers[index] = Number(file.tiers[index]);
    departments[index] = parseInt(file.departmentCodes[index], 36);
    centuries[index] = file.centuries[index];
  }
  return { size, ids, tiers, departments, centuries, departmentNames: file.departments };
}

export function entryAt(index: CardIndex, position: number): IndexEntry {
  const century = index.centuries[position];
  return {
    id: index.ids[position],
    rarity: RARITIES[index.tiers[position]],
    department: index.departmentNames[index.departments[position]],
    century: century === 0 ? null : century,
  };
}

export function findEntry(index: CardIndex, id: number): IndexEntry | null {
  let low = 0;
  let high = index.size - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    const value = index.ids[middle];
    if (value === id) {
      return entryAt(index, middle);
    }
    if (value < id) {
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return null;
}

export function poolIds(index: CardIndex, rarity: Rarity, department: DepartmentId | null): number[] {
  const tier = RARITIES.indexOf(rarity);
  const departmentCode = department === null ? -1 : index.departmentNames.indexOf(department);
  const ids: number[] = [];
  for (let position = 0; position < index.size; position++) {
    if (index.tiers[position] === tier && (departmentCode === -1 || index.departments[position] === departmentCode)) {
      ids.push(index.ids[position]);
    }
  }
  return ids;
}
