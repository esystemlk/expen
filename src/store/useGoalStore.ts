import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SavingsGoal {
  id: string;
  uid: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  category?: string;
  createdAt: string;
}

interface GoalStore {
  goals: SavingsGoal[];
  loading: boolean;
  addGoal: (goal: Omit<SavingsGoal, 'id' | 'uid' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
}

export const useGoalStore = create<GoalStore>()(
  persist(
    (set) => ({
      goals: [],
      loading: false,

      addGoal: (goal) => {
        const newGoal: SavingsGoal = {
          ...goal,
          id: Math.random().toString(36).substring(2, 9),
          uid: 'local-user',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          goals: [...state.goals, newGoal]
        }));
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map(g => g.id === id ? { ...g, ...updates } : g)
        }));
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter(g => g.id !== id)
        }));
      },
    }),
    {
      name: 'goal-storage',
    }
  )
);
