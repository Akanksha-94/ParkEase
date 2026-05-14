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
    <div class="auth-page">
      <div class="auth-visual">
        <div class="visual-mesh"></div>
        <div class="visual-content animate-in">
          <div class="logo-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
          </div>
          <h1 class="font-heading">Automated <br> <span class="accent-text">Intelligence.</span></h1>
          <p>Access the global network of ParkEase infrastructure and synchronize your assets in real-time.</p>
          
          <div class="tech-stack">
            <div class="tech-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span>Geo-Spatial Mapping</span>
            </div>
            <div class="tech-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
              <span>Encrypted Transactions</span>
            </div>
            <div class="tech-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              <span>Zero-Trust Security</span>
            </div>
          </div>
        </div>
      </div>

      <div class="auth-form-side">
        <div class="form-box glass animate-in">
          <div class="form-header">
            <span class="badge badge-info mb-4">Secure Gateway</span>
            <h2 class="font-heading">Initialize Uplink</h2>
            <p>Enter your authorization credentials to proceed.</p>
          </div>

          <form (submit)="onSubmit()" #loginForm="ngForm">
            <div class="form-group mb-6">
              <label>Service Identifier (Email)</label>
              <div class="input-wrap">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <input type="email" name="email" [(ngModel)]="model.email" required email placeholder="operator@parkease.net" #email="ngModel">
              </div>
            </div>

            <div class="form-group mb-8">
              <div class="flex justify-between items-center mb-2">
                <label>Security Key (Password)</label>
                <a routerLink="/forgot-password" class="text-xs font-bold text-primary">Key Recovery</a>
              </div>
              <div class="input-wrap">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0110 0v4"></path></svg>
                <input type="password" name="password" [(ngModel)]="model.password" required placeholder="••••••••" #password="ngModel">
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-lg w-full" [disabled]="loginForm.invalid || loading()">
              <span *ngIf="!loading()">Synchronize Account</span>
              <div *ngIf="loading()" class="loader"></div>
            </button>

            <div class="footer-note mt-8">
              <p>Operational node not registered? <a routerLink="/register">Initialize Node</a></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { display: flex; height: 100vh; background: var(--bg-base); overflow: hidden; }

    .auth-visual {
      flex: 1.4; position: relative; display: flex; align-items: center; justify-content: center; padding: 80px;
      background: radial-gradient(circle at 0% 0%, hsla(var(--p-primary), 0.15) 0%, transparent 50%),
                  radial-gradient(circle at 100% 100%, hsla(var(--p-accent), 0.1) 0%, transparent 50%),
                  var(--bg-base);
      &::before { content: ''; position: absolute; inset: 0; background: url('https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&q=80&w=1600') center/cover; opacity: 0.15; mix-blend-mode: overlay; }
    }

    .visual-mesh { position: absolute; inset: 0; background-image: radial-gradient(var(--border) 1px, transparent 1px); background-size: 40px 40px; opacity: 0.3; }

    .visual-content {
      position: relative; z-index: 1; max-width: 520px;
      .logo-box { width: 64px; height: 64px; border-radius: 18px; background: linear-gradient(135deg, var(--primary), var(--accent)); color: #fff; display: flex; align-items: center; justify-content: center; margin-bottom: 40px; box-shadow: 0 10px 30px var(--primary-glow); svg { width: 32px; height: 32px; } }
      h1 { font-size: 4.5rem; line-height: 1; margin-bottom: 24px; color: #fff; }
      .accent-text { color: var(--primary); }
      p { font-size: 1.25rem; color: var(--text-secondary); margin-bottom: 48px; }
    }

    .tech-stack {
      display: flex; flex-direction: column; gap: 20px;
      .tech-item { display: flex; align-items: center; gap: 16px; color: var(--text-primary); font-weight: 600; font-size: 14px; svg { width: 20px; height: 20px; color: var(--accent); } }
    }

    .auth-form-side { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px; position: relative; z-index: 2; }

    .form-box {
      width: 100%; max-width: 440px; padding: 48px; border-radius: 24px;
      .form-header { margin-bottom: 40px; h2 { font-size: 2rem; margin-bottom: 8px; } p { font-size: 14px; color: var(--text-muted); } }
    }

    .input-wrap {
      position: relative;
      .icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: var(--text-muted); }
      input { width: 100%; padding: 14px 16px 14px 48px; background: hsla(255, 255%, 255%, 0.05); border: 1px solid var(--border); border-radius: 12px; color: #fff; font-size: 15px; transition: var(--trans); &:focus { outline: none; border-color: var(--primary); background: hsla(var(--p-primary), 0.05); box-shadow: 0 0 15px var(--primary-glow); } }
    }

    .footer-note { text-align: center; p { font-size: 14px; color: var(--text-muted); a { color: #fff; font-weight: 700; text-decoration: none; &:hover { color: var(--primary); } } } }

    .loader { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1024px) { .auth-visual { display: none; } }
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
