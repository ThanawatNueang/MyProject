const BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  "http://100.100.45.89:3201";

export const TOKEN_KEY = "userToken"; // ใช้คีย์เดียวกันทั้งแอป

function getAuthHeader() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handleUnauthorized() {
  // ลบ token ทิ้งเพื่อบังคับให้ login ใหม่ใน flow ของคุณ
  localStorage.removeItem(TOKEN_KEY);
}

async function handleJsonResponse(res, context = "request") {
  if (res.status === 401) {
    const txt = await res.text().catch(() => "");
    console.error(`❌ ${context} 401:`, txt);
    handleUnauthorized();
    throw new Error(`Unauthorized (401): ${txt || "Invalid token"}`);
  }

  // บาง backend จะส่ง 204 No Content หลังลบ/แก้ไข
  if (res.status === 204) return null;

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    console.error(`❌ ${context} failed:`, res.status, text);
    throw new Error(`${context} failed: ${res.status} ${text}`);
  }

  // พยายาม parse JSON ถ้าไม่ใช่ JSON จะคืน raw text กลับ
  try {
    const json = text ? JSON.parse(text) : null;
    // รองรับทั้ง { data: ... } หรือส่ง array/object ตรง ๆ
    return json && Object.prototype.hasOwnProperty.call(json, "data")
      ? json.data
      : json;
  } catch {
    // ไม่ใช่ JSON ก็คืน text
    return text;
  }
}

// -------------------- Normalizers --------------------

/**
 * ทำให้ payload ที่ส่งขึ้นหลังบ้านมีทั้งแบบ flatten และแบบ nutrition object
 * และ map carbohydrates -> carbs ให้ด้วย เพื่อให้ฝั่ง client ใช้สะดวก
 */
function normalizeCreatePayload(input = {}) {
  const n = input.nutrition || {};
  const calories =
    toNumber(input.calories) ?? toNumber(n.calories) ?? 0;
  const protein =
    toNumber(input.protein) ?? toNumber(n.protein) ?? 0;
  // carbs อาจมาจาก n.carbohydrates หรือ n.carbs
  const carbs =
    toNumber(input.carbs) ??
    toNumber(n.carbohydrates) ??
    toNumber(n.carbs) ??
    0;
  const fat =
    toNumber(input.fat) ?? toNumber(n.fat) ?? 0;

  const nutrition = {
    calories,
    protein,
    carbohydrates: carbs, // เก็บเป็น carbohydrates ใน object
    fat,
  };

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
    consumedAt:  input.consumedAt ?? input.consumed_at ?? new Date().toISOString(),
    consumed_at: input.consumedAt ?? input.consumed_at ?? new Date().toISOString(),
  };
}

/**
 * ทำให้รายการที่ดึงจาก backend กลายเป็น shape เดียวกันในฝั่ง client
 */
export function normalizeHistoryItem(m, idx = 0) {
  const consumed =
    m.consumedAt ??
    m.consumed_at ??
    m.date ??
    null;
    
  return {
    id: m.id ?? m.foodId ?? String(idx),
    name: m.custom_food_name || m.food_name || "Unknown food",
    calories: toNumber(m.calculated_calories) ?? toNumber(m?.nutrition?.calculated_calories) ?? 0,
    protein: toNumber(m.calculated_protein) ?? toNumber(m?.nutrition?.calculated_protein) ?? 0,
    carbs:
      toNumber(m.calculated_carbohydrates) ??
      toNumber(m?.nutrition?.calculated_carbohydrates) ??
      toNumber(m?.nutrition?.calculated_carbohydrates) ??
      0,
    fat: toNumber(m.calculated_fat) ?? toNumber(m?.nutrition?.calculated_fat) ?? 0,
    notes: m.notes ?? "",
    consumedAt: consumed,
    consumed_at: consumed,
    customIngredients: Array.isArray(m.custom_ingredients)
      ? m.custom_ingredients
      : [],
  };
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// -------------------- Date helpers --------------------

export function getLast7DaysRange() {
  const end = new Date();       // วันนี้
  const tomorrow = new Date(end);
  tomorrow.setDate(end.getDate() + 1); // ทำ endDate แบบ exclusive ให้ครอบวันนี้
  const start = new Date();
  start.setDate(end.getDate() - 6);

  const toISODate = (d) => d.toISOString().slice(0, 10);
  return { startDate: toISODate(start), endDate: toISODate(tomorrow) };
}

// -------------------- API Calls --------------------

/**
 * GET /api/eatinghistory?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * สามารถส่งช่วงวันหรือไม่ส่งก็ได้ (ถ้าไม่ส่ง backend ควรคืนทั้งหมด หรือมีค่า default)
 */
export const eatingHistory = async (startDate, endDate) => {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  const url =
    params.toString().length > 0
      ? `${BASE_URL}/api/eatinghistory?${params.toString()}`
      : `${BASE_URL}/api/eatinghistory`;

  console.log("[GET] /api/eatinghistory ->", { url });

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  const data = await res.json()
  console.log(data.data);
  return data.data;
};

/**
 * ตัวช่วยดึง 7 วันย้อนหลัง (ใช้ใน Aside ได้เลย)
 */
export async function fetchLast7Days() {
  const { startDate, endDate } = getLast7DaysRange();
  let data = await eatingHistory(startDate, endDate);
  if (!Array.isArray(data) || data.length === 0) {
    // fallback: บางหลังบ้านต้องการ ?days=7 หรือไม่ส่งพาราม
    try {
      data = await eatingHistory(); // ไม่ส่งช่วง
    } catch {}
  }
  const arr = Array.isArray(data) ? data : [];
  const normalized = arr.map((m, i) => normalizeHistoryItem(m, i));
  console.log(normalized,"noooo");
  const getT = (x) =>
    Date.parse(x?.consumedAt ?? x?.consumed_at ?? x?.date ?? "") || -Infinity;
  normalized.sort((a, b) => getT(b) - getT(a));
  return normalized;
}

/**
 * POST /api/eatinghistory
 */
export async function createEatingHistory(payload) {
  const body = normalizeCreatePayload(payload);
  console.log("📤 POST payload -> /api/eatinghistory:", body);

  if (!body?.foodId) {
    console.warn("⚠️ payload.foodId ว่าง อาจทำให้หลังบ้าน reject");
  }

  const res = await fetch(`${BASE_URL}/api/eatinghistory`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(body),
  });

  const data = await handleJsonResponse(res, "POST /api/eatinghistory");
  console.log("✅ POST response:", data);
  return data;
}

export async function updateEatingHistory(patch) {
console.log(patch);

const res = await fetch(`${BASE_URL}/api/eatinghistory`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader()
    },
    body: JSON.stringify(patch),
  });

   const data = await res.json()
  console.log("✅ PATCH response:", data);
  return data; 
}

/**
 * DELETE /api/eatinghistory/:id
 */
export async function deleteEatingHistory(id) {
  if (!id) throw new Error("deleteEatingHistory: missing id");

  const res = await fetch(`${BASE_URL}/api/eatinghistory/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeader(),
    },
  });

  const data = await handleJsonResponse(res, "DELETE /api/eatinghistory/:id");
  console.log("✅ DELETE response:", data);
  return data; // อาจเป็น null (204)
}
