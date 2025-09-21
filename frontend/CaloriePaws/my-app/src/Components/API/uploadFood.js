// src/API/upload.js

const BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  "https://caloriepaws-node.azurewebsites.net"; // ✅ โปรดักชัน default

const TOKEN_KEY = "userToken";

/**
 * อัปโหลดรูปภาพไปที่ backend
 * @param {File|Blob} file - ไฟล์รูปภาพ
 * @returns {Promise<object>} response JSON
 */
export async function uploadFood(file) {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!file) throw new Error("No file provided");

  const fd = new FormData();
  fd.append("Image", file);

  const res = await fetch(`${BASE_URL}/api/foods/name`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // ❌ อย่าใส่ Content-Type เอง เวลาใช้ FormData
    },
    body: fd,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Upload failed: ${res.status} ${res.statusText} :: ${text}`
    );
  }

  return res.json();
}
