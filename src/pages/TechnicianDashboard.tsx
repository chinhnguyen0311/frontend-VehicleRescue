import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  TrendingUp,
  User,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Award,
  Calendar,
  Wrench,
  Car,
  Bike,
  Truck,
  Navigation,
  Map,
  RefreshCw,
  AlertCircle,
  Flag,
  AlertTriangle,
  Power,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";
import { getRequestedOrders, acceptOrder, cancelOrder, getCurrentOrder, startInProcess, completeOrder, getOrderHistory, getMechanicProfile, updateMechanicProfile, getMechanicServices, updateServicePrice, addMechanicService, getAvailableServices, getStatistic,RenewalRequest } from "../../services/mechanicApi";
// Đã thêm connectWebSocket vào đây
import { connectWebSocket, disconnect, sendLocation, isConnected } from "../../services/websocketService";
import { API_CONFIG, API_ENDPOINTS } from "../../config/apiConfig";
import type { MechanicService, AvailableService, MechanicStatistic } from "../../types/mechanic";

interface RescueRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  location: string;
  distance: string;
  timestamp: string;
  status:
    | "pending"
    | "accepted"
    | "in-progress"
    | "completed"
    | "cancelled";
  price?: number;
  rating?: number;
  review?: string;
}

interface TechnicianProfile {
  username: string;
  name: string;
  email: string;
  phone: string;
  vehicleTypes: string[];
  joinDate: string;
  expiryDate: string;
  isActive: boolean;
  garageName?: string;
  garageAddress?: string;
  type?: string;
  workType?: string;
  avatarUrl?: string;
}

