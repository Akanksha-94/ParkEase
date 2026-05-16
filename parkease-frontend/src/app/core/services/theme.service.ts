import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'parkease-theme';
  isDarkMode = signal<boolean>(this.getInitialTheme());

  constructor() {
    // Synchronize signal state with document body
    effect(() => {
      const isDark = this.isDarkMode();
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light-mode');
        localStorage.setItem(this.THEME_KEY, 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light-mode');
        localStorage.setItem(this.THEME_KEY, 'light');
      }
    });
  }

  toggleTheme() {
    this.isDarkMode.set(!this.isDarkMode());
  }

  private getInitialTheme(): boolean {
    const saved = localStorage.getItem(this.THEME_KEY);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
