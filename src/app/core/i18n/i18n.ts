export type Locale = 'fr' | 'en';

export const LOCALES: readonly Locale[] = ['fr', 'en'];

export const LOCALE_TAG: Readonly<Record<Locale, string>> = { fr: 'fr-FR', en: 'en-US' };

export interface Plural {
  readonly one: string;
  readonly other: string;
}

export type Message = string | Plural;

export type Params = Readonly<Record<string, string | number>>;

export interface MessageSet<K extends string> {
  readonly fr: Readonly<Record<K, Message>>;
  readonly en: Readonly<Record<K, Message>>;
}

export function defineMessages<K extends string>(
  fr: Record<K, Message>,
  en: Record<NoInfer<K>, Message>,
): MessageSet<K> {
  return { fr, en };
}

export function formatMessage(message: Message, params: Params, locale: Locale): string {
  const template = typeof message === 'string' ? message : message[pluralOf(params['count'], locale)];
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    if (value === undefined) {
      return match;
    }
    return typeof value === 'number' ? value.toLocaleString(LOCALE_TAG[locale]) : value;
  });
}

const PLURAL_RULES: Readonly<Record<Locale, Intl.PluralRules>> = {
  fr: new Intl.PluralRules(LOCALE_TAG.fr),
  en: new Intl.PluralRules(LOCALE_TAG.en),
};

function pluralOf(count: string | number | undefined, locale: Locale): keyof Plural {
  return typeof count === 'number' && PLURAL_RULES[locale].select(count) === 'one'
    ? 'one'
    : 'other';
}
