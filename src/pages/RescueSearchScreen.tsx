import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Shield, 
  Phone, 
  Truck, 
  Battery, 
  Wrench, 
  Fuel, 
  Key,
  AlertTriangle,
  ArrowLeft,
  MapPin,
  User
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";
import type { Service } from "../../types/service";
import { getServices } from "../../services/serviceApi";
import { searchMechanics } from "../../services/searchApi";

const vehicleTypes = [
  { value: "MOTORBIKE", label: "Xe Máy", icon: "🛵" },
  { value: "CAR", label: "Ô Tô", icon: "🚗" },
  { value: "TRUCK", label: "Xe Tải", icon: "🚛" },
];
export function RescueSearchScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  useEffect(() => {
  const fetchServices = async () => {
    try {
      const data = await getServices();
      setServices(data);
    } catch (error) {
      toast.error("Không thể tải danh sách dịch vụ");
    }
  };

  fetchServices();
}, []);
const serviceUIConfig = [
  {
    keyword: "kéo",
    icon: Truck,
    color: "bg-red-50 border-red-200 hover:bg-red-100",
    iconColor: "text-red-600",
    description: "Xe hỏng hoặc tai nạn",
  },
  {
    keyword: "lốp",
    icon: AlertTriangle,
    color: "bg-orange-50 border-orange-200 hover:bg-orange-100",
    iconColor: "text-orange-600",
    description: "Lốp xẹp hoặc nổ",
  },
  {
    keyword: "nổ",
    icon: Battery,
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    iconColor: "text-blue-600",
    description: "Bình điện hết",
  },
  {
    keyword: "nhiên",
    icon: Fuel,
    color: "bg-green-50 border-green-200 hover:bg-green-100",
    iconColor: "text-green-600",
    description: "Hết xăng",
  },
  {
    keyword: "khóa",
    icon: Key,
    color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
    iconColor: "text-purple-600",
    description: "Chìa khóa bị khóa trong xe",
  },
];
const getServiceUI = (name: string) => {
  const lowerName = name.toLowerCase();

  const found = serviceUIConfig.find((item) =>
    lowerName.includes(item.keyword)
  );

  if (found) return found;

  // default
  return {
    icon: Wrench,
    color: "bg-slate-50 border-slate-200 hover:bg-slate-100",
    iconColor: "text-slate-600",
    description: "Sự cố khác",
  };
};
  useEffect(() => {
    // Show location permission prompt when component mounts
    toast.info("Cho Phép Truy Cập Vị Trí", {
      description: "Vui lòng chia sẻ vị trí của bạn để tìm chuyên gia cứu hộ gần nhất.",
      icon: <MapPin className="size-5" />,
      duration: 5000,
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
  }, []);
  const validate = () => {
    const newErrors: { name?: string; phone?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Vui lòng nhập họ và tên";
    } else if (name.trim().length < 2) {
      newErrors.name = "Họ và tên phải có ít nhất 2 ký tự";
    } else if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(name.trim())) {
      newErrors.name = "Họ và tên không được chứa số hoặc ký tự đặc biệt";
    } else if (/(.)\1{1,}/.test(name.trim())) {
      newErrors.name = "Họ và tên không hợp lệ";
    }
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (!phoneNumber.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại";
    } else if (!phoneRegex.test(phoneNumber.trim())) {
      newErrors.phone = "Số điện thoại không hợp lệ (VD: 0834421130)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSearch = async (e: React.FormEvent) => {
  e.preventDefault();
   if (!validate()) return;
  if (!name || !phoneNumber || !selectedService || !selectedType) {
    toast.error("Vui lòng nhập đầy đủ thông tin");
    return;
  }

  if (!latitude || !longitude) {
    toast.error("Vui lòng cho phép lấy vị trí");
    return;
  }

  try {
    const results = await searchMechanics({
      customerName: name,
      customerPhone: phoneNumber,
      type: selectedType,
      serviceId: selectedService,
      latitude,
      longitude,
    });

    // chuyển sang trang results + truyền data
    navigate("/results", {
      state: {
        results,
        customerName: name,
    customerPhone: phoneNumber,
    serviceId: selectedService,
    serviceName: services.find(s => s.serviceId === selectedService)?.name || "Dịch vụ không xác định",
    latitude,                        
    longitude, 
      },
    });

  } catch (err: any) {
    toast.error(err.message || "Tìm kiếm thất bại");
  }
  window.scrollTo(0, 0)
};

  

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = e.target.value;
    setPhoneNumber(formatted);
  };
  
const handleGetLocation = () => {
  if (!navigator.geolocation) {
    toast.error("Trình duyệt không hỗ trợ định vị");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      setLatitude(lat);
      setLongitude(lng);

      toast.success("Đã Lấy Vị Trí Thành Công!", {
        description: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      });
    },
    () => {
      toast.error("Không thể lấy vị trí, vui lòng cấp quyền");
    }
  );
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
                <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  <ArrowLeft className="size-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <Shield className="size-8 text-red-600" />
                <span className="text-2xl font-bold text-slate-900">RescueNow</span>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link to="/my-requests">
                Yêu Cầu Của Tôi
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center size-20 bg-red-100 rounded-full mb-6">
            <Phone className="size-10 text-red-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Nhận Trợ Giúp Khẩn Cấp Ngay
          </h1>
          <p className="text-xl text-slate-600">
            Cho chúng tôi biết bạn cần gì và chúng tôi sẽ kết nối bạn với chuyên gia cứu hộ gần nhất
          </p>
        </div>

        <Card className="p-8 shadow-lg border-2">
          <form onSubmit={handleSearch} className="space-y-8">
            {/* Name Input */}
            <div className="space-y-3">
              <Label htmlFor="name" className="text-lg font-semibold">
                Họ Và Tên
              </Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Nguyễn Duy Chính"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  required
                  className={`pl-12 h-14 text-lg border-2 ${
                    errors.name ? "border-red-500 focus:border-red-500" : "focus:border-red-500"
                  }`}
                />
              </div>
              {errors.name && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="size-4" />
                    {errors.name}
                  </p>
              )}
              <p className="text-sm text-slate-600">
                Tên của bạn để chuyên gia cứu hộ dễ dàng nhận diện
              </p>
            </div>

            {/* Phone Number Input */}
            <div className="space-y-3">
              <Label htmlFor="phone" className="text-lg font-semibold">
                Số Điện Thoại Của Bạn
              </Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0834421130"
                  value={phoneNumber}
                  onChange={(e) => {
                    handlePhoneChange(e);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  maxLength={11}
                  required
                  className={`pl-12 h-14 text-lg border-2 ${
                      errors.phone ? "border-red-500 focus:border-red-500" : "focus:border-red-500"
                    }`}
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle className="size-4" />
                  {errors.phone}
                </p>
              )}
              <p className="text-sm text-slate-600">
                Chúng tôi sẽ sử dụng số này để kết nối bạn với chuyên gia cứu hộ
              </p>
            </div>
            <div className="space-y-3">
              <Label className="text-lg font-semibold">
                Loại Phương Tiện
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {vehicleTypes.map((vt) => (
                  <button
                    key={vt.value}
                    type="button"
                    onClick={() => setSelectedType(vt.value)}
                    className={`
                      p-4 rounded-lg border-2 text-center transition-all
                      ${selectedType === vt.value
                        ? "border-red-500 bg-red-50 shadow-md"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                      }
                    `}
                  >
                    <div className="text-2xl mb-1">{vt.icon}</div>
                    <div className="font-semibold text-slate-900 text-sm">{vt.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Service Type Selection */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">
                Bạn cần loại trợ giúp nào?
              </Label>
              <div className="grid sm:grid-cols-2 gap-4">
                {services.map((service) => {
  const ui = getServiceUI(service.name);
  const Icon = ui.icon;
  const isSelected = selectedService === service.serviceId;

  return (
    <button
      key={service.serviceId}
      type="button"
      onClick={() => setSelectedService(service.serviceId)}
      className={`
        p-6 rounded-lg border-2 text-left transition-all
        ${isSelected 
          ? 'border-red-500 bg-red-50 shadow-md' 
          : ui.color
        }
      `}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-white">
          <Icon className={`size-6 ${ui.iconColor}`} />
        </div>

        <div className="flex-1">
          <div className="font-semibold text-slate-900 mb-1">
            {service.name}
          </div>
          <div className="text-sm text-slate-600">
            {ui.description}
          </div>
        </div>
      </div>
    </button>
  );
})}
              </div>
            </div>
            <div className="space-y-3">
  <Label className="text-lg font-semibold">
    Vị trí của bạn
  </Label>

  <Button
    type="button"
    onClick={handleGetLocation}
    variant="outline"
    className="w-full h-12"
  >
    <MapPin className="size-5 mr-2" />
    {latitude && longitude
      ? `Đã lấy vị trí (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`
      : "Chia sẻ vị trí"}
  </Button>
</div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-14 text-lg bg-red-600 hover:bg-red-700"
              disabled={!name || !phoneNumber || !selectedType || !selectedService}
            >
              <Shield className="size-5 mr-2" />
              Tìm Chuyên Gia Cứu Hộ Gần Đây
            </Button>
          </form>
        </Card>

        {/* Trust Indicators */}
        <div className="grid sm:grid-cols-3 gap-6 mt-12 text-center">
          <div className="p-6">
            <div className="text-3xl font-bold text-slate-900 mb-2">24/7</div>
            <div className="text-slate-600">Sẵn Sàng Mọi Lúc</div>
          </div>
          <div className="p-6">
            <div className="text-3xl font-bold text-slate-900 mb-2">&lt;10 phút</div>
            <div className="text-slate-600">Phản Hồi Trung Bình</div>
          </div>
          <div className="p-6">
            <div className="text-3xl font-bold text-slate-900 mb-2">Đã Xác Minh</div>
            <div className="text-slate-600">Chuyên Gia Có Giấy Phép</div>
          </div>
        </div>
      </main>
    </div>
  );
}