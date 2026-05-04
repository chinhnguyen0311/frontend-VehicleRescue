import type { Service, ApiResponse } from "../types/service";
import { API_CONFIG, API_ENDPOINTS } from "../config/apiConfig";

export const getServices = async (): Promise<Service[]> => {
  const res = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SERVICES}`);

  if (!res.ok) {
    throw new Error("Lỗi khi gọi API");
  }

  const data: ApiResponse<Service[]> = await res.json();
  return data.data;
};