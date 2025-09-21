// src/API/foods.js

const BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  "https://caloriepaws-node.azurewebsites.net"; // ✅ โปรดักชัน default

// ---------- helpers ----------
async function handleJson(res, label) {
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ไม่ใช่ JSON → คืน raw text
    json = text;
  }

  if (!res.ok) {
    const msg = json?.message || text || `${res.status} ${res.statusText}`;
    throw new Error(`${label} failed :: ${msg}`);
  }
  return json;
}

// ---------- APIs ----------

/** Autocomplete เมนู */
export async function suggestFoods(q, { signal } = {}) {
  const url = `${BASE_URL}/api/foods/suggest?q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { signal });
  return handleJson(res, "GET /foods/suggest");
}

/** ดึงรายละเอียดเมนูตามชื่อ */
export async function getFoodByName(name, { signal } = {}) {
  const url = `${BASE_URL}/api/foods/name/${encodeURIComponent(name)}`;
  const res = await fetch(url, { signal });
  const json = await handleJson(res, "GET /foods/name/:name");
  return json?.data ?? json;
}

/** Autocomplete วัตถุดิบ */
export async function suggestIngredients(q, { signal } = {}) {
  const url = `${BASE_URL}/api/ingredients/suggest?q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { signal });
  return handleJson(res, "GET /ingredients/suggest");
}

/** ดึงวัตถุดิบตาม id */
export async function getIngredientById(id, { signal } = {}) {
  const url = `${BASE_URL}/api/ingredients/${encodeURIComponent(id)}`;
  const res = await fetch(url, { signal });
  const json = await handleJson(res, "GET /ingredients/:id");
  return json?.data ?? json;
}
