"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { getRecoveryCallbackUrl } from "@/lib/auth-urls";
import type { Scan } from "@/lib/types";

type ScanOutcome = { risk: string; fileName: string };

interface SessionValue {
  configured: boolean;
  ready: boolean;
  userEmail: string | null;
  scans: Scan[];
  scansError: string;
  signIn: (email: string, password: string) => Promise<string>;
  signUp: (email: string, password: string) => Promise<string>;
  sendRecovery: (email: string) => Promise<string>;
  signOut: () => Promise<void>;
  scanFile: (file: File) => Promise<ScanOutcome>;
  refreshScans: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside Providers.");
  return value;
}

export function Providers({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [ready, setReady] = useState(() => !createClient());
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [scansError, setScansError] = useState("");

  const clearSession = useCallback(async () => {
    setUserEmail(null);
    setScans([]);
    if (supabase) {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // Keep the UI signed out even if local cleanup fails.
      }
    }
  }, [supabase]);

  const getAccessToken = useCallback(async () => {
    if (!supabase) throw new Error("Supabase is not configured.");

    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      await clearSession();
      throw new Error("Sign in to view or scan files.");
    }

    if (data.session.expires_at && data.session.expires_at * 1000 <= Date.now() + 30_000) {
      const refreshed = await supabase.auth.refreshSession();
      if (refreshed.error || !refreshed.data.session) {
        await clearSession();
        throw new Error("Your sign-in session expired. Sign in again.");
      }
      return refreshed.data.session.access_token;
    }

    return data.session.access_token;
  }, [clearSession, supabase]);

  const refreshScans = useCallback(async () => {
    try {
      const accessToken = await getAccessToken();
      const response = await fetch("/api/scans", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const body = await response.json();
      if (response.status === 401) {
        await clearSession();
        throw new Error(body.error ?? "Your sign-in session was rejected.");
      }
      if (!response.ok) throw new Error(body.error ?? "Scan history could not be loaded.");
      setScans(body.scans ?? []);
      setScansError("");
    } catch (cause) {
      setScansError(cause instanceof Error ? cause.message : "Scan history could not be loaded.");
    }
  }, [clearSession, getAccessToken]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setUserEmail(data.session?.user.email ?? null);
      if (data.session) await refreshScans();
      setReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
      if (!session) setScans([]);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [refreshScans, supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) throw new Error("Supabase is not configured.");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      if (!data.session) throw new Error("Supabase did not return an active session.");
      setUserEmail(data.session.user.email ?? email);
      await refreshScans();
      return "Signed in successfully.";
    },
    [refreshScans, supabase],
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!supabase) throw new Error("Supabase is not configured.");
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      if (!data.session) return "Check your email to confirm your account.";
      setUserEmail(data.session.user.email ?? email);
      await refreshScans();
      return "Account created. Welcome to MiniDSP.";
    },
    [refreshScans, supabase],
  );

  const sendRecovery = useCallback(
    async (email: string) => {
      if (!supabase) throw new Error("Supabase is not configured.");
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: getRecoveryCallbackUrl(window.location.origin),
      });
      if (error) {
        if ("code" in error && error.code === "email_address_invalid") {
          throw new Error(
            "Supabase's email provider rejected this recipient. Check the account email and your Auth email settings.",
          );
        }
        throw error;
      }
      return "If this email belongs to an account, a recovery link will be sent.";
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUserEmail(null);
    setScans([]);
  }, [supabase]);

  const scanFile = useCallback(
    async (file: File) => {
      const accessToken = await getAccessToken();
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/scan", {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const body = await response.json();
      if (response.status === 401) {
        await clearSession();
        throw new Error(body.error ?? "Your sign-in session was rejected.");
      }
      if (!response.ok) throw new Error(body.error ?? "The file could not be scanned.");
      await refreshScans();
      return { risk: body.risk as string, fileName: body.fileName as string };
    },
    [clearSession, getAccessToken, refreshScans],
  );

  const value = useMemo<SessionValue>(
    () => ({
      configured: Boolean(supabase),
      ready,
      userEmail,
      scans,
      scansError,
      signIn,
      signUp,
      sendRecovery,
      signOut,
      scanFile,
      refreshScans,
    }),
    [refreshScans, ready, scanFile, scans, scansError, sendRecovery, signIn, signOut, signUp, supabase, userEmail],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
