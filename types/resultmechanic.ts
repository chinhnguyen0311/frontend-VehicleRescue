export interface ResultMechanic {
  mechanicId: string;
  displayName: string;
  latitude: number;
  longitude: number;
  phoneNumber: string;
  avatarUrl: string;
  type: string[];
  services: {
    serviceId: string;
    serviceName: string;
    customPrice: number;
  }[];
  ratingScore: number;
  completedOrders: number;
  distance: number;
}