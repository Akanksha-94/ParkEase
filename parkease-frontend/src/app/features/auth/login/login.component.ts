import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-wrapper">
      <div class="bg-gradient"></div>
      <div class="bg-mesh"></div>
      
      <div class="auth-card animate-in">
        <div class="card-header">
          <div class="logo-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
          </div>
          <h1 class="font-heading">Welcome Back</h1>
          <p>Synchronize your uplink to the ParkEase ecosystem.</p>
        </div>

        <form (submit)="onSubmit()" #loginForm="ngForm">
          <div class="form-group">
            <label>Communication ID</label>
            <div class="input-wrap">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input type="email" name="email" [(ngModel)]="model.email" required email placeholder="major.tom@groundcontrol.com">
            </div>
          </div>

          <div class="form-group">
            <div class="label-row">
              <label>Security Key</label>
              <a routerLink="/forgot-password" class="forgot">Reset Key?</a>
            </div>
            <div class="input-wrap">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0110 0v4"></path>
              </svg>
              <input type="password" name="password" [(ngModel)]="model.password" required minlength="6" placeholder="••••••••">
            </div>
          </div>

          <button type="submit" class="action-btn primary w-full" [disabled]="loginForm.invalid || loading()">
            <span *ngIf="!loading()">Synchronize Uplink</span>
            <div *ngIf="loading()" class="loader"></div>
          </button>

          <div class="card-footer">
            <p>New entity? <a routerLink="/register">Initialize Node</a></p>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      position: relative;
      width: 100%;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow: hidden;
      background: var(--bg-base);
    }

    .bg-gradient {
      position: absolute;
      top: -10%; left: -10%; width: 120%; height: 120%;
      background: radial-gradient(circle at 20% 20%, oklch(var(--primary) / 15%) 0%, transparent 40%),
                  radial-gradient(circle at 80% 80%, oklch(var(--accent) / 10%) 0%, transparent 40%);
      filter: blur(80px);
      z-index: 0;
    }

    .bg-mesh {
      position: absolute; inset: 0;
      background-image: radial-gradient(var(--border-color) 1px, transparent 1px);
      background-size: 50px 50px;
      opacity: 0.1;
      z-index: 0;
    }

    .auth-card {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 440px;
      padding: 48px;
      border-radius: 32px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      box-shadow: 0 40px 100px rgba(0, 0, 0, 0.1);
    }

    .card-header {
      text-align: center;
      margin-bottom: 40px;
      
      .logo-box {
        width: 56px; height: 56px; border-radius: 16px;
        background: var(--text-primary); color: var(--bg-base);
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 24px;
        svg { width: 28px; height: 28px; }
      }
      
      h1 { font-size: 32px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; letter-spacing: -0.02em; }
      p { font-size: 15px; color: oklch(var(--foreground) / 60%); }
    }

    .action-btn {
      display: flex; align-items: center; justify-content: center; height: 52px;
      padding: 0 24px; border-radius: 14px; font-weight: 700; font-size: 15px;
      cursor: pointer; transition: var(--trans); border: none; width: 100%;
      &.primary { 
        background: var(--primary-color); color: #fff; 
        &:hover:not(:disabled) { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 4px 12px var(--primary-glow); } 
        &:disabled { background: oklch(var(--foreground) / 10%); color: oklch(var(--foreground) / 20%); cursor: not-allowed; }
      }
    }

    .form-group {
      margin-bottom: 24px;
      label { display: block; font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
      .label-row { display: flex; justify-content: space-between; align-items: center; }
      .forgot { font-size: 12px; color: var(--primary-color); text-decoration: none; font-weight: 700; &:hover { opacity: 0.8; } }
    }

    .input-wrap {
      position: relative;
      .icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: oklch(var(--foreground) / 40%); }
      input {
        width: 100%; padding: 14px 16px 14px 48px;
        background: oklch(var(--foreground) / 3%);
        border: 1px solid var(--border-color);
        border-radius: 14px;
        color: var(--text-primary);
        font-size: 15px;
        transition: var(--trans);
        
        &::placeholder { color: oklch(var(--foreground) / 25%); }
        &:focus { outline: none; border-color: var(--primary-color); background: oklch(var(--foreground) / 5%); }
      }
    }

    .card-footer {
      text-align: center;
      margin-top: 32px;
      p { font-size: 14px; color: oklch(var(--foreground) / 50%); }
      a { color: var(--primary-color); font-weight: 700; text-decoration: none; &:hover { opacity: 0.8; } }
    }

    .loader { width: 20px; height: 20px; border: 2px solid oklch(var(--foreground) / 10%); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  model = { email: '', password: '' };
  loading = signal(false);

  onSubmit() {
    this.loading.set(true);
    this.auth.login(this.model.email, this.model.password).subscribe({
      next: (res) => {
        this.toast.success('Synchronization complete. Access granted.');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.error?.message || 'Authentication sequence failed.');
      }
    });
  }
}
