// Local history helpers (ใช้เมื่อ backend ไม่มี/ล่ม)
export const LOCAL_KEY = "eatingHistory";

export const getHistory = () => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const setHistory = (list) => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify((list || []).slice(0, 200)));
};

export const addHistory = (entry) => {
  const list = getHistory();
  list.unshift(entry);
  setHistory(list);
};

export const updateHistoryLocal = (id, patch) => {
  const list = getHistory();
  const next = list.map((it) => (it.id === id ? { ...it, ...patch } : it));
  setHistory(next);
};

export const removeHistory = (id) => {
  const list = getHistory();
  setHistory(list.filter((it) => it.id !== id));
};

// ใช้ใน Aside เวลาอยาก normalize ข้อมูลจาก localStorage
export const readLocalHistory = () => {
  try {
    const arr = getHistory();
    return (Array.isArray(arr) ? arr : []).map((m, i) => ({
      id: m.id ?? m.foodId ?? String(i),
      name: m.name ?? "Unknown food",
      calories: Number(m.calories) || 0,
      protein: Number(m.protein) || 0,
      carbs: Number(m.carbs ?? m.carbohydrates) || 0,
      fat: Number(m.fat) || 0,
      notes: m.notes ?? "",
      consumedAt:
        m.consumedAt ?? m.savedAt ?? m.createdAt ?? m.date ?? new Date().toISOString(),
      customIngredients: Array.isArray(m.customIngredients) ? m.customIngredients : [],
    }));
  } catch {
    return [];
  }
};
