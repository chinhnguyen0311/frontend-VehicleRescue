// Centralized API Configuration
// Chỉ cần sửa API_BASE_URL ở đây, tất cả services sẽ sử dụng URL này

export const API_CONFIG = {
  API_BASE_URL: "https://api.cuuhogiaothong.io.vn",
} as const;

// Export endpoints
export const API_ENDPOINTS = {
  // Orders/Services
  SERVICES: "/orders/services",
  SEARCH_MECHANICS: "/orders/search",
  CUSTOMER_ORDERS: "/orders/my",
  CREATE_ORDER: "/orders",
  
  // Auth
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  LOGOUT: "/auth/logout",
  
  // Reviews
  CREATE_REVIEW: "/reviews",
  
  // Mechanic
  MECHANIC_REQUESTED_ORDERS: "/mechanic/requested-orders",
  MECHANIC_ACCEPT_ORDER: "/mechanic/order",
  MECHANIC_CANCEL_ORDER: "/mechanic/order",
  MECHANIC_PROFILE: "/mechanic/profile",
  MECHANIC_UPDATE_PROFILE: "/mechanic/profile",
  MECHANIC_UPDATE_SERVICES: "/mechanic/services",
  MECHANIC_AVAILABLE_SERVICES: "/mechanic/available-services",
  MECHANIC_STATISTIC: "/mechanic/statistic",
} as const;

// Helper function to build full URL
export const buildUrl = (endpoint: string, params?: Record<string, string>) => {
  const url = new URL(`${API_CONFIG.API_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
};
