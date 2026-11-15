import { Artwork, DepartmentId } from './artwork';
import { Rarity } from './game-rules';
import { EMPTY_RESERVE, RESERVE_TARGET, Reserve, addToReserve, mostNeededRarity, takeFromReserve } from './reserve';

function artwork(id: number, rarity: Rarity, department: DepartmentId = 'asian-art'): Artwork {
  return {
    id,
    title: `Artwork ${id}`,
    artist: null,
    date: null,
    year: null,
    department,
    rarity,
    imageSmall: '',
    image: '',
    metUrl: '',
  };
}

function filled(rarity: Rarity, count: number): Reserve {
  let reserve = EMPTY_RESERVE;
  for (let id = 1; id <= count; id++) {
    reserve = addToReserve(reserve, artwork(id, rarity));
  }
  return reserve;
}

describe('takeFromReserve', () => {
  it('takes the oldest card of the asked rarity', () => {
    const reserve = filled('rare', 3);
    const { reserve: next, artwork: taken } = takeFromReserve(reserve, 'rare', null);
    expect(taken?.id).toBe(1);
    expect(next.rare.map((card) => card.id)).toEqual([2, 3]);
    expect(reserve.rare).toHaveLength(3);
  });

  it('only takes a card from the asked department', () => {
    const reserve = addToReserve(addToReserve(EMPTY_RESERVE, artwork(1, 'common')), artwork(2, 'common', 'egyptian-art'));
    expect(takeFromReserve(reserve, 'common', 'egyptian-art').artwork?.id).toBe(2);
    expect(takeFromReserve(reserve, 'common', 'islamic-art').artwork).toBeNull();
  });

  it('returns nothing when the rarity is empty', () => {
    expect(takeFromReserve(EMPTY_RESERVE, 'legendary', null)).toEqual({ reserve: EMPTY_RESERVE, artwork: null });
  });
});

describe('addToReserve', () => {
  it('ignores a card already in the reserve', () => {
    const reserve = filled('epic', 1);
    expect(addToReserve(reserve, artwork(1, 'epic'))).toBe(reserve);
  });

  it('stops at the target size', () => {
    expect(filled('legendary', 5).legendary).toHaveLength(RESERVE_TARGET.legendary);
  });
});

describe('mostNeededRarity', () => {
  it('starts with the first rarity when everything is empty', () => {
    expect(mostNeededRarity(EMPTY_RESERVE)).toBe('common');
  });

  it('picks the least filled rarity compared to its target', () => {
    const reserve = { ...EMPTY_RESERVE, common: filled('common', 20).common, uncommon: filled('uncommon', 3).uncommon };
    expect(mostNeededRarity({ ...reserve, rare: filled('rare', 8).rare, epic: filled('epic', 2).epic, legendary: filled('legendary', 1).legendary })).toBe('uncommon');
  });

  it('returns null once every target is reached', () => {
    const full: Reserve = {
      common: filled('common', 25).common,
      uncommon: filled('uncommon', 15).uncommon,
      rare: filled('rare', 8).rare,
      epic: filled('epic', 2).epic,
      legendary: filled('legendary', 1).legendary,
    };
    expect(mostNeededRarity(full)).toBeNull();
  });
});
