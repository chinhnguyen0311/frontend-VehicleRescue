import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  LogOut,
  BarChart3,
  Users,
  UserCheck,
  Clock,
  FileText,
  TrendingUp,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Ban,
  Eye,
  UserX,
  Calendar,
  DollarSign,
  Award,
  Wrench,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  Search,
  X,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";
import { adminService } from "../../services/adminApi";
import type { DashboardStats,MechanicData,PendingAccount,ReportAdminResponse,AdminOrderHistory } from "../../types/admin";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

interface Technician {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  rating: number;
  completedJobs: number;
  status: "active" | "banned" | "suspended";
  joinDate: string;
  expiryDate: string;
  workType?: string; 
  garageName?: string | null;
  garageAddress?: string | null;
}

interface RenewalRequest {
  id: string;
  technicianId: string;
  technicianName: string;
  currentExpiry: string;
  requestedDate: string;
  status: "pending" | "approved" | "rejected";
  billImageUrl?: string;
}
function getServiceIcon(serviceName: string): string {
  const map: Record<string, string> = {
    "Dịch Vụ Kéo Xe": "🚗",
    "Thay Lốp Xe": "🛞",
    "Nổ Máy": "🔋",
    "Giao Nhiên Liệu": "⛽",
    "Mở Khóa Xe": "🔑",
    "Sự Cố Cơ Khí": "🔧",
    "Không xác định": "❓",
  };
  return map[serviceName] ?? "🔧";
}
export function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "stats" | "technicians" | "order-history" | "registrations" | "renewals" | "reports"
  >("stats");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoadingMechanics, setIsLoadingMechanics] = useState(false);
  const [pendingAccounts, setPendingAccounts] = useState<PendingAccount[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [renewalRequests, setRenewalRequests] = useState<RenewalRequest[]>([]);
  const [selectedBillUrl, setSelectedBillUrl] = useState<string | null>(null);
  const [isBillDialogOpen, setIsBillDialogOpen] = useState(false);
  const [isLoadingRenewals, setIsLoadingRenewals] = useState(false);

  const [reports, setReports] = useState<ReportAdminResponse[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  const [orderHistory, setOrderHistory] = useState<AdminOrderHistory[]>([]);
  const [isLoadingOrderHistory, setIsLoadingOrderHistory] = useState(false);
  const [orderHistoryPage, setOrderHistoryPage] = useState(0);
  const [orderHistoryTotalPages, setOrderHistoryTotalPages] = useState(0);
  const [orderHistoryTotalElements, setOrderHistoryTotalElements] = useState(0);

  const fetchDashboardStats = async () => {
    setIsLoadingStats(true);
    setStatsError(null);
    try {
      const data = await adminService.getDashboardStats();
      setDashboardStats(data);
    } catch (error: any) {
      console.error("Lỗi lấy thống kê:", error);
      setStatsError(error.message || "Không thể tải dữ liệu thống kê");
      toast.error("Lỗi khi tải thống kê", {
        description: error.message || "Vui lòng thử lại sau",
      });
    } finally {
      setIsLoadingStats(false);
    }
  };
  const fetchMechanics = async () => {
    setIsLoadingMechanics(true);
    try {
      const data = await adminService.getMechanics();
      
      // Chuyển đổi (map) dữ liệu từ API sang cấu trúc Technician hiện tại của UI/UX
      const formattedData: Technician[] = data.map((item) => ({
        id: item.mechanicId,
        username: item.mechanicEmail.split('@')[0], // UI cần username, ta lấy tạm phần đầu của email
        name: item.mechanicName,
        email: item.mechanicEmail,
        phone: item.mechanicPhone,
        avatarUrl: item.avatarUrl,
        rating: item.avgRating,
        completedJobs: item.totalCompleted,
        status: item.isActive ? "active" : "suspended", // Map trạng thái
        joinDate: item.createdAt,
        expiryDate: item.expiredAt,
        workType: item.workType,
        garageName: item.garageName,
        garageAddress: item.garageAddress,
      }));

      setTechnicians(formattedData);
    } catch (error: any) {
      console.error("Lỗi lấy danh sách thợ:", error);
      toast.error("Lỗi tải danh sách thợ", {
        description: error.message || "Vui lòng thử lại sau",
      });
    } finally {
      setIsLoadingMechanics(false);
    }
  };
  const fetchPendingAccounts = async () => {
    setIsLoadingPending(true);
    try {
      const data = await adminService.getPendingAccounts();
      setPendingAccounts(data);
    } catch (error: any) {
      console.error("Lỗi lấy danh sách chờ duyệt:", error);
      toast.error("Lỗi tải danh sách chờ duyệt", {
        description: error.message || "Vui lòng thử lại sau",
      });
    } finally {
      setIsLoadingPending(false);
    }
  };
  const fetchRenewalRequests = async () => {
    setIsLoadingRenewals(true);
    try {
      const data = await adminService.getRenewalRequests();
      
      // Map dữ liệu API trả về sang cấu trúc UI đang sử dụng
      const formattedData: RenewalRequest[] = data.map((item) => ({
        id: item.subId, // Gắn id để xử lý Duyệt/Từ chối sau này
        technicianId: item.workType === "GARAGE" ? "Garage/Xưởng" : "Thợ Di động", 
        technicianName: item.mechanicName,
        currentExpiry: item.currentEndDate,
        requestedDate: item.renewalDate,
        status: "pending",
        billImageUrl: item.billImageUrl, // Mặc định hiển thị ở tab chờ duyệt
      }));

      setRenewalRequests(formattedData);
    } catch (error: any) {
      console.error("Lỗi lấy danh sách gia hạn:", error);
      toast.error("Lỗi tải danh sách gia hạn", {
        description: error.message || "Vui lòng thử lại sau",
      });
    } finally {
      setIsLoadingRenewals(false);
    }
  };

  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      const data = await adminService.getReports();
      setReports(data);
    } catch (error: any) {
      console.error("Lỗi lấy danh sách báo cáo:", error);
      toast.error("Lỗi tải danh sách báo cáo", {
        description: error.message || "Vui lòng thử lại sau",
      });
    } finally {
      setIsLoadingReports(false);
    }
  };
  useEffect(() => {
  const user = localStorage.getItem("user");
  if (!user) {
    navigate("/login");
    return;
  }
  
  // Kiểm tra thêm role cho chắc
  const parsed = JSON.parse(user);
  if (parsed.role !== "ADMIN") {
    navigate("/login");
  }
  fetchRenewalRequests();
  fetchPendingAccounts();
  fetchReports();
  
}, [navigate]);

 const handleLogout = () => {
  localStorage.removeItem("user");         // ✅ đúng key
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  toast.success("Đăng Xuất Thành Công!");
  navigate("/login");
};
useEffect(() => {
    if (activeTab === "stats") {
      fetchDashboardStats();
    }
  }, [activeTab]);
  useEffect(() => {
    if (activeTab === "technicians") {
      fetchMechanics();
    }
  }, [activeTab]);
  useEffect(() => {
    if (activeTab === "registrations") {
      fetchPendingAccounts();
    }
  }, [activeTab]);
  useEffect(() => {
    if (activeTab === "renewals") {
      fetchRenewalRequests();
    }
  }, [activeTab]);
  useEffect(() => {
    if (activeTab === "reports") {
      fetchReports();
    }
  }, [activeTab]);

  const fetchOrderHistory = async (page: number = 0) => {
    setIsLoadingOrderHistory(true);
    try {
      const data = await adminService.getOrdersHistory(page, 10);
      setOrderHistory(data.content);
      setOrderHistoryPage(data.page);
      setOrderHistoryTotalPages(data.totalPages);
      setOrderHistoryTotalElements(data.totalElements);
    } catch (error: any) {
      console.error("Lỗi lấy lịch sử đơn:", error);
      toast.error("Lỗi tải lịch sử đơn cứu hộ", {
        description: error.message || "Vui lòng thử lại sau",
      });
    } finally {
      setIsLoadingOrderHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "order-history") {
      fetchOrderHistory(0);
    }
  }, [activeTab]);


  const handleBanTechnician = async (id: string) => {
    try {
      await adminService.banMechanic(id);
      setTechnicians((prev) =>
        prev.map((tech) =>
          tech.id === id ? { ...tech, status: "banned" as const } : tech
        )
      );
      toast.error("Đã Cấm Vĩnh Viễn Tài Khoản Thợ Sửa");
    } catch (error: any) {
      toast.error("Lỗi khi cấm tài khoản", {
        description: error.message || "Vui lòng thử lại sau",
      });
    }
  };

  const handleSuspendTechnician = (id: string) => {
    setTechnicians((prev) =>
      prev.map((tech) =>
        tech.id === id ? { ...tech, status: "suspended" as const } : tech
      )
    );
    toast.warning("Đã Tạm Cấm Tài Khoản Thợ Sửa");
  };

  const handleActivateTechnician = (id: string) => {
    setTechnicians((prev) =>
      prev.map((tech) =>
        tech.id === id ? { ...tech, status: "active" as const } : tech
      )
    );
    toast.success("Đã Kích Hoạt Lại Tài Khoản");
  };

  const handleApproveRegistration = async (accountId: string) => {
    try {
      await adminService.approveAccount(accountId);
      
      // Xóa tài khoản đã duyệt khỏi danh sách hiển thị
      setPendingAccounts((prev) => prev.filter((acc) => acc.accountId !== accountId));
      
      toast.success("Đã Duyệt Đăng Ký!", {
        description: "Tài khoản mới đã được kích hoạt thành công",
      });

      // Tùy chọn: Gọi lại fetchMechanics để cập nhật danh sách thợ bên tab Quản Lý
      fetchMechanics(); 
    } catch (error: any) {
      toast.error("Lỗi duyệt tài khoản", {
        description: error.message || "Vui lòng thử lại",
      });
    }
  };

  // Nút từ chối thì bạn tạm thời giữ nguyên hoặc đổi filter sang accountId tương tự:
  const handleRejectRegistration = async (accountId: string) => {
    try {
      // 1. Gọi API từ chối
      await adminService.rejectAccount(accountId);
      
      // 2. Cập nhật UI: Xóa tài khoản vừa bị từ chối khỏi danh sách đang hiển thị
      setPendingAccounts((prev) => prev.filter((acc) => acc.accountId !== accountId));
      
      // 3. Thông báo thành công
      toast.success("Đã từ chối đăng ký", {
        description: "Yêu cầu đăng ký đã được hủy bỏ.",
      });

    } catch (error: any) {
      console.error("Lỗi từ chối tài khoản:", error);
      toast.error("Lỗi khi từ chối tài khoản", {
        description: error.message || "Vui lòng thử lại sau",
      });
    }
  };

  const handleApproveRenewal = async (id: string) => {
    try {
      // 1. Gọi API duyệt gia hạn
      await adminService.approveRenewal(id);
      
      // 2. Cập nhật UI (chuyển status sang approved để ẩn khỏi tab chờ)
      setRenewalRequests((prev) =>
        prev.map((req) =>
          req.id === id ? { ...req, status: "approved" as const } : req
        )
      );
      
      toast.success("Đã Duyệt Gia Hạn!", {
        description: "Tài khoản đã được gia hạn thành công.",
      });
    } catch (error: any) {
      console.error("Lỗi duyệt gia hạn:", error);
      toast.error("Lỗi duyệt gia hạn", {
        description: error.message || "Vui lòng thử lại sau.",
      });
    }
  };

  const handleRejectRenewal = async (id: string) => {
    try {
      // 1. Gọi API từ chối gia hạn
      await adminService.rejectRenewal(id);
      
      // 2. Cập nhật UI (chuyển status sang rejected)
      setRenewalRequests((prev) =>
        prev.map((req) =>
          req.id === id ? { ...req, status: "rejected" as const } : req
        )
      );
      
      toast.success("Đã Từ Chối Gia Hạn", {
        description: "Yêu cầu gia hạn đã bị từ chối.",
      });
    } catch (error: any) {
      console.error("Lỗi từ chối gia hạn:", error);
      toast.error("Lỗi từ chối gia hạn", {
        description: error.message || "Vui lòng thử lại sau.",
      });
    }
  };

  const handleViewTechnician = (tech: Technician) => {
    setSelectedTechnician(tech);
    setIsViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { label: string; className: string }
    > = {
      active: { label: "Hoạt Động", className: "bg-green-100 text-green-800" },
      banned: { label: "Đã Cấm", className: "bg-red-100 text-red-800" },
      suspended: {
        label: "Tạm Cấm",
        className: "bg-yellow-100 text-yellow-800",
      },
      pending: { label: "Chờ Duyệt", className: "bg-blue-100 text-blue-800" },
      approved: { label: "Đã Duyệt", className: "bg-green-100 text-green-800" },
      rejected: { label: "Đã Từ Chối", className: "bg-red-100 text-red-800" },
      resolved: { label: "Đã Xử Lý", className: "bg-green-100 text-green-800" },
      dismissed: { label: "Đã Bỏ Qua", className: "bg-slate-100 text-slate-800" },
    };
    const { label, className } = config[status] || config.pending;
    return <Badge className={className}>{label}</Badge>;
  };


  const filteredTechnicians = technicians.filter(
    (tech) =>
      tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <Badge className="bg-purple-600 text-white">
                Quản Trị Viên
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="font-semibold text-slate-900">Administrator</p>
                <p className="text-sm text-slate-600">@admin</p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="size-4 mr-2" />
                Đăng Xuất
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Button
            variant={activeTab === "stats" ? "default" : "outline"}
            onClick={() => setActiveTab("stats")}
            className={
              activeTab === "stats"
                ? "bg-purple-600 hover:bg-purple-700"
                : ""
            }
          >
            <BarChart3 className="size-4 mr-2" />
            Thống Kê
          </Button>
          <Button
            variant={activeTab === "technicians" ? "default" : "outline"}
            onClick={() => setActiveTab("technicians")}
            className={
              activeTab === "technicians"
                ? "bg-purple-600 hover:bg-purple-700"
                : ""
            }
          >
            <Users className="size-4 mr-2" />
            Quản Lý Thợ
          </Button>
          <Button
            variant={activeTab === "order-history" ? "default" : "outline"}
            onClick={() => setActiveTab("order-history")}
            className={
              activeTab === "order-history"
                ? "bg-purple-600 hover:bg-purple-700"
                : ""
            }
          >
            <History className="size-4 mr-2" />
            Lịch Sử Đơn
          </Button>
          <Button
            variant={activeTab === "registrations" ? "default" : "outline"}
            onClick={() => setActiveTab("registrations")}
            className={
              activeTab === "registrations"
                ? "bg-purple-600 hover:bg-purple-700"
                : ""
            }
          >
            <UserCheck className="size-4 mr-2" />
            Duyệt Tài Khoản
            {pendingAccounts.length > 0 && (
            <Badge className="ml-2 bg-white text-purple-600">
              {pendingAccounts.length}
            </Badge>
          )}
          </Button>
          <Button
            variant={activeTab === "renewals" ? "default" : "outline"}
            onClick={() => setActiveTab("renewals")}
            className={
              activeTab === "renewals"
                ? "bg-purple-600 hover:bg-purple-700"
                : ""
            }
          >
            <Clock className="size-4 mr-2" />
            Duyệt Gia Hạn
            {renewalRequests.filter((r) => r.status === "pending").length >
              0 && (
              <Badge className="ml-2 bg-white text-purple-600">
                {renewalRequests.filter((r) => r.status === "pending").length}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === "reports" ? "default" : "outline"}
            onClick={() => setActiveTab("reports")}
            className={
              activeTab === "reports"
                ? "bg-purple-600 hover:bg-purple-700"
                : ""
            }
          >
            <FileText className="size-4 mr-2" />
            Báo Cáo
            {reports.length > 0 && (
              <Badge className="ml-2 bg-white text-purple-600">
                {reports.length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Tab: Statistics */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                Tổng Quan Thống Kê
              </h2>
              <Button 
                variant="outline" 
                onClick={fetchDashboardStats}
                disabled={isLoadingStats}
              >
                <RefreshCw className={`size-4 mr-2 ${isLoadingStats ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>

            {isLoadingStats ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="size-10 animate-spin text-purple-600" />
                  <p className="text-slate-600">Đang tải thống kê...</p>
                </div>
              </div>
            ) : statsError ? (
              <Card className="p-12 text-center">
                <AlertCircle className="size-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Không tải được dữ liệu</h3>
                <p className="text-slate-600 mb-4">{statsError}</p>
                <Button onClick={fetchDashboardStats}>Thử lại</Button>
              </Card>
            ) : dashboardStats ? (
              <>
                {/* Key Metrics */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <CheckCircle className="size-8 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Tổng Số Ca Hoàn Thành</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {dashboardStats.totalCompletedOrders}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <TrendingUp className="size-8 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Tổng Số Ca Yêu Cầu</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {dashboardStats.totalRequestedOrders}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Users className="size-8 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Tổng Thợ</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {dashboardStats.totalMechanics}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-100 rounded-lg">
                        <BarChart3 className="size-8 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Trung bình ca/tháng</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {dashboardStats.avgOrdersPerMonth}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Monthly Performance Chart */}
                <Card className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="size-6 text-blue-600" />
                    Hiệu Suất Theo Tháng
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dashboardStats.monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="requested" fill="#3b82f6" name="Số Ca Yêu Cầu" />
                      <Bar dataKey="completed" fill="#10b981" name="Số Ca Hoàn Thành" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Top Technicians */}
                  <Card className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Award className="size-6 text-yellow-600" />
                      Bảng Xếp Hạng Thợ Sửa
                    </h3>
                    <div className="space-y-3">
                      {dashboardStats.topMechanics.map((tech, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg"
                        >
                          <div
                            className={`flex items-center justify-center size-10 rounded-full font-bold text-white ${
                              index === 0 ? "bg-yellow-500" : index === 1 ? "bg-slate-400" : index === 2 ? "bg-amber-600" : "bg-slate-300"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{tech.mechanicName}</p>
                            <p className="text-sm text-slate-600">
                              {tech.totalCompleted} ca • {tech.avgRating.toFixed(1)} ⭐
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="size-5 fill-yellow-400 text-yellow-400" />
                            <span className="font-bold text-slate-900">{tech.avgRating.toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Top Services */}
                  <Card className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Wrench className="size-6 text-red-600" />
                      Bảng Xếp Hạng Dịch Vụ
                    </h3>
                    <div className="space-y-3">
                      {dashboardStats.serviceRanking.map((service, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{getServiceIcon(service.serviceName)}</span>
                              <span className="font-medium text-slate-900">{service.serviceName}</span>
                            </div>
                            <span className="font-bold text-red-600">{service.totalRequests} ca</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-red-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min((service.totalRequests / (dashboardStats.totalCompletedOrders || 1)) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Tab: Technician Management */}
        {activeTab === "technicians" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                Quản Lý Thợ Sửa Chữa
              </h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm thợ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {filteredTechnicians.map((tech) => (
                <Card key={tech.id} className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="size-14 sm:size-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-slate-100">
                      <img src={tech.avatarUrl || "/default-avatar.png"} alt="Avatar" className="size-full object-cover" />
                    </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-lg text-slate-900">
                              {tech.workType === "GARAGE" && tech.garageName
                                ? tech.garageName
                                : tech.name}
                            </h3>
                            {getStatusBadge(tech.status)}
                          </div>
                          <p className="text-sm text-slate-600">
                            @{tech.username}
                          </p>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Mail className="size-4" />
                          <span className="text-sm">{tech.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <Phone className="size-4" />
                          <span className="text-sm">{tech.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <Star className="size-4 text-yellow-500" />
                          <span className="text-sm font-semibold">
                            {tech.rating} ⭐ ({tech.completedJobs} ca)
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <Calendar className="size-4" />
                          <span className="text-sm">
                            HSD:{" "}
                            {new Date(tech.expiryDate).toLocaleDateString(
                              "vi-VN"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex lg:flex-col gap-2 lg:w-40">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewTechnician(tech)}
                      >
                        <Eye className="size-4 mr-2" />
                        Xem
                      </Button>
                      {tech.status === "active" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuspendTechnician(tech.id)}
                            className="flex-1 text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                          >
                            <AlertCircle className="size-4 mr-2" />
                            Tạm Cấm
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBanTechnician(tech.id)}
                            className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <Ban className="size-4 mr-2" />
                            Cấm
                          </Button>
                        </>
                      )}
                      {tech.status !== "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleActivateTechnician(tech.id)}
                          className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <CheckCircle className="size-4 mr-2" />
                          Kích Hoạt
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Order History */}
        {activeTab === "order-history" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Lịch Sử Đơn Cứu Hộ</h2>
                {orderHistoryTotalElements > 0 && (
                  <p className="text-sm text-slate-500 mt-0.5">
                    Tổng cộng <span className="font-semibold text-slate-700">{orderHistoryTotalElements}</span> đơn hàng
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchOrderHistory(orderHistoryPage)}
                disabled={isLoadingOrderHistory}
              >
                <RefreshCw className={`size-4 mr-2 ${isLoadingOrderHistory ? "animate-spin" : ""}`} />
                Làm Mới
              </Button>
            </div>

            {isLoadingOrderHistory ? (
              <Card className="p-12 text-center">
                <RefreshCw className="size-8 text-slate-400 mx-auto mb-4 animate-spin" />
                <p className="text-slate-600">Đang tải lịch sử đơn hàng...</p>
              </Card>
            ) : orderHistory.length === 0 ? (
              <Card className="p-12 text-center">
                <History className="size-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Chưa Có Đơn Hàng Nào</h3>
                <p className="text-slate-600">Lịch sử đơn hàng sẽ hiển thị ở đây</p>
              </Card>
            ) : (
              <>
                <div className="space-y-3">
                  {orderHistory.map((order) => {
                    const statusConfig: Record<string, { label: string; color: string }> = {
                      COMPLETED:   { label: "Hoàn Thành",       color: "bg-green-100 text-green-800" },
                      CANCELLED:   { label: "Đã Hủy",           color: "bg-red-100 text-red-800" },
                      REQUESTED:   { label: "Đang Chờ",         color: "bg-yellow-100 text-yellow-800" },
                      ACCEPTED:    { label: "Đã Chấp Nhận",     color: "bg-blue-100 text-blue-800" },
                      IN_PROGRESS:  { label: "Đang Trên Đường",  color: "bg-purple-100 text-purple-800" },
                    };
                    const sc = statusConfig[order.status] ?? { label: order.status, color: "bg-slate-100 text-slate-800" };

                    return (
                      <Card key={order.orderId} className="p-5 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          {/* Service icon */}
                          <div className="size-12 bg-purple-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                            {getServiceIcon(order.serviceName)}
                          </div>

                          {/* Main info */}
                          <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <h3 className="font-bold text-slate-900">{order.serviceName}</h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {new Date(order.completedAt).toLocaleString("vi-VN")}
                                </p>
                              </div>
                              <Badge className={`${sc.color} shrink-0`}>{sc.label}</Badge>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                              <div>
                                <p className="text-xs text-slate-500 mb-0.5">Khách hàng</p>
                                <p className="font-medium text-slate-900">{order.customerName}</p>
                                <p className="text-slate-500">{order.phone}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-0.5">Thợ sửa</p>
                                <p className="font-medium text-slate-900">{order.mechanicName}</p>
                                <p className="text-slate-500">{order.mechanicPhone}</p>
                              </div>
                              {order.address && (
                                <div className="sm:col-span-2">
                                  <p className="text-xs text-slate-500 mb-0.5">Địa chỉ</p>
                                  <p className="text-slate-700 flex items-start gap-1">
                                    <MapPin className="size-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                                    {order.address}
                                  </p>
                                </div>
                              )}
                            </div>

                            {order.rating && (
                              <div className="flex items-center gap-1.5 pt-1">
                                {[1,2,3,4,5].map((s) => (
                                  <Star key={s} className={`size-4 ${s <= order.rating! ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`} />
                                ))}
                                <span className="text-xs text-slate-500 ml-1">{order.rating}/5</span>
                                {order.review && (
                                  <span className="text-xs text-slate-500 italic ml-2">"{order.review}"</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination */}
                {orderHistoryTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchOrderHistory(orderHistoryPage - 1)}
                      disabled={orderHistoryPage === 0 || isLoadingOrderHistory}
                    >
                      <ChevronLeft className="size-4 mr-1" />
                      Trước
                    </Button>
                    <span className="text-sm text-slate-600">
                      Trang <span className="font-semibold">{orderHistoryPage + 1}</span> / {orderHistoryTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchOrderHistory(orderHistoryPage + 1)}
                      disabled={orderHistoryPage >= orderHistoryTotalPages - 1 || isLoadingOrderHistory}
                    >
                      Sau
                      <ChevronRight className="size-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab: Registration Approval */}
        {activeTab === "registrations" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                Duyệt Tài Khoản Mới
              </h2>
              <Button variant="outline" onClick={fetchPendingAccounts} disabled={isLoadingPending}>
                <RefreshCw className={`size-4 mr-2 ${isLoadingPending ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>

            {pendingAccounts.length === 0 ? (
              <Card className="p-12 text-center">
                <UserCheck className="size-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Không Có Yêu Cầu Đăng Ký Mới
                </h3>
                <p className="text-slate-600">
                  Các yêu cầu đăng ký mới sẽ xuất hiện ở đây
                </p>
              </Card>
            ) : (
              pendingAccounts.map((account) => (
                <Card key={account.accountId} className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-blue-100 rounded-full">
                          <UserCheck className="size-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900">
                            {account.fullName} 
                            <Badge className={account.workType === "GARAGE" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}>
                              {account.workType === "GARAGE" ? "Garage/Xưởng" : "Thợ Di động"}
                            </Badge>
                          </h3>
                          <p className="text-sm text-slate-600">
                            @{account.username}
                          </p>
                          
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Mail className="size-4" />
                          <span className="text-sm">{account.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <Phone className="size-4" />
                          <span className="text-sm">{account.phoneNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <Calendar className="size-4" />
                          <span className="text-sm">
                            Ngày đăng ký:{" "}
                            {new Date(account.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border">
                        <p className="text-sm font-medium text-slate-700 mb-2">
                          Loại phương tiện:
                        </p>
                        <div className="flex flex-col gap-2">
                          <div>
                            <Badge variant="outline" className="bg-red-100 text-red-800">
                              {account.type === "CAR" ? "Ô tô" : account.type === "MOTORBIKE" ? "Xe máy" : "Xe tải"}
                            </Badge>
                          </div>
                          
                          {account.workType === "GARAGE" && account.garageName && (
                            <div className="mt-1 text-sm text-slate-700">
                              <p><span className="font-semibold text-slate-900">Garage:</span> {account.garageName}</p>
                              {account.garageAddress && (
                                <p className="mt-1 flex gap-1 items-start">
                                  <MapPin className="size-4 text-red-500 shrink-0 mt-0.5" />
                                  <span>{account.garageAddress}</span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex lg:flex-col gap-2 lg:w-40">
                      <Button
                        onClick={() => handleApproveRegistration(account.accountId)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="size-4 mr-2" />
                        Duyệt
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRejectRegistration(account.accountId)}
                        className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
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

        {/* Tab: Renewal Approval */}
        {activeTab === "renewals" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                Duyệt Gia Hạn Tài Khoản
              </h2>
              <Button variant="outline" onClick={fetchRenewalRequests} disabled={isLoadingRenewals}>
                <RefreshCw className={`size-4 mr-2 ${isLoadingRenewals ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>

            {renewalRequests.filter((r) => r.status === "pending").length ===
            0 ? (
              <Card className="p-12 text-center">
                <Clock className="size-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Không Có Yêu Cầu Gia Hạn
                </h3>
                <p className="text-slate-600">
                  Các yêu cầu gia hạn sẽ xuất hiện ở đây
                </p>
              </Card>
            ) : (
              renewalRequests
                .filter((r) => r.status === "pending")
                .map((request) => (
                  <Card key={request.id} className="p-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-3 bg-yellow-100 rounded-full">
                            <RefreshCw className="size-6 text-yellow-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-slate-900">
                              {request.technicianName}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {request.technicianId}
                            </p>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="bg-red-50 p-3 rounded-lg border-2 border-red-200">
                            <p className="text-sm font-medium text-slate-700">
                              Ngày Hết Hạn Hiện Tại
                            </p>
                            <p className="text-lg font-bold text-red-600">
                              {new Date(
                                request.currentExpiry
                              ).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg border-2 border-green-200">
                            <p className="text-sm font-medium text-slate-700">
                              Ngày Hết Hạn Mới
                            </p>
                            <p className="text-lg font-bold text-green-600">
                              {new Date(
                                new Date(request.currentExpiry).setMonth(
                                  new Date(request.currentExpiry).getMonth() +
                                    1
                                )
                              ).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm text-slate-600 mt-3">
                          Ngày gửi yêu cầu:{" "}
                          {new Date(request.requestedDate).toLocaleDateString(
                            "vi-VN"
                          )}
                        </p>
                      </div>

                      <div className="flex lg:flex-col gap-2 lg:w-40">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBillUrl(request.billImageUrl || null);
                            setIsBillDialogOpen(true);
                          }}
                          className="flex-1 text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="size-4 mr-2" />
                          Xem Bill
                        </Button>
                        <Button
                          onClick={() => handleApproveRenewal(request.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="size-4 mr-2" />
                          Duyệt
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleRejectRenewal(request.id)}
                          className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
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

        {/* Tab: Reports */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Xử Lý Báo Cáo</h2>
              <Button variant="outline" size="sm" onClick={fetchReports} disabled={isLoadingReports}>
                <RefreshCw className={`size-4 mr-2 ${isLoadingReports ? "animate-spin" : ""}`} />
                Làm Mới
              </Button>
            </div>

            {isLoadingReports ? (
              <Card className="p-12 text-center">
                <RefreshCw className="size-8 text-slate-400 mx-auto mb-4 animate-spin" />
                <p className="text-slate-600">Đang tải danh sách báo cáo...</p>
              </Card>
            ) : reports.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="size-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Không Có Báo Cáo Nào
                </h3>
                <p className="text-slate-600">
                  Các báo cáo từ người dùng và thợ sửa sẽ xuất hiện ở đây
                </p>
              </Card>
            ) : (
              reports.map((report) => {
                const REASON_LABEL: Record<string, string> = {
                  MECHANIC_NO_COME: "Thợ không đến",
                  UNPROFESSIONAL_BEHAVIOR: "Thái độ không chuyên nghiệp",
                  MECHANIC_NO_RESPOND: "Thợ không phản hồi",
                  CUSTOMER_NOT_PRESENT: "Khách không có mặt",
                  CUSTOMER_UNCOOPERATIVE: "Khách không hợp tác",
                  APP_ERROR: "Lỗi hệ thống",
                  LOCATION_ERROR: "Lỗi định vị / vị trí sai",
                  NOT_RECEIVING_ORDERS: "Không nhận được yêu cầu",
                  EXTEND_ERROR: "Lỗi gia hạn tài khoản",
                };
                const reportedByConfig: Record<string, { label: string; color: string }> = {
                  CUSTOMER: { label: "Từ Khách Hàng", color: "bg-blue-100 text-blue-800" },
                  MECHANIC: { label: "Từ Thợ Sửa", color: "bg-purple-100 text-purple-800" },
                  SYSTEM: { label: "Từ Hệ Thống", color: "bg-orange-100 text-orange-800" },
                };
                const byConfig = reportedByConfig[report.reportedByType] ?? {
                  label: report.reportedByType,
                  color: "bg-slate-100 text-slate-800",
                };
                const iconColor =
                  report.reportedByType === "CUSTOMER"
                    ? "bg-blue-100 text-blue-600"
                    : report.reportedByType === "MECHANIC"
                    ? "bg-purple-100 text-purple-600"
                    : "bg-orange-100 text-orange-600";

                return (
                  <Card key={report.reportId} className="p-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`p-3 rounded-full flex-shrink-0 ${iconColor}`}>
                            <AlertCircle className="size-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg text-slate-900">
                                {REASON_LABEL[report.reason] ?? report.reason}
                              </h3>
                              <Badge className={byConfig.color}>{byConfig.label}</Badge>
                            </div>
                            <p className="text-sm text-slate-500">
                              {new Date(report.createdAt).toLocaleString("vi-VN")}
                            </p>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                              Người báo cáo
                            </p>
                            <p className="text-slate-900 font-medium">{report.reporterName}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                              Đối tượng bị báo cáo
                            </p>
                            <p className="text-slate-900 font-medium">{report.target || "—"}</p>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                            Nội dung báo cáo
                          </p>
                          <p className="text-slate-900 leading-relaxed">{report.content}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* View Technician Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Chi Tiết Thợ Sửa Chữa</DialogTitle>
          </DialogHeader>

          {selectedTechnician && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border-2 border-red-200">
                <div className="size-16 rounded-full overflow-hidden flex-shrink-0 border border-slate-200">
                        <img 
                          src={selectedTechnician.avatarUrl || "/default-avatar.png"} // Thêm ảnh mặc định phòng trường hợp url null
                          alt="Avatar" 
                          className="size-full object-cover"
                        />
                      </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900">
                    {/* Sửa logic hiển thị tên ở đây */}
                  {selectedTechnician.workType === "GARAGE" && selectedTechnician.garageName 
                    ? selectedTechnician.garageName 
                    : selectedTechnician.name}
                </h3>
                <p className="text-slate-600">
                  {/* Nếu là Garage, hiện thêm tên thợ nhỏ ở dưới */}
                  {selectedTechnician.workType === "GARAGE" ? `Chủ tiệm: ${selectedTechnician.name}` : `@${selectedTechnician.username}`}
                </p>
                  <div className="mt-2">{getStatusBadge(selectedTechnician.status)}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <Star className="size-6 fill-yellow-400 text-yellow-400" />
                    <span className="text-3xl font-bold text-slate-900">
                      {selectedTechnician.rating}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">Đánh giá trung bình</p>
                </div>
              </div>
              {selectedTechnician.workType === "GARAGE" && selectedTechnician.garageAddress && (
                <div>
                  <h4 className="font-bold text-lg text-slate-900 mb-3 flex items-center gap-2">
                    <MapPin className="size-5 text-red-600" />
                    Địa Chỉ Garage
                  </h4>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-slate-900 leading-relaxed">
                      {selectedTechnician.garageAddress}
                    </p>
                  </div>
                </div>
              )}
              {/* Contact Information */}
              <div>
                <h4 className="font-bold text-lg text-slate-900 mb-3 flex items-center gap-2">
                  <Phone className="size-5 text-red-600" />
                  Thông Tin Liên Hệ
                </h4>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-slate-500" />
                      <p className="font-medium text-slate-900">{selectedTechnician.email}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Số điện thoại</p>
                    <div className="flex items-center gap-2">
                      <Phone className="size-4 text-slate-500" />
                      <p className="font-medium text-slate-900">{selectedTechnician.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Statistics */}
              <div>
                <h4 className="font-bold text-lg text-slate-900 mb-3 flex items-center gap-2">
                  <BarChart3 className="size-5 text-red-600" />
                  Thống Kê Công Việc
                </h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="size-8 text-green-600" />
                      <div>
                        <p className="text-sm text-slate-600">Số Ca Hoàn Thành</p>
                        <p className="text-2xl font-bold text-green-600">
                          {selectedTechnician.completedJobs}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                    <div className="flex items-center gap-3">
                      <Star className="size-8 text-yellow-600" />
                      <div>
                        <p className="text-sm text-slate-600">Xếp Hạng</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {selectedTechnician.rating} ⭐
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h4 className="font-bold text-lg text-slate-900 mb-3 flex items-center gap-2">
                  <Calendar className="size-5 text-red-600" />
                  Thông Tin Tài Khoản
                </h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Ngày tham gia</p>
                    <p className="font-medium text-slate-900">
                      {new Date(selectedTechnician.joinDate).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Ngày hết hạn</p>
                    <p className="font-medium text-slate-900">
                      {new Date(selectedTechnician.expiryDate).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                {selectedTechnician.status === "active" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleSuspendTechnician(selectedTechnician.id);
                        setIsViewDialogOpen(false);
                      }}
                      className="flex-1 text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                    >
                      <AlertCircle className="size-4 mr-2" />
                      Tạm Cấm
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleBanTechnician(selectedTechnician.id);
                        setIsViewDialogOpen(false);
                      }}
                      className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <Ban className="size-4 mr-2" />
                      Cấm
                    </Button>
                  </>
                )}
                {selectedTechnician.status !== "active" && (
                  <Button
                    onClick={() => {
                      handleActivateTechnician(selectedTechnician.id);
                      setIsViewDialogOpen(false);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="size-4 mr-2" />
                    Kích Hoạt
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setIsViewDialogOpen(false)}
                  className="flex-1"
                >
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Dialog xem ảnh Bill */}
      <Dialog open={isBillDialogOpen} onOpenChange={setIsBillDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Minh Chứng Thanh Toán</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-2">
            {selectedBillUrl ? (
              <img 
                src={selectedBillUrl} 
                alt="Bill thanh toán" 
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md border" 
              />
            ) : (
              <div className="py-20 text-center text-slate-500">
                <AlertCircle className="size-12 mx-auto mb-2 opacity-20" />
                <p>Không tìm thấy hình ảnh minh chứng.</p>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setIsBillDialogOpen(false)}>Đóng</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}