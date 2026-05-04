import { getToken, onMessage, type MessagePayload } from "firebase/messaging";
import { messaging } from "./firebase";

// ─── Toast Notification ───────────────────────────────────────────────────────

const injectToastStyles = (): void => {
  let style = document.getElementById("fcm-toast-styles");
  
  // Nếu chưa có thì tạo thẻ style mới
  if (!style) {
    style = document.createElement("style");
    style.id = "fcm-toast-styles";
    document.head.appendChild(style);
  }

  // LUÔN LUÔN ghi đè CSS mới nhất (Không dùng lệnh return nữa)
  style.textContent = `
    @keyframes fcm-slide-in {
      from { transform: translateX(110%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
    @keyframes fcm-slide-out {
      from { transform: translateX(0);    opacity: 1; }
      to   { transform: translateX(110%); opacity: 0; }
    }
    @keyframes fcm-progress {
      from { width: 100%; }
      to   { width: 0%;   }
    }

    /* Đổi lại định vị cho container để chuẩn bị cho Mobile */
    .fcm-toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 15px;
      pointer-events: none;
      /* Thêm thuộc tính này để tránh thanh cuộn ngang rác trên mobile */
      max-width: 100vw; 
    }

    .fcm-toast {
      pointer-events: all;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-left: 5px solid #22c55e;
      border-radius: 12px;
      padding: 18px 20px 16px;
      
      /* --- THAY ĐỔI QUAN TRỌNG Ở ĐÂY --- */
      width: 480px; /* Chiều rộng mặc định cho PC */
      max-width: calc(100vw - 40px); /* Đảm bảo không bao giờ tràn màn hình, chừa lề 2 bên 20px */
      /* ---------------------------------- */
      
      min-height: 80px;
      box-shadow:
        0 4px 6px -1px rgba(0,0,0,0.07),
        0 10px 30px -5px rgba(0,0,0,0.12);
      animation: fcm-slide-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .fcm-toast:hover {
      box-shadow:
        0 8px 12px -2px rgba(0,0,0,0.10),
        0 16px 40px -6px rgba(0,0,0,0.16);
    }

    .fcm-toast.fcm-toast-leaving {
      animation: fcm-slide-out 0.3s ease-in forwards;
    }

    .fcm-toast-icon {
      flex-shrink: 0;
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      margin-top: 2px;
    }

    .fcm-toast-body {
      flex: 1;
      min-width: 0;
    }

    .fcm-toast-title {
      font-family: -apple-system, 'Segoe UI', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 6px;
      line-height: 1.4;
      white-space: normal; 
      word-break: break-word;
    }

    .fcm-toast-message {
      font-family: -apple-system, 'Segoe UI', sans-serif;
      font-size: 15px;
      color: #475569;
      margin: 0;
      line-height: 1.6;
      display: block; 
      white-space: normal;
      word-break: break-word;
    }

    .fcm-toast-close {
      flex-shrink: 0;
      background: none;
      border: none;
      cursor: pointer;
      color: #94a3b8;
      padding: 4px 6px;
      border-radius: 6px;
      font-size: 18px;
      line-height: 1;
      transition: color 0.15s, background 0.15s;
      margin-top: -4px;
      margin-right: -4px;
    }
    
    .fcm-toast-close:hover {
      color: #334155;
      background: #f1f5f9;
    }

    .fcm-toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 4px;
      background: linear-gradient(90deg, #4ade80, #16a34a);
      border-radius: 0 0 0 12px;
      animation: fcm-progress linear forwards;
    }

    /* ============================================================== */
    /* CSS MEDIA QUERIES CHO ĐIỆN THOẠI (Màn hình nhỏ hơn 600px) */
    /* ============================================================== */
    @media (max-width: 600px) {
      .fcm-toast-container {
        /* Đẩy thông báo ra giữa màn hình trên mobile hoặc chiếm full width */
        top: 10px;
        right: 10px;
        left: 10px;
        align-items: center; 
      }

      .fcm-toast {
        /* Trên mobile, chiếm 100% không gian cho phép (trừ lề 10px mỗi bên) */
        width: 100%;
        max-width: none; 
        padding: 14px 16px 12px; /* Thu nhỏ padding lại 1 chút */
        gap: 12px; /* Thu nhỏ khoảng cách icon và chữ */
      }

      .fcm-toast-icon {
        width: 36px;
        height: 36px;
        font-size: 18px;
      }

      .fcm-toast-title {
        font-size: 15px; /* Thu nhỏ chữ 1 chút cho đỡ chiếm chỗ */
      }

      .fcm-toast-message {
        font-size: 14px;
      }
    }
  `;
};

const getOrCreateContainer = (): HTMLElement => {
  let container = document.getElementById("fcm-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "fcm-toast-container";
    container.className = "fcm-toast-container";
    document.body.appendChild(container);
  }
  return container;
};

const showToast = (title: string, body: string, duration = 20000): void => {
  injectToastStyles();
  const container = getOrCreateContainer();

  const toast = document.createElement("div");
  toast.className = "fcm-toast";
  toast.innerHTML = `
    <div class="fcm-toast-icon">🔔</div>
    <div class="fcm-toast-body">
      <p class="fcm-toast-title">${title}</p>
      <p class="fcm-toast-message">${body}</p>
    </div>
    <button class="fcm-toast-close" aria-label="Đóng">✕</button>
    <div class="fcm-toast-progress" style="animation-duration: ${duration}ms;"></div>
  `;

  const dismiss = () => {
    toast.classList.add("fcm-toast-leaving");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  };

  toast.querySelector(".fcm-toast-close")?.addEventListener("click", (e) => {
    e.stopPropagation();
    dismiss();
  });
  toast.addEventListener("click", dismiss);

  container.appendChild(toast);
  setTimeout(dismiss, duration);
};

// ─── Firebase Functions ───────────────────────────────────────────────────────

export const requestNotificationPermission = async (): Promise<string | undefined> => {
  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      const currentToken = await getToken(messaging, {
        vapidKey: 'BFzfDnJSZXgKrH0mBcy16_q3oziNt6FfL1d7-cSV-Tz7YGftelsUt7EIRup9tc3-8KVar35cX0F1pSOMWsSYd4A'
      });

      if (currentToken) {
        localStorage.setItem("fcm_token", currentToken);
        return currentToken;
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  } catch (error) {
    console.error("Lỗi khi lấy FCM token:", error);
    return undefined;
  }
};

export const listenForRealtimeMessages = (): void => {
  onMessage(messaging, (payload: MessagePayload) => {
    console.log("Nhận được thông báo Foreground: ", payload);

    if (payload.notification) {
      showToast(
        payload.notification.title ?? "Thông báo",
        payload.notification.body ?? ""
      );
    }
  });
};