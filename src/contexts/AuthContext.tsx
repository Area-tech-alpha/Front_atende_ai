import { API_ENDPOINTS } from "@/config/api";
import axios from "axios";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

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
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (email: string, password: string) => {
    const response = await axios.post(API_ENDPOINTS.auth.login, {
      email,
      password,
    });
    if (response.data && response.data.user) {
      setUser(response.data.user);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    await axios.post(API_ENDPOINTS.auth.signup, { name, email, password });
  };

  const logout = async () => {
    try {
      await axios.post(
        API_ENDPOINTS.auth.logout,
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error(
        "Logout falhou, limpando o estado local de qualquer maneira.",
        error
      );
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.auth.me, {
          withCredentials: true,
        });

        if (response.data && response.data.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserSession();
  }, []);

  const value = {
    user,
    isLoading,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
