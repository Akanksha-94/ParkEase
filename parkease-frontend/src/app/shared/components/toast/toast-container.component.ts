import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toasts$ | async" 
           class="toast glass" 
           [class]="toast.type"
           @toastAnimation>
        <div class="toast-icon-wrapper">
          <div class="toast-icon" [ngSwitch]="toast.type">
            <svg *ngSwitchCase="'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
            <svg *ngSwitchCase="'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
            <svg *ngSwitchCase="'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <svg *ngSwitchCase="'info'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
        </div>
        <div class="toast-content">
          <div class="toast-title" *ngIf="toast.title">{{ toast.title }}</div>
          <div class="toast-message">{{ toast.message }}</div>
        </div>
        <button class="toast-close" (click)="remove(toast.id)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <div class="toast-progress-track">
          <div class="toast-progress-bar"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; top: 32px; right: 32px;
      display: flex; flex-direction: column; gap: 16px;
      z-index: 10000; pointer-events: none;
    }

    .toast {
      pointer-events: auto;
      width: 400px; min-height: 80px; padding: 20px; border-radius: 24px;
      background: var(--bg-card);
      backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--border-color);
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.15);
      display: flex; align-items: flex-start; gap: 16px;
      position: relative; overflow: hidden;
      
      &.success { color: #10b981; border-left: 6px solid #10b981; .toast-icon-wrapper { background: rgba(16, 185, 129, 0.1); color: #10b981; } }
      &.error   { color: #ef4444; border-left: 6px solid #ef4444; .toast-icon-wrapper { background: rgba(239, 68, 68, 0.1); color: #ef4444; } }
      &.warning { color: #f59e0b; border-left: 6px solid #f59e0b; .toast-icon-wrapper { background: rgba(245, 158, 11, 0.1); color: #f59e0b; } }
      &.info    { color: #3b82f6; border-left: 6px solid #3b82f6; .toast-icon-wrapper { background: rgba(59, 130, 246, 0.1); color: #3b82f6; } }
    }

    .toast-icon-wrapper {
      width: 40px; height: 40px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .toast-icon svg { width: 20px; height: 20px; }

    .toast-content { flex: 1; display: flex; flex-direction: column; gap: 4px; padding-top: 2px; }
    .toast-title { font-weight: 900; font-size: 15px; color: var(--text-primary); letter-spacing: -0.5px; }
    .toast-message { font-size: 13px; color: var(--text-secondary); line-height: 1.5; font-weight: 500; }

    .toast-close {
      background: transparent; border: none; color: var(--text-muted);
      cursor: pointer; padding: 4px; transition: 0.3s;
      svg { width: 16px; height: 16px; }
      &:hover { color: var(--text-primary); transform: rotate(90deg); }
    }

    .toast-progress-track {
      position: absolute; bottom: 0; left: 0; right: 0; height: 4px;
      background: var(--border-color);
    }

    .toast-progress-bar {
      height: 100%; width: 100%;
      background: currentColor;
      transform-origin: left;
      animation: toastProgress 4s linear forwards;
    }

    @keyframes toastProgress {
      from { transform: scaleX(1); }
      to { transform: scaleX(0); }
    }
  `],
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class ToastContainerComponent {
  private toastService = inject(ToastService);
  toasts$ = this.toastService.toasts$;

  remove(id: number) {
    this.toastService.remove(id);
  }
}
