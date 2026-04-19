export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  statusCode: number;
  data?: {
    user: User;
    access_token: string;
  };
  message: string;
  timestamp: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
