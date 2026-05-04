import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  ArrowLeft,
  Clock,
  CheckCircle,
  Phone,
  Star,
  Truck,
  User,
  RefreshCw,
  Flag,
  AlertTriangle,
  Car,
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
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";
import { API_CONFIG, API_ENDPOINTS } from "../../config/apiConfig";

interface CustomerOrderResponse {
  orderId: string;
  mechanicName: string;
  customerName: string;
  customerPhone: string;
  mechanicPhone: string;
  serviceName: string;
  status: string;
  createdAt: string;
  rating?: number;
  review?: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  REQUESTED: {
    label: "Đang Chờ Xác Nhận",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: Clock,
  },
  ACCEPTED: {
    label: "Đã Chấp Nhận",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: CheckCircle,
  },
  IN_PROGRESS: {
    label: "Đang Trên Đường",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: Car,
  },
  COMPLETED: {
    label: "Đã Hoàn Thành",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Đã Hủy",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: Clock,
  },
};

const REASON_OPTIONS: { value: string; label: string; description: string }[] = [
  {
    value: "MECHANIC_NO_COME",
    label: "Thợ không đến",
    description: "Thợ đã xác nhận nhưng không đến điểm hẹn",
  },
  {
    value: "UNPROFESSIONAL_BEHAVIOR",
    label: "Thái độ không chuyên nghiệp",
    description: "Thợ có hành vi, lời nói thiếu chuyên nghiệp hoặc không lịch sự",
  },
  {
    value: "MECHANIC_NO_RESPOND",
    label: "Thợ không phản hồi",
    description: "Không thể liên lạc hoặc thợ bỏ qua cuộc gọi / tin nhắn",
  },
];

const getStatusInfo = (status: string) =>
  STATUS_MAP[status] ?? {
    label: status,
    color: "bg-slate-100 text-slate-700 border-slate-200",
    icon: Clock,
  };

