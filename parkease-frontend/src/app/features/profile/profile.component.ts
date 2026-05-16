import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ReservationService } from '../../core/services/reservation.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ParkingLotService } from '../../core/services/parking-lot.service';
import { ToastService } from '../../core/services/toast.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header animate-in">
      <div>
        <h2 class="header-title">Account Control</h2>
        <p class="header-subtitle">Manage your identity and operational parameters within the system.</p>
      </div>
    </div>

    <div class="profile-bento animate-in">
      <!-- Top Left: Main Identity -->
      <section class="bento-card large glass identity-section">
        <div class="identity-header">
          <div class="avatar-wrap">
            <div class="avatar-orb" (click)="fileInput.click()">
              <div class="avatar-fallback" *ngIf="!user?.profilePicture">{{ initials }}</div>
              <img class="avatar-img" *ngIf="user?.profilePicture" [src]="user?.profilePicture" alt="Profile">
              <div class="avatar-edit-hint">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
            </div>
            <div class="avatar-controls">
              <button class="control-btn" (click)="fileInput.click()">Update Photo</button>
              <button class="control-btn danger" *ngIf="user?.profilePicture" (click)="deleteProfilePicture()">Remove</button>
            </div>
            <input type="file" #fileInput hidden accept="image/*" (change)="onFileSelected($event)">
          </div>
          
          <div class="identity-info">
            <div class="name-row">
              <h3 class="user-name">{{ user?.fullName || (user?.firstName + ' ' + user?.lastName) }}</h3>
              <div class="verified-tag">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                VERIFIED
              </div>
            </div>
            <p class="user-email">{{ user?.email }}</p>
            <div class="role-pills">
              <span class="role-pill">{{ user?.role }}</span>
              <span class="role-pill secondary">ParkEase Native</span>
            </div>
          </div>
        </div>

        <div class="identity-form">
          <div class="form-header">
            <span class="form-label">Update Personal Details</span>
          </div>
          <form (submit)="saveProfile()" #profileForm="ngForm">
            <div class="form-grid">
              <div class="form-group">
                <label>Legal Name</label>
                <div class="input-wrap">
                  <input type="text" name="fullName" [(ngModel)]="editProfile.fullName" placeholder="Full name">
                </div>
              </div>
              <div class="form-group">
                <label>Email Address</label>
                <div class="input-wrap">
                  <input type="email" name="email" [(ngModel)]="editProfile.email" placeholder="Email">
                </div>
              </div>
              <div class="form-group full">
                <label>Contact Number</label>
                <div class="input-wrap">
                  <input type="tel" name="phone" [(ngModel)]="editProfile.phone" placeholder="+91 0000000000">
                </div>
              </div>
            </div>
            <button type="submit" class="save-btn" [disabled]="savingProfile()">
              <span>{{ savingProfile() ? 'Processing...' : 'Sync Profile Changes' }}</span>
            </button>
          </form>
        </div>
      </section>

      <!-- Top Right: Quick Stats -->
      <div class="stats-bento">
        <div class="stat-card glass" *ngFor="let s of stats()">
          <span class="stat-label">{{ s.label }}</span>
          <span class="stat-value">{{ s.value }}</span>
          <div class="stat-deco"></div>
        </div>
        
        <section class="identity-badge glass">
          <span class="badge-label">Network Identity</span>
          <div class="badge-data">
            <div class="data-item">
              <span class="l">Registry ID</span>
              <span class="v">USR-{{ user?.userId || user?.id }}</span>
            </div>
            <div class="data-item">
              <span class="l">Access Level</span>
              <span class="v" style="color: var(--primary-color)">{{ user?.role }}</span>
            </div>
          </div>
        </section>
      </div>

      <!-- Bottom Left: Security -->
      <section class="bento-card glass security-section">
        <div class="form-header">
          <span class="form-label">Credentials Authorization</span>
        </div>
        <form (submit)="changePassword()" #pwForm="ngForm">
          <div class="form-group mb-6">
            <label>Current Encryption Key</label>
            <div class="input-wrap">
              <input type="password" name="currentPw" [(ngModel)]="pwChange.current" required placeholder="••••••••">
            </div>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>New Passphrase</label>
              <div class="input-wrap">
                <input type="password" name="newPw" [(ngModel)]="pwChange.newPw" required minlength="6" placeholder="Min 6 chars">
              </div>
            </div>
            <div class="form-group">
              <label>Repeat Passphrase</label>
              <div class="input-wrap">
                <input type="password" name="confirmPw" [(ngModel)]="pwChange.confirm" required placeholder="Repeat passphrase">
              </div>
            </div>
          </div>
          <button type="submit" class="save-btn secondary" [disabled]="pwForm.invalid || pwChange.newPw !== pwChange.confirm || changingPw()">
            <span>{{ changingPw() ? 'Updating...' : 'Refresh Credentials' }}</span>
          </button>
        </form>
      </section>

    </div>
  `,
  styles: [`
    .header-title { font-size: 42px; font-weight: 900; letter-spacing: -2px; color: var(--text-primary); margin: 0; }
    .header-subtitle { color: var(--text-muted); margin-top: 8px; font-size: 15px; }
    .membership-badge { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: oklch(38% 0.1 50 / 10%); border: 1px solid oklch(38% 0.1 50 / 20%); border-radius: 100px; color: #f59e0b; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; svg { width: 14px; height: 14px; } }

    .profile-bento { 
      display: grid; grid-template-columns: 1fr 340px; grid-template-rows: auto auto; gap: 24px; 
    }

    .bento-card { border-radius: 32px; padding: 40px; overflow: hidden; position: relative; }
    
    /* Identity Section */
    .identity-header { display: flex; gap: 40px; align-items: flex-start; margin-bottom: 48px; }
    .avatar-wrap { 
      display: flex; flex-direction: column; align-items: center; gap: 16px;
      .avatar-orb { 
        width: 120px; height: 120px; border-radius: 50%; position: relative; cursor: pointer; 
        background: linear-gradient(135deg, var(--primary-color), var(--accent-color, #8b5cf6)); padding: 4px;
        transition: 0.5s cubic-bezier(0.23, 1, 0.32, 1);
        &:hover { transform: scale(1.05) rotate(5deg); .avatar-edit-hint { opacity: 1; } }
      }
      .avatar-fallback, .avatar-img { width: 100%; height: 100%; border-radius: 50%; background: var(--bg-base); border: 4px solid var(--bg-base); display: flex; align-items: center; justify-content: center; font-size: 44px; font-weight: 900; color: var(--text-primary); object-fit: cover; }
      .avatar-edit-hint { position: absolute; inset: 4px; border-radius: 50%; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.3s; color: #fff; svg { width: 32px; height: 32px; } }
      .avatar-controls { display: flex; gap: 8px; .control-btn { font-size: 10px; font-weight: 800; padding: 6px 12px; border-radius: 100px; background: oklch(var(--foreground) / 5%); border: 1px solid oklch(var(--foreground) / 10%); color: var(--text-muted); cursor: pointer; transition: 0.3s; &:hover { background: var(--text-primary); color: var(--bg-base); } &.danger:hover { background: #ef4444; color: #fff; border-color: #ef4444; } } }
    }

    .identity-info {
      flex: 1;
      .name-row { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; .user-name { font-size: 32px; font-weight: 900; letter-spacing: -1px; margin: 0; } .verified-tag { display: flex; align-items: center; gap: 4px; font-size: 9px; font-weight: 900; color: #10b981; background: oklch(0.6 0.2 150 / 10%); padding: 4px 8px; border-radius: 100px; letter-spacing: 1px; svg { width: 10px; height: 10px; } } }
      .user-email { font-size: 16px; color: var(--text-muted); margin-bottom: 20px; }
      .role-pills { display: flex; gap: 8px; .role-pill { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 6px 12px; border-radius: 100px; background: oklch(var(--primary) / 10%); color: var(--primary-color); border: 1px solid oklch(var(--primary) / 20%); &.secondary { background: oklch(var(--foreground) / 5%); color: var(--text-muted); border-color: oklch(var(--foreground) / 10%); } } }
    }

    /* Forms */
    .form-header { margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid oklch(var(--foreground) / 8%); .form-label { font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 2px; } }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; &.full { grid-template-columns: 1fr; } }
    .form-group { 
      display: flex; flex-direction: column; gap: 8px; &.full { grid-column: span 2; }
      label { font-size: 11px; font-weight: 700; color: var(--text-muted); margin-top: 8px; padding-left: 16px; }
      .input-wrap { 
        position: relative; 
        input { width: 100%; height: 44px; background: oklch(var(--foreground) / 5%); border: 1px solid oklch(var(--foreground) / 10%); border-radius: 99px; padding: 0 24px; color: var(--text-primary); font-size: 14px; font-weight: 600; transition: 0.3s; &:focus { border-color: var(--primary-color); background: oklch(var(--foreground) / 8%); box-shadow: 0 0 20px oklch(var(--primary-glow-raw) / 15%); outline: none; } }
      }
    }
    .save-btn { width: fit-content; padding: 0 32px; height: 44px; border-radius: 14px; border: none; background: var(--text-primary); color: var(--bg-base); font-size: 13px; font-weight: 800; cursor: pointer; transition: 0.4s; &:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 10px 30px oklch(var(--foreground) / 15%); } &:disabled { opacity: 0.5; cursor: not-allowed; } &.secondary { background: oklch(var(--foreground) / 8%); color: var(--text-primary); border: 1px solid oklch(var(--foreground) / 10%); &:hover { background: oklch(var(--foreground) / 12%); } } }

    /* Right Column Stats */
    .stats-bento { display: flex; flex-direction: column; gap: 24px; }
    .stat-card { 
      padding: 32px; border-radius: 28px; position: relative; overflow: hidden;
      display: flex; flex-direction: column; gap: 4px;
      .stat-label { font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
      .stat-value { font-size: 48px; font-weight: 900; color: var(--text-primary); letter-spacing: -2px; }
      .stat-deco { position: absolute; right: -20px; bottom: -20px; width: 100px; height: 100px; border-radius: 50%; background: var(--primary-color); filter: blur(60px); opacity: 0.1; }
    }
    .identity-badge { 
      padding: 32px; border-radius: 28px; 
      .badge-label { font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 20px; }
      .badge-data { display: flex; flex-direction: column; gap: 16px; }
      .data-item { display: flex; flex-direction: column; .l { font-size: 10px; font-weight: 700; color: var(--text-muted); } .v { font-size: 15px; font-weight: 800; } }
    }

    @media (max-width: 1100px) { .profile-bento { grid-template-columns: 1fr; } }
    @keyframes pulse { 0% { transform: scale(0.95); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(0.95); opacity: 0.5; } }
  `]
})
export class ProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private resService = inject(ReservationService);
  private vehicleService = inject(VehicleService);
  private analytics = inject(AnalyticsService);
  private lotService = inject(ParkingLotService);
  private toast = inject(ToastService);

  user = this.auth.currentUser;
  stats = signal<any[]>([]);

  editProfile = {
    fullName: this.auth.currentUser?.fullName ?? '',
    email: this.auth.currentUser?.email ?? '',
    phone: this.auth.currentUser?.phoneNumber ?? ''
  };

  pwChange = { current: '', newPw: '', confirm: '' };
  savingProfile = signal(false);
  changingPw = signal(false);

  get isAdmin(): boolean { return this.auth.role === 'ADMIN'; }
  get isManager(): boolean { return this.auth.role === 'MANAGER'; }

  get initials(): string {
    const u = this.user;
    if (!u) return 'U';
    if (u.firstName) return (u.firstName[0] + (u.lastName?.[0] ?? '')).toUpperCase();
    return (u.fullName ?? u.email ?? 'U').slice(0, 2).toUpperCase();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        this.toast.error('Image size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64Image = e.target.result;
        this.auth.updateUser({ profilePicture: base64Image });
        this.user = this.auth.currentUser;
        this.toast.success('Profile picture updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  }

  deleteProfilePicture() {
    this.auth.updateUser({ profilePicture: '' });
    this.user = this.auth.currentUser;
    this.toast.success('Profile picture removed!');
  }

  ngOnInit() {
    if (this.isAdmin) {
      forkJoin({
        lots: this.lotService.getAll(),
        summary: this.analytics.getPlatformSummary()
      }).subscribe(({ lots, summary }) => {
        this.stats.set([
          { label: 'Network Lots', value: lots.length.toString() },
          { label: 'Active Sessions', value: (summary.totalSpots - summary.availableSpots).toString() }
        ]);
      });
    } else if (this.isManager) {
      const userId = this.auth.currentUser?.userId || this.auth.currentUser?.id;
      if (userId) {
        this.lotService.getAll({ managerId: userId.toString() }).subscribe(lots => {
          this.stats.set([
            { label: 'Managed Lots', value: lots.length.toString() },
            { label: 'Status', value: 'Active' }
          ]);
        });
      }
    } else {
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
