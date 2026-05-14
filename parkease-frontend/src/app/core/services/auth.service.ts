import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: number;
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phoneNumber?: string;
  role: string;
  token: string;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly BASE = `${environment.apiBaseUrl}/auth`;
  private readonly TOKEN_KEY = 'pe_token';
  private readonly USER_KEY  = 'pe_user';

  private _user$ = new BehaviorSubject<AuthUser | null>(this.loadUser());
  readonly user$ = this._user$.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  get currentUser(): AuthUser | null { return this._user$.value; }
  get token(): string | null { return localStorage.getItem(this.TOKEN_KEY); }
  get isLoggedIn(): boolean { return !!this.token; }
  get role(): string { return this.currentUser?.role ?? ''; }

  login(email: string, password: string): Observable<ApiResponse<AuthUser>> {
    return this.http.post<ApiResponse<AuthUser>>(`${this.BASE}/login`, { email, password }).pipe(
      tap(res => this.saveSession(res.data))
    );
  }

  register(payload: object): Observable<ApiResponse<AuthUser>> {
    return this.http.post<ApiResponse<AuthUser>>(`${this.BASE}/register`, payload);
  }

  forgotPassword(email: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.BASE}/forgot-password`, { email });
  }

  resetPassword(payload: any): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.BASE}/reset-password`, payload);
  }

  getProfile(): Observable<ApiResponse<AuthUser>> {
    return this.http.get<ApiResponse<AuthUser>>(`${this.BASE}/profile`);
  }

  updateProfile(payload: { fullName?: string; email?: string; phone?: string }): Observable<ApiResponse<AuthUser>> {
    return this.http.put<ApiResponse<AuthUser>>(`${this.BASE}/profile`, payload).pipe(
      tap(res => { if (res.data) this.updateUser(res.data); })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.BASE}/password`, { currentPassword, newPassword });
  }

  logout(): void {
    this.http.post(`${this.BASE}/logout`, {}).subscribe({ error: () => {} });
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._user$.next(null);
    this.router.navigate(['/login']);
  }

  updateUser(user: Partial<AuthUser>): void {
    const updated = { ...this.currentUser!, ...user };
    localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
    this._user$.next(updated);
  }

  private saveSession(data: AuthUser): void {
    localStorage.setItem(this.TOKEN_KEY, data.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(data));
    this._user$.next(data);
  }

  private loadUser(): AuthUser | null {
    try { return JSON.parse(localStorage.getItem(this.USER_KEY) ?? 'null'); }
    catch { return null; }
  }
}
