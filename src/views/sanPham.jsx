import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ArrowUpDown,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  History,
  RotateCw,
} from "lucide-react";
import api from "../services/api";
import { showError, showSuccess } from "../utils/notify";
import { upLoadImage } from "../utils/cloudinary";

export default function SanPham() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingHistory, setIsGettingHistory] = useState(false);
  const [mockCategories, setMockCategories] = useState([]);
  const [mockProducts, setMockProducts] = useState([]);
  const [mockPriceHistory, setMockPriceHistory] = useState([]);
  const ITEMS_PER_PAGE = 10;

const fetchData = useCallback(async () => {
  setIsLoading(true);
  try {
    const [categoriesResponse, productsResponse] = await Promise.all([
      api.get("/danhmuc"),
      api.get("/sanpham"),
    ]);
    setMockCategories(categoriesResponse.data);
    setMockProducts(productsResponse.data);
  } catch (error) {
    showError("Lỗi khi tải dữ liệu");
    console.error("Error fetching data:", error);
  } finally {
    setIsLoading(false);
  }
}, []); 

  const fetchHistory = useCallback(async (id) => {
    setIsGettingHistory(true);
    try {
      const response = await api.get(`/lichsuthaydoi/${id}`);
      setMockPriceHistory(response.data);
    } catch (error) {
      showError("Lỗi khi tải lịch sử giá");
      console.error("Error fetching price history:", error);
    } finally {
      setIsGettingHistory(false);
    }
  },[]);

  function formatDate(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  // 'price-asc', 'price-desc', 'newest', 'oldest'
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  // States Modal
  const [isOpenAdd, setIsOpenAdd] = useState(false);
  const [isOpenEdit, setIsOpenEdit] = useState(false);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [isOpenHistory, setIsOpenHistory] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // State phóng to ảnh
  const [previewImage, setPreviewImage] = useState(null);

  // Lọc và sắp xếp
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...mockProducts];

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((p) =>
        p.tensanpham?.toLowerCase().includes(lower),
      );
    }

    if (selectedCategory) {
      result = result.filter((p) => p.madanhmuc === Number(selectedCategory));
    }

    // Xử lý 4 tiêu chí sắp xếp
    result.sort((a, b) => {
      if (sortOrder === "price-asc") {
        return (Number(a.giaban) || 0) - (Number(b.giaban) || 0);
      }
      if (sortOrder === "price-desc") {
        return (Number(b.giaban) || 0) - (Number(a.giaban) || 0);
      }
      if (sortOrder === "newest") {
        return (b.masanpham || 0) - (a.masanpham || 0);
      }
      if (sortOrder === "oldest") {
        return (a.masanpham || 0) - (b.masanpham || 0);
      }
      return 0;
    });

    return result;
  }, [mockProducts, searchTerm, selectedCategory, sortOrder]);

  const totalPages = useMemo(() => {
    return Math.max(
      1,
      Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE),
    );
  }, [filteredAndSortedProducts.length]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedProducts, currentPage]);

  // Handlers
  const handleOpenEdit = useCallback((product) => {
    setSelectedProduct(product);
    setIsOpenEdit(true);
  }, []);

  const handleOpenDelete = useCallback((product) => {
    setSelectedProduct(product);
    setIsOpenDelete(true);
  }, []);

  const handleOpenHistory = useCallback((product) => {
    setSelectedProduct(product);
    fetchHistory(product.masanpham);
    setIsOpenHistory(true);
    console.log("Selected product for history:", product);
    console.log(
      "Price history for product:",
      mockPriceHistory.filter((item) => item.masanpham == product.masanpham),
    );
  }, []);

  // Handlers phóng to & đóng xem ảnh
  const handleOpenImage = useCallback((product) => {
    if (product?.anhsanpham) {
      setPreviewImage({
        src: product.anhsanpham,
        name: product.tensanpham,
      });
    }
  }, []);

  const handleCloseImage = useCallback(() => {
    setPreviewImage(null);
  }, []);

  const handleCloseAdd = useCallback(() => setIsOpenAdd(false), []);
  const handleCloseEdit = useCallback(() => setIsOpenEdit(false), []);
  const handleCloseDelete = useCallback(() => setIsOpenDelete(false), []);
  const handleCloseHistory = useCallback(() => setIsOpenHistory(false), []);

  const handleSortChange = useCallback((e) => {
    setSortOrder(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleCategoryChange = useCallback((e) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleSaveAdd = useCallback(
    async (e) => {
      e.preventDefault();
      setIsLoading(true);
      try {
        let urlAnh = "";
        if (e.target.anhsanpham?.files?.[0]) {
          const { status, url, public_id, message } = await upLoadImage(e.target.anhsanpham.files[0]);
          console.log("Upload image response:", { status, url, public_id, message });
          if (status === 200) {
            urlAnh = url;
          } else {
            console.error("Error uploading image:", message);
          }
        }
        const responseSP = await api.post("/sanpham", {
          tensanpham: e.target.tensanpham.value,
          motasanpham: e.target.motasanpham.value,
          anhsanpham: urlAnh,
          madanhmuc: Number(e.target.madanhmuc.value),
        });
        const masanpham = responseSP.data.masanpham;
        const responseLS = await api.post("/lichsuthaydoi", {
          giasanpham: Number(e.target.giaban.value),
          thoigian: new Date(),
          masanpham: masanpham,
        });
        setMockProducts((prev) => [
          ...prev,
          {
            ...responseSP.data,
            tendanhmuc:
              mockCategories.find(
                (c) => c.madanhmuc === responseSP.data.madanhmuc,
              )?.tendanhmuc || "",
            giaban: responseLS.data.giasanpham,
          },
        ]);
        showSuccess("Thêm sản phẩm thành công");
      } catch (error) {
        console.error("Error adding product:", error);
        showError("Thêm sản phẩm thất bại");
      } finally {
        setIsOpenAdd(false);
        setIsLoading(false);
      }
    },
    [mockCategories],
  );

  const handleSaveEdit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsLoading(true);
      try {
        let urlAnh = "";
        if (e.target.anhsanpham?.files?.[0]) {
          const { status, url, public_id, message } = await upLoadImage(e.target.anhsanpham.files[0]);
          if (status === 200) {
            urlAnh = url;
          } else {
            console.error("Error uploading image:", message);
          }
        } else {
          urlAnh = selectedProduct.anhsanpham || "";
        }
        const responseSP = await api.put(
          `/sanpham/${selectedProduct.masanpham}`,
          {
            tensanpham: e.target.tensanpham.value,
            motasanpham: e.target.motasanpham.value,
            anhsanpham: urlAnh,
            madanhmuc: Number(e.target.madanhmuc.value),
          },
        );
        const responseLS = await api.post("/lichsuthaydoi", {
          giasanpham: Number(e.target.giaban.value),
          thoigian: new Date(),
          masanpham: selectedProduct.masanpham,
        });
        console.log("responseSP:", responseSP.data);
        setMockProducts((prev) =>
          prev.map((p) =>
            p.masanpham === selectedProduct.masanpham
              ? {
                  ...responseSP.data,
                  tendanhmuc:
                    mockCategories.find(
                      (c) => c.madanhmuc === responseSP.data.madanhmuc,
                    )?.tendanhmuc || "",
                  giaban: responseLS.data.giasanpham,
                }
              : p,
          ),
        );
        showSuccess("Chỉnh sửa sản phẩm thành công");
      } catch (error) {
        console.error("Error editing product:", error);
        showError("Chỉnh sửa sản phẩm thất bại");
      } finally {
        setIsOpenEdit(false);
        setIsLoading(false);
      }
    },
    [selectedProduct, mockCategories],
  );

  const handleConfirmDelete = useCallback(async () => {
    setIsLoading(true);
    try {
      await api.delete(`/lichsuthaydoi/sanpham/${selectedProduct.masanpham}`);
      await api.delete(`/sanpham/${selectedProduct.masanpham}`);
      setMockProducts((prev) =>
        prev.filter((p) => p.masanpham !== selectedProduct.masanpham),
      );
      showSuccess("Xóa sản phẩm thành công");
    } catch (error) {
      console.error("Error deleting product:", error);
      showError("Xóa sản phẩm thất bại");
    } finally {
      setIsOpenDelete(false);
      setIsLoading(false);
    }
  }, [selectedProduct]);

  return (
    <div className='p-3 sm:p-6 min-h-full overflow-x-hidden flex flex-col gap-4 sm:gap-5 bg-gray-50 pb-16 sm:pb-6'>
      {/* Tiêu đề & Nút Thêm, Nút Load */}
      <div className='flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3'>
        <div>
          <h1 className='text-xl sm:text-2xl font-bold text-gray-800'>
            Quản lý Sản Phẩm
          </h1>
          <p className='text-xs sm:text-sm text-gray-500'>
            Tra cứu, quản lý và theo dõi biến động giá
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => setIsOpenAdd(true)}
            className='flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow font-medium text-sm transition-all active:scale-[0.98]'
          >
            <Plus size={18} />
            <span>Thêm Sản Phẩm</span>
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

      {/* Bộ lọc: Mobile xếp chồng 3 hàng, Desktop nằm trên 1 hàng */}
      <div className='bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-2.5 sm:gap-3 items-stretch md:items-center justify-between'>
        {/* 1. Ô Tìm kiếm (Mobile: full hàng 1) */}
        <div className='relative w-full md:flex-1 md:min-w-[220px]'>
          <Search
            className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
            size={18}
          />
          <input
            type='text'
            placeholder='Tìm kiếm sản phẩm...'
            value={searchTerm}
            onChange={handleSearchChange}
            className='w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
          />
        </div>

        {/* 2. Lọc theo danh mục (Mobile: full hàng 2) */}
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          size={1}
          className='w-full md:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
        >
          <option value=''>Tất cả danh mục</option>
          {mockCategories.map((c) => (
            <option key={c.madanhmuc} value={c.madanhmuc}>
              {c.tendanhmuc}
            </option>
          ))}
        </select>

        {/* 3. Lựa chọn sắp xếp (Mobile: full hàng 3) */}
        <div className='relative w-full md:w-auto'>
          <select
            value={sortOrder}
            onChange={handleSortChange}
            className='w-full md:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer'
          >
            <option value='newest'>Mới nhất</option>
            <option value='oldest'>Cũ nhất</option>
            <option value='price-asc'>Giá: Tăng dần</option>
            <option value='price-desc'>Giá: Giảm dần</option>
          </select>
        </div>
      </div>

      {/* Khối hiển thị dữ liệu */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1'>
        {/* Card View (Mobile) */}
        <div className='block md:hidden divide-y divide-gray-100'>
          {paginatedProducts.length > 0 ? (
            paginatedProducts.map((product) => (
              <div
                key={product.masanpham}
                className='p-3.5 flex flex-col gap-2.5'
              >
                <div className='flex items-start gap-3'>
                  <div
                    onClick={() => handleOpenImage(product)}
                    className='w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 text-gray-400 overflow-hidden cursor-pointer active:scale-95 transition-transform'
                    title='Bấm để xem ảnh rõ hơn'
                  >
                    {product.anhsanpham ? (
                      <img
                        src={product.anhsanpham}
                        alt={product.tensanpham}
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <Package size={22} />
                    )}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between gap-1'>
                      <h4 className='text-sm font-semibold text-gray-800 truncate'>
                        {product.tensanpham}
                      </h4>
                      <span className='text-xs text-gray-400 font-mono'>
                        #{product.masanpham}
                      </span>
                    </div>
                    <span className='inline-block mt-0.5 bg-emerald-100 text-emerald-800 text-[11px] px-2 py-0.5 rounded-full font-medium'>
                      {product.tendanhmuc}
                    </span>
                    <p className='text-xs text-gray-500 line-clamp-1 mt-1'>
                      {product.motasanpham}
                    </p>
                  </div>
                </div>

                <div className='flex items-center justify-between pt-1 border-t border-gray-50'>
                  <div className='text-sm font-bold text-emerald-600'>
                    {Number(product.giaban || 0).toLocaleString("vi-VN")} đ
                  </div>
                  <div className='flex items-center gap-1'>
                    <button
                      onClick={() => handleOpenHistory(product)}
                      className='p-1.5 rounded-md hover:bg-amber-50 text-amber-600 active:scale-95'
                      title='Lịch sử thay đổi giá'
                    >
                      <History size={17} />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(product)}
                      className='p-1.5 rounded-md hover:bg-blue-50 text-blue-600 active:scale-95'
                      title='Sửa'
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(product)}
                      className='p-1.5 rounded-md hover:bg-red-50 text-red-600 active:scale-95'
                      title='Xóa'
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className='p-8 text-center text-gray-400 text-sm'>
              Không tìm thấy sản phẩm.
            </div>
          )}
        </div>

        {/* Table View (Tablet & Desktop) */}
        <div className='hidden md:block overflow-x-auto flex-1'>
          <table className='w-full text-left text-sm text-gray-600'>
            <thead className='bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500'>
              <tr>
                <th className='px-4 py-3 text-center w-16'>ID</th>
                <th className='px-4 py-3'>Ảnh</th>
                <th className='px-4 py-3'>Tên sản phẩm</th>
                <th className='px-4 py-3'>Danh mục</th>
                <th className='px-4 py-3'>Mô tả</th>
                <th className='px-4 py-3 text-right'>Giá hiện tại</th>
                <th className='px-4 py-3 text-center w-36'>Hành động</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((product) => (
                  <tr
                    key={product.masanpham}
                    className='hover:bg-gray-50/80 transition-colors'
                  >
                    <td className='px-4 py-3 font-medium text-center text-gray-500'>
                      #{product.masanpham}
                    </td>
                    <td className='px-4 py-3'>
                      <div
                        onClick={() => handleOpenImage(product)}
                        className='w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 text-gray-400 overflow-hidden cursor-pointer hover:opacity-80 active:scale-95 transition-all'
                        title='Bấm để xem ảnh rõ hơn'
                      >
                        {product.anhsanpham ? (
                          <img
                            src={product.anhsanpham}
                            alt={product.tensanpham}
                            className='w-full h-full object-cover'
                          />
                        ) : (
                          <Package size={20} />
                        )}
                      </div>
                    </td>
                    <td className='px-4 py-3 font-semibold text-gray-800'>
                      {product.tensanpham}
                    </td>
                    <td className='px-4 py-3'>
                      <span className='bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium'>
                        {product.tendanhmuc}
                      </span>
                    </td>
                    <td className='px-4 py-3 max-w-xs truncate text-gray-500'>
                      {product.motasanpham}
                    </td>
                    <td className='px-4 py-3 text-right font-semibold text-emerald-600'>
                      {product.giaban ? (
                        <span>
                          {Number(product.giaban).toLocaleString("vi-VN")} đ
                        </span>
                      ) : (
                        "Chưa rõ"
                      )}
                    </td>
                    <td className='px-4 py-3 text-center'>
                      <div className='flex items-center justify-center gap-1.5'>
                        <button
                          onClick={() => handleOpenHistory(product)}
                          className='p-1.5 hover:bg-amber-50 text-amber-600 rounded-md'
                          title='Lịch sử giá'
                        >
                          <History size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className='p-1.5 hover:bg-blue-50 text-blue-600 rounded-md'
                          title='Chỉnh sửa'
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(product)}
                          className='p-1.5 hover:bg-red-50 text-red-600 rounded-md'
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
                    colSpan={7}
                    className='text-center py-8 text-gray-400 text-sm'
                  >
                    Không tìm thấy sản phẩm phù hợp.
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
              {filteredAndSortedProducts.length > 0
                ? (currentPage - 1) * ITEMS_PER_PAGE + 1
                : 0}
            </b>{" "}
            -{" "}
            <b>
              {Math.min(
                currentPage * ITEMS_PER_PAGE,
                filteredAndSortedProducts.length,
              )}
            </b>{" "}
            trên <b>{filteredAndSortedProducts.length}</b>
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

      {/* MODAL PHÓNG TO ẢNH */}
      {previewImage && (
        <div
          onClick={handleCloseImage}
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-in fade-in duration-200'
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className='relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col'
          >
            <div className='flex justify-between items-center px-4 py-3 border-b bg-gray-50'>
              <h4 className='text-sm font-semibold text-gray-800 truncate pr-2'>
                {previewImage.name}
              </h4>
              <button
                onClick={handleCloseImage}
                className='text-gray-400 hover:text-black p-1 rounded-md transition-colors'
              >
                <X size={20} />
              </button>
            </div>
            <div className='p-2 flex items-center justify-center bg-neutral-900 min-h-[260px] max-h-[70vh]'>
              <img
                src={previewImage.src}
                alt={previewImage.name}
                className='max-w-full max-h-[65vh] object-contain rounded-lg'
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL LỊCH SỬ GIÁ */}
      {isOpenHistory && (
        <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4'>
          <div className='bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200'>
            <div className='flex justify-between items-center px-5 py-3.5 border-b'>
              <div>
                <h3 className='font-bold text-base sm:text-lg text-gray-800'>
                  Lịch Sử Giá Sản Phẩm
                </h3>
                <p className='text-xs text-gray-500 font-medium'>
                  {selectedProduct?.tensanpham}
                </p>
              </div>
              <button
                onClick={handleCloseHistory}
                className='text-gray-400 hover:text-black p-1'
              >
                <X size={20} />
              </button>
            </div>

            <div className='p-5 overflow-y-auto flex flex-col gap-3'>
              <div className='text-xs font-semibold text-gray-400 uppercase tracking-wider'>
                Các lần thay đổi giá gần đây
              </div>

              <div className='flex flex-col divide-y divide-gray-100 border border-gray-100 rounded-lg'>
                {isGettingHistory ? (
                  <div className='py-4 text-center text-sm text-gray-500'>
                    Đang lấy dữ liệu...
                  </div>
                ) : mockPriceHistory.length === 0 ? (
                  <div className='py-4 text-center text-sm text-gray-400'>
                    Chưa có dữ liệu
                  </div>
                ) : (
                  mockPriceHistory.map((item) => (
                    <div
                      key={item.malichsu}
                      className='py-2.5 px-3 flex justify-between items-center text-sm'
                    >
                      <span className='text-gray-500 text-xs'>
                        {formatDate(item.thoigian)}
                      </span>
                      <span className='font-semibold text-emerald-600'>
                        {item.giasanpham.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className='p-3 border-t bg-gray-50 flex justify-end'>
              <button
                type='button'
                onClick={handleCloseHistory}
                className='w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 font-medium'
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM SẢN PHẨM */}
      {isOpenAdd && (
        <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4'>
          <div className='bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200'>
            <div className='flex justify-between items-center px-5 py-3.5 border-b sticky top-0 bg-white'>
              <h3 className='font-bold text-base sm:text-lg text-gray-800'>
                Thêm Sản Phẩm Mới
              </h3>
              <button
                onClick={handleCloseAdd}
                className='text-gray-400 hover:text-black p-1'
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={handleSaveAdd}
              className='p-5 flex flex-col gap-3.5 overflow-y-auto'
            >
              <div>
                <label className='block text-xs sm:text-sm font-medium text-gray-700 mb-1'>
                  Tên sản phẩm *
                </label>
                <input
                  name='tensanpham'
                  type='text'
                  required
                  placeholder='Nhập tên sản phẩm'
                  className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none'
                />
              </div>
              <div>
                <label className='block text-xs sm:text-sm font-medium text-gray-700 mb-1'>
                  Danh mục *
                </label>
                <select
                  required
                  size={1}
                  className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none bg-white'
                  name='madanhmuc'
                >
                  <option value=''>Chọn danh mục</option>
                  {mockCategories.map((c) => (
                    <option key={c.madanhmuc} value={c.madanhmuc}>
                      {c.tendanhmuc}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-xs sm:text-sm font-medium text-gray-700 mb-1'>
                  Giá ban đầu (VNĐ) *
                </label>
                <input
                  name='giaban'
                  type='number'
                  required
                  placeholder='0'
                  className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none'
                />
              </div>
              <div>
                <label className='block text-xs sm:text-sm font-medium text-gray-700 mb-1'>
                  Ảnh sản phẩm (tuỳ chọn)
                </label>
                <input
                  name='anhsanpham'
                  type='file'
                  className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none'
                />
              </div>
              <div>
                <label className='block text-xs sm:text-sm font-medium text-gray-700 mb-1'>
                  Mô tả (tuỳ chọn / tối đa 200 chữ cái)
                </label>
                <textarea
                  maxLength={200}
                  name='motasanpham'
                  rows='3'
                  placeholder='Mô tả sản phẩm...'
                  className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none'
                ></textarea>
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
                  {isLoading ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CẬP NHẬT SẢN PHẨM */}
      {isOpenEdit && (
        <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4'>
          <div className='bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200'>
            <div className='flex justify-between items-center px-5 py-3.5 border-b sticky top-0 bg-white'>
              <h3 className='font-bold text-base sm:text-lg text-gray-800'>
                Cập Nhật Sản Phẩm
              </h3>
              <button
                onClick={handleCloseEdit}
                className='text-gray-400 hover:text-black p-1'
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={handleSaveEdit}
              className='p-5 flex flex-col gap-3.5 overflow-y-auto'
            >
              <div>
                <label className='block text-xs sm:text-sm font-medium text-gray-700 mb-1'>
                  Tên sản phẩm *
                </label>
                <input
                  name='tensanpham'
                  type='text'
                  defaultValue={selectedProduct?.tensanpham}
                  required
                  className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none'
                />
              </div>
              <div>
                <label className='block text-xs sm:text-sm font-medium text-gray-700 mb-1'>
                  Danh mục *
                </label>
                <select
                  size={1}
                  defaultValue={selectedProduct?.madanhmuc}
                  name='madanhmuc'
                  className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none bg-white'
                >
                  {mockCategories.map((c) => (
                    <option key={c.madanhmuc} value={c.madanhmuc}>
                      {c.tendanhmuc}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-xs sm:text-sm font-medium text-gray-700 mb-1'>
                  Cập nhật giá mới (VNĐ)
                </label>
                <input
                  name='giaban'
                  type='number'
                  defaultValue={selectedProduct?.giaban}
                  className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none'
                />
              </div>
              <div>
                <label className='block text-xs sm:text-sm font-medium text-gray-700 mb-1'>
                  Ảnh sản phẩm (tuỳ chọn)
                </label>
                <input
                  name='anhsanpham'
                  type='file'
                  className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none'
                />
              </div>
              <div>
                <label className='block text-xs sm:text-sm font-medium text-gray-700 mb-1'>
                  Mô tả (tuỳ chọn / tối đa 200 chữ cái)
                </label>
                <textarea
                  defaultValue={selectedProduct?.motasanpham}
                  maxLength={200}
                  name='motasanpham'
                  rows='3'
                  placeholder='Mô tả sản phẩm...'
                  className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none'
                ></textarea>
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
              Xóa sản phẩm <b>"{selectedProduct?.tensanpham}"</b>? Hành động này
              không thể hoàn tác.
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
