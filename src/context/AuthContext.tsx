import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, StudentProfile } from '../types';
import { api, getStoredToken, setStoredToken, removeStoredToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  profile: StudentProfile | null;
  loading: boolean;
  token: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<StudentProfile> & { name?: string }) => Promise<void>;
  refreshProfile: () => Promise<void>;
  saveOnboarding: (data: {
    subjects: string[];
    primaryGoal: string;
    dailyStudyTargetMinutes: number;
  }) => Promise<void>;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState<boolean>(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  const fetchCurrentUser = async () => {
    try {
      if (!getStoredToken()) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const data = await api.getProfile();

      setUser(data.user);
      setProfile(data.profile);

      if (data.profile && !data.profile.completedOnboarding) {
        setShowOnboarding(true);
      }
    } catch (err) {
      const status =
        typeof err === 'object' &&
        err !== null &&
        'status' in err
          ? Number((err as { status?: number }).status)
          : undefined;

      if (status === 401) {
        // The server explicitly rejected the token.
        // Only in this case should we log the user out.
        console.warn('Session expired or invalid. Logging out.');
        removeStoredToken();
        setToken(null);
        setUser(null);
        setProfile(null);
      } else {
        // Network errors, 5xx errors, Gemini errors, temporary
        // backend failures, etc. must NOT destroy the session.
        console.warn(
          'Could not refresh profile. Keeping the current session.',
          err
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.login(credentials);

    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    setProfile(res.profile);

    if (res.profile && !res.profile.completedOnboarding) {
      setShowOnboarding(true);
    }
  };

  const googleLogin = async (credential: string) => {
    const res = await api.googleLogin(credential);

    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    setProfile(res.profile);

    if (res.profile && !res.profile.completedOnboarding) {
      setShowOnboarding(true);
    }
  };

  const register = async (data: any) => {
    const res = await api.register(data);

    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    setProfile(res.profile);
    setShowOnboarding(true);
  };

  const demoLogin = async () => {
    const res = await api.demoLogin();

    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    setProfile(res.profile);
    setShowOnboarding(false);
  };

  const logout = () => {
    removeStoredToken();
    setToken(null);
    setUser(null);
    setProfile(null);
    setShowOnboarding(false);
  };

  const updateProfile = async (
    data: Partial<StudentProfile> & { name?: string }
  ) => {
    const res = await api.updateProfile(data);
    setUser(res.user);
    setProfile(res.profile);
  };

  const refreshProfile = async () => {
    await fetchCurrentUser();
  };

  const saveOnboarding = async (data: {
    subjects: string[];
    primaryGoal: string;
    dailyStudyTargetMinutes: number;
  }) => {
    const res = await api.saveOnboarding(data);
    setProfile(res.profile);
    setShowOnboarding(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        token,
        login,
        googleLogin,
        register,
        demoLogin,
        logout,
        updateProfile,
        refreshProfile,
        saveOnboarding,
        showOnboarding,
        setShowOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
