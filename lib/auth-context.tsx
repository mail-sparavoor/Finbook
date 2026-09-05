"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, UserRole, UserStatus } from './types';
import { SEED_USERS } from './storage';

interface AuthContextType {
  currentUser: UserAccount | null;
  users: UserAccount[];
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<{ success: boolean; user?: UserAccount; error?: string }>;
  logout: () => void;
  createUserAccount: (data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    status?: UserStatus;
    currency?: string;
    currencySymbol?: string;
  }) => Promise<{ success: boolean; user?: UserAccount; error?: string }>;
  updateUserAccount: (id: string, data: Partial<UserAccount>) => Promise<{ success: boolean; error?: string }>;
  deleteUserAccount: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<UserAccount[]>(SEED_USERS);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch users & initialize session
  useEffect(() => {
    let isMounted = true;

    // Fast local initialization first so screen never hangs
    const savedUsers = localStorage.getItem('myfinbook_system_users');
    let loadedUsers = SEED_USERS;
    if (savedUsers) {
      try {
        const parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) loadedUsers = parsed;
      } catch {}
    }
    setUsers(loadedUsers);
    const savedSessionUserId = localStorage.getItem('myfinbook_session_user_id');
    if (savedSessionUserId) {
      const matching = loadedUsers.find((u) => u.id === savedSessionUserId);
      setCurrentUser(matching && matching.status === 'ACTIVE' ? matching : null);
    } else {
      setCurrentUser(null);
    }
    setIsLoading(false);

    // Background sync with MySQL
    async function loadAuth() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch('/api/auth', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok && isMounted) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setUsers(json.data);
            const currentSession = localStorage.getItem('myfinbook_session_user_id');
            if (currentSession) {
              const matched = json.data.find((u: UserAccount) => u.id === currentSession);
              if (matched && matched.status === 'ACTIVE') {
                setCurrentUser(matched);
              } else {
                setCurrentUser(null);
                localStorage.removeItem('myfinbook_session_user_id');
              }
            } else {
              setCurrentUser(null);
            }
          }
        }
      } catch (e) {
        console.warn('Backend auth sync deferred', e);
      }
    }

    loadAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (emailOrUsername: string, password: string): Promise<{ success: boolean; user?: UserAccount; error?: string }> => {
    const cleanId = emailOrUsername.trim().toLowerCase();
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LOGIN', email: cleanId, password }),
      });
      const json = await res.json();
      if (json.success && json.user) {
        setCurrentUser(json.user);
        localStorage.setItem('myfinbook_session_user_id', json.user.id);
        return { success: true, user: json.user };
      } else if (res.status === 401 || res.status === 403 || res.status === 404) {
        return { success: false, error: json.error || 'Authentication failed' };
      }
    } catch (e) {
      console.warn('API login request failed, falling back to local auth', e);
    }

    // Fallback authentication
    const foundUser = users.find(
      (u) => (u.email.toLowerCase() === cleanId || u.name.toLowerCase() === cleanId)
    );

    if (!foundUser) {
      return { success: false, error: 'User account not found with this email or username.' };
    }

    if (foundUser.password !== password) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    if (foundUser.status === 'DISABLED') {
      return { success: false, error: 'This user account has been deactivated.' };
    }

    setCurrentUser(foundUser);
    localStorage.setItem('myfinbook_session_user_id', foundUser.id);
    return { success: true, user: foundUser };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('myfinbook_session_user_id');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const createUserAccount = async (data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    status?: UserStatus;
    currency?: string;
    currencySymbol?: string;
  }): Promise<{ success: boolean; user?: UserAccount; error?: string }> => {
    const cleanEmail = data.email.trim().toLowerCase();
    if (!cleanEmail || !data.name.trim() || !data.password) {
      return { success: false, error: 'Please provide all required fields (Name, Email, Password).' };
    }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REGISTER',
          name: data.name,
          email: cleanEmail,
          password: data.password,
          role: data.role || 'USER',
          currency: data.currency || 'INR',
          currencySymbol: data.currencySymbol || '₹',
        }),
      });
      const json = await res.json();
      if (json.success && json.user) {
        setUsers((prev) => [...prev, json.user]);
        return { success: true, user: json.user };
      } else {
        return { success: false, error: json.error || 'Failed to create user account' };
      }
    } catch (e) {
      console.warn('API user registration failed, falling back to local state', e);
    }

    const newUser: UserAccount = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: data.name.trim(),
      email: cleanEmail,
      password: data.password,
      role: data.role || 'USER',
      status: data.status || 'ACTIVE',
      currency: data.currency || 'INR',
      currencySymbol: data.currencySymbol || '₹',
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);
    return { success: true, user: newUser };
  };

  const updateUserAccount = async (id: string, data: Partial<UserAccount>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      const json = await res.json();
      if (!json.success) {
        return { success: false, error: json.error };
      }
    } catch (e) {
      console.warn('API update user failed', e);
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...data };
          if (currentUser && currentUser.id === id) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
    return { success: true };
  };

  const deleteUserAccount = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/auth?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) {
        return { success: false, error: json.error };
      }
    } catch (e) {
      console.warn('API delete user failed', e);
    }

    const updated = users.filter((u) => u.id !== id);
    setUsers(updated);

    if (currentUser && currentUser.id === id) {
      const nextUser = updated.find((u) => u.status === 'ACTIVE') || null;
      setCurrentUser(nextUser);
      if (nextUser) {
        localStorage.setItem('myfinbook_session_user_id', nextUser.id);
      } else {
        localStorage.removeItem('myfinbook_session_user_id');
      }
    }

    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isLoading,
        login,
        logout,
        createUserAccount,
        updateUserAccount,
        deleteUserAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
