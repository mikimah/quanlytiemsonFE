import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from "../contexts/authContext";
import Login from "../views/login";
import SideBar from "../components/sideBar";
import DanhMuc from '../views/danhMuc';
import SanPham from "../views/sanPham";

function LoginWrapper() {
  const authStore = useAuthStore();
  return authStore.isAuthenticated() ? <Navigate to="/sanpham" replace /> : <Login />;
}

function ProtectedRoute({ children }) {
  const authStore = useAuthStore();
  if (!authStore.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

const router = createBrowserRouter([
  { 
    path: "/login", 
    element: <LoginWrapper /> 
  },
  { 
    path: "/", 
    element: (
      <ProtectedRoute>
        <SideBar />
      </ProtectedRoute>
    ),
    children: [
      // Vào đúng trang chủ "/" -> tự nhảy vào "/sanpham"
      { index: true, element: <Navigate to="/sanpham" replace /> },
      
      { path: "sanpham", element: <SanPham /> },
      { path: "danhmuc", element: <DanhMuc /> },
      
      //Vào các link con không tồn tại bên trong layout (VD: /abc) -> tự nhảy về "/sanpham"
      //{ path: "*", element: <Navigate to="/sanpham" replace /> }
    ]
  },
  // Bắt tất cả các link rác ngoài phạm vi -> tự nhảy về "/sanpham"
  { 
    path: "*", 
    element: <Navigate to="/sanpham" replace /> 
  }
]);

export default router;