import { create } from "zustand";
import { persist } from "zustand/middleware";

// Helper function to detect browser's dark mode preference
const getBrowserDarkModePreference = () => {
  // if smth is undefined, return false (so return val is always boolean)
  return window?.matchMedia?.("(prefers-color-scheme: dark)").matches || false;
};

// Helper function to apply dark mode to DOM
const applyDarkMode = (isDarkMode) => {
  if (typeof document !== "undefined") {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }
};

const useDarkModeStore = create(
  persist(
    (set, get) => ({
      isDarkMode: false, // Default value, will be overridden by persistence or initialization
      toggleDarkMode: () => {
        const newValue = !get().isDarkMode;
        set({ isDarkMode: newValue });
        applyDarkMode(newValue);
      },
      setDarkMode: (value) => {
        set({ isDarkMode: value });
        applyDarkMode(value);
      },
    }),
    {
      name: "vhf-darkMode",
      partialize: (state) => ({ isDarkMode: state.isDarkMode }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.log("An error occurred during hydration", error);
          return;
        }

        if (state) {
          // Apply the rehydrated dark mode value
          applyDarkMode(state.isDarkMode);
        } else {
          // No stored value, use browser preference
          const browserPreference = getBrowserDarkModePreference();
          applyDarkMode(browserPreference);
        }
      },
    },
  ),
);

// Initialize store with browser preference if no stored value exists
if (typeof window !== "undefined") {
  // Check if there's already a stored value
  const stored = localStorage.getItem("vhf-darkMode");
  if (!stored) {
    // No stored value, set browser preference
    const browserPreference = getBrowserDarkModePreference();
    useDarkModeStore.getState().setDarkMode(browserPreference);
  }
}

export default useDarkModeStore;
