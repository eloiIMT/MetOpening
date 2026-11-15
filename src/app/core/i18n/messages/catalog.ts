import { DepartmentId } from '../../artwork';
import { Rarity } from '../../game-rules';
import { ShopCaseId } from '../../shop';
import { defineMessages } from '../i18n';

export const departments = defineMessages<DepartmentId>(
  {
    'european-paintings': 'Peintures européennes',
    'drawings-prints': 'Dessins et estampes',
    'american-wing': 'Aile américaine',
    'european-sculpture': 'Sculpture et arts décoratifs européens',
    'asian-art': 'Art asiatique',
    photographs: 'Photographies',
    'musical-instruments': 'Instruments de musique',
    'greek-roman': 'Art grec et romain',
    'islamic-art': 'Art islamique',
    'egyptian-art': 'Art égyptien',
    'arms-armor': 'Armes et armures',
    'ancient-west-asian': 'Proche-Orient ancien',
    'africa-oceania-americas': 'Arts d’Afrique, d’Océanie et des Amériques',
    cloisters: 'The Cloisters',
    'costume-institute': 'Costume Institute',
    libraries: 'Bibliothèques',
    'medieval-art': 'Art médiéval',
    'modern-contemporary': 'Art moderne et contemporain',
    'robert-lehman': 'Collection Robert Lehman',
  },
  {
    'european-paintings': 'European Paintings',
    'drawings-prints': 'Drawings and Prints',
    'american-wing': 'The American Wing',
    'european-sculpture': 'European Sculpture and Decorative Arts',
    'asian-art': 'Asian Art',
    photographs: 'Photographs',
    'musical-instruments': 'Musical Instruments',
    'greek-roman': 'Greek and Roman Art',
    'islamic-art': 'Islamic Art',
    'egyptian-art': 'Egyptian Art',
    'arms-armor': 'Arms and Armor',
    'ancient-west-asian': 'Ancient West Asian Art',
    'africa-oceania-americas': 'Arts of Africa, Oceania, and the Americas',
    cloisters: 'The Cloisters',
    'costume-institute': 'The Costume Institute',
    libraries: 'The Libraries',
    'medieval-art': 'Medieval Art',
    'modern-contemporary': 'Modern and Contemporary Art',
    'robert-lehman': 'The Robert Lehman Collection',
  },
);

export const rarities = defineMessages<Rarity>(
  { common: 'Commune', uncommon: 'Peu commune', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire' },
  { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' },
);

export const raritiesPlural = defineMessages<Rarity>(
  { common: 'Communes', uncommon: 'Peu communes', rare: 'Rares', epic: 'Épiques', legendary: 'Légendaires' },
  { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' },
);

export const stencils = defineMessages<ShopCaseId>(
  {
    classic: 'CLASSIQUE',
    'european-paintings': 'PEINTURES',
    'drawings-prints': 'ESTAMPES',
    'american-wing': 'AMERIQUE',
    'european-sculpture': 'SCULPTURE',
    'asian-art': 'ASIE',
    photographs: 'PHOTOS',
    'musical-instruments': 'MUSIQUE',
    'greek-roman': 'ANTIQUITE',
    'islamic-art': 'ISLAM',
    'egyptian-art': 'EGYPTE',
    'arms-armor': 'ARMURES',
  },
  {
    classic: 'CLASSIC',
    'european-paintings': 'PAINTINGS',
    'drawings-prints': 'PRINTS',
    'american-wing': 'AMERICA',
    'european-sculpture': 'SCULPTURE',
    'asian-art': 'ASIA',
    photographs: 'PHOTOS',
    'musical-instruments': 'MUSIC',
    'greek-roman': 'ANTIQUITY',
    'islamic-art': 'ISLAM',
    'egyptian-art': 'EGYPT',
    'arms-armor': 'ARMOR',
  },
);

export const crate = defineMessages(
  { classicName: 'Caisse classique', label: 'Caisse en bois marquée {stencil}' },
  { classicName: 'Classic case', label: 'Wooden case marked {stencil}' },
);
