// src/API/eatingHistory.js  (หรือชื่อไฟล์เดิมของคุณ)

export const BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  "https://caloriepaws-node.azurewebsites.net"; // ✅ ค่า default โปรดักชัน (ไม่ใช้พอร์ต)

export const TOKEN_KEY = "userToken";

// -------------------- Helpers --------------------

function getAuthHeader() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handleUnauthorized() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

async function handleJsonResponse(res, context = "request") {
  // 401: ล้าง token และโยน error
  if (res.status === 401) {
    const txt = await res.text().catch(() => "");
    console.error(`❌ ${context} 401:`, txt);
    handleUnauthorized();
    throw new Error(`Unauthorized (401): ${txt || "Invalid token"}`);
  }

  // บางตัวตอบ 204 No Content
  if (res.status === 204) return null;

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    console.error(`❌ ${context} failed:`, res.status, text);
    throw new Error(`${context} failed: ${res.status} ${text}`);
  }

  // คืน JSON ถ้า parse ได้ ไม่งั้นคืน text
  try {
    const json = text ? JSON.parse(text) : null;
    return json && Object.prototype.hasOwnProperty.call(json, "data")
      ? json.data
      : json;
  } catch {
    return text;
  }
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// -------------------- Normalizers --------------------

/** แปลง payload ให้หลังบ้านรองรับทั้งแบบ flatten และ object nutrition */
function normalizeCreatePayload(input = {}) {
  const n = input.nutrition || {};
  const calories = toNumber(input.calories) ?? toNumber(n.calories) ?? 0;
  const protein  = toNumber(input.protein)  ?? toNumber(n.protein)  ?? 0;
  const carbs    =
    toNumber(input.carbs) ??
    toNumber(n.carbohydrates) ??
    toNumber(n.carbs) ??
    0;
  const fat      = toNumber(input.fat)      ?? toNumber(n.fat)      ?? 0;

  const nutrition = { calories, protein, carbohydrates: carbs, fat };

  const consumed =
    input.consumedAt ?? input.consumed_at ?? new Date().toISOString();

  return {
    foodId: input.foodId,
    custom_food_name: input.custom_food_name || "Unknown food",
    calories,
    protein,
    carbs,
    fat,
    nutrition,
    customIngredients: Array.isArray(input.customIngredients)
      ? input.customIngredients.map((it, idx) => ({
          id: it.id ?? it._id ?? String(idx),
          name: String(it.name ?? "").trim(),
          quantity: toNumber(it.quantity) ?? 0,
          unit: (it.unit || "กรัม").trim(),
        }))
      : [],
    notes: input.notes || "",
    consumedAt: consumed,
    consumed_at: consumed,
  };
}

/** แปลงรายการจากหลังบ้านให้เป็น shape เดียวกันใน client */
export function normalizeHistoryItem(m, idx = 0) {
  const consumed = m.consumedAt ?? m.consumed_at ?? m.date ?? null;
  return {
    id: m.id ?? m.foodId ?? String(idx),
    name: m.custom_food_name || m.food_name || "Unknown food",
    calories:
      toNumber(m.calculated_calories) ??
      toNumber(m?.nutrition?.calculated_calories) ??
      0,
    protein:
      toNumber(m.calculated_protein) ??
      toNumber(m?.nutrition?.calculated_protein) ??
      0,
    carbs:
      toNumber(m.calculated_carbohydrates) ??
      toNumber(m?.nutrition?.calculated_carbohydrates) ??
      0,
    fat:
      toNumber(m.calculated_fat) ??
      toNumber(m?.nutrition?.calculated_fat) ??
      0,
    notes: m.notes ?? "",
    consumedAt: consumed,
    consumed_at: consumed,
    customIngredients: Array.isArray(m.custom_ingredients)
      ? m.custom_ingredients
      : [],
  };
}

// -------------------- Date helpers --------------------

export function getLast7DaysRange() {
  const end = new Date();
  const tomorrow = new Date(end);
  tomorrow.setDate(end.getDate() + 1); // exclusive
  const start = new Date();
  start.setDate(end.getDate() - 6);

  const iso = (d) => d.toISOString().slice(0, 10);
  return { startDate: iso(start), endDate: iso(tomorrow) };
}

// -------------------- API Calls --------------------

/** GET /api/eatinghistory?startDate=&endDate= */
export async function eatingHistory(startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  const url =
    params.toString()
      ? `${BASE_URL}/api/eatinghistory?${params.toString()}`
      : `${BASE_URL}/api/eatinghistory`;

  const res = await fetch(url, {
    method: "GET",
    headers: { ...getAuthHeader() }, // GET ไม่จำเป็นต้องใส่ Content-Type
    cache: "no-store",
  });

  // คาดหวังหลังบ้านกลับ { data: [...] }
  const data = await handleJsonResponse(res, "GET /api/eatinghistory");
  return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
} 

export async function allEatingHistory(Date, plimit) {
  const params = new URLSearchParams();
  if (Date) params.set("Date", Date);
  let limit = 10
  limit += plimit

  const url =
    params.toString()
      ? `${BASE_URL}/api/eatinghistory/all?limit=${limit}?date=${params.toString()}`
      : `${BASE_URL}/api/eatinghistory/all?limit=${limit}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { ...getAuthHeader() }, // GET ไม่จำเป็นต้องใส่ Content-Type
    cache: "no-store",
  });

    // คาดหวังหลังบ้านกลับ { data: [...] }
  const data = await handleJsonResponse(res, "GET /api/eatinghistory/all");
  return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
} 

/** Helper: ดึง 7 วันย้อนหลัง */
export async function fetchLast7Days() {
  const { startDate, endDate } = getLast7DaysRange();
  let data = await eatingHistory(startDate, endDate);
  if (!Array.isArray(data) || data.length === 0) {
    try {
      data = await eatingHistory(); // fallback
    } catch {}
  }
  const normalized = (Array.isArray(data) ? data : []).map((m, i) =>
    normalizeHistoryItem(m, i)
  );
  const getT = (x) =>
    Date.parse(x?.consumedAt ?? x?.consumed_at ?? x?.date ?? "") || -Infinity;
  normalized.sort((a, b) => getT(b) - getT(a));
  return normalized;
}

/** POST /api/eatinghistory */
export async function createEatingHistory(payload) {
  const body = normalizeCreatePayload(payload);
  const res = await fetch(`${BASE_URL}/api/eatinghistory`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(body),
  });
  return await handleJsonResponse(res, "POST /api/eatinghistory");
}

/** PATCH /api/eatinghistory */
export async function updateEatingHistory(patch) {
  const res = await fetch(`${BASE_URL}/api/eatinghistory`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(patch),
  });
  return await handleJsonResponse(res, "PATCH /api/eatinghistory");
}

/** DELETE /api/eatinghistory/:id */
export async function deleteEatingHistory(id) {
  if (!id) throw new Error("deleteEatingHistory: missing id");
  const res = await fetch(
    `${BASE_URL}/api/eatinghistory/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: { ...getAuthHeader() },
    }
  );
  return await handleJsonResponse(res, "DELETE /api/eatinghistory/:id"); // อาจเป็น null (204)
}
