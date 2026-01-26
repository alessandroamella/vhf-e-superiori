import axios, { isAxiosError } from "axios";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useUserStore = create(
  persist(
    (set, get) => ({
      // State
      user: false, // false = loading, null = not authenticated, object = authenticated user
      impersonatedUserId: null,
      isFetching: false,

      startImpersonation: (userId) => set({ impersonatedUserId: userId }),
      stopImpersonation: () => set({ impersonatedUserId: null }),

      // Actions
      fetchUser: async () => {
        const { isFetching } = get();
        if (isFetching) return;

        set({ isFetching: true });

        try {
          const { data } = await axios.get("/api/auth");
          console.log("user", data);
          set({ user: data, isFetching: false });
        } catch (err) {
          console.log("no user");
          if (!isAxiosError(err)) {
            console.error(err);
          }
          set({ user: null, isFetching: false });
        }
      },

      setUser: (user) => set({ user }),

      logout: () => set({ user: null }),
    }),
    {
      name: "user-storage", // localStorage name
      partialize: (state) => ({ impersonatedUserId: state.impersonatedUserId }), // Persistiamo solo questo
    },
  ),
);

export default useUserStore;
