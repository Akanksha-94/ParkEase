import { VehicleType } from './booking.model';

export interface Vehicle {
  vehicleId: number;
  ownerId: number;
  licensePlate: string;
  make: string;
  model: string;
  color: string;
  vehicleType: VehicleType;
  evEnabled?: boolean;
}
