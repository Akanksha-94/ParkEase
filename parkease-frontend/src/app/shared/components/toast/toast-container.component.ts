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
           class="toast" 
           [class]="toast.type"
           @toastAnimation>
        <div class="toast-icon">
          <span *ngIf="toast.type === 'success'">✅</span>
          <span *ngIf="toast.type === 'error'">❌</span>
          <span *ngIf="toast.type === 'warning'">⚠️</span>
          <span *ngIf="toast.type === 'info'">ℹ️</span>
        </div>
        <div class="toast-body">
          <div class="toast-title" *ngIf="toast.title">{{ toast.title }}</div>
          <div class="toast-message">{{ toast.message }}</div>
        </div>
        <button class="toast-close" (click)="remove(toast.id)">✕</button>
        <div class="toast-progress"></div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; top: 24px; right: 24px;
      display: flex; flex-direction: column; gap: 12px;
      z-index: 9999; pointer-events: none;
    }

    .toast {
      pointer-events: auto;
      width: 380px; padding: 16px; border-radius: var(--radius-md);
      background: hsla(222, 47%, 12%, 0.85);
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--border);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
      display: flex; gap: 16px;
      position: relative; overflow: hidden;
      animation: toastSlideIn 0.4s var(--ease);

      &::after {
        content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
      }

      &.success { &::after { background: var(--primary); } }
      &.error   { &::after { background: #ff4757; } }
      &.warning { &::after { background: var(--warning); } }
      &.info    { &::after { background: var(--accent); } }
    }

    .toast-icon { 
      font-size: 20px; flex-shrink: 0; 
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255, 255, 255, 0.05);
    }

    .toast-body { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
    .toast-title { font-weight: 700; font-size: 14px; color: #fff; margin-bottom: 2px; }
    .toast-message { font-size: 13px; color: var(--text-secondary); line-height: 1.4; }

    .toast-close {
      background: transparent; border: none; color: var(--text-muted);
      cursor: pointer; font-size: 16px; padding: 4px; line-height: 1;
      transition: var(--trans);
      &:hover { color: #fff; transform: scale(1.1); }
    }

    .toast-progress {
      position: absolute; bottom: 0; left: 0; height: 2px;
      background: rgba(255, 255, 255, 0.2); width: 100%;
      transform-origin: left;
      animation: toastProgress 4s linear forwards;
    }

    @keyframes toastProgress {
      from { transform: scaleX(1); }
      to { transform: scaleX(0); }
    }

    @keyframes toastSlideIn {
      from { transform: translateX(100%) scale(0.9); opacity: 0; }
      to { transform: translateX(0) scale(1); opacity: 1; }
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
