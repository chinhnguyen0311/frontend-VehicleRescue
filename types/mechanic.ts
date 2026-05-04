export interface AvailableService {
  serviceId: string;
  name: string;
}

export interface MechanicService {
  serviceId: string;
  serviceName: string;
  customPrice: number;
}

export type MechanicStatus = "ONLINE" | "OFFLINE"| "BUSY";

export interface MechanicProfile {
  fullName: string;
  email: string;
  phoneNumber: string;
  type: string;
  workType: string;
  avatarUrl: string;
  subsEndDate: string;
  garageName: string;
  garageAddress: string;
  status: MechanicStatus;
}

export interface RequestedOrder {
  orderId: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  latitude: number;
  longitude: number;
  distance: number;
  address: string;
  createdAt: string;
  status?: string;
}

export interface OrderHistory {
  orderId: string;
  customerName: string;
  phone: string;
  serviceName: string;
  status: string;
  address: string | null;
  completedAt: string;
  rating: number | null;
  review: string | null;
}

export interface MechanicStatistic {
  totalCompletedOrders: number;
  averageRating: number;
  avgOrdersPerMonth: number;
  rankingScore: number;
  recentReviews: Array<{
    createdAt: string;
    customerName: string;
    rating: number;
    review: string;
    serviceName: string;
  }>;
}

export interface TopMechanic {
  mechanicId: string;
  mechanicName: string;
  avgRating: number;
  avatarUrl: string;
  totalReviews: number;
  totalCompleted: number;
}

export interface MechanicReview {
  customerName: string;
  rating: number;
  review: string;
  createdAt: string;
  serviceName?: string;
}
 
export interface MechanicDetail {
  mechanicName: string;
  mechanicPhone: string;
  avatarUrl: string;
  avgRating: number;
  totalReviews: number;
  type: string;
  workType: string;
  address: string;
  recentReviews?: MechanicReview[]; // 👈 thêm mới
}

export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}