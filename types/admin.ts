
export interface MonthlyStats {
  month: string; 
  requested: number;
  completed: number;
}

export interface ServiceRanking {
  serviceName: string;
  totalRequests: number;
}

export interface TopMechanic {
  mechanicName: string;
  avgRating: number;
  totalCompleted: number;
}

export interface DashboardStats {
  totalCompletedOrders: number;
  totalRequestedOrders: number;
  totalMechanics: number;
  avgOrdersPerMonth: number;
  monthlyStats: MonthlyStats[];
  serviceRanking: ServiceRanking[];
  topMechanics: TopMechanic[];
}

export interface DashboardApiResponse {
  success: boolean;
  code: number;
  message: string;
  data: DashboardStats;
  timestamp: string;
}
export interface MechanicData {
  mechanicId: string;
  mechanicName: string;
  mechanicPhone: string;
  mechanicEmail: string;
  avgRating: number;
  totalCompleted: number;
  workType: string;
  avatarUrl: string | null;
  garageName: string | null;
  garageAddress: string | null;
  createdAt: string;
  expiredAt: string;
  isActive: boolean;
}
export interface PendingAccount{
  accountId: string;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  type : string;
  workType: string;
  garageName: string | null;
  garageAddress: string | null;
  createdAt: string;
}
export interface RenewalRequest {
  subId: string;
  mechanicName: string;
  workType: string;
  currentEndDate: string;
  newEndDate: string;
  renewalDate: string;
  billImageUrl: string;
}
export type ReportedByType = "CUSTOMER" | "MECHANIC" | "SYSTEM";

export interface ReportAdminResponse {
  reportId: string;
  reason: string;
  reportedByType: ReportedByType;
  reporterName: string;
  target: string;
  content: string;
  createdAt: string;
}
export interface AdminOrderHistory {
  orderId: string;
  customerName: string;
  phone: string;
  serviceName: string;
  mechanicName: string;
  mechanicPhone: string;
  status: string;
  address: string | null;
  completedAt: string;
  rating: number | null;
  review: string | null;
}

export interface AdminOrderHistoryPage {
  content: AdminOrderHistory[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  numberOfElements: number;
  sorted: boolean;
}