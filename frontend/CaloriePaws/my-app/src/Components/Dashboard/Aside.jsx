import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  CartesianGrid,
  Rectangle,
} from "recharts";
import { IoBookmark, IoCloseCircle } from "react-icons/io5";
import { useEffect, useState, useMemo, useCallback } from "react";
import { nutritionGoal } from "../API/nutritionGoal";
import { BsFire } from "react-icons/bs";
import { MdDelete } from "react-icons/md";
import { MdDeleteOutline } from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";
import { readLocalHistory } from "../../utils/eatingHistory";
import {
  fetchLast7Days,
  updateEatingHistory,
  deleteEatingHistory,
} from "../API/eatingHistory";
import {
  suggestIngredients,
  getIngredientById as apiGetIngredientById,
} from "../API/search";

/* ===== Colors ===== */
const MACRO_COLORS = { protein: "#606B43", carbs: "#909C6F", fat: "#414B26" };
const GRID = "#E7E3D8";
const AXIS = "#6F6A5B";

/* ---------- Normalize helpers ---------- */
const normalizeMeal = (m, i) => {
  const customName = m?.custom_food_name ?? m?.customFoodName ?? null;

  return {
    ...m,
    id: m?.id ?? m?.foodId ?? String(i),
    // เก็บค่าเดิมไว้ทั้งคู่
    name: m?.name ?? "Unknown food",
    custom_food_name: customName,

    // ชื่อที่ใช้โชว์บน UI เสมอ (custom ก่อน ถ้าไม่มีค่อย fallback เป็น name)
    displayName:
      (typeof customName === "string" && customName.trim()) ||
      m?.name ||
      "Unknown food",

    calories: Number(m?.calories ?? m?.nutrition?.calories) || 0,
    protein: Number(m?.protein ?? m?.nutrition?.protein) || 0,
    carbs:
      Number(m?.carbs ?? m?.nutrition?.carbs ?? m?.nutrition?.carbohydrates) ||
      0,
    fat: Number(m?.fat ?? m?.nutrition?.fat) || 0,
    notes: m?.notes ?? "",
    consumedAt: m?.consumedAt ?? m?.consumed_at ?? m?.date ?? null,
    customIngredients: Array.isArray(m?.customIngredients)
      ? m.customIngredients
      : [],
  };
};

const getBarRadius = (payload, key) => {
  const protein = Number(payload.protein || 0);
  const carbs = Number(payload.carbs || 0);
  const fat = Number(payload.fat || 0);
  const topKey =
    fat > 0 ? "fat" : carbs > 0 ? "carbs" : protein > 0 ? "protein" : null;
  return key === topKey ? [8, 8, 0, 0] : [0, 0, 0, 0];
};

// หน่วย → กรัม/มล.
const UNIT_TO_GRAMS = {
  g: 1,
  gram: 1,
  กรัม: 1,
  ml: 1,
  "มล.": 1,
  มิลลิลิตร: 1,
  ช้อนชา: 5,
  ช้อนโต๊ะ: 15,
};
const toGrams = (qty, unit) =>
  (Number(qty) || 0) * (UNIT_TO_GRAMS[unit?.trim?.()] || 1);

// per 100g pickers
const pickPer100g = (obj = {}) => ({
  calories_100g:
    Number(
      obj.calories_100g ??
        obj.caloriesPer100g ??
        obj.calories_per_100g ??
        obj.calories
    ) || 0,
  protein_100g:
    Number(
      obj.protein_100g ??
        obj.proteinPer100g ??
        obj.protein_per_100g ??
        obj.protein
    ) || 0,
  carbs_100g:
    Number(
      obj.carbs_100g ??
        obj.carbsPer100g ??
        obj.carbs_per_100g ??
        obj.carbohydrates
    ) || 0,
  fat_100g:
    Number(obj.fat_100g ?? obj.fatPer100g ?? obj.fat_per_100g ?? obj.fat) || 0,
});

const PER100G_CACHE = new Map();

