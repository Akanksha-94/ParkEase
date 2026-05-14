import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  title?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts$ = new BehaviorSubject<Toast[]>([]);
  readonly toasts$ = this._toasts$.asObservable();
  private counter = 0;

  private add(type: Toast['type'], message: string, title?: string): void {
    const toast: Toast = { id: ++this.counter, type, message, title };
    this._toasts$.next([...this._toasts$.value, toast]);
    setTimeout(() => this.remove(toast.id), 4000);
  }

  success(message: string, title = 'Success') { this.add('success', message, title); }
  error(message: string, title = 'Error')     { this.add('error', message, title); }
  info(message: string, title = 'Info')       { this.add('info', message, title); }
  warning(message: string, title = 'Warning') { this.add('warning', message, title); }

  remove(id: number): void {
    this._toasts$.next(this._toasts$.value.filter(t => t.id !== id));
  }
}
