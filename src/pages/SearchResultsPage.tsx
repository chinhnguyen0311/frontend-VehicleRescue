import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Shield,
  Phone,
  Star,
  Clock,
  CheckCircle,
  ArrowLeft,
  Navigation,
  Award,
  User,
  Wrench,
  Loader,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";
import { API_CONFIG, API_ENDPOINTS } from "../../config/apiConfig";
import { getMechanicDetail } from "../../services/mechanicApi";
import type { ResultMechanic } from "../../types/resultmechanic";
import type { MechanicDetail } from "../../types/mechanic";

export function SearchResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Lấy results + thông tin người yêu cầu từ navigate state
  const results: ResultMechanic[] = location.state?.results ?? [];
  const customerName: string = location.state?.customerName ?? "";
  const customerPhone: string = location.state?.customerPhone ?? "";
  const serviceName: string = location.state?.serviceName ?? "";
  const serviceId: string = location.state?.serviceId ?? "";
  const latitude: number = location.state?.latitude ?? 0;
  const longitude: number = location.state?.longitude ?? 0;

  const [requestedId, setRequestedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState<(ResultMechanic & MechanicDetail) | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  
  const handleRequestSupport = async (mechanic: ResultMechanic) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.CREATE_ORDER}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          serviceId,
          latitude,
          longitude,
          mechanicId: mechanic.mechanicId,
        }),
      });
      console.log("serviceId:", serviceId);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Gửi yêu cầu thất bại");
      }

      setRequestedId(mechanic.mechanicId);
      const fcmToken = localStorage.getItem("fcm_token");
    const newOrderId = data.data.orderId;
    
    if (fcmToken && newOrderId) {
      try {
        // Gọi API lưu token tạm vào RAM (bạn nhớ điều chỉnh lại URL API cho khớp với config của bạn)
        await fetch(`${API_CONFIG.API_BASE_URL}/api/notifications/save-token?orderId=${newOrderId}&token=${fcmToken}`, {
          method: "POST"
        });
        console.log("Đã gửi FCM token cho đơn hàng:", newOrderId);
      } catch (tokenErr) {
        // Lỗi gửi token không nên làm crash luồng tạo đơn chính
        console.error("Lỗi khi đồng bộ FCM token với server:", tokenErr);
      }
    }
      // Lưu vào localStorage để hiển thị ở MyRequestsPage
      const saved = localStorage.getItem("rescueRequests");
      const requests = saved ? JSON.parse(saved) : [];
      requests.push({
        id: data.data.orderId,
        customerName,
        customerPhone,
        serviceId,
        provider: {
          name: mechanic.displayName,
          phone: mechanic.phoneNumber,
        },
        status: data.data.orderStatus ?? "WAITING",
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("rescueRequests", JSON.stringify(requests));

      toast.success("Yêu Cầu Đã Gửi Thành Công", {
        description: `Yêu cầu đã được gửi đến ${mechanic.displayName}. Đang chờ chấp nhận...`,
        duration: 5000,
        action: {
          label: "Xem Yêu Cầu",
          onClick: () => navigate("/my-requests"),
        },
      });
    } catch (err: any) {
      toast.error("Gửi Yêu Cầu Thất Bại", {
        description: err.message || "Vui lòng thử lại",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const formatDistance = (km: number) => {
    return `${km.toFixed(1)} km`;
  };

  const handleViewProfile = async (mechanic: ResultMechanic) => {
    setIsLoadingDetail(true);
    try {
      const detail = await getMechanicDetail(mechanic.mechanicId);
      // Merge detail with mechanic, but keep mechanic's type (string[])
      const merged = { ...mechanic, ...detail, type: mechanic.type };
      setSelectedMechanic(merged as ResultMechanic & MechanicDetail);
    } catch (error) {
      console.error("Error fetching mechanic detail:", error);
      toast.error("Không thể tải hồ sơ nhà cung cấp");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const estimateETA = (km: number) => {
    const minutes = Math.max(5, Math.round((km / 50) * 60)); // ~50km/h trung bình
    return `${minutes}–${minutes + 5} phút`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/search">
                  <ArrowLeft className="size-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <Shield className="size-8 text-red-600" />
                <span className="text-2xl font-bold text-slate-900">RescueNow</span>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link to="/my-requests">Xem Yêu Cầu Của Tôi</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Summary bar */}
        <div className="bg-white rounded-lg border-2 border-slate-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Chuyên Gia Cứu Hộ Có Sẵn
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-slate-600 text-sm">
                {customerName && (
                  <div className="flex items-center gap-1.5">
                    <User className="size-4 text-slate-400" />
                    <span>{customerName}</span>
                  </div>
                )}
                {customerPhone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="size-4 text-slate-400" />
                    <span>{customerPhone}</span>
                  </div>
                )}
                {serviceName && (
                  <Badge variant="outline" className="border-red-200 text-red-700">
                    {serviceName}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-3xl font-bold text-slate-900">{results.length}</div>
              <div className="text-sm text-slate-500">nhà cung cấp gần đây</div>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {results.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <Wrench className="size-12 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium">Không tìm thấy chuyên gia nào</p>
            <p className="text-sm mt-1">Vui lòng thử lại hoặc chọn dịch vụ khác</p>
            <Button className="mt-6" asChild>
              <Link to="/search">Tìm Lại</Link>
            </Button>
          </div>
        )}

        {/* Results */}
        <div className="space-y-4">
          {results.map((mechanic, index) => (
            <Card
              key={mechanic.mechanicId}
              className={`p-6 transition-all border-2 ${
                requestedId === mechanic.mechanicId
                  ? "border-green-500 bg-green-50"
                  : "hover:border-red-200 hover:shadow-lg"
              }`}
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar + rank */}
                    <div className="relative">
                      <div className="size-16 rounded-full overflow-hidden flex-shrink-0 border border-slate-200">
                        <img 
                          src={mechanic.avatarUrl || "/default-avatar.png"} // Thêm ảnh mặc định phòng trường hợp url null
                          alt="Avatar" 
                          className="size-full object-cover"
                        />
                      </div>
                      {index < 3 && (
                        <div className="absolute -top-1 -right-1 size-7 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-slate-900">
                          {mechanic.displayName}
                        </h3>
                        <CheckCircle className="size-5 text-blue-600" />
                      </div>

                      <div className="flex items-center gap-2 text-slate-500 mb-4">
                        <Phone className="size-4" />
                        <span>{mechanic.phoneNumber}</span>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center gap-1 text-yellow-500 mb-1">
                            <Star className="size-4 fill-current" />
                            <span className="font-bold text-slate-900">
                              {mechanic.ratingScore.toFixed(1)}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">Đánh giá</div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center gap-1 text-green-600 mb-1">
                            <Navigation className="size-4" />
                            <span className="font-bold text-slate-900">
                              {formatDistance(mechanic.distance)}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">Khoảng cách</div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center gap-1 text-blue-600 mb-1">
                            <Clock className="size-4" />
                            <span className="font-bold text-slate-900">
                              {estimateETA(mechanic.distance)}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">ETA</div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center gap-1 text-purple-600 mb-1">
                            <Award className="size-4" />
                            <span className="font-bold text-slate-900">
                              {mechanic.completedOrders}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">Đơn hoàn thành</div>
                        </div>
                      </div>

                      {/* Services */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {mechanic.services.map((s) => (
                          <Badge
                            key={s.serviceId}
                            variant="outline"
                            className="border-slate-300 text-slate-700"
                          >
                            {s.serviceName}
                            {s.customPrice > 0 && (
                              <span className="ml-1 text-slate-400">
                                · {s.customPrice.toLocaleString("vi-VN")}đ
                              </span>
                            )}
                          </Badge>
                        ))}
                      </div>

                      {/* Types */}
                      {mechanic.type.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Wrench className="size-4 text-slate-400" />
                          <span className="text-sm text-slate-500">
                            {mechanic.type.map((t) => 
                              t === "MOTORBIKE" ? "Xe Máy" : 
                              t === "CAR" ? "Ô Tô" : 
                              t === "TRUCK" ? "Xe Tải" : t
                            ).join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="flex flex-col justify-center gap-3 lg:min-w-[200px]">
                  {requestedId === mechanic.mechanicId ? (
                    <div className="text-center p-4 bg-green-100 rounded-lg border-2 border-green-500">
                      <CheckCircle className="size-8 text-green-600 mx-auto mb-2" />
                      <div className="font-bold text-green-900 mb-1">Yêu Cầu Đã Gửi!</div>
                      <div className="text-sm text-green-700">
                        {mechanic.displayName} sẽ liên hệ với bạn sớm
                      </div>
                    </div>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        className="bg-red-600 hover:bg-red-700 w-full h-14 text-lg"
                        onClick={() => handleRequestSupport(mechanic)}
                        disabled={requestedId !== null || loading}
                      >
                        <Phone className="size-5 mr-2" />
                        {loading ? "Đang gửi..." : "Yêu Cầu Hỗ Trợ"}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="w-full"
                        onClick={() => handleViewProfile(mechanic)}
                      >
                        Xem Hồ Sơ
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Trust notice */}
        {results.length > 0 && (
          <Card className="mt-8 p-6 bg-blue-50 border-2 border-blue-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Shield className="size-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">
                  An Toàn Của Bạn Là Ưu Tiên Hàng Đầu
                </h3>
                <p className="text-slate-700">
                  Tất cả chuyên gia cứu hộ đều được xác minh, có giấy phép và được bảo hiểm.
                  Thông tin liên hệ của bạn sẽ chỉ được chia sẻ với nhà cung cấp mà bạn yêu cầu.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Mechanic Detail Dialog */}
        <Dialog open={!!selectedMechanic} onOpenChange={(open) => !open && setSelectedMechanic(null)}>
          <DialogContent className="w-[92vw] max-w-lg rounded-2xl p-0 gap-0">
            <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-100">
              <DialogTitle className="text-lg">Chi Tiết Nhà Cung Cấp</DialogTitle>
            </DialogHeader>
            {selectedMechanic && (
              <div className="overflow-y-auto max-h-[70vh] px-5 pb-6 pt-4 space-y-5">
                {isLoadingDetail ? (
                  <div className="flex justify-center py-8">
                    <Loader className="size-8 animate-spin text-red-600" />
                  </div>
                ) : (
                  <>
                    {/* Provider Header */}
                    <div className="flex items-center gap-3">
                      <div className="size-14 sm:size-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-slate-100">
                        <img 
                          src={selectedMechanic.avatarUrl || "/default-avatar.png"}
                          alt="Avatar" 
                          className="size-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-xl font-bold text-slate-900 mb-1 truncate">
                          {selectedMechanic.displayName}
                        </h3>
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                          {selectedMechanic.workType === "GARAGE" ? "Garage/Xưởng" : "Thợ Di Động"}
                        </Badge>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-3 p-3 sm:p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={`size-4 ${s <= Math.round(selectedMechanic.avgRating ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`} />
                        ))}
                      </div>
                      <div>
                        <span className="text-lg sm:text-2xl font-bold text-slate-900">
                          {selectedMechanic.avgRating?.toFixed(1) || "N/A"}
                        </span>
                        <span className="text-sm text-slate-500 ml-2">
                          ({selectedMechanic.totalReviews || 0} đánh giá)
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="border-t pt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="text-xs text-slate-500 mb-1">Số Điện Thoại</div>
                          <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                            <Phone className="size-3.5 text-red-600 flex-shrink-0" />
                            <span className="truncate">{selectedMechanic.phoneNumber}</span>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="text-xs text-slate-500 mb-1">Loại Xe</div>
                          <div className="font-semibold text-slate-900 text-sm">
                            {selectedMechanic.type?.includes("MOTORBIKE") ? "🏍️ Xe Máy" : "🚗 Ô Tô"}
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="text-xs text-slate-500 mb-1">Đơn Hoàn Thành</div>
                          <div className="font-semibold text-slate-900 text-sm">
                            ✅ {selectedMechanic.completedOrders || 0}
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="text-xs text-slate-500 mb-1">Khoảng Cách</div>
                          <div className="font-semibold text-slate-900 text-sm">
                            📍 {formatDistance(selectedMechanic.distance)}
                          </div>
                        </div>

                        {selectedMechanic.address && (
                          <div className="col-span-2 bg-slate-50 rounded-lg p-3">
                            <div className="text-xs text-slate-500 mb-1">Địa Chỉ</div>
                            <div className="font-semibold text-slate-900 text-sm">
                              {selectedMechanic.address}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Services */}
                    {selectedMechanic.services && selectedMechanic.services.length > 0 && (
                      <div className="border-t pt-4">
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Dịch Vụ</div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedMechanic.services.map((s) => (
                            <Badge key={s.serviceId} variant="outline" className="text-xs">
                              {s.serviceName}
                              {s.customPrice > 0 && (
                                <span className="ml-1 text-slate-400">· {s.customPrice.toLocaleString("vi-VN")}đ</span>
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Reviews */}
                    {selectedMechanic.recentReviews && selectedMechanic.recentReviews.length > 0 && (
                      <div className="border-t pt-4">
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                          <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                          Bình Luận Gần Đây
                        </div>
                        <div className="space-y-2.5">
                          {selectedMechanic.recentReviews.map((r, idx) => (
                            <div key={idx} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <div className="size-6 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-600 flex-shrink-0">
                                    {r.customerName?.charAt(0)?.toUpperCase() ?? "?"}
                                  </div>
                                  <span className="text-sm font-semibold text-slate-800 truncate max-w-[120px]">{r.customerName}</span>
                                </div>
                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} className={`size-3 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`} />
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-slate-600 italic leading-relaxed">"{r.review}"</p>
                              <div className="flex items-center justify-between mt-1.5">
                                {r.serviceName && <span className="text-xs text-slate-400 truncate">{r.serviceName}</span>}
                                <span className="text-xs text-slate-400 ml-auto flex-shrink-0">
                                  {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <Button
                      size="lg"
                      className="w-full bg-red-600 hover:bg-red-700 h-12 text-base sticky bottom-0"
                      onClick={() => {
                        handleRequestSupport(selectedMechanic);
                        setSelectedMechanic(null);
                      }}
                      disabled={requestedId !== null || loading}
                    >
                      <Phone className="size-5 mr-2" />
                      {requestedId === selectedMechanic.mechanicId ? "Yêu Cầu Đã Gửi" : "Yêu Cầu Hỗ Trợ"}
                    </Button>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}