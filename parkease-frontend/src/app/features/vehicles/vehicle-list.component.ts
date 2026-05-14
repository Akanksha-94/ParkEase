import { Component, OnInit, inject } from '@angular/core';

import { AuthService } from '../../core/auth/auth.service';
import { Vehicle } from '../../core/models/vehicle.model';
import { VehicleService } from '../../core/services/vehicle.service';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  template: `
    @if (vehicles.length) {
      <section class="grid">
        @for (vehicle of vehicles; track vehicle.vehicleId) {
          <article class="panel vehicle">
            <strong>{{ vehicle.licensePlate }}</strong>
            <span>{{ vehicle.make }} {{ vehicle.model }}</span>
            <small>{{ vehicle.color }} / {{ vehicle.vehicleType }}</small>
          </article>
        }
      </section>
    } @else {
      <section class="panel empty-state">{{ loading ? 'Loading vehicles...' : 'No vehicles found.' }}</section>
    }
  `,
  styles: `
    .grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .vehicle {
      display: grid;
      gap: 6px;
      padding: 18px;
    }

    strong {
      font-size: 1.25rem;
    }

    small {
      color: var(--text-muted);
      font-weight: 800;
    }
  `
})
export class VehicleListComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly vehicleService = inject(VehicleService);

  loading = true;
  vehicles: Vehicle[] = [];

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    if (!user) {
      this.loading = false;
      return;
    }

    const request = user.role === 'ADMIN' ? this.vehicleService.getAllVehicles() : this.vehicleService.getVehiclesByOwner(user.userId);
    request.subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles;
        this.loading = false;
      },
      error: () => {
        this.vehicles = [];
        this.loading = false;
      }
    });
  }
}
