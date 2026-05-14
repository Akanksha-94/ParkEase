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
      <!-- Left Side: Visual -->
      <div class="auth-visual">
        <div class="visual-content">
          <div class="logo-large">P</div>
          <h1>Join the <br> <span class="highlight">ParkEase</span> <br> Movement.</h1>
          <p>Create an account to start enjoying stress-free parking with our smart reservation system.</p>
          
          <div class="stat-group">
            <div class="stat-item">
              <span class="val">500+</span>
              <span class="lbl">Parking Lots</span>
            </div>
            <div class="stat-item">
              <span class="val">50k+</span>
              <span class="lbl">Daily Bookings</span>
            </div>
          </div>
        </div>
        <div class="visual-overlay"></div>
      </div>

      <!-- Right Side: Form -->
      <div class="auth-form-container">
        <div class="auth-form-card card">
          <div class="form-header">
            <h2>Create Account</h2>
            <p>Start your journey with us today</p>
          </div>

          <form (submit)="onSubmit()" #regForm="ngForm">
            <div class="grid grid-2 mb-4">
              <div class="form-group">
                <label>First Name</label>
                <input type="text" name="firstName" [(ngModel)]="model.firstName" required placeholder="John">
              </div>
              <div class="form-group">
                <label>Last Name</label>
                <input type="text" name="lastName" [(ngModel)]="model.lastName" required placeholder="Doe">
              </div>
            </div>

            <div class="form-group mb-4">
              <label>Email Address</label>
              <input type="email" name="email" [(ngModel)]="model.email" required email placeholder="john@example.com">
            </div>

            <div class="form-group mb-4">
              <label>Phone Number</label>
              <input type="tel" name="phoneNumber" [(ngModel)]="model.phoneNumber" required placeholder="+1 234 567 890">
            </div>

            <div class="form-group mb-4">
              <label>Account Role</label>
              <select name="role" [(ngModel)]="model.role" required>
                <option value="USER">Driver / User</option>
                <option value="ADMIN">System Administrator</option>
              </select>
            </div>

            <div class="form-group mb-6">
              <label>Password</label>
              <input type="password" name="password" [(ngModel)]="model.password" required minlength="6" placeholder="••••••••">
              <div class="hint">Minimum 6 characters</div>
            </div>

            <button type="submit" 
                    class="btn btn-primary btn-lg w-full mb-4" 
                    [disabled]="regForm.invalid || loading()">
              <span *ngIf="!loading()">Create Account</span>
              <span *ngIf="loading()" class="pe-spinner"></span>
            </button>

            <p class="auth-footer">
              Already have an account? <a routerLink="/login">Sign In</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { display: flex; height: 100vh; overflow: hidden; background: var(--bg-base); }

    .auth-visual {
      flex: 1.2; position: relative;
      background: url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1600') center/cover;
      display: flex; align-items: center; justify-content: center;
      padding: 60px; color: #fff;
      &::before {
        content: ''; position: absolute; inset: 0;
        background: linear-gradient(135deg, rgba(8, 14, 26, 0.95) 0%, rgba(139, 92, 246, 0.4) 100%);
        z-index: 1;
      }
    }

    .visual-content {
      position: relative; z-index: 2; max-width: 500px;
      .logo-large {
        width: 60px; height: 60px; border-radius: 16px;
        background: #8b5cf6; color: #fff;
        font-weight: 900; font-size: 32px;
        display: flex; align-items: center; justify-content: center;
        margin-bottom: 32px; box-shadow: 0 0 40px rgba(139, 92, 246, 0.3);
      }
      h1 { font-size: 3.5rem; color: #fff; margin-bottom: 24px; line-height: 1.1; }
      .highlight { color: #a78bfa; }
      p { font-size: 1.1rem; color: rgba(255,255,255,0.8); margin-bottom: 40px; }
    }

    .stat-group {
      display: flex; gap: 40px;
      .stat-item {
        display: flex; flex-direction: column;
        .val { font-size: 1.5rem; font-weight: 800; color: #fff; }
        .lbl { font-size: 12px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.1em; }
      }
    }

    .auth-form-container { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px; background: var(--bg-base); z-index: 2; }
    .auth-form-card { width: 100%; max-width: 480px; padding: 40px; background: var(--bg-surface); border-color: var(--border); animation: slideInRight 0.5s ease; }
    .form-header { margin-bottom: 32px; h2 { font-size: 1.8rem; margin-bottom: 8px; } p { color: var(--text-muted); font-size: 14px; } }
    .w-full { width: 100%; }
    .auth-footer { text-align: center; font-size: 14px; color: var(--text-muted); a { font-weight: 700; color: var(--text-primary); } }
    .pe-spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; display: inline-block; animation: spin 0.8s linear infinite; }

    @media (max-width: 1024px) { .auth-visual { display: none; } }
  `]
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  model = { firstName: '', lastName: '', email: '', password: '', phoneNumber: '', role: 'USER' };
  loading = signal(false);

  onSubmit() {
    this.loading.set(true);
    this.auth.register(this.model).subscribe({
      next: () => {
        this.toast.success('Account created successfully! Please sign in.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.error?.message || 'Registration failed. Try again.');
      }
    });
  }
}
