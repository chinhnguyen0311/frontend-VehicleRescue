import type { ApiResponse, RequestedOrder, OrderHistory, MechanicProfile, MechanicService, AvailableService, MechanicStatistic, TopMechanic, MechanicDetail, MechanicStatus } from "../types/mechanic";
import { API_CONFIG, API_ENDPOINTS } from "../config/apiConfig";

export const getRequestedOrders = async (): Promise<RequestedOrder[]> => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("No access token found");
  }

  const res = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.MECHANIC_REQUESTED_ORDERS}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Lỗi khi gọi API requested orders");
  }

  const data: ApiResponse<RequestedOrder[]> = await res.json();
  return data.data;
};

export const acceptOrder = async (orderId: string): Promise<void> => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("No access token found");
  }

  const res = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.MECHANIC_ACCEPT_ORDER}/${orderId}/accept`, {
    method: 'PUT',
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Lỗi khi chấp nhận order");
  }
};

export const cancelOrder = async (orderId: string): Promise<void> => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("No access token found");
  }

  const res = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.MECHANIC_CANCEL_ORDER}/${orderId}/cancel`, {
    method: 'PUT',
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Lỗi khi hủy order");
  }
};

export const getCurrentOrder = async (): Promise<RequestedOrder | null> => {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("No access token found");

  const res = await fetch(`${API_CONFIG.API_BASE_URL}/mechanic/current-order`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error("Lỗi khi lấy current order");

  const json = await res.json();
  if (!json.data) return null;
  // Trả nguyên raw object để giữ field status từ backend
  return json.data as RequestedOrder;
};

export const startInProcess = async (orderId: string): Promise<void> => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("No access token found");
  }

  const res = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.MECHANIC_ACCEPT_ORDER}/${orderId}/in-process`, {
    method: 'PUT',
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Lỗi khi cập nhật trạng thái đang trên đường");
  }
};

export const completeOrder = async (orderId: string): Promise<void> => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("No access token found");
  }

  const res = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.MECHANIC_ACCEPT_ORDER}/${orderId}/complete`, {
    method: 'PUT',
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Lỗi khi hoàn thành order");
  }
};

export const getOrderHistory = async (): Promise<OrderHistory[]> => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("No access token found");
  }

  const res = await fetch(`${API_CONFIG.API_BASE_URL}/mechanic/order-history`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Lỗi khi lấy lịch sử order");
  }

  const data: ApiResponse<OrderHistory[]> = await res.json();
  return data.data;
};

export const getMechanicProfile = async (): Promise<MechanicProfile> => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("No access token found");
  }

  const res = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.MECHANIC_PROFILE}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Lỗi khi lấy hồ sơ mechanic");
  }

  const data: ApiResponse<MechanicProfile> = await res.json();
  return data.data;
};

export const updateMechanicProfile = async (
  profileData: {
    fullName: string;
    phoneNumber: string;
    email: string;
    type: string;
    status?: MechanicStatus;
    garageName?: string;
    garageAddress?: string;
    garageLatitude?: number;
    garageLongitude?: number;
  },
  avatarFile?: File | null
): Promise<void> => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("No access token found");
  }

  const formData = new FormData();

  // SỬA Ở ĐÂY: Kiểm tra khác null và undefined thay vì truthy/falsy
  const textFields = ['fullName', 'phoneNumber', 'email', 'type', 'garageName', 'garageAddress'] as const;
  textFields.forEach(field => {
    // Cho phép append cả chuỗi rỗng ""
    if (profileData[field] !== undefined && profileData[field] !== null) {
      formData.append(field, profileData[field]!);
    }
  });

  if (profileData.status) {
    formData.append("status", profileData.status);
  }

  if (profileData.garageLatitude != null)
    formData.append("garageLatitude", String(profileData.garageLatitude));
  if (profileData.garageLongitude != null)
    formData.append("garageLongitude", String(profileData.garageLongitude));

  if (avatarFile) {
    formData.append("file", avatarFile);
  }

  const res = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.MECHANIC_UPDATE_PROFILE}`, {
    method: 'PUT',
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Lỗi khi cập nhật hồ sơ mechanic" }));
    throw new Error(error.message);
  }
};

export const getMechanicServices = async (): Promise<MechanicService[]> => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("No access token found");
  }

  const res = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.MECHANIC_UPDATE_SERVICES}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Lỗi khi lấy danh sách dịch vụ");
  }

  const data: ApiResponse<MechanicService[]> = await res.json();
  return data.data;
};

export const updateServicePrice = async (serviceId: string, customPrice: number): Promise<void> => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("No access token found");
  }

  const res = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.MECHANIC_UPDATE_SERVICES}/${serviceId}`, {
    method: 'PUT',
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ customPrice }),
  });

  if (!res.ok) {
    throw new Error("Lỗi khi cập nhật giá dịch vụ");
  }
};

export const addMechanicService = async (serviceId: string, customPrice: number): Promise<void> => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("No access token found");
  }

  const res = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.MECHANIC_UPDATE_SERVICES}`, {
    method: 'POST',
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ serviceId, customPrice }),
  });

  if (!res.ok) {
    throw new Error("Lỗi khi thêm dịch vụ mới");
  }
};

export const getAvailableServices = async (): Promise<AvailableService[]> => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("No access token found");
  }

  const res = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SERVICES}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Lỗi khi lấy danh sách dịch vụ có sẵn");
  }

  const data: ApiResponse<AvailableService[]> = await res.json();
  return data.data;
};

export const getStatistic = async (): Promise<MechanicStatistic> => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("No access token found");
  }

  const res = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.MECHANIC_STATISTIC}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Lỗi khi lấy thống kê");
  }

  const data: ApiResponse<MechanicStatistic> = await res.json();
  return data.data;
};

export const getTopMechanics = async (): Promise<TopMechanic[]> => {
  const res = await fetch(`${API_CONFIG.API_BASE_URL}/reviews/top-mechanics`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Lỗi khi lấy danh sách thợ sửa hàng đầu");
  }

  const data: ApiResponse<TopMechanic[]> = await res.json();
  return data.data;
};

export const getMechanicDetail = async (mechanicId: string): Promise<MechanicDetail> => {
  const res = await fetch(`${API_CONFIG.API_BASE_URL}/mechanic/detail/${mechanicId}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Lỗi khi lấy chi tiết thợ sửa");
  }

  const data: ApiResponse<MechanicDetail> = await res.json();
  return data.data;
};
export const RenewalRequest = async (file: File): Promise<void> => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("No access token found");
  }

  // 1. Tạo FormData
  const formData = new FormData();
  // Key "file" phải CHÍNH XÁC khớp với @RequestPart("file") ở Backend
  formData.append("file", file); 

  const res = await fetch(`${API_CONFIG.API_BASE_URL}/mechanic/subscription`, {
    method: 'POST',
    headers: {
      // 2. KHÔNG set "Content-Type" thủ công. 
      // Trình duyệt sẽ tự động thiết lập nó kèm theo "boundary" hợp lệ cho multipart
      "Authorization": `Bearer ${token}`,
    },
    body: formData, // 3. Gửi FormData thay vì JSON.stringify
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || "Lỗi khi gửi yêu cầu gia hạn");
  }
};