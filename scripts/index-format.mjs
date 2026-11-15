export const INDEX_VERSION = 1;

export const TIER_NAMES = Object.freeze(['Commune', 'Peu commune', 'Rare', 'Épique', 'Légendaire']);

export const DEPARTMENT_IDS = Object.freeze({
  'The American Wing': 'american-wing',
  'Ancient West Asian Art': 'ancient-west-asian',
  'Arms and Armor': 'arms-armor',
  'Arts of Africa, Oceania, and the Americas': 'africa-oceania-americas',
  'Asian Art': 'asian-art',
  'The Cloisters': 'cloisters',
  'Costume Institute': 'costume-institute',
  'Drawings and Prints': 'drawings-prints',
  'Egyptian Art': 'egyptian-art',
  'European Paintings': 'european-paintings',
  'European Sculpture and Decorative Arts': 'european-sculpture',
  'Greek and Roman Art': 'greek-roman',
  'Islamic Art': 'islamic-art',
  'The Libraries': 'libraries',
  'Medieval Art': 'medieval-art',
  'Modern and Contemporary Art': 'modern-contemporary',
  'Musical Instruments': 'musical-instruments',
  Photographs: 'photographs',
  'Robert Lehman Collection': 'robert-lehman',
});

const MIN_YEAR = -5000;
const MAX_YEAR = 2100;

export function centuryOfYears(begin, end) {
  if (!Number.isInteger(begin) || !Number.isInteger(end) || (begin === 0 && end === 0)) {
    return 0;
  }
  const year = Math.round((begin + end) / 2);
  if (year < MIN_YEAR || year > MAX_YEAR) {
    return 0;
  }
  return year < 0 ? -Math.ceil(-year / 100) : Math.floor(year / 100) + 1;
}

export function encodeIndex(rows) {
  const departments = [...new Set(rows.map((row) => row.department))].sort();
  const departmentCode = new Map(departments.map((department, index) => [department, index.toString(36)]));
  const sorted = [...rows].sort((a, b) => a.id - b.id);
  let previous = 0;
  return {
    version: INDEX_VERSION,
    departments,
    objectIdDeltas: sorted.map((row) => {
      const delta = row.id - previous;
      previous = row.id;
      return delta;
    }),
    tiers: sorted.map((row) => String(row.tier)).join(''),
    departmentCodes: sorted.map((row) => departmentCode.get(row.department)).join(''),
    centuries: sorted.map((row) => row.century),
  };
}

export function decodeIndex(file) {
  let id = 0;
  return file.objectIdDeltas.map((delta, index) => {
    id += delta;
    return {
      id,
      tier: Number(file.tiers[index]),
      department: file.departments[parseInt(file.departmentCodes[index], 36)],
      century: file.centuries[index],
    };
  });
}
