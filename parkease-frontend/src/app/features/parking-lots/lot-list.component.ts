import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { ParkingLot } from '../../core/models/parking-lot.model';
import { ParkingLotService } from '../../core/services/parking-lot.service';
import { StatusBadgeComponent } from '../../shared/status-badge.component';

@Component({
  selector: 'app-lot-list',
  standalone: true,
  imports: [CurrencyPipe, ReactiveFormsModule, StatusBadgeComponent],
  template: `
    <section class="panel toolbar">
      <form [formGroup]="filters" (ngSubmit)="loadLots()">
        <label class="field"><span>City</span><input formControlName="city" /></label>
        <label class="field"><span>Keyword</span><input formControlName="keyword" /></label>
        <button class="button" type="submit">Search</button>
      </form>
    </section>

    @if (lots.length) {
      <section class="lot-grid">
        @for (lot of lots; track lot.lotId) {
          <article class="panel lot">
            <h2>{{ lot.name }}</h2>
            <p>{{ lot.address }}, {{ lot.city }}</p>
            <div class="badges">
              <app-status-badge [label]="lot.isOpen ? 'OPEN' : 'CLOSED'" />
              <app-status-badge [label]="lot.isApproved ? 'APPROVED' : 'PENDING'" />
            </div>
            <strong>{{ lot.availableSpots }}/{{ lot.totalSpots }} spots</strong>
            <span>{{ lot.hourlyRate | currency:'INR' }} per hour</span>
          </article>
        }
      </section>
    } @else {
      <section class="panel empty-state">{{ loading ? 'Loading parking lots...' : 'No parking lots found.' }}</section>
    }
  `,
  styles: `
    .toolbar {
      margin-bottom: 16px;
      padding: 16px;
    }

    form {
      align-items: end;
      display: grid;
      gap: 14px;
      grid-template-columns: 1fr 1fr auto;
    }

    .lot-grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .lot {
      display: grid;
      gap: 10px;
      padding: 18px;
    }

    h2,
    p {
      margin: 0;
    }

    p,
    span {
      color: var(--text-muted);
    }

    .badges {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    @media (max-width: 920px) {
      form,
      .lot-grid {
        grid-template-columns: 1fr;
      }
    }
  `
})
export class LotListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly lotService = inject(ParkingLotService);

  loading = true;
  lots: ParkingLot[] = [];
  readonly filters = this.fb.nonNullable.group({ city: [''], keyword: [''] });

  ngOnInit(): void {
    this.loadLots();
  }

  loadLots(): void {
    this.loading = true;
    this.lotService.getLots(this.filters.getRawValue()).subscribe({
      next: (lots) => {
        this.lots = lots;
        this.loading = false;
      },
      error: () => {
        this.lots = [];
        this.loading = false;
      }
    });
  }
}
