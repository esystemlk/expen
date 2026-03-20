import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Account {
  id: string;
  name: string;
  type: 'CASH' | 'BANK' | 'CREDIT' | 'SAVINGS';
  balance: number;
  color: string;
  icon: string;
  createdAt: string;
}

interface AccountStore {
  accounts: Account[];
  loading: boolean;
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  updateBalance: (id: string, amount: number, type: 'INCOME' | 'EXPENSE') => void;
}

const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'default-wallet',
    name: 'Main Wallet',
    type: 'CASH',
    balance: 0,
    color: '#6C5CE7',
    icon: 'Wallet',
    createdAt: new Date().toISOString(),
  }
];

export const useAccountStore = create<AccountStore>()(
  persist(
    (set) => ({
      accounts: DEFAULT_ACCOUNTS,
      loading: false,

      addAccount: (account) => {
        const newAccount: Account = {
          ...account,
          id: Math.random().toString(36).substring(2, 9),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          accounts: [...state.accounts, newAccount]
        }));
      },

      updateAccount: (id, updates) => {
        set((state) => ({
          accounts: state.accounts.map(a => a.id === id ? { ...a, ...updates } : a)
        }));
      },

      deleteAccount: (id) => {
        set((state) => ({
          accounts: state.accounts.filter(a => a.id !== id)
        }));
      },

      updateBalance: (id, amount, type) => {
        set((state) => ({
          accounts: state.accounts.map(a => {
            if (a.id === id) {
              const newBalance = type === 'INCOME' ? a.balance + amount : a.balance - amount;
              return { ...a, balance: newBalance };
            }
            return a;
          })
        }));
      },
    }),
    {
      name: 'account-storage',
    }
  )
);
