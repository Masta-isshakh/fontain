import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { Hub } from 'aws-amplify/utils';
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

type AuthFlowCode = 'RESET_PASSWORD' | 'CONFIRM_SIGN_UP' | 'NEW_PASSWORD_REQUIRED';

export interface AuthFlowError extends Error {
  code: AuthFlowCode;
  email: string;
}

function normalizeGroups(groups: unknown): string[] {
  if (Array.isArray(groups)) {
    return groups.filter((group): group is string => typeof group === 'string');
  }
  if (typeof groups === 'string' && groups.trim()) {
    return [groups];
  }
  return [];
}

function resolveRole(groups: string[]): UserRole {
  const normalized = groups.map((group) => group.toLowerCase());
  if (normalized.some((group) => group === 'admin' || group.includes('admin'))) {
    return 'ADMIN';
  }
  return 'FREELANCER';
}

function createAuthFlowError(code: AuthFlowCode, email: string, message: string): AuthFlowError {
  const error = new Error(message) as AuthFlowError;
  error.code = code;
  error.email = email;
  return error;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { withLoading } = useLoading();

  const loadUser = useCallback(async () => {
    try {
      const cognitoUser = await getCurrentUser();
      const session = await fetchAuthSession();
      let attrs: Partial<Record<string, string>> = {};

      try {
        attrs = await fetchUserAttributes();
      } catch {
        attrs = {};
      }

      const accessGroups = normalizeGroups(session.tokens?.accessToken?.payload['cognito:groups']);
      const idGroups = normalizeGroups(session.tokens?.idToken?.payload['cognito:groups']);
      const groups = Array.from(new Set([...accessGroups, ...idGroups]));
      const role = resolveRole(groups);

      setUser({
        userId: cognitoUser.userId,
        email: attrs.email ?? cognitoUser.signInDetails?.loginId ?? '',
        fullName: attrs.fullname ?? attrs.name ?? attrs.email ?? cognitoUser.signInDetails?.loginId ?? '',
        role,
        groups,
      });
      return true;
    } catch {
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUser();

    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      const event = payload.event;

      if (event === 'signedOut') {
        setUser(null);
        setLoading(false);
        return;
      }

      if (event === 'signedIn' || event === 'tokenRefresh') {
        void loadUser();
      }
    });

    return unsubscribe;
  }, [loadUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      await withLoading(async () => {
        try {
          const result = await signIn({ username: email, password });
          const signInStep = result.nextStep?.signInStep;

          if (result.isSignedIn || signInStep === 'DONE') {
            const hasUser = await loadUser();
            if (!hasUser) {
              throw new Error('Connexion reussie, mais le profil n\'a pas pu etre charge. Rechargez la page si le probleme persiste.');
            }
            return;
          }

          if (signInStep === 'RESET_PASSWORD') {
            throw createAuthFlowError(
              'RESET_PASSWORD',
              email,
              'Votre mot de passe doit etre reinitialise avant de continuer.'
            );
          }

          if (signInStep === 'CONFIRM_SIGN_UP') {
            throw createAuthFlowError(
              'CONFIRM_SIGN_UP',
              email,
              'Votre compte n\'est pas encore confirme. Verifiez votre email et terminez l\'inscription.'
            );
          }

          if (signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
            throw createAuthFlowError(
              'NEW_PASSWORD_REQUIRED',
              email,
              'Un nouveau mot de passe est requis avant de continuer.'
            );
          }

          throw new Error('Connexion incomplete. Veuillez terminer les etapes de verification puis reessayer.');
        } catch (err: any) {
          const msg = String(err?.message ?? '').toLowerCase();
          const isAlreadySignedIn =
            msg.includes('already a signed-in user') ||
            msg.includes('already signed in') ||
            err?.name === 'UserAlreadyAuthenticatedException';

          if (isAlreadySignedIn) {
            const hasUser = await loadUser();
            if (hasUser) {
              return;
            }
          }

          throw err;
        }
      }, 'Connexion en cours...');
    },
    [withLoading, loadUser]
  );

  const logout = useCallback(async () => {
    await withLoading(async () => {
      try {
        await signOut();
      } catch (err: any) {
        const msg = String(err?.message ?? '').toLowerCase();
        const isAlreadySignedOut =
          msg.includes('no current user') ||
          msg.includes('not authenticated') ||
          msg.includes('no user is currently signed in');

        if (!isAlreadySignedOut) {
          throw err;
        }
      } finally {
        setUser(null);
      }
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
