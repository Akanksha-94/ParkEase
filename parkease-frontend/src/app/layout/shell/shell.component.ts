import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="shell" [class.collapsed]="sidebarCollapsed()">
      <!-- Kinetic Background Matrix -->
      <div class="mesh mesh-a"></div>
      <div class="mesh mesh-b"></div>
      <div class="mesh mesh-c"></div>
      
      <app-sidebar [collapsed]="sidebarCollapsed()" (toggleCollapse)="sidebarCollapsed.set(!sidebarCollapsed())" />
      <div class="shell-main">
        <app-header [sidebarCollapsed]="sidebarCollapsed()" (toggleSidebar)="sidebarCollapsed.set(!sidebarCollapsed())" />
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
      overflow: hidden;

      --sidebar-w: var(--sidebar-w-full);
      &.collapsed { --sidebar-w: var(--sidebar-w-icon); }
    }

    .mesh {
      position: fixed;
      border-radius: 50%;
      filter: blur(100px);
      opacity: 0.45;
      pointer-events: none;
      z-index: 0;
      animation: drift 20s ease-in-out infinite alternate;
    }

    .mesh-a {
      width: 500px; height: 500px;
      left: 10%; top: -10%;
      background: hsla(var(--p-primary), 0.2);
    }

    .mesh-b {
      width: 600px; height: 600px;
      right: -10%; bottom: -10%;
      background: hsla(var(--p-accent), 0.15);
      animation-delay: -5s;
    }

    .mesh-c {
      width: 400px; height: 400px;
      left: 40%; top: 40%;
      background: hsla(142, 71%, 45%, 0.1);
      animation-duration: 25s;
      animation-delay: -10s;
    }

    .shell-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      margin-left: var(--sidebar-w);
      transition: margin-left 0.35s cubic-bezier(0.2, 0, 0, 1);
      position: relative;
      z-index: 1;
    }

    .shell-content {
      flex: 1;
      padding: 32px;
      margin-top: var(--header-height);
      overflow-y: auto;
    }

    @keyframes drift {
      0% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(30px, 50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
      100% { transform: translate(0, 0) scale(1); }
    }

    @media (max-width: 768px) {
      .shell-main { margin-left: 0; }
      .shell-content { padding: 20px; }
    }
  `]
})
export class ShellComponent {
  sidebarCollapsed = signal(false);
}
