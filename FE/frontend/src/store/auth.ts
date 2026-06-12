import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  name: string | null;
  email: string | null;
  isLoggedIn: () => boolean;
  setSession: (token: string, name: string, email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        token: null,
        name: null,
        email: null,
        isLoggedIn: () => get().token !== null,
        setSession: (token, name, email) =>
          set({ token, name, email }, undefined, 'auth/setSession'),
        logout: () =>
          set({ token: null, name: null, email: null }, undefined, 'auth/logout'),
      }),
      { name: 'datashare-auth' },
    ),
    { name: 'AuthStore' },
  ),
);
