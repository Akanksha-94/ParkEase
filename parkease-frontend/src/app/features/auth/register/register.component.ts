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
    <div class="auth-page">
      <div class="auth-visual">
        <div class="visual-mesh"></div>
        <div class="visual-content animate-in">
          <div class="logo-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
          </div>
          <h1 class="font-heading">Global <br> <span class="accent-text">Network.</span></h1>
          <p>Initialize your node in the ParkEase ecosystem and orchestrate your parking logistics with elite precision.</p>
          
          <div class="tech-stack">
            <div class="tech-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 00-3-3.87"></path><path d="M16 3.13a4 4 0 010 7.75"></path></svg>
              <span>Multi-Tenant Architecture</span>
            </div>
            <div class="tech-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              <span>Real-Time Telemetry</span>
            </div>
            <div class="tech-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"></path></svg>
              <span>Global Edge Deployment</span>
            </div>
          </div>
        </div>
      </div>

      <div class="auth-form-side">
        <div class="form-box glass animate-in">
          <div class="form-header">
            <span class="badge badge-info mb-4">Node Initialization</span>
            <h2 class="font-heading">Register Entity</h2>
            <p>Provision a new account on the ParkEase infrastructure.</p>
          </div>

          <form (submit)="onSubmit()" #regForm="ngForm">
            <div class="form-group mb-4">
              <label>Full Operational Name</label>
              <div class="input-wrap">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <input type="text" name="fullName" [(ngModel)]="model.fullName" required placeholder="Major Tom">
              </div>
            </div>

            <div class="form-group mb-4">
              <label>Communication Channel (Email)</label>
              <div class="input-wrap">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <input type="email" name="email" [(ngModel)]="model.email" required email placeholder="tom@groundcontrol.com">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="form-group">
                <label>Entity Role</label>
                <select class="form-control" name="role" [(ngModel)]="model.role" required>
                  <option value="DRIVER">Fleet Operator</option>
                  <option value="MANAGER">Network Admin</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>
              <div class="form-group">
                <label>Vehicle Plate</label>
                <div class="input-wrap">
                  <input type="text" class="form-control" name="plate" [(ngModel)]="model.vehiclePlate" placeholder="ABC-1234">
                </div>
              </div>
            </div>

            <div class="form-group mb-8">
              <label>Security Key (Password)</label>
              <div class="input-wrap" [class.invalid]="regForm.controls['password']?.invalid && regForm.controls['password']?.touched">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0110 0v4"></path></svg>
                <input type="password" name="password" [(ngModel)]="model.password" #password="ngModel" required minlength="6" placeholder="••••••••">
              </div>
              <div class="error-msg" *ngIf="password.invalid && password.touched">
                <span *ngIf="password.errors?.['required']">Password is mandatory.</span>
                <span *ngIf="password.errors?.['minlength']">Security key must be at least 6 characters.</span>
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-lg w-full" [disabled]="regForm.invalid || loading()">
              <span *ngIf="!loading()">Initialize Entity</span>
              <div *ngIf="loading()" class="loader"></div>
            </button>

            <div class="footer-note mt-8">
              <p>Already have an active node? <a routerLink="/login">Synchronize Uplink</a></p>
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
      &::before { content: ''; position: absolute; inset: 0; background: url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=1600') center/cover; opacity: 0.15; mix-blend-mode: overlay; }
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
      width: 100%; max-width: 480px; padding: 48px; border-radius: 24px;
      .form-header { margin-bottom: 32px; h2 { font-size: 2rem; margin-bottom: 8px; } p { font-size: 14px; color: var(--text-muted); } }
    }

    .input-wrap {
      position: relative;
      .icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: var(--text-muted); }
      input { width: 100%; padding: 12px 16px 12px 48px; background: hsla(255, 255%, 255%, 0.05); border: 1px solid var(--border); border-radius: 12px; color: #fff; font-size: 15px; transition: var(--trans); &:focus { outline: none; border-color: var(--primary); background: hsla(var(--p-primary), 0.05); box-shadow: 0 0 15px var(--primary-glow); } }
      &.invalid input { border-color: var(--danger); box-shadow: 0 0 10px rgba(var(--p-danger), 0.2); }
    }

    .error-msg { font-size: 12px; color: var(--danger); margin-top: 6px; font-weight: 500; display: flex; align-items: center; gap: 4px; }

    .form-control { width: 100%; padding: 12px 16px; background: hsla(255, 255%, 255%, 0.05); border: 1px solid var(--border); border-radius: 12px; color: #fff; font-size: 15px; transition: var(--trans); &:focus { outline: none; border-color: var(--primary); } }
    .form-control option { background: #102236; color: #fff; }

    .footer-note { text-align: center; p { font-size: 14px; color: var(--text-muted); a { color: #fff; font-weight: 700; text-decoration: none; &:hover { color: var(--primary); } } } }

    .loader { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1024px) { .auth-visual { display: none; } }
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
