async function upLoadImage(image) {
  // 1. Vite bắt buộc phải có tiền tố VITE_
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  if (!uploadPreset) {
    console.error("Thiếu biến môi trường VITE_CLOUDINARY_UPLOAD_PRESET trong file .env");
    return {
      status: 400,
      url: null,
      message: "Chưa cấu hình VITE_CLOUDINARY_UPLOAD_PRESET trong file .env",
    };
  }

  const formData = new FormData();
  formData.append("file", image);
  formData.append("upload_preset", uploadPreset);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();

    // 2. Đọc trực tiếp chi tiết lỗi do Cloudinary trả về nếu thất bại
    if (!res.ok) {
      console.error("Cloudinary Error Detail:", data?.error?.message);
      return {
        status: res.status,
        url: null,
        message: data?.error?.message || `Upload failed with status ${res.status}`,
      };
    }

    return {
      status: 200,
      url: data.secure_url,
      public_id: data.public_id,
      message: "Upload success",
    };
  } catch (e) {
    console.error("Upload error:", e);
    return {
      status: 500,
      url: null,
      message: e.message,
    };
  }
}

export { upLoadImage };