import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-form-side full-width">
        <div class="form-box glass animate-in">
          <div class="form-header">
            <span class="badge badge-info mb-4">Security Protocol</span>
            <h2 class="font-heading">Key Recovery</h2>
            <p>Initiate authorization reset sequence by providing your identifier.</p>
          </div>

          <form (submit)="onSubmit()" #forgotForm="ngForm" *ngIf="!submitted()">
            <div class="form-group mb-8">
              <label>Service Identifier (Email)</label>
              <div class="input-wrap">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <input type="email" name="email" [(ngModel)]="email" required email placeholder="operator@parkease.net" #emailModel="ngModel">
              </div>
              <p class="text-xs mt-2 text-muted">A recovery uplink will be dispatched to this address.</p>
            </div>

            <button type="submit" class="btn btn-primary btn-lg w-full" [disabled]="forgotForm.invalid || loading()">
              <span *ngIf="!loading()">Initialize Recovery</span>
              <div *ngIf="loading()" class="loader"></div>
            </button>

            <div class="footer-note mt-8">
              <p>Remembered your key? <a routerLink="/login">Return to Gateway</a></p>
            </div>
          </form>

          <div class="success-state animate-in" *ngIf="submitted()">
            <div class="success-icon mb-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h3 class="mb-4">Uplink Dispatched</h3>
            <p class="mb-8">If the identifier exists in our nodes, recovery instructions have been sent. Please check your transmission queue (Email).</p>
            <button class="btn btn-outline w-full" routerLink="/login">Back to Gateway</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { display: flex; height: 100vh; background: var(--bg-base); overflow: hidden; justify-content: center; align-items: center; }
    .auth-form-side.full-width { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px; }
    .form-box { width: 100%; max-width: 440px; padding: 48px; border-radius: 24px; }
    .form-header { margin-bottom: 40px; h2 { font-size: 2rem; margin-bottom: 8px; } p { font-size: 14px; color: var(--text-muted); } }
    .input-wrap { position: relative; .icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: var(--text-muted); } input { width: 100%; padding: 14px 16px 14px 48px; background: hsla(255, 255%, 255%, 0.05); border: 1px solid var(--border); border-radius: 12px; color: var(--text-primary); font-size: 15px; transition: var(--trans); &:focus { outline: none; border-color: var(--primary); background: hsla(var(--p-primary), 0.05); box-shadow: 0 0 15px var(--primary-glow); } } }
    .footer-note { text-align: center; p { font-size: 14px; color: var(--text-muted); a { color: var(--text-primary); font-weight: 700; text-decoration: none; &:hover { color: var(--primary); } } } }
    .success-state { text-align: center; .success-icon { width: 64px; height: 64px; background: hsla(var(--p-success), 0.1); color: var(--success); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; svg { width: 32px; height: 32px; } } h3 { font-size: 1.5rem; color: var(--text-primary); } p { color: var(--text-muted); } }
    .loader { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  email = '';
  loading = signal(false);
  submitted = signal(false);

  onSubmit() {
    this.loading.set(true);
    this.auth.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.submitted.set(true);
        this.toast.success('Recovery sequence initialized.');
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.error?.message || 'Failed to initialize recovery.');
      }
    });
  }
}
