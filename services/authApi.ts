interface GeocodingResult {
  latitude: number;
  longitude: number;
}

interface RegistrationPayload {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  type: string;
  workType: string;
  garageName?: string;
  garageAddress?: string;
  garageLatitude?: number;
  garageLongitude?: number;
}

import { API_CONFIG } from "../config/apiConfig";

// Geocode address using Nominatim API (free service) with retry logic and fallback
export const geocodeAddress = async (address: string): Promise<GeocodingResult> => {
  if (!address || address.trim().length === 0) {
    throw new Error("Địa chỉ không được để trống");
  }

  const maxRetries = 3;
  const timeout = 8000; // 8 seconds timeout

  const fetchWithTimeout = (url: string, options: RequestInit = {}) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeout)
      ),
    ]);
  };

  // Try with full address first, then try with simplified version
  const addressVariants = [
    address, // Original address
    address.split(',')[0], // Try just the first part
    `${address}, Vietnam`, // Add Vietnam
  ];

  for (const variant of addressVariants) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const encodedAddress = encodeURIComponent(variant.trim());
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("address", variant.trim());
        url.searchParams.set("format", "json");
        url.searchParams.set("limit", "1");
        url.searchParams.set("addressdetails", "1");
        
        console.log(`Geocoding attempt ${attempt} with variant: "${variant}"`);
        
        const response = await fetchWithTimeout(url.toString(), {
          headers: {
            'User-Agent': 'RescueNow/1.0',
            'Accept': 'application/json',
          }
        }) as Response;

        console.log(`Response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`HTTP ${response.status} Error:`, errorText);
          
          if (response.status === 400) {
            // Bad request, try next variant or retry
            break; // Break inner loop to try next variant
          }
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
          throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Geocoding response:", data);
        
        if (!data || data.length === 0) {
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
          throw new Error("Không tìm thấy kết quả");
        }

        const result = data[0];
        
        // Validate coordinates
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        
        if (isNaN(lat) || isNaN(lon)) {
          throw new Error("Tọa độ không hợp lệ");
        }

        return { latitude: lat, longitude: lon };
      } catch (error: any) {
        console.error(`Geocoding attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxRetries) {
          // Try next variant or give up
          continue;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // All variants and retries failed
  throw new Error(
    `Không thể tìm thấy vị trí cho địa chỉ "${address}". ` +
    `Vui lòng nhập địa chỉ chi tiết hơn (ví dụ: Km12 Đường Thăng Long, Hà Nội hoặc 123 Lê Lợi, Q1, TP.HCM)`
  );
};

export const registerUser = async (
  payload: RegistrationPayload, 
  avatarFile?: File | null // Thêm tham số này
): Promise<any> => {
  try {
    // 1. Giữ nguyên logic Validate required fields
    if (!payload.username?.trim()) throw new Error("Tên đăng nhập không được để trống");
    if (!payload.email?.trim()) throw new Error("Email không được để trống");
    if (!payload.password?.trim()) throw new Error("Mật khẩu không được để trống");
    if (!payload.fullName?.trim()) throw new Error("Họ tên không được để trống");
    if (!payload.phoneNumber?.trim()) throw new Error("Số điện thoại không được để trống");
    if (!payload.type?.trim()) throw new Error("Loại phương tiện không được để trống");
    if (!payload.workType?.trim()) throw new Error("Loại công việc không được để trống");

    // 2. Xây dựng FormData thay vì JSON
    const formData = new FormData();
    
    // Append các trường dữ liệu text
    const fieldsToAppend = [
      'username', 'email', 'password', 'fullName', 
      'phoneNumber', 'type', 'workType', 'garageName', 'garageAddress'
    ] as const;

    fieldsToAppend.forEach(field => {
      if (payload[field]?.trim()) {
        formData.append(field, payload[field]!.trim());
      }
    });

    // 3. Append file avatar nếu có
    if (avatarFile) {
      formData.append("file", avatarFile);
    }

    const requestUrl = `${API_CONFIG.API_BASE_URL}/auth/register`;
    console.log("Sending registration with FormData...");

    // 4. Gửi request
    const response = await fetch(requestUrl, {
      method: "POST",
      // QUAN TRỌNG: KHÔNG set Content-Type ở đây. 
      // Trình duyệt sẽ tự động thêm 'multipart/form-data' và boundary
      headers: {
        "Accept": "application/json",
      },
      body: formData,
    });

    if (!response.ok) {
      // Giữ nguyên logic xử lý lỗi cũ
      let errorMessage = "Đăng ký thất bại";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = await response.text();
      }
      throw new Error(errorMessage);
    }

    const data = await response.json().catch(() => ({ message: "Đăng ký thành công" }));
    
    if (data.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
    }

    return data;
  } catch (error: any) {
    console.error("Registration error:", error);
    throw error;
  }
};
