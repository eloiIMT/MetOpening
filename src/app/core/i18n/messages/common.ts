import { defineMessages } from '../i18n';

export const common = defineMessages(
  {
    coins: { one: '{count} pièce', other: '{count} pièces' },
    artworks: { one: '{count} œuvre', other: '{count} œuvres' },
    copies: { one: '{count} exemplaire', other: '{count} exemplaires' },
    unknownArtist: 'Artiste non identifié',
    unknownDate: 'Date inconnue',
  },
  {
    coins: { one: '{count} coin', other: '{count} coins' },
    artworks: { one: '{count} artwork', other: '{count} artworks' },
    copies: { one: '{count} copy', other: '{count} copies' },
    unknownArtist: 'Unidentified artist',
    unknownDate: 'Unknown date',
  },
);
