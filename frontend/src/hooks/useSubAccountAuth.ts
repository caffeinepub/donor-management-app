import { useState, useEffect, useCallback } from 'react';
import { Role } from '../backend';

const STORAGE_KEY = 'trusttrack_subaccount';

interface SubAccountSession {
  username: string;
  role: Role;
}

export function useSubAccountAuth() {
  const [session, setSession] = useState<SubAccountSession | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((username: string, role: Role) => {
    const newSession: SubAccountSession = { username, role };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    setSession(newSession);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  const isLoggedIn = session !== null;
  const isSubAdmin = session?.role === Role.admin;
  const isSubUser = session?.role === Role.user;
  const username = session?.username ?? null;
  const role = session?.role ?? null;

  return { session, login, logout, isLoggedIn, isSubAdmin, isSubUser, username, role };
}
