import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  ArrowLeftFromLine,
  ArrowRightFromLine,
  Package2,
  Boxes,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "../contexts/authContext";

export default function SideBar() {
  const [isOpen, setIsOpen] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Khai báo style dùng chung cho các NavLink
  const getNavClass = ({ isActive }) =>
    `flex items-center py-2 relative transition-all duration-200 rounded-md mx-1 ${
      isActive
        ? "bg-blue-200/70 text-blue-900 font-semibold" // Khi đang active
        : "text-gray-600 hover:bg-gray-200/60" // Bình thường & hover
    }`;

  return (
    <div className='w-screen h-screen bg-green-100 flex relative'>
      <div
        className={`bg-gray-50 flex flex-col items-start justify-start shadow-lg h-full z-20 transition-all duration-300 absolute ${
          isOpen ? " max-md:w-[85%] md:w-60" : "min-md:w-[3.5rem] w-[2.5rem]"
        }`}
      >
        <button
          className='py-2 pt-3 w-full flex items-center pr-2 justify-end text-gray-600 hover:text-black'
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <ArrowLeftFromLine size={20} />
          ) : (
            <ArrowRightFromLine size={20} />
          )}
        </button>

        {/* Danh sách điều hướng */}
        <div className='flex flex-col justify-start gap-1 pt-2 w-full'>
          <NavLink to='/sanpham' className={getNavClass}>
            <div className='min-w-[2.5rem] flex items-center justify-center'>
              <Package2 size={24} className="min-md:mr-0 min-md:ml-2 mr-2 "/>
            </div>
            <span
              className={`whitespace-nowrap ${isOpen ? "inline-block pl-2" : "hidden"}`}
            >
              Sản Phẩm
            </span>
          </NavLink>

          <NavLink to='/danhmuc' className={getNavClass}>
            <div className='min-w-[2.5rem] flex items-center justify-center'>
              <Boxes size={24} className="min-md:mr-0 min-md:ml-2 mr-2 "/>
            </div>
            <span
              className={`whitespace-nowrap ${isOpen ? "inline-block pl-2" : "hidden"}`}
            >
              Danh Mục
            </span>
          </NavLink>
        </div>

        {/* Nút Đăng Xuất nằm sát mép đáy */}
        <div className='mt-auto pb-4 w-full'>
          <button
            onClick={handleLogout}
            className='w-full flex items-center py-2 transition-all duration-200 rounded-md text-red-600 hover:bg-red-100/70'
            title={!isOpen ? "Đăng xuất" : undefined}
          >
            <div className='min-w-[2.5rem] flex items-center justify-center'>
              <LogOut size={22} className="min-md:mr-0 min-md:ml-4 ml-2 mr-2 "/>
            </div>
            <span
              className={`whitespace-nowrap font-medium ${isOpen ? "inline-block pl-2" : "hidden"}`}
            >
              Đăng Xuất
            </span>
          </button>
        </div>
      </div>

      {/* Lớp overlay màu đen mờ khi mở sidebar trên màn nhỏ (bấm vào là đóng) */}
      <div
        onClick={() => setIsOpen(false)}
        className={`absolute inset-0 z-10 transition-opacity duration-300 bg-black/40 ${
          isOpen ? "block" : "hidden"
        }`}
      />

      {/* Khoảng trống đệm cho phần nội dung chính */}
      <div className='min-md:min-w-[3.5rem] min-w-[2.5rem] h-full' />

      <main className='flex-1 overflow-y-auto overflow-x-hidden'>
        <Outlet />
      </main>
    </div>
  );
}