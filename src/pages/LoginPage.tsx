import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, ArrowLeft, Mail, Lock, Wrench, User } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";
import { API_CONFIG, API_ENDPOINTS } from "../../config/apiConfig";
import { connectWebSocket, isLocationPermissionDenied, getCurrentLocationNow } from "../../services/websocketService";
export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}${API_ENDPOINTS.LOGIN}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });

    if (!response.ok) {
      throw new Error("Sai tài khoản hoặc mật khẩu");
    }

    const data = await response.json();

    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.account));

    toast.success("Đăng Nhập Thành Công!", {
      description: `Xin chào ${data.account.fullName}`,
      duration: 2000,
    });

    const role = data.account.role?.trim();

    if (role === "MECHANIC") {
      
      navigate("/technician-dashboard");
    } else if (role === "ADMIN") {
      navigate("/admin-dashboard");
    } else {
      navigate("/");
    }

  } catch (error: any) {
    toast.error("Đăng Nhập Thất Bại", {
      description: error.message || "Có lỗi xảy ra",
    });
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-700">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="text-white hover:bg-white/20">
              <Link to="/">
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="size-8 text-white" />
              <span className="text-2xl font-bold text-white">RescueNow</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-20 bg-white/20 backdrop-blur-sm rounded-full mb-6">
            <Wrench className="size-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Đăng Nhập Thợ Sửa Chữa
          </h1>
          <p className="text-xl text-red-50">
            Đăng nhập để quản lý dịch vụ cứu hộ của bạn
          </p>
        </div>

        <Card className="p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username Input */}
            <div className="space-y-2">
              <Label htmlFor="username">Tên Đăng Nhập</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="pl-10 h-12"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">Mật Khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 h-12"
                />
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <a href="#" className="text-sm text-red-600 hover:text-red-700">
                Quên mật khẩu?
              </a>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-12 bg-red-600 hover:bg-red-700"
            >
              Đăng Nhập
            </Button>

            {/* Register Link */}
            <div className="text-center text-sm text-slate-600">
              Chưa có tài khoản?{" "}
              <Link to="/register" className="text-red-600 hover:text-red-700 font-semibold">
                Đăng ký ngay
              </Link>
            </div>
          </form>
        </Card>

        {/* Customer Login */}
        <div className="mt-8 text-center">
          <p className="text-white/80 text-sm mb-3">
            Bạn là khách hàng cần trợ giúp?
          </p>
          <Button asChild variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/40 hover:bg-white/30">
            <Link to="/search">
              Tìm Trợ Giúp Ngay
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}