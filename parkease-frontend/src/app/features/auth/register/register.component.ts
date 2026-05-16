import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-wrapper">
      <div class="bg-gradient"></div>
      <div class="bg-mesh"></div>
      
      <div class="auth-card animate-in">
        <div class="card-header">
          <div class="logo-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <h1 class="font-heading">Create Account</h1>
          <p>Initialize your node in the ParkEase ecosystem.</p>
        </div>

        <form (submit)="onSubmit()" #regForm="ngForm">
          <div class="form-group">
            <label>Full Name</label>
            <div class="input-wrap">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input type="text" name="fullName" [(ngModel)]="model.fullName" required placeholder="Major Tom">
            </div>
          </div>

          <div class="form-group">
            <label>Email Address</label>
            <div class="input-wrap">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input type="email" name="email" [(ngModel)]="model.email" required email placeholder="tom@groundcontrol.com">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>Role</label>
              <select class="form-control" name="role" [(ngModel)]="model.role" required>
                <option value="DRIVER">Driver</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label>Plate</label>
              <input type="text" class="form-control" name="plate" [(ngModel)]="model.vehiclePlate" placeholder="ABC-1234">
            </div>
          </div>

          <div class="form-group">
            <label>Security Key</label>
            <div class="input-wrap">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0110 0v4"></path>
              </svg>
              <input type="password" name="password" [(ngModel)]="model.password" required minlength="6" placeholder="••••••••">
            </div>
          </div>

          <button type="submit" class="action-btn primary w-full" [disabled]="regForm.invalid || loading()">
            <span *ngIf="!loading()">Initialize Node</span>
            <div *ngIf="loading()" class="loader"></div>
          </button>

          <div class="card-footer">
            <p>Already registered? <a routerLink="/login">Synchronize Uplink</a></p>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      position: relative;
      width: 100%;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 24px;
      overflow-x: hidden;
      background: var(--bg-base);
    }

    .bg-gradient {
      position: absolute;
      top: -10%; left: -10%; width: 120%; height: 120%;
      background: radial-gradient(circle at 80% 20%, oklch(var(--primary) / 15%) 0%, transparent 40%),
                  radial-gradient(circle at 20% 80%, oklch(var(--accent) / 10%) 0%, transparent 40%);
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
      max-width: 480px;
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
    }

    .form-row { display: flex; gap: 16px; }
    .flex-1 { flex: 1; }

    .input-wrap {
      position: relative;
      .icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: oklch(var(--foreground) / 40%); }
      input, .form-control {
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

    .form-control {
      padding: 14px 16px !important;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 16px center;
      background-size: 16px;
      
      option { background: var(--bg-card); color: var(--text-primary); }
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
export class RegisterComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  model = { fullName: '', email: '', role: 'DRIVER', vehiclePlate: '', password: '', phone: '' };
  loading = signal(false);

  onSubmit() {
    this.loading.set(true);
    this.auth.register(this.model).subscribe({
      next: (res) => {
        this.toast.success('Node initialized. You may now synchronize.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.status === 409 
          ? 'This node (email) is already registered. Please synchronize your existing uplink instead.'
          : (err.error?.message || 'Initialization sequence failed.');
        this.toast.error(msg);
      }
    });
  }
}
