// src/API/nutritionGoal.js

export const BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  "https://caloriepaws-node.azurewebsites.net"; // ✅ โปรดักชันค่าเริ่มต้น (ไม่ต้องมีพอร์ต)

const TOKEN_KEY = "userToken";

// ----- helpers -----
function getAuthHeader() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleJson(res, label) {
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // not JSON; keep as text
  }

  if (!res.ok) {
    const msg = json?.message || text || `${res.status} ${res.statusText}`;
    // 401: ล้าง token เผื่อ token หมดอายุ
    if (res.status === 401) {
      try { localStorage.removeItem(TOKEN_KEY); } catch {}
    }
    throw new Error(`${label} failed :: ${msg}`);
  }
  return json;
}

function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// ----- APIs -----

// GET /api/me/nutrition-goals
export async function nutritionGoal() {
  const url = `${BASE_URL}/api/me/nutrition-goals`;
  const res = await fetch(url, {
    method: "GET",
    headers: { ...getAuthHeader() }, // GET ไม่ต้องมี Content-Type
    cache: "no-store",
  });
  const json = await handleJson(res, "GET /me/nutrition-goals");
  return json?.data; // คาดหวัง { data: ... }
}

// GET /api/eatinghistory/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
export async function fetchEatingSummary(
  start = todayISO(),
  end = todayISO()
) {
  const qs = new URLSearchParams({ startDate: start, endDate: end });
  const url = `${BASE_URL}/api/eatinghistory/summary?${qs.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { ...getAuthHeader() },
    cache: "no-store",
  });

  const json = await handleJson(res, "GET /eatinghistory/summary");
  return json?.data; // ← { calories, fat, protein, carbohydrates }
}
