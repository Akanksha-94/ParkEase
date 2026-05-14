export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
export type BookingType = 'ADVANCE' | 'WALK_IN';
export type VehicleType = 'TWO_WHEELER' | 'FOUR_WHEELER' | 'HEAVY';

export interface Booking {
  bookingId: number;
  userId: number;
  lotId: number;
  spotId: number;
  vehiclePlate: string;
  vehicleType: VehicleType;
  bookingType: BookingType;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalAmount: number;
}
