"use client";

import { create } from "zustand";

interface UiState {
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  commandOpen: false,
  setCommandOpen: (open) => set({ commandOpen: open }),
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
}));
