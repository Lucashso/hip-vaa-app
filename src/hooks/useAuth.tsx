// useAuth — sessão do usuário + role + tenant_id.
// Carrega profile do banco junto com a sessão.

import { useEffect, useState, createContext, useContext } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

export type Role = "owner" | "manager" | "finance" | "coach" | "staff" | "student" | "superadmin" | "coordinator";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  nickname: string | null;
  phone: string | null;
  photo_url: string | null;
  birthdate: string | null;
  cpf: string | null;
  tenant_id: string | null;
  role: Role | null;
  active: boolean;
  address: string | null;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isStudent: boolean;
  isSuperAdmin: boolean;
}

const ADMIN_ROLES: Role[] = ["owner", "manager", "finance", "coordinator"];
const STAFF_ROLES: Role[] = [...ADMIN_ROLES, "coach", "staff"];

export function useAuthState(): AuthState & {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
} {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!session?.user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.error("Erro carregando profile:", error);
          setProfile(null);
        } else {
          setProfile(data as Profile);
        }
        setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  const role = profile?.role ?? null;
  const isAdmin = role !== null && ADMIN_ROLES.includes(role);
  const isStaff = role !== null && STAFF_ROLES.includes(role);
  const isStudent = role === "student";
  const isSuperAdmin = role === "superadmin";

  return {
    session,
    user: session?.user ?? null,
    profile,
    isLoading,
    isAdmin,
    isStaff,
    isStudent,
    isSuperAdmin,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };
}

// Context provider pra compartilhar estado
const AuthContext = createContext<ReturnType<typeof useAuthState> | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value = useAuthState();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
