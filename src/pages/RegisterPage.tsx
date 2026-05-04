import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, ArrowLeft, Mail, Lock, User, Phone, MapPin, Building2, Car, Bike, Truck } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";
import { registerUser } from "../../services/authApi";

export function RegisterPage() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<"technician" | "garage">("technician");
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [vehicleType, setVehicleType] = useState<string>("");
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: "",
    garageName: "",
  });

  const vehicleOptions = [
    { id: "motorcycle", label: "Xe Máy", icon: Bike, apiValue: "MOTORBIKE" },
    { id: "car",        label: "Ô Tô",   icon: Car,  apiValue: "CAR"      },
    { id: "truck",      label: "Xe Tải", icon: Truck, apiValue: "TRUCK"   },
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username?.trim()) { toast.error("Tên đăng nhập không được để trống"); return; }
    if (!formData.name?.trim())     { toast.error("Họ tên không được để trống"); return; }
    if (!formData.email?.trim())    { toast.error("Email không được để trống"); return; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) { toast.error("Email không hợp lệ"); return; }

    if (!formData.phone?.trim())    { toast.error("Số điện thoại không được để trống"); return; }
    if (!formData.password?.trim()) { toast.error("Mật khẩu không được để trống"); return; }
    if (formData.password.length < 6) { toast.error("Mật khẩu phải có ít nhất 6 ký tự"); return; }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Mật khẩu không khớp", { description: "Vui lòng kiểm tra lại mật khẩu của bạn." });
      return;
    }
    if (!vehicleType) {
      toast.error("Vui lòng chọn loại phương tiện", { description: "Bạn cần chọn loại phương tiện bạn có thể sửa." });
      return;
    }

    setIsLoading(true);
    try {
      const selected = vehicleOptions.find(v => v.id === vehicleType);
      const apiVehicleType = selected?.apiValue ?? "CAR";

      let payload: any = {
        username:    formData.username.trim(),
        email:       formData.email.trim(),
        password:    formData.password.trim(),
        fullName:    formData.name.trim(),
        phoneNumber: formData.phone.trim(),
        type:        apiVehicleType,
        workType:    accountType === "technician" ? "MOBILE" : "GARAGE",
      };

      if (accountType === "garage") {
        if (!formData.garageName?.trim() || !formData.address?.trim()) {
          toast.error("Thông tin không đầy đủ", { description: "Vui lòng nhập tên và địa chỉ garage." });
          setIsLoading(false);
          return;
        }
        payload.garageName    = formData.garageName.trim();
        payload.garageAddress = formData.address.trim();
      }

      await registerUser(payload, avatarFile);

      toast.success("Đăng Ký Thành Công!", {
        description: "Tài khoản của bạn đã được tạo. Đang chuyển hướng...",
        duration: 2000,
      });
      setTimeout(() => navigate("/"), 1000);
    } catch (error: any) {
      toast.error("Đăng ký thất bại", { description: error.message || "Có lỗi xảy ra. Vui lòng thử lại." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
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
              <Link to="/"><ArrowLeft className="size-5" /></Link>
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="size-8 text-white" />
              <span className="text-2xl font-bold text-white">RescueNow</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Đăng Ký Thợ Sửa</h1>
          <p className="text-xl text-red-50">Tham gia mạng lưới cứu hộ của chúng tôi</p>
        </div>

        <Card className="p-8 shadow-2xl">
          <form onSubmit={handleRegister} className="space-y-6">

            {/* Account Type */}
            <div className="space-y-3">
              <Label>Loại Tài Khoản</Label>
              <RadioGroup value={accountType} onValueChange={(v) => setAccountType(v as "technician" | "garage")}>
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  {[
                    { value: "technician", label: "Thợ Di Động", Icon: User },
                    { value: "garage",     label: "Garage/Xưởng", Icon: Building2 },
                  ].map(({ value, label, Icon }) => (
                    <label
                      key={value}
                      className={`flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${accountType === value ? "border-red-500 bg-red-50" : "border-slate-200 hover:border-red-200"}`}
                    >
                      <RadioGroupItem value={value} id={value} className="shrink-0" />
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Icon className="size-4 sm:size-5 shrink-0" />
                        <span className="font-medium text-xs sm:text-base tracking-tight">{label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Username + Name */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Tên Đăng Nhập</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                  <Input id="username" type="text" placeholder="username" value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)} required className="pl-10 h-12" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Họ Tên</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                  <Input id="name" type="text" placeholder="Nguyễn Văn A" value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)} required className="pl-10 h-12" />
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Số Điện Thoại</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                <Input id="phone" type="tel" placeholder="0901234567" value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)} required className="pl-10 h-12" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                <Input id="email" type="email" placeholder="thợ@example.com" value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)} required className="pl-10 h-12" />
              </div>
            </div>

            {/* Garage fields */}
            {accountType === "garage" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="garageName">Tên Garage/Xưởng</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                    <Input id="garageName" type="text" placeholder="Garage ABC" value={formData.garageName}
                      onChange={(e) => handleInputChange("garageName", e.target.value)} required className="pl-10 h-12" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Địa Chỉ Garage</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                    <Input id="address" type="text" placeholder="123 Đường ABC, Quận XYZ" value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)} required className="pl-10 h-12" />
                  </div>
                </div>
              </>
            )}

            {/* Vehicle Type — radio, chọn 1 vì backend nhận single value */}
            <div className="space-y-3">
              <Label>Loại Phương Tiện Có Thể Sửa <span className="text-red-500">*</span></Label>
              <RadioGroup value={vehicleType} onValueChange={setVehicleType}>
                <div className="grid grid-cols-3 gap-3">
                  {vehicleOptions.map(({ id, label, icon: Icon }) => (
                    <label
                      key={id}
                      className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all text-center
                        ${vehicleType === id ? "border-red-500 bg-red-50" : "border-slate-200 hover:border-red-200"}`}
                    >
                      <RadioGroupItem value={id} id={`vehicle-${id}`} className="sr-only" />
                      <Icon className={`size-7 ${vehicleType === id ? "text-red-600" : "text-slate-500"}`} />
                      <span className={`text-xs sm:text-sm font-semibold ${vehicleType === id ? "text-red-900" : "text-slate-700"}`}>
                        {label}
                      </span>
                      {vehicleType === id && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Đã chọn</span>
                      )}
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Password */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Mật Khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                  <Input id="password" type="password" placeholder="••••••••" value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)} required className="pl-10 h-12" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác Nhận Mật Khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                  <Input id="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)} required className="pl-10 h-12" />
                </div>
              </div>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative size-24 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300">
                {avatarPreview
                  ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  : <User className="size-10 text-slate-400" />}
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleAvatarChange} />
              </div>
              <span className="text-xs text-slate-500">Nhấn để chọn ảnh đại diện</span>
            </div>

            {/* Submit */}
            <Button type="submit" size="lg" disabled={isLoading}
              className="w-full h-12 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? "Đang Đăng Ký..." : "Đăng Ký Tài Khoản"}
            </Button>

            <div className="text-center text-sm text-slate-600">
              Đã có tài khoản?{" "}
              <Link to="/login" className="text-red-600 hover:text-red-700 font-semibold">Đăng nhập</Link>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}