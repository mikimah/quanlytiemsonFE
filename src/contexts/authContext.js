import { create } from "zustand";
import api from "../services/api";
import { showSuccess } from "../utils/notify";

// Hàm đọc an toàn tránh lỗi SyntaxError: "undefined" is not valid JSON
const getStoredUser = () => {
  try {
    const stored = localStorage.getItem("user");
    return stored && stored !== "undefined" ? JSON.parse(stored) : null;
  } catch (err) {
    console.error("Lỗi parse user từ localStorage:", err);
    return null;
  }
};

export const useAuthStore = create((set, get) => ({
  user: getStoredUser(),
  token: localStorage.getItem("token") || null,


  isAuthenticated: () => !!get().token,

  login: async (tentaikhoan, matkhau) => {
    if (!tentaikhoan || !matkhau) {
      throw new Error("Vui lòng nhập tên đăng nhập và mật khẩu");
    }

    try {
      const res = await api.post("/taikhoan/login", { tentaikhoan, matkhau });
      const { token, user } = res.data;


     

      if (token) localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      return res.data; 
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Đăng nhập thất bại";
      throw new Error(errorMsg);
    }
  },

  logout: () => {
    set({ user: null, token: null });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    showSuccess("Đăng xuất thành công");
  },
}));