import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SplitMember {
  id: string;
  name: string;
  email?: string;
}

export interface SplitExpense {
  id: string;
  description: string;
  totalAmount: number;
  paidBy: string; // Member ID
  splitWith: {
    memberId: string;
    amount: number;
  }[];
  date: string;
  createdAt: string;
}

interface SplitStore {
  members: SplitMember[];
  expenses: SplitExpense[];
  addMember: (name: string, email?: string) => void;
  deleteMember: (id: string) => void;
  addExpense: (expense: Omit<SplitExpense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;
}

export const useSplitStore = create<SplitStore>()(
  persist(
    (set) => ({
      members: [],
      expenses: [],

      addMember: (name, email) => {
        const newMember: SplitMember = {
          id: Math.random().toString(36).substring(2, 9),
          name,
          email,
        };
        set((state) => ({
          members: [...state.members, newMember]
        }));
      },

      deleteMember: (id) => {
        set((state) => ({
          members: state.members.filter(m => m.id !== id),
          expenses: state.expenses.filter(e => e.paidBy !== id && !e.splitWith.some(sw => sw.memberId === id))
        }));
      },

      addExpense: (expense) => {
        const newExpense: SplitExpense = {
          ...expense,
          id: Math.random().toString(36).substring(2, 9),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          expenses: [newExpense, ...state.expenses]
        }));
      },

      deleteExpense: (id) => {
        set((state) => ({
          expenses: state.expenses.filter(e => e.id !== id)
        }));
      },
    }),
    {
      name: 'split-storage',
    }
  )
);
