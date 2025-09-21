// src/API/user.js

const BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  "https://caloriepaws-node.azurewebsites.net"; // ✅ default production

const TOKEN_KEY = "userToken";

function getAuthHeader() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * GET /api/getme
 * ดึงข้อมูลผู้ใช้ปัจจุบัน
 */
export async function userPreview() {
  const res = await fetch(`${BASE_URL}/api/getme`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `GET /api/getme failed: ${res.status} ${res.statusText} :: ${text}`
    );
  }

  const response = await res.json();
  console.log("userPreview:", response);
  return response;
}

/**
 * Helper: คืนเฉพาะ user object
 */
export async function userPreviewRaw() {
  const response = await userPreview();
  return response.user ?? response?.data ?? response;
}

/**
 * PATCH /api/updateme
 * อัปเดตข้อมูลผู้ใช้ (รองรับ JSON และ FormData)
 */
export async function userUpdateMe(data) {
  const isForm = data instanceof FormData;

  const res = await fetch(`${BASE_URL}/api/updateme`, {
    method: "PATCH",
    headers: isForm
      ? { ...getAuthHeader() } // ❗️อย่าเซ็ต Content-Type เองถ้าเป็น FormData
      : { "Content-Type": "application/json", ...getAuthHeader() },
    body: isForm ? data : JSON.stringify(data),
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const msg = json?.message || json?.error || text || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return json;
}
