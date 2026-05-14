export interface ParkingLot {
  lotId: number;
  name: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  totalSpots: number;
  availableSpots: number;
  hourlyRate: number;
  openTime?: string;
  closeTime?: string;
  managerId?: number;
  isOpen: boolean;
  isApproved: boolean;
  imageUrl?: string;
}

export interface ParkingLotFilters {
  city?: string;
  keyword?: string;
}
