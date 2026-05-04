import type { ResultMechanic } from "../types/resultmechanic";
import { API_CONFIG, API_ENDPOINTS } from "../config/apiConfig";

export const searchMechanics = async (body: {
  customerName: string;
  customerPhone: string;
  type: string;
  serviceId: string;
  latitude: number;
  longitude: number;
}): Promise<ResultMechanic[]> => {
  const res = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.SEARCH_MECHANICS}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!json.success) {
    throw new Error(json.message);
  }

  return json.data;
};