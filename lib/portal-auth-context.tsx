"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import type { PortalUser } from "./portal-api";
import { portalAuthApi } from "./portal-api";
import { PORTAL_TOKEN_KEY } from "./portal-config";

interface PortalAuthContextValue {
  portalUser: PortalUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const PortalAuthContext = createContext<PortalAuthContextValue | null>(null);

export function PortalAuthProvider({ children }: { children: React.ReactNode }) {
  const [portalUser, setPortalUser] = useState<PortalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadPortalUser = useCallback(async () => {
    const token = Cookies.get(PORTAL_TOKEN_KEY);
    if (!token) {
      setPortalUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await portalAuthApi.me();
      setPortalUser(data);
    } catch {
      Cookies.remove(PORTAL_TOKEN_KEY);
      setPortalUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortalUser();
  }, [loadPortalUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await portalAuthApi.login(email, password);
      Cookies.set(PORTAL_TOKEN_KEY, data.token, { sameSite: "lax", expires: 7 });
      setPortalUser(data.portalUser);
      router.push("/portal");
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      await portalAuthApi.logout();
    } catch {
      /* ignore */
    }
    Cookies.remove(PORTAL_TOKEN_KEY);
    setPortalUser(null);
    router.push("/portal/login");
  }, [router]);

  return (
    <PortalAuthContext.Provider value={{ portalUser, loading, login, logout }}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth() {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) throw new Error("usePortalAuth must be used within PortalAuthProvider");
  return ctx;
}
