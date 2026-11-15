export const TIER_TO_RARITY = Object.freeze({
  Commune: 'common',
  'Peu commune': 'uncommon',
  Rare: 'rare',
  'Épique': 'epic',
  'Légendaire': 'legendary',
});

export const QUOTAS = Object.freeze({
  common: 4,
  uncommon: 2,
  rare: 2,
  epic: 1,
  legendary: 1,
});

export const MET_DEPARTMENTS = Object.freeze({
  'The American Wing': 'american-wing',
  'Arms and Armor': 'arms-armor',
  'Asian Art': 'asian-art',
  'Drawings and Prints': 'drawings-prints',
  'Egyptian Art': 'egyptian-art',
  'European Paintings': 'european-paintings',
  'European Sculpture and Decorative Arts': 'european-sculpture',
  'Greek and Roman Art': 'greek-roman',
  'Islamic Art': 'islamic-art',
  'Musical Instruments': 'musical-instruments',
  Photographs: 'photographs',
});

export function groupCards(cards) {
  const groups = new Map();
  for (const card of cards) {
    const department = MET_DEPARTMENTS[card.department];
    const rarity = TIER_TO_RARITY[card.tier];
    if (!department || !rarity) {
      continue;
    }
    const key = `${department}|${rarity}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(card);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => b.score - a.score || a.objectID - b.objectID);
  }
  return groups;
}
