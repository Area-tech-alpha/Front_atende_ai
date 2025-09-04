import { API_ENDPOINTS } from "@/config/api";
import apiClient from "@/lib/api.client";
import { createContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  nome_da_instancia: string;
  apikey: string;
  id_instancia: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        apiClient.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      }
    } catch (error) {
      console.error("Falha ao carregar sessão do localStorage", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.post(API_ENDPOINTS.auth.login, {
      email,
      password,
    });

    if (response.data && response.data.user && response.data.token) {
      const { user, token } = response.data;

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUser(user);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    await apiClient.post(API_ENDPOINTS.auth.signup, { name, email, password });
  };

  const logout = () => {
    setUser(null);

    localStorage.removeItem("user");
    localStorage.removeItem("token");

    delete apiClient.defaults.headers.common["Authorization"];

    window.location.href = "/login";
  };

  const value = {
    user,
    isLoading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{!isLoading && children}</AuthContext.Provider>;
};
