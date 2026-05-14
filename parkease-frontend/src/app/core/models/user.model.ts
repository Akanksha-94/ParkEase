export type UserRole = 'DRIVER' | 'STAFF' | 'OFFICER' | 'MANAGER' | 'ADMIN';

export interface User {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  vehiclePlate?: string;
  profilePicUrl?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  tokenType?: string;
  userId: number;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  vehiclePlate?: string;
}
