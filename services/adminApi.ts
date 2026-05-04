import { API_CONFIG  } from "../config/apiConfig";
import type { DashboardStats,MechanicData,PendingAccount,RenewalRequest, ReportAdminResponse,AdminOrderHistory,AdminOrderHistoryPage } from "../types/admin";
const getAuthHeaders = (): HeadersInit => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}`,
});
 
export const adminService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/admin/dashboard`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
 
    if (!response.ok) {
      throw new Error(`Lỗi khi lấy thống kê: ${response.status}`);
    }
 
    const json = await response.json();
 
    if (!json.success) {
      throw new Error(json.message ?? "Lỗi không xác định");
    }
 
    return json.data as DashboardStats;
  },
  getMechanics: async (): Promise<MechanicData[]> => {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/admin/mechanics`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Lỗi khi lấy danh sách thợ: ${response.status}`);
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.message ?? "Lỗi không xác định");
    }

    return json.data as MechanicData[];
  },
  getPendingAccounts: async (): Promise<PendingAccount[]> => {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/admin/pending-accounts`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Lỗi khi lấy danh sách tài khoản đang chờ: ${response.status}`);
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.message ?? "Lỗi không xác định");
    }

    return json.data as PendingAccount[];
  },
  approveAccount: async (accountId: string): Promise<void> => {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/admin/pending-accounts/${accountId}/approve`, {
      method: "PUT",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Lỗi khi duyệt tài khoản: ${response.status}`);
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.message ?? "Lỗi không xác định");
    }
  },
  rejectAccount: async (accountId: string): Promise<void> => {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/admin/pending-accounts/${accountId}/reject`, {
      method: "PUT",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Lỗi khi từ chối tài khoản: ${response.status}`);
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.message ?? "Lỗi không xác định");
    }
  },
  getRenewalRequests: async (): Promise<RenewalRequest[]> => {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/admin/subscriptions`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Lỗi khi lấy danh sách yêu cầu gia hạn: ${response.status}`);
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.message ?? "Lỗi không xác định");
    }
    return json.data as RenewalRequest[];
  },
  approveRenewal: async (subId: string): Promise<void> => {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/admin/subscriptions/${subId}/approve`, {
      method: "PUT",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Lỗi khi duyệt yêu cầu gia hạn: ${response.status}`);
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.message ?? "Lỗi không xác định");
    }
  },
  rejectRenewal: async (subId: string): Promise<void> => {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/admin/subscriptions/${subId}/reject`, {
      method: "PUT",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Lỗi khi từ chối yêu cầu gia hạn: ${response.status}`);
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.message ?? "Lỗi không xác định");
    }
  },
  getReports: async (): Promise<ReportAdminResponse[]> => {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/admin/reports`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Lỗi khi lấy danh sách báo cáo: ${response.status}`);
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.message ?? "Lỗi không xác định");
    }

    return json.data as ReportAdminResponse[];
  },
  getOrdersHistory: async (page: number = 0, size: number = 10): Promise<AdminOrderHistoryPage> => {
    const response = await fetch(
      `${API_CONFIG.API_BASE_URL}/admin/orders-history?page=${page}&size=${size}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Lỗi khi lấy lịch sử đơn: ${response.status}`);
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.message ?? "Lỗi không xác định");
    }

    return json.data as AdminOrderHistoryPage;
  },
  banMechanic: async (mechanicId: string): Promise<void> => {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/admin/mechanics/${mechanicId}/ban`, {
      method: "PUT",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Lỗi khi cấm tài khoản: ${response.status}`);
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.message ?? "Lỗi không xác định");
    }
  }
};