async function ensurePer100g(it) {
  const base = pickPer100g(it);
  if (
    base.calories_100g ||
    base.protein_100g ||
    base.carbs_100g ||
    base.fat_100g
  ) {
    return base;
  }
  if (it.id) {
    if (PER100G_CACHE.has(it.id)) return PER100G_CACHE.get(it.id);
    try {
      const detail = await apiGetIngredientById(it.id);
      const per = pickPer100g(detail?.nutrition || detail || {});
      PER100G_CACHE.set(it.id, per);
      return per;
    } catch {
      return { calories_100g: 0, protein_100g: 0, carbs_100g: 0, fat_100g: 0 };
    }
  }
  return { calories_100g: 0, protein_100g: 0, carbs_100g: 0, fat_100g: 0 };
}

/* ---------- Date helpers (ล็อกเป็น local string) ---------- */

// ==== Local YYYY-MM-DD (กัน off-by-one จาก timezone) ====
const toYMDLocal = (d) => {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// วันนี้ (ตามเวลาบนเครื่องผู้ใช้)
const getTodayYMD = () => toYMDLocal(new Date());

const toYMD = (v) => {
  if (v == null) return null;
  if (typeof v === "number") {
    const ms = v < 1e12 ? v * 1000 : v;
    const d = new Date(ms);
    return isNaN(d) ? null : d.toISOString().slice(0, 10);
  }
  if (typeof v === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v; // keep as-is
    const d1 = new Date(v);
    if (!isNaN(d1)) return d1.toISOString().slice(0, 10);
    const m = v.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (m) {
      const [, dd, mm, yyyy] = m;
      const d2 = new Date(Date.UTC(+yyyy, +mm - 1, +dd));
      return d2.toISOString().slice(0, 10);
    }
    return null;
  }
  const d = new Date(v);
  return isNaN(d) ? null : d.toISOString().slice(0, 10);
};

// ใช้ local แทนในตัวแปลงวันที่ของ item
const getItemDateYMD = (m) => {
  const v = m?.consumedAt ?? m?.consumed_at ?? m?.date ?? null;
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  return toYMDLocal(v);
};

// display ในลิสต์
const displayDate = (v) => {
  if (!v) return "";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  return isNaN(d) ? "" : d.toLocaleString();
};

// notifier
function notifyHistoryUpdated() {
  window.dispatchEvent(
    new CustomEvent("history:updated", { detail: { from: "aside" } })
  );
}

export const Aside = () => {
  const [nutrition, setNutrition] = useState({ protein: 0, fat: 0, carbs: 0 });
  const [latest, setLatest] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isListOpen, setIsListOpen] = useState(false);
  const [allMeals, setAllMeals] = useState([]);
  const [todayMeals, setTodayMeals] = useState([]);

  // กราฟย้อนหลัง 7 วัน
  const [macro7d, setMacro7d] = useState([]);

  // auto complete
  const [suggustions, setSuggustions] = useState([]);
  const [activeSugguestIndex, setActiveSugguestIndex] = useState(null);

  // meal ปัจจุบันที่กำลังแก้ (อาจมาจาก Food Daily หรือจากลิสต์)
  const [editTarget, setEditTarget] = useState(null);

  const fetchIngredient = async (keyword) => {
    const kw = String(keyword || "").trim();
    if (!kw) return [];
    try {
      const res = await suggestIngredients(kw);
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  };

  /* ---------- Compute 7d macros ---------- */
  const computeMacro7d = useCallback((list = []) => {
    const today = new Date();
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const key = toYMD(d);
      const label = d.toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "2-digit",
      });

      const inDay = list.filter((m) => getItemDateYMD(m) === key);
      const protein = inDay.reduce((s, m) => s + Number(m.protein || 0), 0);
      const carbs = inDay.reduce((s, m) => s + Number(m.carbs || 0), 0);
      const fat = inDay.reduce((s, m) => s + Number(m.fat || 0), 0);

      out.push({ date: label, protein, carbs, fat });
    }
    setMacro7d(out);
  }, []);

  /* ---------- fetch lists ---------- */
  const fetchNormalized = useCallback(async () => {
    const raw = await fetchLast7Days();
    return (Array.isArray(raw) ? raw : []).map(normalizeMeal);
  }, []);

  const loadAndRender = useCallback(async () => {
    let list = await fetchNormalized();
    if (list.length === 0) list = readLocalHistory().map(normalizeMeal);

    // sort ใหม่ล่าสุดอยู่บน
    list.sort((a, b) => {
      const A = getItemDateYMD(a) || "";
      const B = getItemDateYMD(b) || "";
      return B.localeCompare(A);
    });

    setAllMeals(list);

    // ✅ กรองเฉพาะวันนี้
    const today = getTodayYMD();
    setTodayMeals(list.filter((m) => getItemDateYMD(m) === today));

    computeMacro7d(list);
    return list;
  }, [fetchNormalized, computeMacro7d]);

  /* ---------- Mount ---------- */
  useEffect(() => {
    (async () => {
      try {
        const resData = await nutritionGoal();
        setNutrition(resData.macronutrients);
      } catch {}
      const list = await loadAndRender();
      setAllMeals(list);

      const onUpdated = async () => {
        const l2 = await loadAndRender();
        setAllMeals(l2);
      };
      window.addEventListener("history:updated", onUpdated);
      return () => window.removeEventListener("history:updated", onUpdated);
    })();
  }, [loadAndRender]);

  /* ---------- Modal open/close ---------- */
  useEffect(() => {
    if (!isListOpen) return;
    document.body.style.overflow = "hidden";
    const onEsc = (e) => e.key === "Escape" && setIsListOpen(false);
    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onEsc);
    };
  }, [isListOpen]);

  const openList = async () => {
    const data = await fetchNormalized();
    setAllMeals(data);
    setIsListOpen(true);
  };
  const closeList = () => setIsListOpen(false);

  /* ---------- Actions in modal ---------- */
  const deleteMeal = async (id) => {
    if (!confirm("Delete this item?")) return;
    await deleteEatingHistory(id);
    notifyHistoryUpdated();
    const list = await loadAndRender(); // จะอัปเดต todayMeals ให้อัตโนมัติ
    setAllMeals(list);
  };

  const setAsLatest = (id) => {
    const picked = allMeals.find((m) => m.id === id);
    if (picked) setLatest(picked);
    setIsListOpen(false);
  };

  /* ---------- Edit form (reusable for any meal) ---------- */
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    notes: "",
    customIngredients: [],
    id: "",
    consumedAt: "",
  });

  // เปิดฟอร์มแก้ไขเสมอใน "โมดัล" (เรียกได้ทั้งจาก Food Daily และจากลิสต์)
  const openEdit = (meal = latest) => {
    if (!meal) return;
    setForm({
      name: meal.name ?? "",
      calories: meal.calories ?? "",
      protein: meal.protein ?? "",
      carbs: meal.carbs ?? "",
      fat: meal.fat ?? "",
      notes: meal.notes ?? "",
      customIngredients: Array.isArray(meal.customIngredients)
        ? meal.customIngredients
        : [],
      id: meal.id,
      consumedAt: getItemDateYMD(meal) ?? "",
    });
    setEditTarget(meal);
    setIsEditing(true);
    setIsListOpen(true); // ✅ เปิดโมดัล
  };

  const openEditFromList = (m) => openEdit(m);

  const saveEdit = async () => {
    setIsSaving(true);
    if (!editTarget) return;

    // 1) clean input
    const cleanedIngredients = (form.customIngredients || [])
      .map((it) => ({
        id: String(it.id ?? "").trim(),
        name: String(it.name ?? "").trim(),
        quantity: Number(it.quantity) || 0,
        unit: (it.unit || "g").trim(),
        calories_100g: Number(it.calories_100g) || 0,
        protein_100g: Number(it.protein_100g) || 0,
        carbs_100g: Number(it.carbs_100g) || 0,
        fat_100g: Number(it.fat_100g) || 0,
      }))
      .filter((it) => it.name.length > 0 && (it.quantity || 0) > 0);

    // 2) per100g parallel
    const rows = await Promise.all(
      cleanedIngredients.map(async (it, idx) => {
        const per = await ensurePer100g(it);
        const grams = toGrams(it.quantity, it.unit);
        return {
          idx,
          per,
          grams,
          cals: (per.calories_100g * grams) / 100,
          p: (per.protein_100g * grams) / 100,
          c: (per.carbs_100g * grams) / 100,
          f: (per.fat_100g * grams) / 100,
        };
      })
    );

    // 3) sum
    const sum = rows.reduce(
      (acc, r) => ({
        cal: acc.cal + r.cals,
        p: acc.p + r.p,
        c: acc.c + r.c,
        f: acc.f + r.f,
      }),
      { cal: 0, p: 0, c: 0, f: 0 }
    );

    // 4) add per100g back + cache
    rows.forEach(({ per, idx }) => {
      cleanedIngredients[idx] = { ...cleanedIngredients[idx], ...per };
      const id = cleanedIngredients[idx].id;
      if (id) PER100G_CACHE.set(id, per);
    });

    const round1 = (n) => Math.round(n * 10) / 10;
    const newDateStr = form.consumedAt || null;
    // 5) optimistic: update item in allMeals
    const updatedItem = {
      ...editTarget,
      name: (form.name || "").trim(),
      notes: (form.notes || "").trim(),
      calories: round1(sum.cal),
      protein: round1(sum.p),
      carbs: round1(sum.c),
      fat: round1(sum.f),
      customIngredients: cleanedIngredients,
      consumedAt: newDateStr ?? editTarget.consumedAt,
      consumed_at: newDateStr ?? editTarget.consumed_at,
    };

    const nextAll = allMeals.map((m) =>
      m.id === editTarget.id ? updatedItem : m
    );

    // resort by date
    nextAll.sort((a, b) => {
      const A = getItemDateYMD(a) || "";
      const B = getItemDateYMD(b) || "";
      return B.localeCompare(A);
    });

    setAllMeals(nextAll);

    // sync latest
    if (latest && latest.id === editTarget.id) {
      setLatest(updatedItem);
    } else {
      setLatest(nextAll[0] || null);
    }

    computeMacro7d(nextAll);

    // 6) ส่งจริง
    const patch = {
      id: (form.id || editTarget.id || "").trim(),
      custom_food_name: updatedItem.name,
      notes: updatedItem.notes,
      calories: updatedItem.calories,
      protein: updatedItem.protein,
      carbs: updatedItem.carbs,
      fat: updatedItem.fat,
      customIngredients: cleanedIngredients,
      consumedAt: newDateStr,
      consumed_at: newDateStr,
    };

    try {
      await updateEatingHistory(patch);
      notifyHistoryUpdated();
    } finally {
      const list = await loadAndRender();
      setAllMeals(list);
      setIsEditing(false);
      setIsSaving(false);
      setEditTarget(null);
    }
  };

  const deleteLatest = async () => {
    if (!latest) return;
    if (!confirm("Delete this item?")) return;
    await deleteEatingHistory(latest.id);
    notifyHistoryUpdated();
    const list = await loadAndRender();
    setAllMeals(list);
  };

  // ---------- helpers ของ customIngredients ----------
  const setCI = (updater) =>
    setForm((f) => ({
      ...f,
      customIngredients:
        typeof updater === "function"
          ? updater(f.customIngredients || [])
          : updater,
    }));
  const addIngredientRow = () =>
    setCI((arr) => [...arr, { name: "", quantity: 0, unit: "g" }]);
  const removeIngredientRow = (idx) =>
    setCI((arr) => arr.filter((_, i) => i !== idx));
  const updateIngredientField = (idx, field, value) =>
    setCI((arr) =>
      arr.map((it, i) => (i === idx ? { ...it, [field]: value } : it))
    );

  // donut data (ยังไม่ได้ใช้)
  const ringData = useMemo(
    () => [
      { name: "Protein", value: Number(nutrition.protein || 0) },
      { name: "Carbs", value: Number(nutrition.carbs || 0) },
      { name: "Fat", value: Number(nutrition.fat || 0) },
    ],
    [nutrition]
  );

  const fmtG = (n) =>
    `${Number(n || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 })} g`;

  const todayMacros = useMemo(() => {
    if (!Array.isArray(macro7d) || macro7d.length === 0)
      return { protein: 0, carbs: 0, fat: 0 };
    return macro7d[macro7d.length - 1];
  }, [macro7d]);

  return (
    <div className="h-full min-w-0 flex flex-col overflow-x-hidden">
      <div className="bg-white shrink-0">
        <div className="flex flex-col gap-4 px-5 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-cocoPro text-[18px] lg:text-[20px] text-[#2C2C2B]">
                My Nutrition
              </h1>
              <h2 className="font-cocoPro text-[13px] lg:text-[15px] text-[#9F9F9F]">
                View your nutrition history
              </h2>
            </div>
          </div>

          {/* กราฟย้อนหลัง 7 วัน */}
          <div className="mt-2">
            <div className="poppins-semibold mb-2 text-[13px] text-[#6F6A5B]">
              Macros — last 7 days
            </div>
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={macro7d}
                  margin={{ top: 6, right: 6, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={GRID}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    interval={0}
                    tick={{ fontSize: 12, fill: AXIS }}
                    minTickGap={0}
                    tickMargin={8}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => v.toLocaleString("th-TH")}
                    tick={{ fontSize: 12, fill: AXIS }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                    allowDecimals={false}
                    domain={[0, (dataMax) => Math.max(10, dataMax + 10)]}
                  />
                  <ReTooltip
                    formatter={(val, name) => [
                      `${Number(val).toLocaleString("th-TH")} g`,
                      name,
                    ]}
                    labelFormatter={(l) => `Date ${l}`}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar
                    dataKey="protein"
                    stackId="macro"
                    fill={MACRO_COLORS.protein}
                    shape={(props) => (
                      <Rectangle
                        {...props}
                        radius={getBarRadius(props.payload, "protein")}
                      />
                    )}
                  />
                  <Bar
                    dataKey="carbs"
                    stackId="macro"
                    fill={MACRO_COLORS.carbs}
                    shape={(props) => (
                      <Rectangle
                        {...props}
                        radius={getBarRadius(props.payload, "carbs")}
                      />
                    )}
                  />
                  <Bar
                    dataKey="fat"
                    stackId="macro"
                    fill={MACRO_COLORS.fat}
                    shape={(props) => (
                      <Rectangle
                        {...props}
                        radius={getBarRadius(props.payload, "fat")}
                      />
                    )}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-[#6F6A5B]">
              <span className="inline-flex items-center gap-2">
                <i
                  className="inline-block w-3 h-3 rounded"
                  style={{ background: MACRO_COLORS.carbs }}
                />
                <span>Carbs</span>
                <span
                  className="font-semibold"
                  style={{ color: MACRO_COLORS.carbs }}
                >
                  {fmtG(todayMacros.carbs)}
                </span>
              </span>
              <span className="inline-flex items-center gap-2">
                <i
                  className="inline-block w-3 h-3 rounded"
                  style={{ background: MACRO_COLORS.fat }}
                />
                <span>Fat</span>
                <span
                  className="font-semibold"
                  style={{ color: MACRO_COLORS.fat }}
                >
                  {fmtG(todayMacros.fat)}
                </span>
              </span>
              <span className="inline-flex items-center gap-2">
                <i
                  className="inline-block w-3 h-3 rounded"
                  style={{ background: MACRO_COLORS.protein }}
                />
                <span>Protein</span>
                <span
                  className="font-semibold"
                  style={{ color: MACRO_COLORS.protein }}
                >
                  {fmtG(todayMacros.protein)}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Food Daily */}
      <div className="bg-[#E9E9E9] flex-1 min-h-0 overflow-y-auto">
        <div className="flex items-center justify-between px-6 lg:px-10 py-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center text-white bg-[#2C2C2C] rounded-full w-10 h-10">
              <IoBookmark size={18} />
            </div>
            <div className="poppins-semibold">
              <div className="text-lg lg:text-xl">Food Daily</div>
              <div className="text-[#9F9F9F] text-[12px]">
                {`Date: ${getTodayYMD()}`}
              </div>
            </div>
          </div>
          <div
            className="text-[#9F9F9F] text-[13px] lg:text-[14px] cursor-pointer hover:underline"
            onClick={openList}
          >
            See All
          </div>
        </div>

        <div className="px-6 lg:px-7 py-3 h-full">
          {todayMeals.length === 0 ? (
            <div className="py-10 px-6 text-center text-md md:text-md text-[#626262]">
              No meals for today.
            </div>
          ) : (
            <div className="space-y-4">
              {todayMeals.map((meal) => (
                <div
                  key={meal.id}
                  className="bg-[#F4F4F4] w-full rounded-xl py-5 px-6"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <div className="text-base lg:text-md poppins-semibold truncate">
                        {meal.displayName ?? meal.custom_food_name ?? meal.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center justify-center bg-[#2C2C2C] w-[17px] h-[17px] rounded-full">
                          <BsFire className="text-white" size={10} />
                        </div>
                        <div className="text-[11px] poppins-semibold">
                          {meal.calories} Cal
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        className="flex items-center gap-1 text-xs px-3 py-1 rounded-full border border-[#A9A9A9] hover:bg-black hover:text-white transition"
                        onClick={() => openEdit(meal)}
                      >
                        <FaRegEdit size={12} /> Edit
                      </button>
                      <button
                        className="flex items-center gap-1 text-xs px-3 py-1 rounded-full border border-[#A9A9A9] hover:bg-black hover:text-white transition"
                        onClick={() => deleteMeal(meal.id)}
                      >
                        <MdDeleteOutline size={13} /> Delete
                      </button>
                    </div>
                  </div>

                  {meal.notes && (
                    <p className="text-[11px] md:text-[12px] Fahkwang py-4 line-clamp-3 md:line-clamp-2">
                      {meal.notes}
                    </p>
                  )}

                  {Array.isArray(meal.customIngredients) &&
                    meal.customIngredients.length > 0 && (
                      <div className="mt-2">
                        <div className="text-[12px] font-semibold mb-2">
                          Ingredients
                        </div>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[12px] text-[#444]">
                          {meal.customIngredients.map((it, i) => (
                            <li key={i}>
                              • {it.name} — {it.quantity ?? 0} {it.unit ?? "-"}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  <div className="flex items-start gap-2 justify-start pt-5">
                    <div className="flex items-center gap-1 border-r border-r-[#A9A9A9] pr-2">
                      <span className="font-bold text-[12px]">Protein</span>
                      <span className="font-bold text-[11px] text-[#626262]">
                        {meal.protein}g
                      </span>
                    </div>
                    <div className="flex items-center gap-2 border-r border-r-[#A9A9A9] pr-3">
                      <span className="font-bold text-[12px]">Carbs</span>
                      <span className="font-bold text-[11px] text-[#626262]">
                        {meal.carbs}g
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[12px]">Fat</span>
                      <span className="font-bold text-[11px] text-[#626262]">
                        {meal.fat}g
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== Modal: All Saved Meals + Edit form ===== */}
      {isListOpen && (
        <div className="fixed inset-0 z-[200] flex items-end lg:items-center justify-center">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeList}
          />

          {/* drawer/modal */}
          <div
            className="
              relative bg-white w-full lg:w-[720px] lg:rounded-2xl
              max-h-[85vh] overflow-visible
              rounded-t-2xl p-4 lg:p-6
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b">
              <div className="flex items-center gap-2">
                {isEditing && (
                  <button
                    className="text-sm px-3 py-1 rounded-full border hover:bg-black hover:text-white"
                    onClick={() => {
                      setIsEditing(false);
                      setEditTarget(null);
                    }}
                    title="Back to list"
                  >
                    ← Back
                  </button>
                )}
                <h3 className="text-lg lg:text-xl font-semibold">
                  {isEditing ? "Edit Meal" : "All Saved Meals"}
                </h3>
              </div>
              <button className="px-3 py-1 cursor-pointer" onClick={closeList}>
                <IoCloseCircle size={25} />
              </button>
            </div>

            {/* Body */}
            <div className="mt-3 overflow-y-auto" style={{ maxHeight: "65vh" }}>
              {!isEditing ? (
                // ===== LIST VIEW =====
                <>
                  {allMeals.length === 0 ? (
                    <div className="py-10 text-center text-sm text-[#666]">
                      ยังไม่มีประวัติการกิน
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {allMeals.map((m) => (
                        <li key={m.id} className="py-3 flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium truncate max-w-[55vw] lg:max-w-[420px]">
                                  {m.displayName ??
                                    m.custom_food_name ??
                                    m.name}
                                </p>
                                <span className="text-xs text-[#777]">
                                  {m.calories} Cal · P{m.protein} C{m.carbs} F
                                  {m.fat}
                                </span>
                              </div>
                              <p className="text-xs pt-2 text-[#999] line-clamp-2">
                                {m.notes}
                              </p>
                              {getItemDateYMD(m) && (
                                <p className="text-[11px] pt-1 text-[#5c5c5c]">
                                  {displayDate(
                                    m.consumedAt ?? m.consumed_at ?? m.date
                                  )}
                                </p>
                              )}
                            </div>

                            <div className="shrink-0 flex items-center gap-2">
                              <button
                                className="text-xs px-3 py-1 rounded-full border hover:bg-black hover:text-white cursor-pointer"
                                onClick={() => setAsLatest(m.id)}
                                title="Set as latest"
                              >
                                Use
                              </button>
                              <button
                                className="text-xs px-3 py-1 rounded-full border hover:bg-black hover:text-white cursor-pointer"
                                onClick={() => openEditFromList(m)} // ✅ เปิดฟอร์มในโมดัล
                                title="Edit this meal"
                              >
                                Edit
                              </button>
                              <button
                                className="text-xs px-3 py-1 rounded-full border hover:bg-black hover:text-white cursor-pointer"
                                onClick={() => deleteMeal(m.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          {/* วัตถุดิบทั้งหมดของมื้อนั้น */}
                          {Array.isArray(m.customIngredients) &&
                            m.customIngredients.length > 0 && (
                              <div className="bg-[#fafafa] border border-neutral-200 rounded-lg px-3 py-2">
                                <div className="text-[12px] font-semibold mb-1">
                                  Ingredients
                                </div>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[12px] text-[#444]">
                                  {m.customIngredients.map((it, i) => (
                                    <li key={i}>
                                      • {it.name} — {it.quantity ?? 0}{" "}
                                      {it.unit ?? "-"}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                // ===== EDIT VIEW (ฟอร์มย้ายมาอยู่ที่นี่) =====
                <div className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="text-sm">
                      <span className="block mb-1">Food name</span>
                      <input
                        className="w-full border rounded-md px-3 py-2 outline-none"
                        value={form.name}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, name: e.target.value }))
                        }
                      />
                    </label>
                    <label className="text-sm">
                      <span className="block mb-1">Calories (Cal)</span>
                      <input
                        type="number"
                        className="w-full border rounded-md px-3 py-2 outline-none"
                        value={form.calories}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, calories: e.target.value }))
                        }
                      />
                    </label>
                    <label className="text-sm">
                      <span className="block mb-1">Protein (g)</span>
                      <input
                        type="number"
                        className="w-full border rounded-md px-3 py-2 outline-none"
                        value={form.protein}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, protein: e.target.value }))
                        }
                      />
                    </label>
                    <label className="text-sm">
                      <span className="block mb-1">Carbs (g)</span>
                      <input
                        type="number"
                        className="w-full border rounded-md px-3 py-2 outline-none"
                        value={form.carbs}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, carbs: e.target.value }))
                        }
                      />
                    </label>
                    <label className="text-sm">
                      <span className="block mb-1">Fat (g)</span>
                      <input
                        type="number"
                        className="w-full border rounded-md px-3 py-2 outline-none"
                        value={form.fat}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, fat: e.target.value }))
                        }
                      />
                    </label>
                    <label className="text-sm">
                      <span className="block mb-1">Date</span>
                      <input
                        type="date"
                        className="w-full border rounded-md px-3 py-2 outline-none"
                        value={form.consumedAt}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            consumedAt: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="text-sm md:col-span-2">
                      <span className="block mb-1">Dietary notes</span>
                      <textarea
                        rows={3}
                        className="w-full border rounded-md px-3 py-2 outline-none"
                        value={form.notes}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, notes: e.target.value }))
                        }
                      />
                    </label>
                  </div>

                  {/* Ingredients editor */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[14px] font-semibold">Ingredients</h4>
                      <button
                        className="text-xs px-3 py-1 rounded-full border hover:bg-black hover:text-white cursor-pointer transition"
                        onClick={addIngredientRow}
                      >
                        + Add ingredient
                      </button>
                    </div>

                    {form.customIngredients.length === 0 ? (
                      <div className="text-[12px] text-[#777]">
                        No ingredients in this item yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {form.customIngredients.map((it, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-12 gap-1 items-center bg-white/70 border border-neutral-200 rounded-xl p-1 overflow-visible"
                          >
                            {/* Name + Suggestion */}
                            <div className="relative col-span-12 sm:col-span-5 min-w-0">
                              <input
                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
                                placeholder="ชื่อวัตถุดิบ"
                                value={it.name ?? ""}
                                onChange={async (e) => {
                                  const val = e.target.value;
                                  updateIngredientField(idx, "name", val);
                                  setActiveSugguestIndex(idx);
                                  setSuggustions(await fetchIngredient(val));
                                }}
                                onFocus={() => setActiveSugguestIndex(idx)}
                                onBlur={() =>
                                  setTimeout(
                                    () => setActiveSugguestIndex(null),
                                    200
                                  )
                                }
                              />
                              {activeSugguestIndex === idx && (
                                <div className="absolute left-0 top-full mt-1 w-full z-50 bg-white border rounded-lg shadow max-h-48 overflow-auto">
                                  {suggustions.length > 0 ? (
                                    suggustions.map((s, i) => (
                                      <button
                                        key={s.id || i}
                                        type="button"
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-black hover:text-white"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                          updateIngredientField(
                                            idx,
                                            "id",
                                            s.id || ""
                                          );
                                          updateIngredientField(
                                            idx,
                                            "name",
                                            s.name || ""
                                          );
                                          if (s.nutrition) {
                                            const per =
                                              s.nutrition.per100g ||
                                              s.nutrition;
                                            updateIngredientField(
                                              idx,
                                              "calories_100g",
                                              per.calories ??
                                                per.calories_100g ??
                                                0
                                            );
                                            updateIngredientField(
                                              idx,
                                              "protein_100g",
                                              per.protein ??
                                                per.protein_100g ??
                                                0
                                            );
                                            updateIngredientField(
                                              idx,
                                              "carbs_100g",
                                              per.carbs ??
                                                per.carbs_100g ??
                                                per.carbohydrates ??
                                                0
                                            );
                                            updateIngredientField(
                                              idx,
                                              "fat_100g",
                                              per.fat ?? per.fat_100g ?? 0
                                            );
                                          }
                                          setSuggustions([]);
                                          setActiveSugguestIndex(null);
                                        }}
                                      >
                                        {s.name}
                                      </button>
                                    ))
                                  ) : (
                                    <div className="px-3 py-2 text-sm text-neutral-500">
                                      ไม่พบผลลัพธ์
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Qty */}
                            <input
                              type="number"
                              className="col-span-6 sm:col-span-3 min-w-0 w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="ปริมาณ"
                              value={it.quantity ?? ""}
                              onChange={(e) =>
                                updateIngredientField(
                                  idx,
                                  "quantity",
                                  e.target.value
                                )
                              }
                            />

                            {/* Unit */}
                            <select
                              className="col-span-4 sm:col-span-2 w-full border border-neutral-300 rounded-lg py-2 outline-none focus:ring-2 focus:ring-black/10"
                              value={it.unit ?? "g"}
                              onChange={(e) =>
                                updateIngredientField(
                                  idx,
                                  "unit",
                                  e.target.value
                                )
                              }
                            >
                              <option value="g">g</option>
                              <option value="ml">ml</option>
                            </select>

                            <div className="col-span-2 sm:col-span-2 flex justify-end">
                              <button
                                className="text-xs px-3 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-black hover:text-white transition"
                                onClick={() => removeIngredientRow(idx)}
                                title="Remove ingredient"
                              >
                                <MdDelete />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      className="px-4 py-2 rounded-full border border-[#A9A9A9] hover:bg-black hover:text-white transition"
                      onClick={() => {
                        setIsEditing(false);
                        setEditTarget(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 rounded-full border border-[#A9A9A9] hover:bg-black hover:text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                      onClick={saveEdit}
                      disabled={isSaving}
                      aria-busy={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Saving overlay */}
      {isSaving && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          role="alert"
          aria-live="assertive"
        >
          <div className="bg-white rounded-2xl px-6 py-5 shadow-xl flex items-center gap-3">
            <span className="inline-block w-5 h-5 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
            <div className="text-sm font-medium text-gray-700">Saving...</div>
          </div>
        </div>
      )}
    </div>
  );
};
