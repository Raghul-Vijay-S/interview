import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, type User } from "../lib/api";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  setSession: (token: string, user: User) => void;
  updateUser: (user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("nexvora_token")) {
      setLoading(false);
      return;
    }
    api.me()
      .then(({ user }) => setUser(user))
      .catch(() => localStorage.removeItem("nexvora_token"))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    setSession: (token, nextUser) => {
      localStorage.setItem("nexvora_token", token);
      setUser(nextUser);
    },
    updateUser: setUser,
    logout: () => {
      localStorage.removeItem("nexvora_token");
      setUser(null);
    }
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