export function TechnicianDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "new" | "tracking" | "history" | "stats" | "profile"
  >("new");
  const [profile, setProfile] = useState<TechnicianProfile>({
    username: "thosua",
    name: "Nguyễn Văn Thợ",
    email: "thosua@example.com",
    phone: "0901234567",
    vehicleTypes: ["motorcycle", "car"],
    joinDate: "2024-01-15",
    expiryDate: "2026-05-15",
    isActive: true,
    avatarUrl: "/default-avatar.png",
  });
  const [editMode, setEditMode] = useState(false);
  const [requests, setRequests] = useState<RescueRequest[]>([]);
  const [activeRequest, setActiveRequest] =
    useState<RescueRequest | null>(null);
  const [orderHistory, setOrderHistory] = useState<RescueRequest[]>([]);
  const [services, setServices] = useState<MechanicService[]>([]);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>("");
  const [addingService, setAddingService] = useState(false);
  const [newServiceId, setNewServiceId] = useState<string>("");
  const [newServicePrice, setNewServicePrice] = useState<string>("");
  const [availableServices, setAvailableServices] = useState<AvailableService[]>([]);
  const [statistic, setStatistic] = useState<MechanicStatistic | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationUpdateInterval, setLocationUpdateInterval] = useState<number | null>(null);
  const [showRenewalForm, setShowRenewalForm] = useState(false);
  const [billFile, setBillFile] = useState<File | null>(null);
  const [isSubmittingRenewal, setIsSubmittingRenewal] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [mechanicStatus, setMechanicStatus] = useState<"ONLINE" | "OFFLINE" | "BUSY">("OFFLINE");
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Report state
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportType, setReportType] = useState<"CUSTOMER" | "SYSTEM">("CUSTOMER");
  const [reportTargetOrder, setReportTargetOrder] = useState<RescueRequest | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportContent, setReportContent] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const CUSTOMER_REASONS = [
    { value: "CUSTOMER_NOT_PRESENT", label: "Khách hàng không có mặt tại điểm hẹn" },
    { value: "CUSTOMER_UNCOOPERATIVE", label: "Khách hàng không hợp tác" },
  ];

  const SYSTEM_REASONS = [
    { value: "APP_ERROR", label: "Lỗi hệ thống" },
    { value: "LOCATION_ERROR", label: "Lỗi định vị / vị trí sai" },
    { value: "NOT_RECEIVING_ORDERS", label: "Không nhận được yêu cầu mới" },
    { value: "EXTEND_ERROR", label: "Lỗi gia hạn tài khoản" },
  ];

  const handleOpenCustomerReport = (order: RescueRequest) => {
    setReportType("CUSTOMER");
    setReportTargetOrder(order);
    setReportReason("");
    setReportContent("");
    setShowReportDialog(true);
  };

  const handleOpenSystemReport = () => {
    setReportType("SYSTEM");
    setReportTargetOrder(null);
    setReportReason("");
    setReportContent("");
    setShowReportDialog(true);
  };

  const handleSubmitReport = async () => {
    if (!reportReason) {
      toast.error("Vui lòng chọn lý do báo cáo");
      return;
    }
    if (!reportContent.trim()) {
      toast.error("Vui lòng nhập nội dung báo cáo");
      return;
    }

    setSubmittingReport(true);
    try {
      const token = localStorage.getItem("accessToken");
      const body: Record<string, any> = {
        targetType: reportType,
        reasonCategory: reportReason,
        content: reportContent.trim(),
      };

      if (reportType === "CUSTOMER" && reportTargetOrder) {
        body.orderId = reportTargetOrder.id;
        body.targetPhone = reportTargetOrder.customerPhone;
      }

      const res = await fetch(`${API_CONFIG.API_BASE_URL}/mechanic/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Không thể gửi báo cáo");

      toast.success("Báo Cáo Đã Được Gửi!", {
        description: "Chúng tôi sẽ xem xét và xử lý trong thời gian sớm nhất.",
      });

      setShowReportDialog(false);
      setReportReason("");
      setReportContent("");
      setReportTargetOrder(null);
    } catch (err: any) {
      toast.error("Lỗi khi gửi báo cáo", { description: err.message });
    } finally {
      setSubmittingReport(false);
    }
  };

  const vehicleOptions = [
    { id: "motorbike", label: "Xe Máy", icon: Bike },
    { id: "car", label: "Ô Tô", icon: Car },
    { id: "truck", label: "Xe Tải", icon: Truck },
  ];

  // Request location permission when component mounts
  useEffect(() => {
    // Show location permission prompt
    toast.info("Cho Phép Truy Cập Vị Trí", {
      description: "Vui lòng chia sẻ vị trí của bạn để khách hàng tìm được bạn.",
      icon: <MapPin className="size-5" />,
      duration: 20000,
      action: {
        label: "Cho Phép",
        onClick: () => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                setLatitude(lat);
                setLongitude(lng);

                toast.success("Đã Lấy Vị Trí Thành Công!", {
                  description: `Vị trí: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                  duration: 3000,
                });

                // Send location immediately via WebSocket
                if (isConnected()) {
                  sendLocation(lat, lng);
                }

                // Set up interval to update location every 2-3 minutes
                const interval = Math.random() * 60000 + 120000; // 2-3 minutes in ms
                const newInterval = window.setInterval(() => {
                  navigator.geolocation.getCurrentPosition(
                    (newPosition) => {
                      const newLat = newPosition.coords.latitude;
                      const newLng = newPosition.coords.longitude;
                      setLatitude(newLat);
                      setLongitude(newLng);

                      // Send updated location via WebSocket
                      if (isConnected()) {
                        sendLocation(newLat, newLng);
                      }
                    },
                    (error) => {
                      console.warn("⚠️ Failed to get updated location:", error);
                    }
                  );
                }, interval);

                setLocationUpdateInterval(newInterval);
              },
              (error) => {
                toast.error("Không Thể Lấy Vị Trí", {
                  description: "Vui lòng kiểm tra cài đặt quyền truy cập vị trí của bạn.",
                  duration: 4000,
                });
              }
            );
          } else {
            toast.error("Trình duyệt không hỗ trợ định vị", {
              description: "Vui lòng sử dụng trình duyệt khác.",
            });
          }
        },
      },
    });

    // Cleanup interval on unmount
    return () => {
      if (locationUpdateInterval !== null) {
        window.clearInterval(locationUpdateInterval);
      }
    };
  }, []);

  // Xác minh người dùng và KẾT NỐI WEBSOCKET
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");

    if (!userStr || !token) {
      navigate("/login", { replace: true });
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== "MECHANIC") {
      navigate("/", { replace: true });
      return;
    }

    // === GỌI WEBSOCKET NGAY TẠI ĐÂY (SAU KHI DASHBOARD ĐÃ RENDER) ===
    connectWebSocket(token)
      .then(() => console.log("✅ Kết nối WebSocket tại Dashboard thành công!"))
      .catch((err) => console.log("⚠️ WebSocket chuyển sang HTTP Fallback:", err));

    setProfile({
      username: user.username,
      name: user.fullName,
      email: user.email,
      phone: user.phoneNumber,
      vehicleTypes: ["motorbike", "car"], // tuỳ bạn
      joinDate: "2024-01-01",
      expiryDate: "2026-01-01",
      isActive: user.isActive,
    });
    
    // Load current order if any
    const mapDbStatus = (s?: string): RescueRequest["status"] => {
      if (s === "IN_PROGRESS") return "in-progress";
      if (s === "ACCEPTED")    return "accepted";
      return "accepted";
    };

    const loadCurrentOrder = async () => {
      try {
        const currentOrder = await getCurrentOrder();
        if (currentOrder) {
          setActiveRequest({
            id: currentOrder.orderId,
            customerName: currentOrder.customerName,
            customerPhone: currentOrder.customerPhone,
            serviceType: currentOrder.serviceName || "Cứu hộ",
            location: currentOrder.address,
            distance: `${currentOrder.distance.toFixed(1)} km`,
            timestamp: currentOrder.createdAt,
            status: mapDbStatus(currentOrder.status),
            price: undefined,
            rating: undefined,
            review: undefined,
          });
        }
      } catch (error) {
        // Ignore if no current order
      }
    };

    loadRequestedOrders();
    loadCurrentOrder();

    // Load order history
    const loadOrderHistoryData = async () => {
      try {
        const data = await getOrderHistory();
        const mappedHistory: RescueRequest[] = data.map((order) => ({
          id: order.orderId,
          customerName: order.customerName,
          customerPhone: order.phone,
          serviceType: order.serviceName,
          location: order.address || "Không xác định",
          distance: "",
          timestamp: order.completedAt,
          status: "completed" as const,
          price: undefined,
          rating: order.rating || undefined,
          review: order.review || undefined,
        }));
        setOrderHistory(mappedHistory);
      } catch (error) {
        console.error("Error loading order history:", error);
        setOrderHistory([]);
      }
    };

    loadOrderHistoryData();

    // Dọn dẹp kết nối khi thoát trang
    return () => {
      disconnect();
    };
  }, [navigate]);

   const formatDistance = (distance: number | null | undefined) => {
  if (distance == null) return "Chưa có vị trí";
  if (distance < 1) return `${(distance * 1000).toFixed(0)} m`;
  return `${distance.toFixed(1)} km`;
};
  const loadRequestedOrders = async () => {
  try {
    const data = await getRequestedOrders();
    const mappedRequests: RescueRequest[] = data.map((order: any) => ({
      id: order.orderId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      serviceType: order.serviceName,
      location: order.address,
      distance: formatDistance(order.distance),
      timestamp: order.createdAt,
      status: "pending" as const,
    }));
    setRequests(mappedRequests);
  } catch (error) {
    console.error("Error loading requested orders:", error);
    toast.error("Không thể tải danh sách yêu cầu.");
    setRequests([]);
  }
};
useEffect(() => {
  if (activeTab === "new") {
    loadRequestedOrders();
  }
}, [activeTab]);
  // Fetch mechanic profile when profile tab is active
  useEffect(() => {
    if (activeTab === "profile") {
      const loadMechanicProfile = async () => {
        try {
          const data = await getMechanicProfile();
          const vehicleTypes: string[] = [];
          if (data.type === "CAR") vehicleTypes.push("car");
          else if (data.type === "MOTORBIKE") vehicleTypes.push("motorbike");
          else if (data.type === "TRUCK") vehicleTypes.push("truck");

          setProfile((prev) => ({
            ...prev,
            name: data.fullName,
            email: data.email,
            phone: data.phoneNumber,
            garageName: data.garageName,
            garageAddress: data.garageAddress,
            type: data.type,
            workType: data.workType,
            avatarUrl: data.avatarUrl,
            vehicleTypes: vehicleTypes,
            expiryDate: data.subsEndDate.split('T')[0],
          }));
          if (data.status) setMechanicStatus(data.status);
        } catch (error) {
          console.error("Error loading mechanic profile:", error);
          toast.error("Không thể tải hồ sơ. Vui lòng thử lại.");
        }
      };

      const loadMechanicServices = async () => {
        try {
          const data = await getMechanicServices();
          setServices(data);
        } catch (error) {
          console.error("Error loading mechanic services:", error);
          toast.error("Không thể tải danh sách dịch vụ. Vui lòng thử lại.");
        }
      };

      loadMechanicProfile();
      loadMechanicServices();
    }
  }, [activeTab]);

  // Fetch statistics when stats tab is active
  useEffect(() => {
    if (activeTab === "stats") {
      const loadStatistics = async () => {
        try {
          const data = await getStatistic();
          setStatistic(data);
        } catch (error) {
          console.error("Error loading statistics:", error);
          toast.error("Không thể tải thống kê. Vui lòng thử lại.");
        }
      };

      loadStatistics();
    }
  }, [activeTab]);

  const handleLogout = async () => {
    try {
      // Clean up location update interval
      if (locationUpdateInterval !== null) {
        window.clearInterval(locationUpdateInterval);
        setLocationUpdateInterval(null);
      }

      // Disconnect WebSocket
      disconnect();

      // Call logout API
      const token = localStorage.getItem("accessToken");
      if (token) {
        await fetch(
          `${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.LOGOUT}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          }
        );
      }

      // Clear local storage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("technicianUser");

      toast.success("Đăng Xuất Thành Công!");
      navigate("/");
    } catch (error) {
      console.error("❌ Logout error:", error);
      toast.error("Lỗi đăng xuất", {
        description: "Vui lòng thử lại",
      });
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptOrder(requestId);
      // Load current order
      const currentOrder = await getCurrentOrder();
      if (currentOrder) {
        setActiveRequest({
          id: currentOrder.orderId,
          customerName: currentOrder.customerName,
          customerPhone: currentOrder.customerPhone,
          serviceType: currentOrder.serviceName || "Cứu hộ",
          location: currentOrder.address,
          distance: `${currentOrder.distance.toFixed(1)} km`,
          timestamp: currentOrder.createdAt,
          status: currentOrder.status === "IN_PROGRESS" ? "in-progress" : "accepted",
          price: undefined,
          rating: undefined,
          review: undefined,
        });
      }
      loadRequestedOrders();
      setActiveTab("tracking");
      toast.success("Đã Chấp Nhận Yêu Cầu!", {
        description: "Hãy liên hệ với khách hàng và bắt đầu công việc.",
      });
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error("Lỗi khi chấp nhận yêu cầu. Vui lòng thử lại.");
    }
  };

  const handleStartNavigation = () => {
    if (activeRequest) {
      // Open Google Maps with directions
      const destination = encodeURIComponent(activeRequest.location);
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
      window.open(url, '_blank');
      
      toast.success("Đã Mở Google Maps", {
        description: "Chúc bạn lái xe an toàn!",
      });
    }
  };

  const handleUpdateStatus = async (status: "in-progress" | "completed") => {
    if (activeRequest) {
      try {
        if (status === "in-progress") {
          await startInProcess(activeRequest.id);
          // Re-fetch từ API để lấy status thực từ DB
          const refreshed = await getCurrentOrder();
          if (refreshed) {
            setActiveRequest(prev => prev ? {
              ...prev,
              status: refreshed.status === "IN_PROGRESS" ? "in-progress" : "accepted",
            } : null);
          }
          toast.info("Đã Cập Nhật: Đang Trên Đường");
        } else if (status === "completed") {
          await completeOrder(activeRequest.id);
          toast.success("Công Việc Hoàn Thành!", {
            description: "Đã chuyển sang lịch sử",
          });
          // Reload history
          try {
            const data = await getOrderHistory();
            const mappedHistory: RescueRequest[] = data.map((order) => ({
              id: order.orderId,
              customerName: order.customerName,
              customerPhone: order.phone,
              serviceType: order.serviceName,
              location: order.address || "Không xác định",
              distance: "",
              timestamp: order.completedAt,
              status: "completed" as const,
              price: undefined,
              rating: order.rating || undefined,
              review: order.review || undefined,
            }));
            setOrderHistory(mappedHistory);
          } catch (error) {
            console.error("Error reloading order history:", error);
          }
          setActiveRequest(null);
        }
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("Lỗi khi cập nhật trạng thái. Vui lòng thử lại.");
      }
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await cancelOrder(requestId);
      setRequests((prev) => prev.filter((req) => req.id !== requestId));
      toast.info("Đã Từ Chối Yêu Cầu");
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Lỗi khi từ chối yêu cầu. Vui lòng thử lại.");
    }
  };


  const handleSaveProfile = async () => {
    try {
      let type = "CAR";
      if (profile.vehicleTypes.includes("motorbike")) type = "MOTORBIKE";
      else if (profile.vehicleTypes.includes("truck")) type = "TRUCK";
      else if (profile.vehicleTypes.includes("car")) type = "CAR";

      await updateMechanicProfile({
        fullName: profile.name,
        phoneNumber: profile.phone,
        email: profile.email,
        type: type,
        status: mechanicStatus,
        // Đảm bảo không bị null hoặc undefined
        garageName: profile.garageName ?? "", 
        garageAddress: profile.garageAddress ?? "",
        // Lấy tọa độ thực tế từ state, thay vì gán cứng
        garageLatitude: latitude ?? undefined, 
        garageLongitude: longitude ?? undefined,
      }, avatarFile);

      setEditMode(false);
      toast.success("Cập Nhật Thông Tin Thành Công!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Lỗi khi cập nhật hồ sơ. Vui lòng thử lại.");
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = mechanicStatus === "ONLINE" ? "OFFLINE" : "ONLINE";
    setTogglingStatus(true);
    try {
      let type = "CAR";
      if (profile.vehicleTypes.includes("motorbike")) type = "MOTORBIKE";
      else if (profile.vehicleTypes.includes("truck")) type = "TRUCK";
      else if (profile.vehicleTypes.includes("car")) type = "CAR";

      await updateMechanicProfile({
        fullName: profile.name,
        phoneNumber: profile.phone,
        email: profile.email,
        type: type,
        status: newStatus,
      });

      setMechanicStatus(newStatus);
      toast.success(
        newStatus === "ONLINE" ? "Bạn đang Online — sẵn sàng nhận yêu cầu!" : "Bạn đã chuyển sang Offline.",
        { description: newStatus === "ONLINE" ? "Khách hàng có thể tìm thấy bạn." : "Bạn sẽ không nhận yêu cầu mới." }
      );
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Lỗi khi thay đổi trạng thái. Vui lòng thử lại.");
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleSubmitRenewal = async () => {
  // Kiểm tra file tồn tại trong state
  if (!billFile) {
    toast.error("Vui lòng tải lên ảnh chụp biên lai (bill)");
    return;
  }

  setIsSubmittingRenewal(true);
  try {
    // TRUYỀN TRỰC TIẾP 'billFile' VÀO HÀM
    // Không cần dùng URL giả nữa vì FormData sẽ xử lý file nhị phân
    await RenewalRequest(billFile); 

    toast.success("Đã gửi yêu cầu gia hạn!", {
      description: "Vui lòng chờ hệ thống duyệt yêu cầu của bạn.",
    });
    
    // Reset form
    setShowRenewalForm(false);
    setBillFile(null);
  } catch (error: any) {
    console.error("Lỗi gia hạn:", error);
    toast.error("Lỗi gửi yêu cầu", {
      description: error.message || "Vui lòng thử lại sau",
    });
  } finally {
    setIsSubmittingRenewal(false);
  }
};
const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setAvatarPreview(URL.createObjectURL(file));
  setAvatarFile(file);

  try {
    // Tận dụng service Firebase bạn đã viết
    // Lưu ý: Nếu muốn upload ngay khi chọn, bạn có thể gọi hàm upload ở đây
    // Hoặc đợi đến khi nhấn "Lưu" ở Tab Profile
    toast.info("Đang tải ảnh lên...");
    // Gọi API upload nếu bạn có API upload ảnh riêng, hoặc sử dụng logic tương tự RenewalRequest
  } catch (error) {
    toast.error("Lỗi upload ảnh");
  }
};

  const toggleVehicleType = (vehicleId: string) => {
    setProfile((prev) => ({
      ...prev,
      vehicleTypes: prev.vehicleTypes.includes(vehicleId)
        ? prev.vehicleTypes.filter((id) => id !== vehicleId)
        : [...prev.vehicleTypes, vehicleId],
    }));
  };

  const handleEditServicePrice = (serviceId: string, currentPrice: number) => {
    setEditingServiceId(serviceId);
    setEditingPrice(currentPrice.toString());
  };

  const handleSaveServicePrice = async () => {
    if (!editingServiceId) return;

    try {
      const price = parseFloat(editingPrice);
      if (isNaN(price) || price < 0) {
        toast.error("Giá phải là số dương");
        return;
      }

      await updateServicePrice(editingServiceId, price);

      // Update local state
      setServices((prev) =>
        prev.map((service) =>
          service.serviceId === editingServiceId
            ? { ...service, customPrice: price }
            : service
        )
      );

      setEditingServiceId(null);
      setEditingPrice("");
      toast.success("Cập nhật giá dịch vụ thành công!");
    } catch (error) {
      console.error("Error updating service price:", error);
      toast.error("Lỗi khi cập nhật giá dịch vụ. Vui lòng thử lại.");
    }
  };

  const handleCancelEditService = () => {
    setEditingServiceId(null);
    setEditingPrice("");
  };

  const handleAddService = async () => {
    setAddingService(true);
    setNewServiceId("");
    setNewServicePrice("");

    try {
      const data = await getAvailableServices();
      // Filter out services already added
      const existingServiceIds = services.map(s => s.serviceId);
      const filteredServices = data.filter(s => !existingServiceIds.includes(s.serviceId));
      setAvailableServices(filteredServices);
    } catch (error) {
      console.error("Error loading available services:", error);
      toast.error("Không thể tải danh sách dịch vụ có sẵn");
      setAvailableServices([]);
    }
  };

  const handleSaveNewService = async () => {
    if (!newServiceId || !newServicePrice.trim()) {
      toast.error("Vui lòng chọn dịch vụ và nhập giá");
      return;
    }

    const price = parseFloat(newServicePrice);
    if (isNaN(price) || price < 0) {
      toast.error("Giá phải là số dương");
      return;
    }

    try {
      await addMechanicService(newServiceId, price);

      // Reload services
      const data = await getMechanicServices();
      setServices(data);

      setAddingService(false);
      setNewServiceId("");
      setNewServicePrice("");
      toast.success("Thêm dịch vụ mới thành công!");
    } catch (error) {
      console.error("Error adding service:", error);
      toast.error("Lỗi khi thêm dịch vụ mới. Vui lòng thử lại.");
    }
  };

  const handleCancelAddService = () => {
    setAddingService(false);
    setNewServiceId("");
    setNewServicePrice("");
  };

  // Calculate statistics
  const completedRequests = requests.filter(
    (req) => req.status === "completed",
  );
  const totalEarnings = completedRequests.reduce(
    (sum, req) => sum + (req.price || 0),
    0,
  );
  const averageRating =
    completedRequests.length > 0
      ? completedRequests.reduce(
          (sum, req) => sum + (req.rating || 0),
          0,
        ) / completedRequests.length
      : 0;
  const pendingRequests = requests.filter(
    (req) => req.status === "pending",
  );

  // Check account expiry
  const expiryDate = new Date(profile.expiryDate);
  const today = new Date();
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24),
  );
  const isExpiringSoon =
    daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry <= 0;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default"; color: string }> = {
      // Local keys
      pending:       { label: "Đang Chờ",     variant: "default", color: "bg-yellow-100 text-yellow-800" },
      accepted:      { label: "Đã Chấp Nhận", variant: "default", color: "bg-blue-100 text-blue-800"   },
      "in-progress": { label: "Đang Làm",      variant: "default", color: "bg-purple-100 text-purple-800"},
      completed:     { label: "Hoàn Thành",    variant: "default", color: "bg-green-100 text-green-800" },
      cancelled:     { label: "Đã Hủy",        variant: "default", color: "bg-red-100 text-red-800"     },
      // DB uppercase keys — phòng khi chưa kịp map
      REQUESTED:     { label: "Đang Chờ",      variant: "default", color: "bg-yellow-100 text-yellow-800"},
      ACCEPTED:      { label: "Đã Chấp Nhận",  variant: "default", color: "bg-blue-100 text-blue-800"   },
      IN_PROGRESS:   { label: "Đang Làm",       variant: "default", color: "bg-purple-100 text-purple-800"},
      COMPLETED:     { label: "Hoàn Thành",     variant: "default", color: "bg-green-100 text-green-800" },
      CANCELLED:     { label: "Đã Hủy",         variant: "default", color: "bg-red-100 text-red-800"     },
    };
    const config = statusConfig[status] ?? {
      label: status ?? "Không xác định",
      variant: "default" as const,
      color: "bg-slate-100 text-slate-700",
    };
    return (
      <Badge className={config.color} variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <Shield className="size-8 text-red-600" />
                <span className="text-2xl font-bold text-slate-900">
                  RescueNow
                </span>
              </Link>
              <Badge className="bg-red-600 text-white">
                Thợ Sửa Chữa
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="font-semibold text-slate-900">
                  {profile.name}
                </p>
                <p className="text-sm text-slate-600">
                  @{profile.username}
                </p>
              </div>
              <Button variant="outline" onClick={handleLogout} size="sm">
                <LogOut className="size-4 sm:mr-2" />
                <span className="hidden sm:inline">Đăng Xuất</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Tabs Navigation */}
        <div className="flex gap-1.5 sm:gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={activeTab === "new" ? "default" : "outline"}
            onClick={() => setActiveTab("new")}
            size="sm"
            className={`flex-shrink-0 ${activeTab === "new" ? "bg-red-600 hover:bg-red-700" : ""}`}
          >
            <Clock className="size-4 sm:mr-2" />
            <span className="hidden sm:inline">Yêu Cầu Mới</span>
            {pendingRequests.length > 0 && (
              <Badge className="ml-1.5 bg-white text-red-600 text-xs px-1.5">
                {pendingRequests.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === "tracking" ? "default" : "outline"}
            onClick={() => setActiveTab("tracking")}
            size="sm"
            className={`flex-shrink-0 ${activeTab === "tracking" ? "bg-red-600 hover:bg-red-700" : ""}`}
          >
            <Navigation className="size-4 sm:mr-2" />
            <span className="hidden sm:inline">Theo Dõi</span>
          </Button>
          <Button
            variant={activeTab === "history" ? "default" : "outline"}
            onClick={() => setActiveTab("history")}
            size="sm"
            className={`flex-shrink-0 ${activeTab === "history" ? "bg-red-600 hover:bg-red-700" : ""}`}
          >
            <Calendar className="size-4 sm:mr-2" />
            <span className="hidden sm:inline">Lịch Sử</span>
          </Button>
          <Button
            variant={activeTab === "stats" ? "default" : "outline"}
            onClick={() => setActiveTab("stats")}
            size="sm"
            className={`flex-shrink-0 ${activeTab === "stats" ? "bg-red-600 hover:bg-red-700" : ""}`}
          >
            <TrendingUp className="size-4 sm:mr-2" />
            <span className="hidden sm:inline">Thống Kê</span>
          </Button>
          <Button
            variant={activeTab === "profile" ? "default" : "outline"}
            onClick={() => setActiveTab("profile")}
            size="sm"
            className={`flex-shrink-0 ${activeTab === "profile" ? "bg-red-600 hover:bg-red-700" : ""}`}
          >
            <User className="size-4 sm:mr-2" />
            <span className="hidden sm:inline">Hồ Sơ</span>
          </Button>
        </div>

        {/* Tab: New Requests */}
        {activeTab === "new" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">
              Yêu Cầu Cứu Hộ Mới
            </h2>
            {pendingRequests.length === 0 ? (
              <Card className="p-12 text-center">
                <Clock className="size-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Không Có Yêu Cầu Mới
                </h3>
                <p className="text-slate-600">
                  Các yêu cầu cứu hộ mới sẽ xuất hiện ở đây
                </p>
              </Card>
            ) : (
              pendingRequests.map((request) => (
                <Card key={request.id} className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Wrench className="size-6 text-red-600" />
                        <div>
                          <h3 className="font-bold text-lg text-slate-900">
                            {request.serviceType}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {new Date(
                              request.timestamp,
                            ).toLocaleString("vi-VN")}
                          </p>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-slate-700">
                          <User className="size-4" />
                          <span>{request.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <Phone className="size-4" />
                          <span>{request.customerPhone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <MapPin className="size-4" />
                          <span>{request.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <TrendingUp className="size-4" />
                          <span>{request.distance}</span>
                        </div>
                      </div>

                    </div>

                    <div className="flex gap-2 sm:flex-col sm:w-36">
                      <Button
                        onClick={() => handleAcceptRequest(request.id)}
                        className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="size-4 mr-2" />
                        Chấp Nhận
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRejectRequest(request.id)}
                        className="flex-1 sm:flex-none text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <XCircle className="size-4 mr-2" />
                        Từ Chối
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Tab: Tracking */}
        {activeTab === "tracking" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">
              Theo Dõi Yêu Cầu
            </h2>
            {activeRequest ? (
              <>
                <Card className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Wrench className="size-6 text-red-600" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-slate-900">
                              {activeRequest.serviceType}
                            </h3>
                            {getStatusBadge(activeRequest.status)}
                          </div>
                          <p className="text-sm text-slate-600">
                            {new Date(
                              activeRequest.timestamp,
                            ).toLocaleString("vi-VN")}
                          </p>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-slate-700">
                          <User className="size-4" />
                          <span>
                            {activeRequest.customerName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <Phone className="size-4" />
                          <span>
                            {activeRequest.customerPhone}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <MapPin className="size-4" />
                          <span>{activeRequest.location}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={handleStartNavigation}
                          className="bg-blue-600 hover:bg-blue-700"
                          size="sm"
                        >
                          <Navigation className="size-4 mr-2" />
                          Mở Google Maps
                        </Button>
                        
                        {activeRequest.status === "accepted" && (
                          <Button
                            onClick={() => handleUpdateStatus("in-progress")}
                            className="bg-purple-600 hover:bg-purple-700"
                            size="sm"
                          >
                            <Clock className="size-4 mr-2" />
                            Đang Trên Đường
                          </Button>
                        )}
                        
                        {(activeRequest.status === "accepted" || activeRequest.status === "in-progress") && (
                          <Button
                            onClick={() => handleUpdateStatus("completed")}
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            <CheckCircle className="size-4 mr-2" />
                            Hoàn Thành
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Google Maps Integration */}
                <Card className="p-0 overflow-hidden">
                  <div className="bg-slate-100 p-4 border-b">
                    <div className="flex items-center gap-2">
                      <Map className="size-5 text-red-600" />
                      <h3 className="font-bold text-slate-900">
                        Bản Đồ Chỉ Đường
                      </h3>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      Khoảng cách: {activeRequest.distance} • Thời gian dự kiến: ~{parseInt(activeRequest.distance) * 3} phút
                    </p>
                  </div>
                  <div className="relative w-full h-[260px] sm:h-[400px] bg-slate-200">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(activeRequest.location)}&zoom=15`}
                    />
                  </div>
                  <div className="p-4 bg-blue-50 border-t">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MapPin className="size-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">Điểm Đến</p>
                        <p className="text-sm text-slate-700">{activeRequest.location}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Nhấn "Mở Google Maps" để bắt đầu dẫn đường
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-12 text-center">
                <Navigation className="size-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Chưa Có Yêu Cầu Đang Theo Dõi
                </h3>
                <p className="text-slate-600">
                  Yêu cầu đang được xử lý sẽ xuất hiện ở đây
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Tab: History */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">
              Lịch Sử Cứu Hộ
            </h2>
            {orderHistory.length === 0 ? (
              <Card className="p-12 text-center">
                <Calendar className="size-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Chưa Có Lịch Sử
                </h3>
                <p className="text-slate-600">
                  Lịch sử các ca cứu hộ của bạn sẽ xuất hiện ở
                  đây
                </p>
              </Card>
            ) : (
              orderHistory.map((request) => (
                <Card key={request.id} className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Wrench className="size-6 text-red-600" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-slate-900">
                              {request.serviceType}
                            </h3>
                            {getStatusBadge(request.status)}
                          </div>
                          <p className="text-sm text-slate-600">
                            {new Date(
                              request.timestamp,
                            ).toLocaleString("vi-VN")}
                          </p>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center gap-2 text-slate-700">
                          <User className="size-4" />
                          <span>{request.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <Phone className="size-4" />
                          <span>{request.customerPhone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <MapPin className="size-4" />
                          <span>{request.location}</span>
                        </div>
                        
                      </div>

                      {request.status === "completed" &&
                        request.rating && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Star className="size-5 fill-yellow-400 text-yellow-400" />
                              <span className="font-semibold text-slate-900">
                                {request.rating}/5 sao
                              </span>
                            </div>
                            {request.review && (
                              <p className="text-sm text-slate-600 italic">
                                "{request.review}"
                              </p>
                            )}
                          </div>
                        )}
                    </div>

                    {/* Report button for history */}
                    <div className="flex flex-row sm:flex-col justify-end sm:w-36 gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                        onClick={() => handleOpenCustomerReport(request)}
                      >
                        <Flag className="size-4 mr-1.5" />
                        Báo Cáo KH
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Tab: Statistics */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Thống Kê Cá Nhân
            </h2>

            {statistic ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <Card className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <CheckCircle className="size-8 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">
                          Ca Hoàn Thành
                        </p>
                        <p className="text-3xl font-bold text-slate-900">
                          {statistic.totalCompletedOrders}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <Star className="size-8 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">
                          Đánh Giá TB
                        </p>
                        <p className="text-3xl font-bold text-slate-900">
                          {statistic.averageRating.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Navigation className="size-8 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">
                          Trung Bình/Tháng
                        </p>
                        <p className="text-3xl font-bold text-slate-900">
                          {statistic.avgOrdersPerMonth.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Award className="size-8 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">
                          Xếp Hạng
                        </p>
                        <p className="text-3xl font-bold text-slate-900">
                          {(statistic.rankingScore).toFixed(0)}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">
                    Đánh Giá Gần Đây
                  </h3>
                  <div className="space-y-4">
                    {statistic.recentReviews.length > 0 ? (
                      statistic.recentReviews.map((review, index) => (
                        <div
                          key={index}
                          className="border-b pb-4 last:border-0"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`size-4 ${
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-slate-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="font-semibold text-slate-900">
                              {review.customerName}
                            </span>
                            <span className="text-sm text-slate-500">
                              • {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                          <p className="text-slate-700 mb-1">
                            {review.review}
                          </p>
                          <p className="text-sm text-slate-500">
                            Dịch vụ: {review.serviceName}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-600 text-center py-4">
                        Chưa có đánh giá nào
                      </p>
                    )}
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-12 text-center">
                <RefreshCw className="size-8 text-slate-400 mx-auto mb-4 animate-spin" />
                <p className="text-slate-600">Đang tải thống kê...</p>
              </Card>
            )}
          </div>
        )}

        {/* Tab: Profile */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900">
                Hồ Sơ Cá Nhân
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                  onClick={handleOpenSystemReport}
                >
                  <Flag className="size-4 mr-1.5" />
                  <span className="hidden xs:inline">Báo Cáo </span>Hệ Thống
                </Button>
                {!editMode ? (
                  <Button onClick={() => setEditMode(true)} variant="outline" size="sm">
                    Chỉnh Sửa
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} size="sm" className="bg-green-600 hover:bg-green-700">
                      Lưu
                    </Button>
                    <Button onClick={() => setEditMode(false)} size="sm" variant="outline">
                      Hủy
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Status toggle card */}
            <Card className={`p-4 sm:p-5 border-2 transition-colors ${
              mechanicStatus === "ONLINE" ? "border-green-200 bg-green-50" : 
              mechanicStatus === "BUSY" ? "border-purple-200 bg-purple-50" : 
              "border-slate-200 bg-slate-50"
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`size-10 sm:size-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                    mechanicStatus === "ONLINE" ? "bg-green-100" : 
                    mechanicStatus === "BUSY" ? "bg-purple-100" : 
                    "bg-slate-200"
                  }`}>
                    {mechanicStatus === "BUSY" ? (
                      <Clock className="size-4 sm:size-5 text-purple-600" />
                    ) : (
                      <Power className={`size-4 sm:size-5 ${mechanicStatus === "ONLINE" ? "text-green-600" : "text-slate-500"}`} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm sm:text-base">Trạng Thái Hoạt Động</span>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        mechanicStatus === "ONLINE" ? "bg-green-100 text-green-700" : 
                        mechanicStatus === "BUSY" ? "bg-purple-100 text-purple-700" : 
                        "bg-slate-200 text-slate-600"
                      }`}>
                        <span className={`size-1.5 rounded-full ${
                          mechanicStatus === "ONLINE" ? "bg-green-500 animate-pulse" : 
                          mechanicStatus === "BUSY" ? "bg-purple-500 animate-pulse" : 
                          "bg-slate-400"
                        }`} />
                        {mechanicStatus === "ONLINE" ? "Online" : mechanicStatus === "BUSY" ? "Đang Bận" : "Offline"}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                      {mechanicStatus === "ONLINE"
                        ? "Bạn đang hiển thị và có thể nhận yêu cầu."
                        : mechanicStatus === "BUSY"
                        ? "Bạn đang thực hiện dở một ca cứu hộ."
                        : "Bạn đang ẩn — khách hàng không thể tìm thấy bạn."}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleToggleStatus}
                  // Khóa nút nếu đang load HOẶC trạng thái đang là BUSY
                  disabled={togglingStatus || mechanicStatus === "BUSY"}
                  size="sm"
                  className={`flex-shrink-0 font-semibold ${
                    mechanicStatus === "ONLINE" ? "bg-slate-600 hover:bg-slate-700 text-white" : 
                    mechanicStatus === "BUSY" ? "bg-purple-200 text-purple-600 opacity-100" : 
                    "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {togglingStatus ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : mechanicStatus === "ONLINE" ? (
                    <><Power className="size-4 mr-1" />Offline</>
                  ) : mechanicStatus === "BUSY" ? (
                    <><Clock className="size-4 mr-1" />Khóa</>
                  ) : (
                    <><Power className="size-4 mr-1" />Online</>
                  )}
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-6">
                <div className="flex flex-col items-center mb-8 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
  <div className="relative size-32 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4">
    <img 
      src={avatarPreview || profile.avatarUrl || "/default-avatar.png"} 
      alt="Avatar" 
      className="size-full object-cover"
    />
  </div>
  
  {editMode && (
    <>
      <Button 
        variant="outline" 
        onClick={() => document.getElementById("avatar-input")?.click()}
      >
        Chọn ảnh mới
      </Button>
      <input 
        id="avatar-input"
        type="file" 
        accept="image/*" 
        className="hidden"
       onChange={handleAvatarChange}
      />
    </>
  )}
</div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tên Đăng Nhập</Label>
                    <Input
                      value={profile.username}
                      disabled
                      className="bg-slate-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Họ Tên</Label>
                    <Input
                      value={profile.name}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      disabled={!editMode}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                      <Input
                        value={profile.email}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        disabled={!editMode}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Số Điện Thoại</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                      <Input
                        value={profile.phone}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        disabled={!editMode}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tên Gara</Label>
                    <Input
                      value={profile.garageName || ""}
                      disabled
                      className="bg-slate-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Loại Phương Tiện</Label>
                    <Input
                      value={profile.type || ""}
                      disabled
                      className="bg-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Địa Chỉ Gara</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 size-5 text-slate-400" />
                    <Input
                      value={profile.garageAddress || ""}
                      disabled
                      className="pl-10 bg-slate-100"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Loại Công Việc</Label>
                    <Input
                      value={profile.workType || ""}
                      disabled
                      className="bg-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Loại Phương Tiện Có Thể Sửa</Label>
                  <RadioGroup
                    value={profile.vehicleTypes[0] ?? ""}
                    onValueChange={(val) => {
                      if (!editMode) return;
                      setProfile(prev => ({ ...prev, vehicleTypes: [val] }));
                    }}
                  >
                    <div className="grid sm:grid-cols-3 gap-3">
                      {vehicleOptions.map((vehicle) => {
                        const VehicleIcon = vehicle.icon;
                        const isSelected = profile.vehicleTypes[0] === vehicle.id;

                        return (
                          <label
                            key={vehicle.id}
                            className={`
                              flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                              ${isSelected ? "border-red-500 bg-red-50" : "border-slate-200"}
                              ${editMode ? "cursor-pointer hover:border-red-200" : "cursor-default"}
                            `}
                          >
                            <RadioGroupItem
                              value={vehicle.id}
                              disabled={!editMode}
                            />
                            <VehicleIcon
                              className={`size-5 ${isSelected ? "text-red-600" : "text-slate-600"}`}
                            />
                            <span className={`font-medium ${isSelected ? "text-red-900" : "text-slate-900"}`}>
                              {vehicle.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </RadioGroup>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="size-4" />
                    <span>
                      Tham gia từ:{" "}
                      {new Date(
                        profile.joinDate,
                      ).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Services Information Card */}
            <Card className="p-6">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Thông Tin Dịch Vụ
                </h3>
                <Button
                  onClick={handleAddService}
                  variant="outline"
                  size="sm"
                >
                  Thêm Dịch Vụ Mới
                </Button>
              </div>
              <div className="space-y-4">
                {addingService && (
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h4 className="font-semibold text-slate-900 mb-3">Thêm Dịch Vụ Mới</h4>
                    <div className="grid sm:grid-cols-2 gap-3 mb-3">
                      <div className="space-y-2">
                        <Label>Chọn Dịch Vụ</Label>
                        <Select value={newServiceId} onValueChange={setNewServiceId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn dịch vụ" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableServices.map((service) => (
                              <SelectItem key={service.serviceId} value={service.serviceId}>
                                {service.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Giá Tùy Chỉnh</Label>
                        <Input
                          type="number"
                          value={newServicePrice}
                          onChange={(e) => setNewServicePrice(e.target.value)}
                          placeholder="Nhập giá"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveNewService}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Thêm
                      </Button>
                      <Button
                        onClick={handleCancelAddService}
                        size="sm"
                        variant="outline"
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                )}
                {services.length === 0 && !addingService ? (
                  <p className="text-slate-600">Chưa có dịch vụ nào.</p>
                ) : (
                  services.map((service) => (
                    <div
                      key={service.serviceId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">
                          {service.serviceName}
                        </h4>
                        {editingServiceId === service.serviceId ? (
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Input
                              type="number"
                              value={editingPrice}
                              onChange={(e) => setEditingPrice(e.target.value)}
                              placeholder="Nhập giá mới"
                              className="w-full sm:w-32"
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={handleSaveServicePrice}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Lưu
                              </Button>
                              <Button
                                onClick={handleCancelEditService}
                                size="sm"
                                variant="outline"
                              >
                                Hủy
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-600 mt-1">
                            Giá: {service.customPrice.toLocaleString("vi-VN")} đ
                          </p>
                        )}
                      </div>
                      {editingServiceId !== service.serviceId && (
                        <Button
                          onClick={() => handleEditServicePrice(service.serviceId, service.customPrice)}
                          variant="outline"
                          size="sm"
                        >
                          Chỉnh Sửa
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Account Status & Renewal Card */}
            <Card
              className={`p-6 ${isExpired ? "border-2 border-red-500" : isExpiringSoon ? "border-2 border-yellow-500" : ""}`}
            >
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                {isExpired ? (
                  <>
                    <AlertCircle className="size-5 text-red-600" />
                    <span className="text-red-600">
                      Tài Khoản Đã Hết Hạn
                    </span>
                  </>
                ) : isExpiringSoon ? (
                  <>
                    <AlertCircle className="size-5 text-yellow-600" />
                    <span className="text-yellow-600">
                      Tài Khoản Sắp Hết Hạn
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="size-5 text-green-600" />
                    <span className="text-green-600">
                      Tài Khoản Đang Hoạt Động
                    </span>
                  </>
                )}
              </h3>

              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg ${isExpired ? "bg-red-50" : isExpiringSoon ? "bg-yellow-50" : "bg-green-50"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">
                      Ngày Hết Hạn
                    </span>
                    <span
                      className={`text-lg font-bold ${isExpired ? "text-red-600" : isExpiringSoon ? "text-yellow-600" : "text-green-600"}`}
                    >
                      {expiryDate.toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Số Ngày Còn Lại
                    </span>
                    <span
                      className={`text-lg font-bold ${isExpired ? "text-red-600" : isExpiringSoon ? "text-yellow-600" : "text-green-600"}`}
                    >
                      {isExpired
                        ? "Đã hết hạn"
                        : `${daysUntilExpiry} ngày`}
                    </span>
                  </div>
                </div>

                {/* Form thanh toán gia hạn */}
                {showRenewalForm ? (
                  <div className="mt-6 p-5 border-2 border-blue-200 rounded-lg bg-blue-50 space-y-5 animate-in fade-in slide-in-from-top-4">
                    <div className="text-center">
                      <h4 className="font-bold text-slate-900 text-lg">Thanh Toán Phí Gia Hạn</h4>
                      <p className="text-slate-700 mt-1">
                        Phí gia hạn (1 tháng): <span className="font-bold text-red-600 text-xl">
                          {profile.workType === "GARAGE" ? "20.000đ" : "10.000đ"}
                        </span>
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <div className="p-2 bg-white rounded-xl shadow-sm border">
                        <img 
                          src="/public/qr.png" 
                          alt="Mã QR Thanh Toán" 
                          className="w-70 h-90 object-cover" 
                          onError={(e) => {
                            // Phòng trường hợp file qr là .jpg thay vì .png
                            (e.target as HTMLImageElement).src = '/qr.jpg'; 
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold">Tải lên ảnh chụp chuyển khoản thành công</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        className="bg-white"
                        onChange={(e) => setBillFile(e.target.files?.[0] || null)}
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={handleSubmitRenewal}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={isSubmittingRenewal}
                      >
                        {isSubmittingRenewal ? (
                          <><RefreshCw className="size-4 mr-2 animate-spin" /> Đang gửi...</>
                        ) : (
                          "Gửi Yêu Cầu"
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRenewalForm(false);
                          setBillFile(null);
                        }}
                        className="flex-1 bg-white"
                        disabled={isSubmittingRenewal}
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Các nút gia hạn cũ (khi chưa mở form)
                  <>
                    {(isExpired || isExpiringSoon) && (
                      <div
                        className={`p-4 rounded-lg ${isExpired ? "bg-red-50 border-2 border-red-200" : "bg-yellow-50 border-2 border-yellow-200"}`}
                      >
                        <p className="text-sm text-slate-700 mb-3">
                          {isExpired
                            ? "Tài khoản của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục nhận yêu cầu cứu hộ."
                            : "Tài khoản của bạn sắp hết hạn. Gia hạn ngay để không bị gián đoạn dịch vụ."}
                        </p>
                        <Button
                          onClick={() => setShowRenewalForm(true)}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <RefreshCw className="size-4 mr-2" />
                          Gia Hạn 1 Tháng
                        </Button>
                      </div>
                    )}

                    {!isExpired && !isExpiringSoon && (
                      <Button
                        onClick={() => setShowRenewalForm(true)}
                        variant="outline"
                        className="w-full"
                      >
                        <RefreshCw className="size-4 mr-2" />
                        Gia Hạn Thêm 1 Tháng
                      </Button>
                    )}
                  </>
                )}

                <p className="text-xs text-slate-500 text-center">
                  Yêu cầu gia hạn sẽ được quản trị viên duyệt trong thời gian sớm nhất
                </p>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="size-5" />
              {reportType === "CUSTOMER" ? "Báo Cáo Khách Hàng" : "Báo Cáo Hệ Thống"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Context info */}
            {reportType === "CUSTOMER" && reportTargetOrder && (
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="size-12 bg-white rounded-full flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{reportTargetOrder.customerName}</div>
                  <div className="text-sm text-slate-500">{reportTargetOrder.customerPhone} · {reportTargetOrder.serviceType}</div>
                </div>
              </div>
            )}

            {reportType === "SYSTEM" && (
              <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                <div className="size-12 bg-white rounded-full flex items-center justify-center text-2xl">
                  🖥️
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Báo Cáo Sự Cố Hệ Thống</div>
                  <div className="text-sm text-slate-500">Phản ánh lỗi hoặc vấn đề với ứng dụng</div>
                </div>
              </div>
            )}

            {/* Reason selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Lý Do Báo Cáo <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-2">
                {(reportType === "CUSTOMER" ? CUSTOMER_REASONS : SYSTEM_REASONS).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setReportReason(option.value)}
                    className={`w-full text-left p-3.5 rounded-lg border-2 transition-all ${
                      reportReason === option.value
                        ? "border-orange-400 bg-orange-50"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`size-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          reportReason === option.value
                            ? "border-orange-500 bg-orange-500"
                            : "border-slate-300"
                        }`}
                      >
                        {reportReason === option.value && (
                          <div className="size-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          reportReason === option.value ? "text-orange-700" : "text-slate-800"
                        }`}
                      >
                        {option.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="reportContent" className="text-sm font-medium text-slate-700">
                Mô Tả Chi Tiết <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reportContent"
                placeholder="Mô tả rõ sự việc đã xảy ra để chúng tôi có thể hỗ trợ bạn tốt hơn..."
                value={reportContent}
                onChange={(e) => setReportContent(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-slate-400">
                Thông tin của bạn sẽ được bảo mật và xử lý trong vòng 24 giờ.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowReportDialog(false)}
                disabled={submittingReport}
              >
                Hủy
              </Button>
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleSubmitReport}
                disabled={submittingReport}
              >
                {submittingReport ? (
                  <>
                    <RefreshCw className="size-4 mr-2 animate-spin" />
                    Đang Gửi...
                  </>
                ) : (
                  <>
                    <Flag className="size-4 mr-2" />
                    Gửi Báo Cáo
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}