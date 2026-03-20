import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RecurringTransaction {
  id: string;
  accountId: string;
  amount: number;
  category: string;
  description: string;
  type: 'INCOME' | 'EXPENSE';
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: string;
  lastProcessed?: string;
  nextDate: string;
  isActive: boolean;
  createdAt: string;
}

interface RecurringStore {
  recurringTransactions: RecurringTransaction[];
  addRecurring: (transaction: Omit<RecurringTransaction, 'id' | 'createdAt' | 'nextDate'>) => void;
  updateRecurring: (id: string, updates: Partial<RecurringTransaction>) => void;
  deleteRecurring: (id: string) => void;
  toggleRecurring: (id: string) => void;
}

export const useRecurringStore = create<RecurringStore>()(
  persist(
    (set) => ({
      recurringTransactions: [],

      addRecurring: (transaction) => {
        const nextDate = new Date(transaction.startDate).toISOString();
        const newRecurring: RecurringTransaction = {
          ...transaction,
          id: Math.random().toString(36).substring(2, 9),
          nextDate,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          recurringTransactions: [...state.recurringTransactions, newRecurring]
        }));
      },

      updateRecurring: (id, updates) => {
        set((state) => ({
          recurringTransactions: state.recurringTransactions.map(r => r.id === id ? { ...r, ...updates } : r)
        }));
      },

      deleteRecurring: (id) => {
        set((state) => ({
          recurringTransactions: state.recurringTransactions.filter(r => r.id !== id)
        }));
      },

      toggleRecurring: (id) => {
        set((state) => ({
          recurringTransactions: state.recurringTransactions.map(r => 
            r.id === id ? { ...r, isActive: !r.isActive } : r
          )
        }));
      },
    }),
    {
      name: 'recurring-storage',
    }
  )
);
