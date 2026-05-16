import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  signIn,
  signOut,
  getCurrentUser,
  fetchUserAttributes,
  resetPassword,
  confirmResetPassword,
  fetchAuthSession,
} from 'aws-amplify/auth';
import { useLoading } from './LoadingContext';

export type UserRole = 'ADMIN' | 'FREELANCER' | 'PUBLIC';

export interface AuthUser {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  groups: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isFreelancer: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmForgotPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { withLoading } = useLoading();

  const loadUser = useCallback(async () => {
    try {
      const cognitoUser = await getCurrentUser();
      const attrs = await fetchUserAttributes();
      const session = await fetchAuthSession();
      const groups =
        (session.tokens?.accessToken?.payload['cognito:groups'] as string[]) ?? [];

      const role: UserRole = groups.includes('Admin')
        ? 'ADMIN'
        : groups.includes('Freelancer')
        ? 'FREELANCER'
        : 'PUBLIC';

      setUser({
        userId: cognitoUser.userId,
        email: attrs.email ?? '',
        fullName: attrs.name ?? attrs.email ?? '',
        role,
        groups,
      });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      await withLoading(async () => {
        await signIn({ username: email, password });
        await loadUser();
      }, 'Connexion en cours...');
    },
    [withLoading, loadUser]
  );

  const logout = useCallback(async () => {
    await withLoading(async () => {
      await signOut();
      setUser(null);
    }, 'Déconnexion...');
  }, [withLoading]);

  const forgotPassword = useCallback(
    async (email: string) => {
      await withLoading(async () => {
        await resetPassword({ username: email });
      }, 'Envoi du lien...');
    },
    [withLoading]
  );

  const confirmForgotPassword = useCallback(
    async (email: string, code: string, newPassword: string) => {
      await withLoading(async () => {
        await confirmResetPassword({ username: email, confirmationCode: code, newPassword });
      }, 'Réinitialisation...');
    },
    [withLoading]
  );

  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: user !== null,
        isAdmin: user?.role === 'ADMIN',
        isFreelancer: user?.role === 'FREELANCER',
        login,
        logout,
        forgotPassword,
        confirmForgotPassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
