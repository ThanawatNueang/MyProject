// ../API/nutritionGoal.js
export const BASE_URL =
  (import.meta?.env?.VITE_API_BASE_URL) || "http://100.100.45.89:3201";

const TOKEN_KEY = "userToken";

function getAuthHeader() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) throw new Error("UNAUTHORIZED: missing token");
  return { Authorization: `Bearer ${token}` };
}

async function handleJson(res, label) {
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) {
    const msg = json?.message || text || `${res.status} ${res.statusText}`;
    throw new Error(`${label} failed :: ${msg}`);
  }
  return json;
}

export const nutritionGoal = async () => {
  const url = `${BASE_URL}/api/me/nutrition-goals`;
  const res = await fetch(url, {
    method: "GET",
    headers: { ...getAuthHeader() }, // ✅ GET ไม่ต้องใส่ Content-Type
    cache: "no-store",
  });
  const json = await handleJson(res, "GET /me/nutrition-goals");
  return json?.data; // ← คืน data ตามสัญญา
};

function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export const fetchEatingSummary = async (start = todayISO(), end = todayISO()) => {
  const qs = new URLSearchParams({ startDate: start, endDate: end });
  const url = `${BASE_URL}/api/eatinghistory/summary?${qs.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { ...getAuthHeader() }, // ✅ พอแล้วสำหรับ Bearer
    cache: "no-store",
  });

  const json = await handleJson(res, "GET /eatinghistory/summary");
  return json?.data; // ← คืน { calories, fat, protein, carbohydrates }
};