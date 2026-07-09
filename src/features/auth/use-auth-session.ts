import { useCallback, useEffect, useState } from "react";
import { AuthError, Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";

export type AuthSessionStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthUserProfile {
  email: string | null;
  id: string;
  is_platform_admin: boolean;
}

export interface AuthSessionState {
  error: AuthError | null;
  isAuthenticated: boolean;
  isPlatformAdmin: boolean;
  isLoading: boolean;
  profile: AuthUserProfile | null;
  session: Session | null;
  status: AuthSessionStatus;
  user: User | null;
}

export interface UseAuthSessionResult extends AuthSessionState {
  refreshSession: () => Promise<Pick<AuthSessionState, "profile" | "session">>;
  signOut: () => Promise<void>;
}

const getStatus = (isLoading: boolean, session: Session | null): AuthSessionStatus => {
  if (isLoading) {
    return "loading";
  }

  return session ? "authenticated" : "unauthenticated";
};

const getFallbackProfile = (user: User): AuthUserProfile => ({
  email: user.email ?? null,
  id: user.id,
  is_platform_admin: false,
});

const fetchAuthProfile = async (user: User | null): Promise<AuthUserProfile | null> => {
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) {
    return getFallbackProfile(user);
  }

  return {
    email: user.email ?? null,
    id: data.id,
    is_platform_admin: data.is_platform_admin === true,
  };
};

export const useAuthSession = (): UseAuthSessionResult => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthUserProfile | null>(null);
  const [error, setError] = useState<AuthError | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setIsLoading(true);

    const { data, error: sessionError } = await supabase.auth.getSession();
    const nextProfile = await fetchAuthProfile(data.session?.user ?? null);

    setSession(data.session);
    setProfile(nextProfile);
    setError(sessionError);
    setIsLoading(false);

    return {
      profile: nextProfile,
      session: data.session,
    };
  }, []);

  const signOut = useCallback(async () => {
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError);
      return;
    }

    setSession(null);
    setProfile(null);
    setError(null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const applyProfile = async (user: User | null) => {
      if (!user) {
        if (isMounted) {
          setProfile(null);
        }
        return;
      }

      const nextProfile = await fetchAuthProfile(user);
      if (isMounted) {
        setProfile(nextProfile);
      }
    };

    const loadSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      setSession(data.session);
      setError(sessionError);
      setIsLoading(false);

      void applyProfile(data.session?.user ?? null);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "INITIAL_SESSION") {
        return;
      }

      if (event === "TOKEN_REFRESHED") {
        setSession(nextSession);
        setError(null);
        return;
      }

      setSession(nextSession);
      setError(null);
      void applyProfile(nextSession?.user ?? null);
    });

    void loadSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const status = getStatus(isLoading, session);
  const isPlatformAdmin = profile?.is_platform_admin === true;

  return {
    error,
    isAuthenticated: status === "authenticated",
    isPlatformAdmin,
    isLoading,
    profile,
    refreshSession,
    session,
    signOut,
    status,
    user: session?.user ?? null,
  };
};
