import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly BASE = 'http://127.0.0.1:8080/api/v1';

  constructor(private http: HttpClient) {}

  private url(path: string): string { return `${this.BASE}/${path}`; }

  get<T>(path: string, params?: Record<string, string | number | boolean>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) Object.entries(params).forEach(([k,v]) => httpParams = httpParams.set(k, String(v)));
    return this.http.get<ApiResponse<T>>(this.url(path), { params: httpParams }).pipe(map(r => r.data));
  }

  post<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http.post<ApiResponse<T>>(this.url(path), body).pipe(map(r => r.data));
  }

  put<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http.put<ApiResponse<T>>(this.url(path), body).pipe(map(r => r.data));
  }

  patch<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http.patch<ApiResponse<T>>(this.url(path), body).pipe(map(r => r.data));
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<ApiResponse<T>>(this.url(path)).pipe(map(r => r.data));
  }
}
