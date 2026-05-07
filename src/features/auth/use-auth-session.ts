import { useCallback, useEffect, useState } from "react";
import { AuthError, Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";

export type AuthSessionStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthSessionState {
  error: AuthError | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  session: Session | null;
  status: AuthSessionStatus;
  user: User | null;
}

export interface UseAuthSessionResult extends AuthSessionState {
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
}

const getStatus = (isLoading: boolean, session: Session | null): AuthSessionStatus => {
  if (isLoading) {
    return "loading";
  }

  return session ? "authenticated" : "unauthenticated";
};

export const useAuthSession = (): UseAuthSessionResult => {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<AuthError | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setIsLoading(true);

    const { data, error: sessionError } = await supabase.auth.getSession();

    setSession(data.session);
    setError(sessionError);
    setIsLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError);
      return;
    }

    setSession(null);
    setError(null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      setSession(data.session);
      setError(sessionError);
      setIsLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setError(null);
      setIsLoading(false);
    });

    void loadSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const status = getStatus(isLoading, session);

  return {
    error,
    isAuthenticated: status === "authenticated",
    isLoading,
    refreshSession,
    session,
    signOut,
    status,
    user: session?.user ?? null,
  };
};
