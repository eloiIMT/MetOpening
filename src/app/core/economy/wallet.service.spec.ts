import { TestBed } from '@angular/core/testing';
import { STARTING_COINS } from '../game/game-rules';
import { WALLET_STORAGE_KEY, WalletService } from './wallet.service';

describe('WalletService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function createWallet(): WalletService {
    return TestBed.inject(WalletService);
  }

  it('starts with the starting balance', () => {
    expect(createWallet().coins()).toBe(STARTING_COINS);
  });

  it('debits when the balance is enough', () => {
    const wallet = createWallet();
    expect(wallet.debit(150)).toBe(true);
    expect(wallet.coins()).toBe(STARTING_COINS - 150);
  });

  it('refuses a debit larger than the balance', () => {
    const wallet = createWallet();
    expect(wallet.debit(STARTING_COINS + 1)).toBe(false);
    expect(wallet.coins()).toBe(STARTING_COINS);
  });

  it('credits coins', () => {
    const wallet = createWallet();
    wallet.credit(200);
    expect(wallet.coins()).toBe(STARTING_COINS + 200);
  });

  it('ignores negative and decimal amounts', () => {
    const wallet = createWallet();
    expect(wallet.debit(-50)).toBe(false);
    wallet.credit(-50);
    wallet.credit(2.5);
    expect(wallet.coins()).toBe(STARTING_COINS);
  });

  it('restores the saved balance', () => {
    createWallet().debit(100);
    TestBed.resetTestingModule();
    expect(createWallet().coins()).toBe(STARTING_COINS - 100);
  });

  it('falls back to the starting balance when the saved value is corrupted', () => {
    localStorage.setItem(WALLET_STORAGE_KEY, 'abc');
    expect(createWallet().coins()).toBe(STARTING_COINS);
  });
});