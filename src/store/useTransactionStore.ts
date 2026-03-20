import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Transaction {
  id: string;
  uid: string;
  accountId: string;
  type: 'EXPENSE' | 'INCOME';
  amount: number;
  description: string;
  category: string;
  mode: 'PERSONAL' | 'COMPANY';
  date: string;
  notes?: string;
  createdAt?: string;
}

interface TransactionStore {
  transactions: Transaction[];
  loading: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'uid' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;
}

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set) => ({
      transactions: [],
      loading: false,
      
      addTransaction: (transaction) => {
        const newTransaction: Transaction = {
          ...transaction,
          id: Math.random().toString(36).substring(2, 9),
          uid: 'local-user',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          transactions: [newTransaction, ...state.transactions]
        }));
      },

      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter(t => t.id !== id)
        }));
      },
    }),
    {
      name: 'transaction-storage',
    }
  )
);
