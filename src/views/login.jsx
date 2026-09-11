import { useState, useCallback } from "react";
import { useAuthStore } from "../contexts/authContext";
import { showSuccess, showError } from "../utils/notify";
import { useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff, Loader2, PackageCheck } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showError("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      setIsLoading(true);
      await login(username, password);
      showSuccess("Đăng nhập thành công!");
      navigate("/", { replace: true });
      window.location.reload();
      
    } catch (error) {
      const msg = error?.message || "Đăng nhập thất bại!";
      showError(msg);
      console.error("Lỗi đăng nhập:", error);
    } finally {
      setIsLoading(false);
    }
  }, [username, password, login, navigate]);

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-gray-50 to-slate-100 p-4">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 transition-all">
        {/* Header / Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 mb-3">
            <PackageCheck size={26} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Quản Lý Giá Hàng Hoá
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Đăng nhập để tiếp tục quản lý cửa hàng của bạn
          </p>
        </div>

        {/* Form Đăng Nhập */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Tên tài khoản */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Tên tài khoản
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <User size={18} />
              </span>
              <input
                type="text"
                required
                disabled={isLoading}
                placeholder="Nhập tên đăng nhập..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50/50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Mật khẩu */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                disabled={isLoading}
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-2.5 text-sm bg-gray-50/50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Nút Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-medium text-sm rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>Đăng nhập</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}