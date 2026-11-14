import { Injectable, signal } from '@angular/core';
import { STARTING_COINS } from './game-rules';

export const WALLET_STORAGE_KEY = 'met-opening.coins';

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly balance = signal(readStoredCoins());
  readonly coins = this.balance.asReadonly();

  canAfford(price: number): boolean {
    return this.coins() >= price;
  }

  debit(amount: number): boolean {
    if (!isValidAmount(amount) || !this.canAfford(amount)) {
      return false;
    }
    this.save(this.coins() - amount);
    return true;
  }

  credit(amount: number): void {
    if (!isValidAmount(amount)) {
      return;
    }
    this.save(this.coins() + amount);
  }

  private save(value: number): void {
    this.balance.set(value);
    try {
      localStorage.setItem(WALLET_STORAGE_KEY, String(value));
    } catch {
      return;
    }
  }
}

function isValidAmount(amount: number): boolean {
  return Number.isInteger(amount) && amount > 0;
}

function readStoredCoins(): number {
  try {
    const raw = localStorage.getItem(WALLET_STORAGE_KEY);
    const value = raw === null ? Number.NaN : Number(raw);
    return Number.isInteger(value) && value >= 0 ? value : STARTING_COINS;
  } catch {
    return STARTING_COINS;
  }
}