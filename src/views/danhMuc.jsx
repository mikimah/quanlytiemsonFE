import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Boxes,
  RotateCw,
} from "lucide-react";
import api from "../services/api";
import { useAuthStore } from "../contexts/authContext";
import { showError, showSuccess } from "../utils/notify";

export default function DanhMuc() {
  const [isLoading, setIsLoading] = useState(false);
  const [mockCategories, setMockCategories] = useState([]);
  const user = useAuthStore((state) => state.user);
  const ITEMS_PER_PAGE = 10;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/danhmuc");
      setMockCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // States tìm kiếm, sắp xếp & phân trang
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("newest"); // 'newest' | 'oldest'
  const [currentPage, setCurrentPage] = useState(1);

  // States Modal
  const [isOpenAdd, setIsOpenAdd] = useState(false);
  const [isOpenEdit, setIsOpenEdit] = useState(false);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // 1. Tối ưu: Lọc danh mục theo tìm kiếm và sắp xếp theo mới nhất / cũ nhất
  const filteredCategories = useMemo(() => {
    let result = [...mockCategories];

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((c) =>
        c.tendanhmuc?.toLowerCase().includes(lower),
      );
    }

    result.sort((a, b) => {
      if (sortOrder === "newest") {
        return (b.madanhmuc || 0) - (a.madanhmuc || 0);
      }
      if (sortOrder === "oldest") {
        return (a.madanhmuc || 0) - (b.madanhmuc || 0);
      }
      return 0;
    });

    return result;
  }, [mockCategories, searchTerm, sortOrder]);

  // 2. Tối ưu: Phân trang
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredCategories.length / ITEMS_PER_PAGE));
  }, [filteredCategories.length]);

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCategories.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCategories, currentPage]);

  // 3. Memoized Handlers
  const handleOpenEdit = useCallback((category) => {
    setSelectedCategory(category);
    setIsOpenEdit(true);
  }, []);

  const handleOpenDelete = useCallback((category) => {
    setSelectedCategory(category);
    setIsOpenDelete(true);
  }, []);

  const handleCloseAdd = useCallback(() => setIsOpenAdd(false), []);
  const handleCloseEdit = useCallback(() => setIsOpenEdit(false), []);
  const handleCloseDelete = useCallback(() => setIsOpenDelete(false), []);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((e) => {
    setSortOrder(e.target.value);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  // Form Submits Stub
  const handleSaveAdd = useCallback(
    async (e) => {
      e.preventDefault();
      setIsLoading(true);
      try {
        const response = await api.post("/danhmuc", {
          tendanhmuc: e.target.tendanhmuc.value,
          macuahang: user.macuahang,
        });
        setMockCategories((prev) => [...prev, response.data]);
        showSuccess("Thêm danh mục thành công");
      } catch (error) {
        showError("Thêm danh mục thất bại");
        console.error("Error adding category:", error);
      } finally {
        setIsLoading(false);
        setIsOpenAdd(false);
      }
    },
    [user],
  );

  const handleSaveEdit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsLoading(true);
      try {
        const response = await api.put(
          `/danhmuc/${selectedCategory.madanhmuc}`,
          {
            tendanhmuc: e.target.tendanhmuc.value,
            macuahang: user.macuahang,
          },
        );
        setMockCategories((prev) =>
          prev.map((cat) =>
            cat.madanhmuc === selectedCategory.madanhmuc ? response.data : cat,
          ),
        );
        showSuccess("Cập nhật danh mục thành công");
      } catch (error) {
        showError("Cập nhật danh mục thất bại");
        console.error("Error updating category:", error);
      } finally {
        setIsLoading(false);
        setIsOpenEdit(false);
      }
    },
    [selectedCategory, user],
  );

  const handleConfirmDelete = useCallback(async () => {
    setIsLoading(true);
    try {
      await api.delete(`/danhmuc/${selectedCategory.madanhmuc}`);
      setMockCategories((prev) =>
        prev.filter((cat) => cat.madanhmuc !== selectedCategory.madanhmuc),
      );
      showSuccess("Xóa danh mục thành công");
    } catch (error) {
      console.error("Error deleting category:", error);
      showError("Xóa danh mục thất bại");
    } finally {
      setIsLoading(false);
      setIsOpenDelete(false);
    }
  }, [selectedCategory]);

  return (
    <div className='p-3 sm:p-6 min-h-full flex flex-col gap-4 sm:gap-5 bg-gray-50 pb-16 sm:pb-6'>
      {/* Tiêu đề & Nút Thêm mới */}
      <div className='flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3'>
        <div>
          <h1 className='text-xl sm:text-2xl font-bold text-gray-800'>
            Quản lý Danh Mục
          </h1>
          <p className='text-xs sm:text-sm text-gray-500'>
            Phân loại và gom nhóm các sản phẩm trong kho hàng
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => setIsOpenAdd(true)}
            className='flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow font-medium text-sm transition-all active:scale-[0.98]'
          >
            <Plus size={18} />
            <span>Thêm Danh Mục</span>
          </button>
          {/* Nút Load làm mới dữ liệu bên phải nút Add */}
          <button
            onClick={fetchData}
            disabled={isLoading}
            title='Làm mới dữ liệu'
            className='p-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
          >
            <RotateCw
              disabled={isLoading}
              size={18}
              className='disabled:opacity-50 disabled:cursor-not-allowed'
              onClick={() => {
                fetchData();
              }}
            />
          </button>
        </div>
      </div>

      {/* Bộ lọc: Tìm kiếm & Sắp xếp mới/cũ (Tự xuống dòng và full width trên mobile) */}
      <div className='bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3'>
        {/* Ô Tìm kiếm */}
        <div className='relative w-full sm:flex-1 sm:min-w-[240px]'>
          <Search
            className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
            size={18}
          />
          <input
            type='text'
            placeholder='Tìm kiếm danh mục theo tên...'
            value={searchTerm}
            onChange={handleSearchChange}
            className='w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
          />
        </div>

        {/* Ô Sắp xếp theo cũ nhất / mới nhất */}
        <div className='relative w-full sm:w-auto'>
          <select
            value={sortOrder}
            onChange={handleSortChange}
            className='w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer'
          >
            <option value='newest'>Mới nhất</option>
            <option value='oldest'>Cũ nhất</option>
          </select>
        </div>
      </div>

      {/* Khối danh sách dữ liệu */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1'>
        {/* Card View: Tối ưu cho Mobile */}
        <div className='block md:hidden divide-y divide-gray-100'>
          {paginatedCategories.length > 0 ? (
            paginatedCategories.map((cat) => (
              <div
                key={cat.madanhmuc}
                className='p-3.5 flex items-center justify-between gap-3'
              >
                <div className='flex items-center gap-3 min-w-0'>
                  <div className='w-10 h-10 flex-shrink-0 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center border border-blue-100'>
                    <Boxes size={20} />
                  </div>
                  <div className='min-w-0'>
                    <div className='flex items-center gap-2'>
                      <h4 className='text-sm font-semibold text-gray-800 truncate'>
                        {cat.tendanhmuc}
                      </h4>
                      <span className='text-xs text-gray-400 font-mono'>
                        #{cat.madanhmuc}
                      </span>
                    </div>
                    <span className='text-xs text-gray-500'>
                      {cat.soluongsanpham ? cat.soluongsanpham : 0} sản phẩm
                    </span>
                  </div>
                </div>

                <div className='flex items-center gap-1'>
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className='p-1.5 rounded-md hover:bg-blue-50 text-blue-600 active:scale-95'
                    title='Chỉnh sửa'
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleOpenDelete(cat)}
                    className='p-1.5 rounded-md hover:bg-red-50 text-red-600 active:scale-95'
                    title='Xóa'
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className='p-8 text-center text-gray-400 text-sm'>
              Không tìm thấy danh mục.
            </div>
          )}
        </div>

        {/* Table View: Tablet & Desktop */}
        <div className='hidden md:block overflow-x-auto flex-1'>
          <table className='w-full text-left text-sm text-gray-600'>
            <thead className='bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500'>
              <tr>
                <th className='px-4 py-3 text-center w-16'>ID</th>
                <th className='px-4 py-3'>Tên danh mục</th>
                <th className='px-4 py-3'>Số lượng mặt hàng</th>
                <th className='px-4 py-3 text-center w-28'>Hành động</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {paginatedCategories.length > 0 ? (
                paginatedCategories.map((cat) => (
                  <tr
                    key={cat.madanhmuc}
                    className='hover:bg-gray-50/80 transition-colors'
                  >
                    <td className='px-4 py-3 font-medium text-center text-gray-500'>
                      #{cat.madanhmuc}
                    </td>
                    <td className='px-4 py-3 font-semibold text-gray-800'>
                      {cat.tendanhmuc}
                    </td>
                    <td className='px-4 py-3 text-gray-600'>
                      <span className='bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium'>
                        {cat.soluongsanpham ? cat.soluongsanpham : 0} sản phẩm
                      </span>
                    </td>
                    <td className='px-4 py-3 text-center'>
                      <div className='flex items-center justify-center gap-1.5'>
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className='p-1.5 hover:bg-blue-50 text-blue-600 rounded-md transition-colors'
                          title='Chỉnh sửa'
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(cat)}
                          className='p-1.5 hover:bg-red-50 text-red-600 rounded-md transition-colors'
                          title='Xóa'
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className='text-center py-8 text-gray-400 text-sm'
                  >
                    Không tìm thấy danh mục phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div className='border-t border-gray-200 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-b-xl'>
          <span className='text-xs sm:text-sm text-gray-500'>
            Hiển thị{" "}
            <b>
              {filteredCategories.length > 0
                ? (currentPage - 1) * ITEMS_PER_PAGE + 1
                : 0}
            </b>{" "}
            -{" "}
            <b>
              {Math.min(
                currentPage * ITEMS_PER_PAGE,
                filteredCategories.length,
              )}
            </b>{" "}
            trên <b>{filteredCategories.length}</b> danh mục
          </span>

          <div className='flex items-center gap-1'>
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className='p-1.5 sm:p-2 border border-gray-300 rounded-md disabled:opacity-30 hover:bg-gray-100 active:bg-gray-200'
            >
              <ChevronLeft size={16} />
            </button>

            <div className='flex items-center gap-1'>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md font-medium ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>

            <button
              onClick={() =>
                handlePageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages || totalPages === 0}
              className='p-1.5 sm:p-2 border border-gray-300 rounded-md disabled:opacity-30 hover:bg-gray-100 active:bg-gray-200'
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL THÊM DANH MỤC */}
      {isOpenAdd && (
        <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4'>
          <div className='bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200'>
            <div className='flex justify-between items-center px-5 py-3.5 border-b sticky top-0 bg-white'>
              <h3 className='font-bold text-base sm:text-lg text-gray-800'>
                Thêm Danh Mục Mới
              </h3>
              <button
                onClick={handleCloseAdd}
                className='text-gray-400 hover:text-black p-1'
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveAdd} className='p-5 flex flex-col gap-4'>
              <div>
                <label className='block text-xs sm:text-sm font-medium text-gray-700 mb-1'>
                  Tên danh mục *
                </label>
                <input
                  name='tendanhmuc'
                  type='text'
                  required
                  placeholder='Ví dụ: Sơn chống rỉ, Sơn lót...'
                  className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none'
                />
              </div>
              <div className='flex gap-2 pt-2'>
                <button
                  type='button'
                  onClick={handleCloseAdd}
                  className='flex-1 py-2.5 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                >
                  Hủy
                </button>
                <button
                  type='submit'
                  disabled={isLoading}
                  className='flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed'
                >
                  {isLoading ? "Đang lưu..." : "Lưu danh mục"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CẬP NHẬT DANH MỤC */}
      {isOpenEdit && (
        <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4'>
          <div className='bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200'>
            <div className='flex justify-between items-center px-5 py-3.5 border-b sticky top-0 bg-white'>
              <h3 className='font-bold text-base sm:text-lg text-gray-800'>
                Cập Nhật Danh Mục
              </h3>
              <button
                onClick={handleCloseEdit}
                className='text-gray-400 hover:text-black p-1'
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className='p-5 flex flex-col gap-4'>
              <div>
                <label className='block text-xs sm:text-sm font-medium text-gray-700 mb-1'>
                  Tên danh mục *
                </label>
                <input
                  type='text'
                  defaultValue={selectedCategory?.tendanhmuc}
                  name='tendanhmuc'
                  required
                  className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none'
                />
              </div>
              <div className='flex gap-2 pt-2'>
                <button
                  type='button'
                  onClick={handleCloseEdit}
                  className='flex-1 py-2.5 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                >
                  Hủy
                </button>
                <button
                  type='submit'
                  disabled={isLoading}
                  className='flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed'
                >
                  {isLoading ? "Đang cập nhật..." : "Cập nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA */}
      {isOpenDelete && (
        <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4'>
          <div className='bg-white rounded-2xl sm:rounded-xl shadow-xl w-full max-w-sm p-5 text-center animate-in fade-in zoom-in-95 duration-150'>
            <div className='w-11 h-11 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center mb-2.5'>
              <Trash2 size={22} />
            </div>
            <h3 className='font-bold text-gray-800 text-base sm:text-lg mb-1'>
              Xác nhận xóa?
            </h3>
            <p className='text-xs sm:text-sm text-gray-500 mb-4'>
              Bạn có chắc chắn muốn xóa danh mục{" "}
              <b>"{selectedCategory?.tendanhmuc}"</b>? Các sản phẩm thuộc danh
              mục này có thể bị ảnh hưởng.
            </p>
            <div className='flex gap-2'>
              <button
                onClick={handleCloseDelete}
                className='flex-1 py-2.5 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 active:bg-gray-100'
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isLoading}
                className='flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed'
              >
                {isLoading ? "Đang xóa..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
