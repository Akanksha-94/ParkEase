import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span [class]="tone">{{ label }}</span>`,
  styles: `
    span {
      border-radius: 999px;
      display: inline-flex;
      font-size: 0.78rem;
      font-weight: 900;
      padding: 6px 10px;
    }

    .good {
      background: #daf7e9;
      color: #087a4d;
    }

    .warn {
      background: #ffe4e4;
      color: #a62020;
    }

    .neutral {
      background: #e8eef5;
      color: #4c5c70;
    }
  `
})
export class StatusBadgeComponent {
  @Input({ required: true }) label = '';

  get tone(): 'good' | 'warn' | 'neutral' {
    if (['OPEN', 'APPROVED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED'].includes(this.label)) {
      return 'good';
    }

    if (['CLOSED', 'PENDING', 'CANCELLED'].includes(this.label)) {
      return 'warn';
    }

    return 'neutral';
  }
}
