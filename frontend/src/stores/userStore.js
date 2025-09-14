import axios, { isAxiosError } from "axios";
import { create } from "zustand";

const useUserStore = create((set, get) => ({
  // State
  user: false, // false = loading, null = not authenticated, object = authenticated user
  isFetching: false,

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
}));

export default useUserStore;
