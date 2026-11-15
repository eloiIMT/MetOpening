import { Locale, Message } from '../i18n';
import { artworks } from './artworks';
import { cases } from './cases';
import { crate, departments, rarities, raritiesPlural, stencils } from './catalog';
import { common } from './common';
import { favorites } from './favorites';
import { footer, nav, routes } from './layout';
import { openings } from './openings';

export const MESSAGES = {
  common,
  departments,
  rarities,
  raritiesPlural,
  stencils,
  crate,
  routes,
  nav,
  footer,
  cases,
  openings,
  artworks,
  favorites,
};

type Areas = typeof MESSAGES;

export type MessageKey = {
  [A in keyof Areas & string]: `${A}.${keyof Areas[A]['fr'] & string}`;
}[keyof Areas & string];

export function lookup(locale: Locale, key: MessageKey): Message {
  const dot = key.indexOf('.');
  const area = MESSAGES[key.slice(0, dot) as keyof Areas][locale] as Readonly<Record<string, Message>>;
  return area[key.slice(dot + 1)] ?? key;
}
