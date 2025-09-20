const BASE = import.meta?.env?.VITE_API_BASE_URL || "http://100.100.45.89:3201";

/** Autocomplete เมนู */
export async function suggestFoods(q, { signal } = {}) {
  const res = await fetch(`${BASE}/api/foods/suggest?q=${encodeURIComponent(q)}`, { signal });
  if (!res.ok) throw new Error(`foods/suggest HTTP ${res.status}`);
  return res.json();
}

/** ดึงรายละเอียดเมนูตามชื่อ */
export async function getFoodByName(name, { signal } = {}) {
  const res = await fetch(`${BASE}/api/foods/name/${encodeURIComponent(name)}`, { signal });
  if (!res.ok) throw new Error(`foods/name HTTP ${res.status}`);
  const json = await res.json();
  return json.data;              
}

/** Autocomplete วัตถุดิบ (ใช้กับส่วน Ingredients editor) */
export async function suggestIngredients(q, { signal } = {}) {
  const res = await fetch(`${BASE}/api/ingredients/suggest?q=${encodeURIComponent(q)}`, { signal });
  if (!res.ok) throw new Error(`ingredients/suggest HTTP ${res.status}`);
  return res.json();          
}

export async function getIngredientById(id, { signal } = {}) {
  const res = await fetch(`${BASE}/api/ingredients/${encodeURIComponent(id)}`, { signal });
  if (!res.ok) throw new Error(`ingredients/:ingredientId HTTP ${res.status}`);
  const json = await res.json();
  return json.data;              
}