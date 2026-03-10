import { create } from 'zustand'

export type UserRole = 'admin' | 'accountant' | 'data_entry' | 'viewer'

export interface AuthUser {
  id: string
  username: string
  role: UserRole
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (user: AuthUser, token: string) => void
  clearAuth: () => void
  updateToken: (token: string) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
  clearAuth: () => set({ user: null, accessToken: null, isAuthenticated: false }),
  updateToken: (accessToken) => set({ accessToken }),
}))
