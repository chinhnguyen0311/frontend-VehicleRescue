import { Link } from "react-router-dom";
import { Shield, Star, Phone, Award, TrendingUp, User, ClipboardList, Loader, Menu, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { getTopMechanics, getMechanicDetail } from "../../services/mechanicApi";
import type { TopMechanic, MechanicDetail } from "../../types/mechanic";
import { requestNotificationPermission, listenForRealtimeMessages } from '../../config/notificationHelper';

export function Homepage() {
  const [topMechanics, setTopMechanics] = useState<TopMechanic[]>([]);
  const [selectedMechanic, setSelectedMechanic] = useState<(TopMechanic & MechanicDetail) | null>(null);
  const [requestCount, setRequestCount] = useState(0);
  const [isLoadingTopMechanics, setIsLoadingTopMechanics] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedRequests = localStorage.getItem("rescueRequests");
    if (savedRequests) {
      const requests = JSON.parse(savedRequests);
      const activeRequests = requests.filter(
        (r: any) => r.status !== "completed" && r.status !== "cancelled"
      );
      setRequestCount(activeRequests.length);
    }

    const fetchTopMechanics = async () => {
      try {
        setIsLoadingTopMechanics(true);
        const data = await getTopMechanics();
        setTopMechanics(data);
      } catch (error) {
        console.error("Error fetching top mechanics:", error);
      } finally {
        setIsLoadingTopMechanics(false);
      }
    };

    fetchTopMechanics();
    requestNotificationPermission();
    listenForRealtimeMessages();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="size-8 text-red-600" />
              <span className="text-2xl font-bold text-slate-900">RescueNow</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-slate-600 hover:text-slate-900">Trang Chủ</Link>
              <Link to="/search" className="text-slate-600 hover:text-slate-900">Tìm Trợ Giúp</Link>
            </nav>
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" className="relative">
                <Link to="/my-requests">
                  <ClipboardList className="size-4" />
                  <span className="hidden sm:inline ml-2">Yêu Cầu</span>
                  {requestCount > 0 && (
                    <span className="absolute -top-2 -right-2 size-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {requestCount}
                    </span>
                  )}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/search" onClick={() => window.scrollTo(0, 0)}>
                  <Phone className="size-4" />
                  <span className="hidden sm:inline ml-2">Nhận Trợ Giúp</span>
                </Link>
              </Button>
              <Button asChild variant="ghost" className="hidden sm:flex">
                <Link to="/login" ><User className="size-4" />Đăng Nhập</Link>
              </Button>
              <Button asChild className="bg-red-600 hover:bg-red-700 hidden sm:flex">
                <Link to="/register" onClick={() => window.scrollTo(0, 0)}>Đăng Ký Thợ</Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Mở menu"
              >
                {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </Button>
            </div>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-2">
            <Link to="/" className="block px-3 py-2 rounded-md text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium" onClick={() => setIsMobileMenuOpen(false)}>Trang Chủ</Link>
            <Link to="/search" className="block px-3 py-2 rounded-md text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium" onClick={() => setIsMobileMenuOpen(false)}>Tìm Trợ Giúp</Link>
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
              <Button asChild variant="outline" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                <Link to="/login" onClick={() => window.scrollTo(0, 0)}><User className="size-4 mr-2" />Đăng Nhập</Link>
              </Button>
              <Button asChild className="w-full bg-red-600 hover:bg-red-700" onClick={() => setIsMobileMenuOpen(false)}>
                <Link to="/register" onClick={() => window.scrollTo(0, 0)}>Đăng Ký Thợ</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-600 to-red-700 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <Badge className="bg-yellow-400 text-slate-900 hover:bg-yellow-400 mb-4">
              <Award className="size-3 mr-1" />Hỗ Trợ Khẩn Cấp 24/7
            </Badge>
            <h1 className="text-5xl sm:text-6xl font-bold mb-6">Trợ Giúp Luôn Có Ở Gần Bạn</h1>
            <p className="text-xl text-red-50 mb-8">
              Kết nối với các chuyên gia cứu hộ khẩn cấp được đánh giá cao trong khu vực của bạn.
              Thời gian phản hồi nhanh, dịch vụ đáng tin cậy và trợ giúp khi bạn cần nhất.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-white text-red-600 hover:bg-red-50">
                <Link to="/search"><Shield className="size-5 mr-2" />Yêu Cầu Trợ Giúp Khẩn Cấp</Link>
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-red-500">
              <div><div className="text-3xl font-bold">50K+</div><div className="text-red-100 text-sm">Lượt Cứu Hộ Hoàn Thành</div></div>
              <div><div className="text-3xl font-bold">1,200+</div><div className="text-red-100 text-sm">Nhà Cung Cấp Chứng Nhận</div></div>
              <div><div className="text-3xl font-bold">&lt;10 phút</div><div className="text-red-100 text-sm">Thời Gian Phản Hồi TB</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section id="leaderboard" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-yellow-400 text-slate-900 hover:bg-yellow-400 mb-4">
              <TrendingUp className="size-3 mr-1" />Được Đánh Giá Cao Nhất Tháng Này
            </Badge>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Nhà Cung Cấp Cứu Hộ Khẩn Cấp Hàng Đầu</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Các chuyên gia được đánh giá cao nhất dựa trên đánh giá của khách hàng, thời gian phản hồi và số công việc hoàn thành.
            </p>
          </div>

          <div className="space-y-4">
            {isLoadingTopMechanics ? (
              <div className="flex justify-center py-12">
                <Loader className="size-8 animate-spin text-red-600" />
              </div>
            ) : topMechanics.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-slate-600">Không có dữ liệu thợ sửa hàng đầu</p>
              </Card>
            ) : (
              topMechanics.map((mechanic, index) => (
                <Card key={mechanic.mechanicId} className="p-6 hover:shadow-xl transition-shadow border-2 hover:border-red-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className={`size-16 rounded-full flex items-center justify-center text-2xl font-bold ${index === 0 ? 'bg-yellow-400 text-slate-900' : index === 1 ? 'bg-slate-300 text-slate-900' : index === 2 ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        #{index + 1}
                      </div>
                      <div className="size-16 rounded-full overflow-hidden flex-shrink-0 border border-slate-200">
                        <img src={mechanic.avatarUrl || "/default-avatar.png"} alt="Avatar" className="size-full object-cover" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xl font-bold text-slate-900">{mechanic.mechanicName}</h3>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center gap-1 text-yellow-500 mb-1">
                            <Star className="size-5 fill-current" />
                            <span className="text-lg font-bold text-slate-900">{mechanic.avgRating}</span>
                          </div>
                          <div className="text-xs text-slate-600">{mechanic.totalReviews} đánh giá</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="text-lg font-bold text-slate-900">{mechanic.totalCompleted}</div>
                          <div className="text-xs text-slate-600">Công việc hoàn thành</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="text-lg font-bold text-green-600">-</div>
                          <div className="text-xs text-slate-600">Phản hồi TB</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Sẵn Sàng Ngay</Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      className="bg-red-600 hover:bg-red-700 shrink-0"
                      onClick={async () => {
                        try {
                          setIsLoadingDetail(true);
                          const detail = await getMechanicDetail(mechanic.mechanicId);
                          setSelectedMechanic({ ...mechanic, ...detail });
                        } catch (error) {
                          console.error("Error fetching mechanic detail:", error);
                        } finally {
                          setIsLoadingDetail(false);
                        }
                      }}
                      disabled={isLoadingDetail}
                    >
                      Xem Chi Tiết
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="size-6 text-red-500" />
            <span className="text-xl font-bold text-white">RescueNow</span>
          </div>
          <p className="mb-4">Dịch Vụ Cứu Hộ Xe Khẩn Cấp 24/7</p>
          <p className="text-sm text-slate-400">© 2026 RescueNow. Đã đăng ký bản quyền. An toàn của bạn là ưu tiên hàng đầu.</p>
        </div>
      </footer>

      {/* Provider Detail Dialog */}
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
                      <img src={selectedMechanic.avatarUrl || "/default-avatar.png"} alt="Avatar" className="size-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-xl font-bold text-slate-900 mb-1 truncate">
                        {selectedMechanic.mechanicName}
                      </h3>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                        {selectedMechanic.workType === "GARAGE" ? "Garage/Xưởng" : "Thợ Di Động"}
                      </Badge>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`size-4 ${s <= Math.round(selectedMechanic.avgRating ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`} />
                      ))}
                    </div>
                    <div>
                      <span className="text-lg font-bold text-slate-900">
                        {selectedMechanic.avgRating ?? "N/A"}
                      </span>
                      <span className="text-sm text-slate-500 ml-2">
                        ({selectedMechanic.totalReviews ?? 0} đánh giá)
                      </span>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Số Điện Thoại</div>
                        <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                          <Phone className="size-3.5 text-red-600 flex-shrink-0" />
                          <span className="truncate">{selectedMechanic.mechanicPhone}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Loại Xe</div>
                        <div className="font-semibold text-slate-900 text-sm">
                          {selectedMechanic.type === "MOTORBIKE" ? "🏍️ Xe Máy" : "🚗 Ô Tô"}
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Loại Dịch Vụ</div>
                        <div className="font-semibold text-slate-900 text-sm">
                          {selectedMechanic.workType === "GARAGE" ? "🏪 Garage" : "🚗 Di Động"}
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Hoàn Thành</div>
                        <div className="font-semibold text-slate-900 text-sm">
                          ✅ {selectedMechanic.totalCompleted ?? 0}
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

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <Button asChild variant="outline" size="lg" className="h-11">
                      <a href={`tel:${selectedMechanic.mechanicPhone}`}>
                        <Phone className="size-4 mr-2" />Gọi Ngay
                      </a>
                    </Button>
                    <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 h-11">
                      <Link to="/search">Yêu Cầu Hỗ Trợ</Link>
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}