import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ReservationService } from '../../core/services/reservation.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { ToastService } from '../../core/services/toast.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header animate-in">
      <div>
        <h2>Account Control</h2>
        <p>Manage your identity and operational parameters within the system.</p>
      </div>
      <div class="membership-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
        </svg>
        Elite Tier Member
      </div>
    </div>

    <div class="profile-layout animate-in">
      <div class="main-column">
        <!-- Identity Card -->
        <section class="profile-card glass">
          <div class="card-hero">
            <div class="avatar-container">
              <div class="avatar-ring">
                <div class="avatar">{{ initials }}</div>
              </div>
            </div>
            <div class="hero-info">
              <h3>{{ user?.fullName || (user?.firstName + ' ' + user?.lastName) }}</h3>
              <p>{{ user?.email }}</p>
              <div class="roles">
                <span class="badge badge-info">{{ user?.role }}</span>
                <span class="badge badge-success">Verified</span>
              </div>
            </div>
          </div>

          <!-- Edit Profile Form -->
          <div class="section-divider">
            <h4 class="section-title">Update Profile</h4>
          </div>

          <form (submit)="saveProfile()" #profileForm="ngForm">
            <div class="grid grid-cols-2 gap-6 mb-6">
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" class="form-control" name="fullName"
                  [(ngModel)]="editProfile.fullName" placeholder="Your full name">
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" class="form-control" name="email"
                  [(ngModel)]="editProfile.email" placeholder="your@email.com">
              </div>
            </div>
            <div class="form-group mb-6">
              <label>Phone Number</label>
              <input type="tel" class="form-control" name="phone"
                [(ngModel)]="editProfile.phone" placeholder="+91 9876543210">
            </div>
            <button type="submit" class="btn btn-primary" [disabled]="savingProfile()">
              {{ savingProfile() ? 'Saving...' : 'Save Changes' }}
            </button>
          </form>
        </section>

        <!-- Password Change -->
        <section class="security-form glass mt-6">
          <div class="section-divider mb-6">
            <h4 class="section-title">Change Password</h4>
          </div>

          <form (submit)="changePassword()" #pwForm="ngForm">
            <div class="form-group mb-4">
              <label>Current Password</label>
              <input type="password" class="form-control" name="currentPw"
                [(ngModel)]="pwChange.current" required placeholder="••••••••">
            </div>
            <div class="grid grid-cols-2 gap-6 mb-6">
              <div class="form-group">
                <label>New Password</label>
                <input type="password" class="form-control" name="newPw"
                  [(ngModel)]="pwChange.newPw" required minlength="6" placeholder="Min 6 characters">
              </div>
              <div class="form-group">
                <label>Confirm Password</label>
                <input type="password" class="form-control" name="confirmPw"
                  [(ngModel)]="pwChange.confirm" required placeholder="Repeat new password"
                  [class.input-error]="pwChange.newPw && pwChange.confirm && pwChange.newPw !== pwChange.confirm">
              </div>
            </div>
            <div class="text-danger text-sm mb-4 font-bold" *ngIf="pwChange.newPw && pwChange.confirm && pwChange.newPw !== pwChange.confirm">
              Passwords do not match
            </div>
            <button type="submit" class="btn btn-secondary"
              [disabled]="pwForm.invalid || pwChange.newPw !== pwChange.confirm || changingPw()">
              {{ changingPw() ? 'Updating...' : 'Update Password' }}
            </button>
          </form>
        </section>
      </div>

      <div class="side-column">
        <div class="stats-stack">
          <div class="mini-stat glass" *ngFor="let s of stats()">
            <span class="lbl">{{ s.label }}</span>
            <span class="val font-heading">{{ s.value }}</span>
          </div>
        </div>

        <section class="id-card glass">
          <div class="section-title mb-4">System Identity</div>
          <div class="id-fields">
            <div class="id-field">
              <span class="lbl">User ID</span>
              <span class="val">USR-{{ user?.userId || user?.id }}</span>
            </div>
            <div class="id-field">
              <span class="lbl">Role</span>
              <span class="val">{{ user?.role }}</span>
            </div>
            <div class="id-field">
              <span class="lbl">Phone</span>
              <span class="val">{{ user?.phoneNumber || editProfile.phone || 'Not set' }}</span>
            </div>
          </div>
        </section>

        <section class="security-card glass">
          <div class="section-header">
            <h4>Security Matrix</h4>
            <span class="dot active"></span>
          </div>
          <div class="protocol-list">
            <div class="protocol-item">
              <div class="icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div>
              <div class="info">
                <span class="title">JWT Authentication</span>
                <span class="status success">Active</span>
              </div>
            </div>
            <div class="protocol-item">
              <div class="icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0110 0v4"></path></svg></div>
              <div class="info">
                <span class="title">BCrypt Encryption</span>
                <span class="status">Password secured</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .membership-badge { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: hsla(38, 92%, 50%, 0.1); border: 1px solid hsla(38, 92%, 50%, 0.2); border-radius: 12px; color: #f59e0b; font-size: 13px; font-weight: 800; svg { width: 16px; height: 16px; } }

    .profile-layout { display: grid; grid-template-columns: 1fr 300px; gap: 24px; }

    .profile-card, .security-form {
      padding: 40px;
      .card-hero { display: flex; align-items: center; gap: 32px; margin-bottom: 40px; }
      .avatar-container {
        .avatar-ring { padding: 4px; border-radius: 28px; background: linear-gradient(135deg, var(--primary), var(--accent)); .avatar { width: 96px; height: 96px; border-radius: 24px; background: var(--bg-surface); display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: 800; color: #fff; border: 3px solid var(--bg-base); } }
      }
      .hero-info { h3 { font-size: 2rem; margin-bottom: 6px; } p { font-size: 1rem; color: var(--text-muted); margin-bottom: 12px; } .roles { display: flex; gap: 10px; } }
    }

    .section-divider { border-top: 1px solid var(--border); padding-top: 28px; margin-bottom: 24px; }
    .section-title { font-size: 13px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }

    .input-error { border-color: hsl(var(--danger)) !important; }
    .text-danger { color: hsl(var(--danger)); }

    .stats-stack { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }
    .mini-stat { padding: 24px; display: flex; flex-direction: column; gap: 4px; .lbl { font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; } .val { font-size: 2rem; font-weight: 800; color: #fff; } }

    .id-card { padding: 24px; margin-bottom: 20px; .id-fields { display: flex; flex-direction: column; gap: 16px; } .id-field { display: flex; flex-direction: column; .lbl { font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; } .val { font-size: 14px; font-weight: 700; color: #fff; margin-top: 2px; } } }

    .security-card {
      padding: 24px;
      .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; h4 { font-size: 13px; font-weight: 800; text-transform: uppercase; } .dot { width: 8px; height: 8px; border-radius: 50%; &.active { background: #10b981; box-shadow: 0 0 10px #10b981; } } }
      .protocol-list { display: flex; flex-direction: column; gap: 16px; .protocol-item { display: flex; gap: 12px; align-items: center; .icon-box { width: 40px; height: 40px; border-radius: 10px; background: hsla(255, 255%, 255%, 0.03); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--primary); svg { width: 18px; height: 18px; } } .info { display: flex; flex-direction: column; .title { font-size: 13px; font-weight: 700; color: #fff; } .status { font-size: 11px; color: var(--text-muted); &.success { color: #10b981; } } } } }
    }

    @media (max-width: 1024px) { .profile-layout { grid-template-columns: 1fr; } }
  `]
})
export class ProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private resService = inject(ReservationService);
  private vehicleService = inject(VehicleService);
  private toast = inject(ToastService);

  user = this.auth.currentUser;
  stats = signal([
    { label: 'Total Reservations', value: '0' },
    { label: 'Registered Vehicles', value: '0' }
  ]);

  editProfile = {
    fullName: this.auth.currentUser?.fullName ?? '',
    email: this.auth.currentUser?.email ?? '',
    phone: this.auth.currentUser?.phoneNumber ?? ''
  };

  pwChange = { current: '', newPw: '', confirm: '' };
  savingProfile = signal(false);
  changingPw = signal(false);

  get initials(): string {
    const u = this.user;
    if (!u) return 'U';
    if (u.firstName) return (u.firstName[0] + (u.lastName?.[0] ?? '')).toUpperCase();
    return (u.fullName ?? u.email ?? 'U').slice(0, 2).toUpperCase();
  }

  ngOnInit() {
    forkJoin({
      res: this.resService.getMyReservations(),
      v: this.vehicleService.getMyVehicles()
    }).subscribe(({ res, v }) => {
      this.stats.set([
        { label: 'Total Reservations', value: res.length.toString() },
        { label: 'Registered Vehicles', value: v.length.toString() }
      ]);
    });
  }

  saveProfile() {
    this.savingProfile.set(true);
    this.auth.updateProfile({
      fullName: this.editProfile.fullName || undefined,
      email: this.editProfile.email || undefined,
      phone: this.editProfile.phone || undefined
    }).subscribe({
      next: () => {
        this.user = this.auth.currentUser;
        this.toast.success('Profile updated successfully!');
        this.savingProfile.set(false);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to update profile');
        this.savingProfile.set(false);
      }
    });
  }

  changePassword() {
    if (this.pwChange.newPw !== this.pwChange.confirm) return;
    this.changingPw.set(true);
    this.auth.changePassword(this.pwChange.current, this.pwChange.newPw).subscribe({
      next: () => {
        this.toast.success('Password changed successfully!');
        this.pwChange = { current: '', newPw: '', confirm: '' };
        this.changingPw.set(false);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to change password. Check your current password.');
        this.changingPw.set(false);
      }
    });
  }
}
