import { defineMessages, formatMessage } from './i18n';

const coins = { one: '{count} pièce', other: '{count} pièces' };

describe('formatMessage', () => {
  it('fills the named values', () => {
    expect(formatMessage('Bonjour {name} !', { name: 'Ada' }, 'fr')).toBe('Bonjour Ada !');
  });

  it('formats numbers for the language', () => {
    expect(formatMessage('{count}', { count: 236601 }, 'fr')).toBe('236 601');
    expect(formatMessage('{count}', { count: 236601 }, 'en')).toBe('236,601');
  });

  it('uses the singular for 0 and 1 in French, only for 1 in English', () => {
    expect(formatMessage(coins, { count: 0 }, 'fr')).toBe('0 pièce');
    expect(formatMessage(coins, { count: 2 }, 'fr')).toBe('2 pièces');
    const english = { one: '{count} coin', other: '{count} coins' };
    expect(formatMessage(english, { count: 0 }, 'en')).toBe('0 coins');
    expect(formatMessage(english, { count: 1 }, 'en')).toBe('1 coin');
  });

  it('leaves an unknown value visible', () => {
    expect(formatMessage('{missing}', {}, 'fr')).toBe('{missing}');
  });
});

describe('defineMessages', () => {
  it('keeps both languages', () => {
    expect(defineMessages({ hello: 'Bonjour' }, { hello: 'Hello' }).en.hello).toBe('Hello');
  });
});
