import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="shell">
      <div class="shell-main">
        <app-header />
        <main class="shell-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      min-height: 100vh;
      background: var(--bg-base);
      position: relative;
    }

    .shell-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      transition: margin-left 0.5s var(--trans);
    }

    .shell-content {
      flex: 1;
      padding: 120px 40px 40px; /* Extra top padding for floating header */
    }

    @media (max-width: 1024px) {
      .shell-content { padding: 100px 24px 24px; }
    }
  `]
})
export class ShellComponent {
  sidebarCollapsed = signal(false);
}
