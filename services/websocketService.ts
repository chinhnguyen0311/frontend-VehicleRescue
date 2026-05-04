import { Client } from "@stomp/stompjs";
import { API_CONFIG } from "../config/apiConfig";

let client: Client | null = null;
let locationInterval: number | null = null;
let lastLocation: { lat: number; lng: number } | null = null;
let useHttpFallback = false;
let locationPermissionDenied = false;

/**
 * Kết nối STOMP WebSocket
 * Backend config:
 * - Endpoint: /ws
 * - Message mapping: /app/mechanic/location
 * - Broker: /topic
 */
export const connectWebSocket = (token: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Tạo URL STOMP từ API_CONFIG
      const baseUrl = API_CONFIG.API_BASE_URL;
      const wsUrl = baseUrl.replace(/^http/, "ws") + "/ws";

      

      client = new Client({
        brokerURL: wsUrl,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: (str) => {
          // Chỉ log các thông điệp quan trọng
          if (str.includes("Opening") || str.includes("closing") || str.includes("Connection")) {
            
          }
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          
          useHttpFallback = false;
          startSendingLocation(false); // WebSocket mode
          resolve();
        },
        onStompError: (frame) => {
         
          reject(new Error(frame.body));
        },
        onDisconnect: () => {
          
          stopSendingLocation();
        },
        onWebSocketError: (error) => {
          
          reject(error);
        },
      });

      client.activate();

      // Timeout 5 giây nếu không kết nối được
      const timeout = setTimeout(() => {
        if (client && !client.connected) {
          
          client?.deactivate();
          useHttpFallback = true;
          startSendingLocation(true); // HTTP mode
          resolve(); // Resolve promise để không block login
        }
      }, 10000);

      // Clear timeout khi kết nối thành công
      const originalResolve = resolve;
      resolve = () => {
        clearTimeout(timeout);
        originalResolve();
      };
    } catch (error) {
      
      useHttpFallback = true;
      startSendingLocation(true); // HTTP fallback mode
      reject(error);
    }
  });
};

/**
 * Gửi vị trí GPS qua WebSocket
 */
const sendLocationViaWebSocket = (lat: number, lng: number): void => {
  if (!client || !client.connected) {
   
    return;
  }

  try {
    client.publish({
      destination: "/app/mechanic/location",
      body: JSON.stringify({
        latitude: lat,
        longitude: lng,
      }),
    });
    
  } catch (error) {
    
  }
};

/**
 * Gửi vị trí GPS qua HTTP REST API (fallback)
 */
