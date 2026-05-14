import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-form-side full-width">
        <div class="form-box glass animate-in">
          <div class="form-header">
            <span class="badge badge-warning mb-4">Security Override</span>
            <h2 class="font-heading">Authorize New Key</h2>
            <p>Define a new security key to regain access to your account.</p>
          </div>

          <form (submit)="onSubmit()" #resetForm="ngForm">
            <div class="form-group mb-6">
              <label>New Security Key</label>
              <div class="input-wrap">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0110 0v4"></path></svg>
                <input type="password" name="password" [(ngModel)]="model.newPassword" required minlength="6" placeholder="••••••••" #pass="ngModel">
              </div>
            </div>

            <div class="form-group mb-8">
              <label>Confirm Security Key</label>
              <div class="input-wrap">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0110 0v4"></path></svg>
                <input type="password" name="confirm" [(ngModel)]="confirmPassword" required placeholder="••••••••">
              </div>
              <p class="text-xs mt-2 text-danger" *ngIf="confirmPassword && model.newPassword !== confirmPassword">
                Keys do not match.
              </p>
            </div>

            <button type="submit" class="btn btn-primary btn-lg w-full" [disabled]="resetForm.invalid || model.newPassword !== confirmPassword || loading()">
              <span *ngIf="!loading()">Overwrite Key</span>
              <div *ngIf="loading()" class="loader"></div>
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { display: flex; height: 100vh; background: var(--bg-base); overflow: hidden; justify-content: center; align-items: center; }
    .auth-form-side.full-width { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px; }
    .form-box { width: 100%; max-width: 440px; padding: 48px; border-radius: 24px; }
    .form-header { margin-bottom: 40px; h2 { font-size: 2rem; margin-bottom: 8px; } p { font-size: 14px; color: var(--text-muted); } }
    .input-wrap { position: relative; .icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: var(--text-muted); } input { width: 100%; padding: 14px 16px 14px 48px; background: hsla(255, 255%, 255%, 0.05); border: 1px solid var(--border); border-radius: 12px; color: #fff; font-size: 15px; transition: var(--trans); &:focus { outline: none; border-color: var(--primary); background: hsla(var(--p-primary), 0.05); box-shadow: 0 0 15px var(--primary-glow); } } }
    .loader { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ResetPasswordComponent implements OnInit {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  model = { token: '', newPassword: '' };
  confirmPassword = '';
  loading = signal(false);

  ngOnInit() {
    this.model.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.model.token) {
      this.toast.error('Invalid recovery link. No token provided.');
      this.router.navigate(['/login']);
    }
  }

  onSubmit() {
    this.loading.set(true);
    this.auth.resetPassword(this.model).subscribe({
      next: (res) => {
        this.toast.success('Key overwritten. You can now synchronize with the new key.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.error?.message || 'Key override failed. Link may be expired.');
      }
    });
  }
}
