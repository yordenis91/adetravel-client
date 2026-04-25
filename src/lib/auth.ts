import { api } from "@/lib/api";

const TOKEN_KEY = "token";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  agencyRole?: string | null;
  department?: string | null;
  phone?: string | null;
  isActive: boolean;
}

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const auth = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await api.post("/auth/login", payload);
    const data = response.data as AuthResponse;
    setToken(data.token);
    return data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const response = await api.post("/auth/register", payload);
    const data = response.data as AuthResponse;
    setToken(data.token);
    return data;
  },

  logout: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  me: async (): Promise<AuthUser> => {
    const response = await api.get("/auth/me");
    return response.data as AuthUser;
  },

  isAuthenticated: (): boolean => Boolean(localStorage.getItem(TOKEN_KEY)),
};
