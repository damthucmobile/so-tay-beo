import { create } from 'zustand';

export interface HeaderConfig {
  title?: string;
  subtitle?: string;
  badge?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

interface HeaderStoreState {
  customHeader: HeaderConfig | null;
  setCustomHeader: (config: HeaderConfig | null) => void;
}

export const useHeaderStore = create<HeaderStoreState>((set) => ({
  customHeader: null,
  setCustomHeader: (config) => set({ customHeader: config }),
}));