export function MyRequestsPage() {
  const [orders, setOrders] = useState<CustomerOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Rating state
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrderResponse | null>(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  // Report state
  const [reportOrder, setReportOrder] = useState<CustomerOrderResponse | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportContent, setReportContent] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  const customerPhone = (() => {
    try {
      const saved = localStorage.getItem("rescueRequests");
      if (!saved) return "";
      const requests = JSON.parse(saved);
      return requests[requests.length - 1]?.customerPhone ?? "";
    } catch {
      return "";
    }
  })();

  const fetchOrders = async (silent = false) => {
    if (!customerPhone) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch(
        `${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.CUSTOMER_ORDERS}?phone=${encodeURIComponent(customerPhone)}`
      );
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message);

      const saved = localStorage.getItem("rescueRatings");
      const ratings: Record<string, { rating: number; review: string }> = saved
        ? JSON.parse(saved)
        : {};

      setOrders(
        data.data.map((o: CustomerOrderResponse) => ({
          ...o,
          ...(ratings[o.orderId] ?? {}),
        }))
      );
    } catch (err: any) {
      toast.error("Không thể tải danh sách yêu cầu", {
        description: err.message,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleRateService = (order: CustomerOrderResponse) => {
    setSelectedOrder(order);
    setRating(order.rating ?? 0);
    setReview(order.review ?? "");
    setShowRatingDialog(true);
  };

  const submitRating = async () => {
    if (!selectedOrder || rating === 0) {
      toast.error("Vui lòng chọn số sao đánh giá");
      return;
    }

    setSubmittingRating(true);

    try {
      const res = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.CREATE_REVIEW}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.orderId,
          rating,
          review,
          customerPhone,
        }),
      });

      if (!res.ok) throw new Error("Không thể gửi đánh giá");

      const saved = localStorage.getItem("rescueRatings");
      const ratings = saved ? JSON.parse(saved) : {};
      ratings[selectedOrder.orderId] = { rating, review };
      localStorage.setItem("rescueRatings", JSON.stringify(ratings));

      setOrders((prev) =>
        prev.map((o) =>
          o.orderId === selectedOrder.orderId ? { ...o, rating, review } : o
        )
      );

      toast.success("Đánh Giá Thành Công!", {
        description: "Cảm ơn bạn đã đánh giá dịch vụ.",
      });

      setShowRatingDialog(false);
      setRating(0);
      setReview("");
      setSelectedOrder(null);
    } catch (err: any) {
      toast.error("Lỗi khi gửi đánh giá", { description: err.message });
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleOpenReport = (order: CustomerOrderResponse) => {
    setReportOrder(order);
    setReportReason("");
    setReportContent("");
    setShowReportDialog(true);
  };

  const submitReport = async () => {
    if (!reportOrder) return;
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
      const res = await fetch(`${API_CONFIG.API_BASE_URL}/orders/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: reportOrder.orderId,
          targetPhone: reportOrder.mechanicPhone,
          targetType: "MECHANIC",
          reasonCategory: reportReason,
          content: reportContent.trim(),
        }),
      });

      if (!res.ok) throw new Error("Không thể gửi báo cáo");

      toast.success("Báo Cáo Đã Được Gửi!", {
        description: "Chúng tôi sẽ xem xét và xử lý trong thời gian sớm nhất.",
      });

      setShowReportDialog(false);
      setReportOrder(null);
      setReportReason("");
      setReportContent("");
    } catch (err: any) {
      toast.error("Lỗi khi gửi báo cáo", { description: err.message });
    } finally {
      setSubmittingReport(false);
    }
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
                <Link to="/">
                  <ArrowLeft className="size-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <Shield className="size-8 text-red-600" />
                <span className="text-2xl font-bold text-slate-900">RescueNow</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`size-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Làm Mới
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Yêu Cầu Của Tôi</h1>
          {customerPhone && (
            <p className="text-slate-500 text-sm flex items-center gap-1.5">
              <Phone className="size-3.5" />
              {customerPhone}
            </p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <RefreshCw className="size-6 animate-spin mr-3" />
            Đang tải...
          </div>
        )}

        {/* No phone */}
        {!loading && !customerPhone && (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="size-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone className="size-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Không Tìm Thấy Thông Tin
              </h3>
              <p className="text-slate-600 mb-6">
                Vui lòng tạo yêu cầu cứu hộ trước để xem lịch sử.
              </p>
              <Button asChild className="bg-red-600 hover:bg-red-700">
                <Link to="/search">
                  <Shield className="size-4 mr-2" />
                  Tìm Trợ Giúp Ngay
                </Link>
              </Button>
            </div>
          </Card>
        )}

        {/* Empty */}
        {!loading && customerPhone && orders.length === 0 && (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="size-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Truck className="size-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa Có Yêu Cầu Nào</h3>
              <p className="text-slate-600 mb-6">
                Bạn chưa có yêu cầu cứu hộ nào. Khi bạn cần trợ giúp, yêu cầu sẽ hiển thị ở đây.
              </p>
              <Button asChild className="bg-red-600 hover:bg-red-700">
                <Link to="/search">
                  <Shield className="size-4 mr-2" />
                  Tìm Trợ Giúp Ngay
                </Link>
              </Button>
            </div>
          </Card>
        )}

        {/* Orders list */}
        {!loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const StatusIcon = statusInfo.icon;
              const isActive = !["COMPLETED", "CANCELLED"].includes(order.status);
              const canReport = order.status !== "CANCELLED";

              return (
                <Card key={order.orderId} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="size-14 bg-slate-100 rounded-full flex items-center justify-center text-2xl">
                            🔧
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-1">
                              {order.mechanicName}
                            </h3>
                            <Badge variant="outline" className="mb-2 border-red-200 text-red-700">
                              {order.serviceName}
                            </Badge>
                            <div className="text-sm text-slate-500 space-y-1">
                              <div className="flex items-center gap-2">
                                <User className="size-3.5" />
                                <span>{order.customerName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="size-3.5" />
                                <span>{order.customerPhone}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Badge className={`${statusInfo.color} border shrink-0`}>
                          <StatusIcon className="size-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>

                      {/* Details */}
                      <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Thời Gian Yêu Cầu</div>
                          <div className="font-medium text-slate-900">
                            {new Date(order.createdAt).toLocaleString("vi-VN")}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Số Điện Thoại Thợ</div>
                          <div className="font-medium text-slate-900">
                            {order.mechanicPhone || "—"}
                          </div>
                        </div>
                      </div>
                      {order.status === "REQUESTED" && (
                        <div className="flex items-start gap-2 pt-3 border-t text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2.5">
                          <Clock className="size-4 mt-0.5 flex-shrink-0 text-yellow-500" />
                          <p className="text-sm leading-snug">
                            Bạn có thể gọi trực tiếp đến thợ sửa nếu <span className="font-semibold">5 – 10 phút</span> họ chưa chấp nhận yêu cầu cứu hộ.
                          </p>
                        </div>
                      )}

                      {/* Rating display */}
                      {order.status === "COMPLETED" && order.rating && (
                        <div className="pt-4 border-t">
                          <div className="text-xs text-slate-500 mb-2">Đánh Giá Của Bạn</div>
                          <div className="flex items-center gap-2 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`size-5 ${
                                  star <= order.rating!
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-slate-300"
                                }`}
                              />
                            ))}
                            <span className="text-sm font-semibold text-slate-900">
                              {order.rating}/5
                            </span>
                          </div>
                          {order.review && (
                            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg italic">
                              "{order.review}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col justify-center gap-3 lg:min-w-[180px]">
                      {isActive && order.mechanicPhone && (
                        <Button asChild variant="outline" size="lg" className="w-full">
                          <a href={`tel:${order.mechanicPhone}`}>
                            <Phone className="size-4 mr-2" />
                            Gọi Thợ
                          </a>
                        </Button>
                      )}

                      {order.status === "COMPLETED" && !order.rating && (
                        <Button
                          size="lg"
                          className="bg-yellow-500 hover:bg-yellow-600 w-full"
                          onClick={() => handleRateService(order)}
                        >
                          <Star className="size-4 mr-2" />
                          Đánh Giá
                        </Button>
                      )}

                      {order.status === "COMPLETED" && order.rating && (
                        <Button
                          variant="outline"
                          size="lg"
                          className="w-full"
                          onClick={() => handleRateService(order)}
                        >
                          Sửa Đánh Giá
                        </Button>
                      )}

                      {/* Report button - show for all statuses except CANCELLED */}
                      {canReport && (
                        <Button
                          variant="outline"
                          size="lg"
                          className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                          onClick={() => handleOpenReport(order)}
                        >
                          <Flag className="size-4 mr-2" />
                          Báo Cáo
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {orders.length > 0 && (
          <div className="mt-8 text-center">
            <Button asChild size="lg" className="bg-red-600 hover:bg-red-700">
              <Link to="/search">
                <Shield className="size-4 mr-2" />
                Tạo Yêu Cầu Mới
              </Link>
            </Button>
          </div>
        )}
      </main>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đánh Giá Dịch Vụ</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="size-12 bg-white rounded-full flex items-center justify-center text-2xl">
                  🔧
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{selectedOrder.mechanicName}</div>
                  <div className="text-sm text-slate-500">{selectedOrder.serviceName}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Đánh Giá Sao</Label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`size-10 ${
                          star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-slate-300 hover:text-yellow-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-sm text-slate-500">Bạn đã chọn {rating} sao</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="review">Nhận Xét (Tùy Chọn)</Label>
                <Textarea
                  id="review"
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowRatingDialog(false)}
                  disabled={submittingRating}
                >
                  Hủy
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={submitRating}
                  disabled={submittingRating}
                >
                  {submittingRating ? "Đang Gửi..." : "Gửi Đánh Giá"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="size-5" />
              Báo Cáo Sự Cố
            </DialogTitle>
          </DialogHeader>

          {reportOrder && (
            <div className="space-y-5">
              {/* Mechanic info */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="size-12 bg-white rounded-full flex items-center justify-center text-2xl">
                  🔧
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{reportOrder.mechanicName}</div>
                  <div className="text-sm text-slate-500">{reportOrder.serviceName}</div>
                </div>
              </div>

              {/* Reason selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Lý Do Báo Cáo <span className="text-red-500">*</span>
                </Label>
                <div className="space-y-2">
                  {REASON_OPTIONS.map((option) => (
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
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 size-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                            reportReason === option.value
                              ? "border-orange-500 bg-orange-500"
                              : "border-slate-300"
                          }`}
                        >
                          {reportReason === option.value && (
                            <div className="size-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <div
                            className={`text-sm font-medium ${
                              reportReason === option.value
                                ? "text-orange-700"
                                : "text-slate-800"
                            }`}
                          >
                            {option.label}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{option.description}</div>
                        </div>
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
                  onClick={submitReport}
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}