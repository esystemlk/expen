import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  currency: string;
  country: string;
  monthlyBudget: number;
  categoryBudgets: Record<string, number>;
  createdAt: string;
  theme: 'light' | 'dark';
  agreedToTerms: boolean;
  security: {
    pin: string | null;
    isLocked: boolean;
    biometricEnabled: boolean;
  };
}

interface UserStore {
  profile: UserProfile;
  loading: boolean;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const DEFAULT_PROFILE: UserProfile = {
  uid: 'local-user',
  email: 'local@user.com',
  displayName: 'Local User',
  photoURL: '',
  currency: 'LKR',
  country: 'LK',
  monthlyBudget: 0,
  categoryBudgets: {},
  createdAt: new Date().toISOString(),
  theme: 'light',
  agreedToTerms: false,
  security: {
    pin: null,
    isLocked: false,
    biometricEnabled: false,
  },
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      loading: false,
      
      updateProfile: (updates) => {
        set((state) => ({
          profile: { ...state.profile, ...updates }
        }));
      },
    }),
    {
      name: 'user-storage',
    }
  )
);
