import { create } from 'zustand';

interface AppState {
  sidebarOpen: boolean;
  themeMode: 'light' | 'dark';
  globalSearchQuery: string;
  notificationsCount: number;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleThemeMode: () => void;
  setGlobalSearchQuery: (query: string) => void;
  setNotificationsCount: (count: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  themeMode: 'light',
  globalSearchQuery: '',
  notificationsCount: 3,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleThemeMode: () => set((state) => ({ themeMode: state.themeMode === 'light' ? 'dark' : 'light' })),
  setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),
  setNotificationsCount: (count) => set({ notificationsCount: count }),
}));
