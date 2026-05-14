import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AuthResponse, LoginRequest, RegisterRequest, User, UserRole } from '../models/user.model';
import { unwrapApiResponse } from '../operators/unwrap-api';

const TOKEN_KEY = 'parkease_token';
const USER_KEY = 'parkease_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;
  private readonly currentUserSubject = new BehaviorSubject<AuthResponse | null>(this.readStoredUser());

  readonly currentUser$ = this.currentUserSubject.asObservable();

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/login`, payload).pipe(
      unwrapApiResponse(),
      tap((response) => this.persistSession(response))
    );
  }

  register(payload: RegisterRequest): Observable<User> {
    return this.http.post<ApiResponse<User>>(`${this.baseUrl}/register`, payload).pipe(unwrapApiResponse());
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getCurrentUser(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  getRole(): UserRole | null {
    return this.currentUserSubject.value?.role ?? null;
  }

  isLoggedIn(): boolean {
    return Boolean(this.getToken());
  }

  private persistSession(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response));
    this.currentUserSubject.next(response);
  }

  private readStoredUser(): AuthResponse | null {
    const rawUser = localStorage.getItem(USER_KEY);
    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as AuthResponse;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
}
