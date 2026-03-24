// AUTH BYPASS — dev only. Restore original logic before production deploy.
// Original file is documented in newsections.md under "Dev Overrides".
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// DEV BYPASS: mock identity so DashboardLayout and page queries don't null-crash.
// Supabase calls will return empty data (no matching rows), pages will show empty states.
const DEV_USER = { id: "dev-bypass-user" } as unknown as User;
const DEV_PROFILE: UserProfile = {
  id: "dev-bypass-user",
  role: "admin",
  status: "approved",
  full_name: "Dev Preview",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export interface UserProfile {
  id: string;
  role: "trade" | "society" | "admin";
  status: "pending" | "approved" | "suspended";
  full_name: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: UserProfile["role"] | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setProfile(data as UserProfile);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        // DEV BYPASS: inject mock identity when no real session exists.
        setUser(DEV_USER);
        setProfile(DEV_PROFILE);
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        // DEV BYPASS: restore mock instead of clearing profile.
        setUser(DEV_USER);
        setProfile(DEV_PROFILE);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      profile,
      role: profile?.role ?? null,
      isLoading,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
