import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import type { Profile } from "@exotic-nursery/types";
import { supabase } from "../services/supabase";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  fetchProfile: () => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,

  setSession: (session) => {
    set({
      session,
      user: session?.user ?? null,
      isLoading: false,
    });
  },

  setProfile: (profile) => set({ profile }),

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      set({ profile: data as Profile });
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  },

  reset: () =>
    set({
      session: null,
      user: null,
      profile: null,
      isLoading: false,
    }),
}));
