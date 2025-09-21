// src/API/auth.js

// ===== Base config (แก้ค่าได้จาก ENV) =====
export const API_BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  "https://caloriepaws-node.azurewebsites.net"; // ค่า default ตอนโปรดักชัน

const TOKEN_KEY = "userToken";

// สร้าง URL แบบชัวร์ ๆ
function api(path) {
  const base = API_BASE_URL.replace(/\/+$/, "");
  const p = String(path || "").startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

// เฮดเดอร์ Authorization
function authHeader() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ทำรูปให้เป็น absolute URL ถ้าหลังบ้านส่งมาเป็น /uploads/xxx.png
function absoluteUrl(possiblyRelative) {
  if (!possiblyRelative) return "";
  if (/^https?:\/\//i.test(possiblyRelative)) return possiblyRelative;
  const base = API_BASE_URL.replace(/\/+$/, "");
  const p = String(possiblyRelative).startsWith("/")
    ? possiblyRelative
    : `/${possiblyRelative}`;
  return `${base}${p}`;
}

// parse/throw ให้เป็นระเบียบ
async function handleJsonResponse(res, context = "request") {
  const text = await res.text().catch(() => "");
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ไม่ใช่ JSON ก็ปล่อยเป็นข้อความดิบ
  }

  if (!res.ok) {
    const msg =
      json?.message || json?.error || text || `${res.status} ${res.statusText}`;
    throw new Error(`${context} failed: ${msg}`);
  }

  return json ?? {};
}

// =====================================================
//                     AUTH APIS
// =====================================================

export const registerUser = async (data) => {
  const res = await fetch(api("/api/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data ?? {}),
  });

  const resData = await handleJsonResponse(res, "POST /auth/register");
  return {
    status: res.status,
    ok: res.ok,
    data: resData,
  };
};

export const loginUser = async (data) => {
  const payload = {
    email: data?.name, // ตามโค้ดเดิมคุณส่ง name=อีเมล
    password: data?.password,
  };

  const res = await fetch(api("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // ถ้า backend ใช้ cookie ให้เปิดบรรทัดล่างนี้
    // credentials: "include",
    body: JSON.stringify(payload),
  });

  const jData = await handleJsonResponse(res, "POST /auth/login");

  // ถ้าได้ token เก็บลง localStorage
  if (jData?.token) {
    localStorage.setItem(TOKEN_KEY, jData.token);

    const displayName = jData?.user?.name || "";
    localStorage.setItem("user", JSON.stringify({ name: displayName }));

    const rawImg =
      jData?.user?.profileImageURL || jData?.user?.profileImage || "";
    const fullImg = rawImg ? absoluteUrl(rawImg) : "";
    if (fullImg) localStorage.setItem("profileImageURL", fullImg);

    // ให้ส่วนอื่นของแอปฟัง event นี้ได้
    window.dispatchEvent(new Event("auth:login"));
  }

  return {
    status: res.status,
    ok: res.ok,
    data: jData,
  };
};

export const logoutUser = async () => {
  const res = await fetch(api("/api/auth/logout"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    // ถ้า backend ใช้ cookie ให้เปิดบรรทัดล่างนี้
    // credentials: "include",
  });

  const data = await handleJsonResponse(res, "POST /auth/logout");

  // เคลียร์ token ฝั่ง client (ถ้าอยากออกจากระบบทันที)
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
  return data;
};

// (optionals) helper เผื่ออยากใช้ที่อื่น
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
