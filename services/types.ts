// Powered by OnSpace.AI
// BAZGO domain types

export type UserRole = 'merchant' | 'driver';

export interface MerchantProfile {
  companyName: string;
  location: string;
  province: string;
  phone: string;
}

export interface DriverProfile {
  fatherName: string;
  grandfatherName: string;
  province: string;
  vehicleType: string;
  maxCapacity: string;
  driverPhoto: string;
  licensePhoto: string;
  vehiclePhoto: string;
  phone: string;
}

export type RequestStatus =
  | 'available'
  | 'negotiating'
  | 'open'
  | 'applications'
  | 'selected'
  | 'confirmed'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface Driver {
  id: string;
  name: string;
  photo: string;
  vehicleType: string;
  maxCapacity: number;
  vehiclePhoto: string;
  rating: number;
  completedTrips: number;
  verified: boolean;
  province: string;
}

export interface Application {
  id: string;
  freightId: string;
  driverId: string;
  status: ApplicationStatus;
  createdAt: number;
}

export interface FreightRequest {
  id: string;
  merchantId?: string;
  activeNegotiationId?: string | null;
  serverBacked?: boolean;
  merchantName: string;
  merchantRating: number;
  pickupProvince: string;
  pickupArea: string;
  pickupAddress: string;
  deliveryProvince: string;
  deliveryArea: string;
  deliveryAddress: string;
  weightTons: number;
  cargoType: string;
  cargoDescription: string;
  cargoImage: string;
  vehicleType: string;
  priceIQD: number;
  pickupDate: string;
  notes: string;
  status: RequestStatus;
  distanceKm: number;
  createdAt: number;
  selectedDriverId?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderRole: UserRole;
  kind?: 'text' | 'voice';
  audioPath?: string;
  text: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  freightId: string;
  driverId: string;
  freightTitle: string;
  peerName: string;
}

export interface AppNotification {
  id: string;
  role: UserRole;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
}