const sendLocationViaHttp = async (lat: number, lng: number): Promise<void> => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    console.warn("⚠️ Không có token");
    return;
  }

  try {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/mechanic/location`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        latitude: lat,
        longitude: lng,
      }),
    });

    if (!response.ok) {
      console.warn("⚠️ HTTP location send failed:", response.status);
      return;
    }

    console.log("📍 Gửi location qua HTTP:", { lat, lng });
  } catch (error) {
    console.error("❌ Lỗi gửi location qua HTTP:", error);
  }
};

/**
 * Gửi vị trí GPS (WebSocket hoặc HTTP)
 */
export const sendLocation = (lat: number, lng: number): void => {
  if (useHttpFallback) {
    sendLocationViaHttp(lat, lng);
  } else if (client?.connected) {
    sendLocationViaWebSocket(lat, lng);
  }
};

/**
 * Bắt đầu gửi GPS mỗi 2-5 phút
 */
const startSendingLocation = (useHttp: boolean): void => {
  if (locationInterval !== null) {
    window.clearInterval(locationInterval);
  }

  useHttpFallback = useHttp;

  // Gửi ngay lập tức
  getCurrentLocation();

  // Thiết lập interval 2-5 phút (ngẫu nhiên)
  const interval = getRandomInterval(2, 5) * 60 * 1000;
  const mode = useHttp ? "HTTP" : "WebSocket";

  locationInterval = window.setInterval(() => {
    getCurrentLocation();
  }, interval);
};

/**
 * Dừng gửi GPS
 */
const stopSendingLocation = (): void => {
  if (locationInterval !== null) {
    window.clearInterval(locationInterval);
    locationInterval = null;
  }
};

/**
 * Lấy vị trí hiện tại và gửi lên server
 */
const getCurrentLocation = (): void => {
  if (!navigator.geolocation) {
    console.error("❌ Geolocation không được hỗ trợ");
    return;
  }

  // Chỉ skip nếu permission CHẮC CHẮN bị từ chối
  // Không skip nếu chỉ là lần đầu (cho phép request permission)
  if (locationPermissionDenied && locationInterval !== null) {
    // Đã xác định permission từ chối và interval đã start
    console.warn("⚠️ Geolocation permission đã bị từ chối, bỏ qua");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      locationPermissionDenied = false; // Reset nếu thành công

      // Kiểm tra xem vị trí có thay đổi đáng kể không
      if (!lastLocation || hasSignificantChange(lastLocation, { lat: latitude, lng: longitude })) {
        lastLocation = { lat: latitude, lng: longitude };
        sendLocation(latitude, longitude);
      }
    },
    (error) => {
      // Error codes: 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
      const errorMessages: { [key: number]: string } = {
        1: "🔒 Người dùng từ chối quyền truy cập vị trí",
        2: "📡 Không thể lấy vị trí GPS (không sẵn sàng)",
        3: "⏱️ Timeout khi lấy vị trí GPS",
      };

      const errorCode = error.code;
      const errorMsg = errorMessages[errorCode] || "❌ Lỗi lấy vị trí GPS: " + error.message;

      if (errorCode === 1) {
        // PERMISSION_DENIED - dừng thử
        if (!locationPermissionDenied) {
          console.error(errorMsg);
          console.error("📋 Hệ thống đã dừng gửi vị trí. Vui lòng cho phép quyền Geolocation trong cài đặt trình duyệt.");
          locationPermissionDenied = true;
        }
      } else if (errorCode === 2) {
        // POSITION_UNAVAILABLE - thử lại
        console.warn(errorMsg);
      } else if (errorCode === 3) {
        // TIMEOUT - thử lại
        console.warn(errorMsg);
      } else {
        console.error(errorMsg);
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
};

/**
 * Lấy vị trí ngay lập tức (để trigger permission prompt khi login)
 */
export const getCurrentLocationNow = (): void => {
  getCurrentLocation();
};

/**
 * Kiểm tra xem vị trí có thay đổi > 100m không
 */
const hasSignificantChange = (prev: { lat: number; lng: number }, curr: { lat: number; lng: number }): boolean => {
  const R = 6371000; // Bán kính Trái Đất (mét)
  const dLat = ((curr.lat - prev.lat) * Math.PI) / 180;
  const dLon = ((curr.lng - prev.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((prev.lat * Math.PI) / 180) *
      Math.cos((curr.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance > 100; // 100 mét
};

/**
 * Lấy khoảng thời gian ngẫu nhiên (phút)
 */
const getRandomInterval = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Kiểm tra STOMP đã kết nối chưa
 */
export const isConnected = (): boolean => {
  return client !== null && client.connected;
};

/**
 * Lấy trạng thái permission GPS
 */
export const isLocationPermissionDenied = (): boolean => {
  return locationPermissionDenied;
};

/**
 * Reset trạng thái permission (dùng khi tính năng được enable lại)
 */
export const resetLocationPermissionState = (): void => {
  locationPermissionDenied = false;
  console.log("🔄 Reset trạng thái Geolocation permission");
};

/**
 * Ngắt kết nối STOMP
 */
export const disconnect = (): void => {
  stopSendingLocation();
  if (client) {
    client.deactivate();
    client = null;
    console.log("🔌 STOMP WebSocket đã ngắt kết nối");
  }
};
