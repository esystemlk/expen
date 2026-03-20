import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Debt {
  id: string;
  title: string;
  amount: number;
  currentAmount: number;
  type: 'OWED_TO_ME' | 'OWED_BY_ME';
  person: string;
  dueDate?: string;
  interestRate?: number;
  status: 'ACTIVE' | 'PAID';
  createdAt: string;
}

interface DebtStore {
  debts: Debt[];
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'status'>) => void;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  repayDebt: (id: string, amount: number) => void;
}

export const useDebtStore = create<DebtStore>()(
  persist(
    (set) => ({
      debts: [],

      addDebt: (debt) => {
        const newDebt: Debt = {
          ...debt,
          id: Math.random().toString(36).substring(2, 9),
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          debts: [...state.debts, newDebt]
        }));
      },

      updateDebt: (id, updates) => {
        set((state) => ({
          debts: state.debts.map(d => d.id === id ? { ...d, ...updates } : d)
        }));
      },

      deleteDebt: (id) => {
        set((state) => ({
          debts: state.debts.filter(d => d.id !== id)
        }));
      },

      repayDebt: (id, amount) => {
        set((state) => ({
          debts: state.debts.map(d => {
            if (d.id === id) {
              const newAmount = d.currentAmount - amount;
              return { 
                ...d, 
                currentAmount: newAmount,
                status: newAmount <= 0 ? 'PAID' : 'ACTIVE'
              };
            }
            return d;
          })
        }));
      },
    }),
    {
      name: 'debt-storage',
    }
  )
);
