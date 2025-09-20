// src/Components/Aside.js
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

// ⬇️ ใช้คอมโพเนนต์ Autocomplete
import { IngredientAutocomplete } from "../Ingredients/IngredientAutocomplete";

/* ===== Colors (โทนเดียวกับทั้งหน้า) ===== */
const RING_COLORS = ["#606B43", "#909C6F", "#414B26"];
const MACRO_COLORS = { protein: "#606B43", carbs: "#909C6F", fat: "#414B26" };
const GRID = "#E7E3D8";
const AXIS = "#6F6A5B";

/* ---------- Normalize helpers ---------- */
const normalizeMeal = (m, i) => ({
  ...m,
  id: m?.id ?? m?.foodId ?? String(i),
  name: m?.name ?? "Unknown food",
  calories: Number(m?.calories ?? m?.nutrition?.calories) || 0,
  protein: Number(m?.protein ?? m?.nutrition?.protein) || 0,
  carbs: Number(m?.carbs ?? m?.nutrition?.carbs ?? m?.nutrition?.carbohydrates) || 0,
  fat: Number(m?.fat ?? m?.nutrition?.fat) || 0,
  notes: m?.notes ?? "",
  consumedAt: m?.consumedAt ?? m?.consumed_at ?? m?.date ?? null,
  customIngredients: Array.isArray(m?.customIngredients) ? m.customIngredients : [],
});

const getBarRadius = (payload, key) => {
  const protein = Number(payload.protein || 0);
  const carbs = Number(payload.carbs || 0);
  const fat = Number(payload.fat || 0);
  const topKey = fat > 0 ? "fat" : carbs > 0 ? "carbs" : protein > 0 ? "protein" : null;
  return key === topKey ? [8, 8, 0, 0] : [0, 0, 0, 0];
};

/* ---------- Date helpers ---------- */
const toYMD = (v) => {
  if (v == null) return null;
  if (typeof v === "number") {
    const ms = v < 1e12 ? v * 1000 : v;
    const d = new Date(ms);
    return isNaN(d) ? null : d.toISOString().slice(0, 10);
  }
  if (typeof v === "string") {
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

const getItemDateYMD = (m) => {
  const v = m?.consumedAt ?? m?.consumed_at ?? m?.date ?? null;
  return toYMD(v);
};

export const Aside = () => {
  const [nutrition, setNutrition] = useState({ protein: 0, fat: 0, carbs: 0 });
  const [latest, setLatest] = useState(null);

  const [isListOpen, setIsListOpen] = useState(false);
  const [allMeals, setAllMeals] = useState([]);

  // ข้อมูลกราฟย้อนหลัง 7 วัน
  const [macro7d, setMacro7d] = useState([]);

  /* ---------- Compute 7d macros ---------- */
  const computeMacro7d = useCallback((list = []) => {
    const today = new Date();
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const key = toYMD(d);
      const label = d.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit" });
      const inDay = list.filter((m) => getItemDateYMD(m) === key);
      const protein = inDay.reduce((s, m) => s + Number(m.protein || 0), 0);
      const carbs = inDay.reduce((s, m) => s + Number(m.carbs || 0), 0);
      const fat = inDay.reduce((s, m) => s + Number(m.fat || 0), 0);
      out.push({ date: label, protein, carbs, fat });
    }
    setMacro7d(out);
  }, []);

  /* ---------- Single source of truth for fetching lists ---------- */
  const fetchNormalized = useCallback(async () => {
    const raw = await fetchLast7Days();
    return (Array.isArray(raw) ? raw : []).map(normalizeMeal);
  }, []);

  const loadAndRender = useCallback(async () => {
    let list = await fetchNormalized();
    if (list.length === 0) list = readLocalHistory().map(normalizeMeal);
    list.sort((a, b) => new Date(b.consumedAt) - new Date(a.consumedAt));
    setLatest(list[0] || null);
    computeMacro7d(list);
    return list;
  }, [fetchNormalized, computeMacro7d]);

  /* ---------- Mount: load goal + history ---------- */
  useEffect(() => {
    (async () => {
      try {
        const resData = await nutritionGoal();
        setNutrition(resData.macronutrients);
      } catch {}
      await loadAndRender();

      const onUpdated = async () => {
        const list = await loadAndRender();
        setAllMeals(list);
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
    const data = await fetchNormalized();
    setAllMeals(data);
    await loadAndRender();
  };

  const setAsLatest = (id) => {
    const picked = allMeals.find((m) => m.id === id);
    if (picked) setLatest(picked);
    setIsListOpen(false);
  };

  /* ---------- Edit form ---------- */
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
  });

  // state ของ quick add
  const [quickName, setQuickName] = useState("");

  const openEdit = () => {
    if (!latest) return;
    setForm({
      name: latest.name ?? "",
      calories: latest.calories ?? "",
      protein: latest.protein ?? "",
      carbs: latest.carbs ?? "",
      fat: latest.fat ?? "",
      notes: latest.notes ?? "",
      customIngredients: Array.isArray(latest.customIngredients) ? latest.customIngredients : [],
      id: latest.id,
    });
    setIsEditing(true);
  };

  const saveEdit = async () => {
    if (!latest) return;

    const cleanedIngredients = (form.customIngredients || [])
      .map((it) => ({
        id: String(it.id ?? "").trim(),
        name: String(it.name ?? "").trim(),
        quantity: Number(it.quantity) || 0,
        unit: (it.unit || "กรัม").trim(),
      }))
      .filter((it) => it.name.length > 0);

    const patch = {
      id: (form.id || "").trim(),
      name: (form.name || "").trim(),
      notes: (form.notes || "").trim(),
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
      customIngredients: cleanedIngredients,
      consumedAt: latest?.consumedAt ?? latest?.consumed_at ?? latest?.date ?? null,
      consumed_at: latest?.consumedAt ?? latest?.consumed_at ?? latest?.date ?? null,
    };

    await updateEatingHistory(patch);
    const list = await loadAndRender();
    setAllMeals(list);
    setIsEditing(false);
  };

  const deleteLatest = async () => {
    if (!latest) return;
    if (!confirm("Delete this item?")) return;
    await deleteEatingHistory(latest.id);
    const list = await loadAndRender();
    setAllMeals(list);
  };

  // ---------- helpers ของ customIngredients ----------
  const setCI = (updater) =>
    setForm((f) => ({
      ...f,
      customIngredients:
        typeof updater === "function" ? updater(f.customIngredients || []) : updater,
    }));
  const addIngredientRow = () => setCI((arr) => [...arr, { name: "", quantity: 0, unit: "กรัม" }]);
  const removeIngredientRow = (idx) => setCI((arr) => arr.filter((_, i) => i !== idx));
  const updateIngredientField = (idx, field, value) =>
    setCI((arr) => arr.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));

  // donut data (เอาจาก goal)
  const ringData = useMemo(
    () => [
      { name: "Protein", value: Number(nutrition.protein || 0) },
      { name: "Carbs", value: Number(nutrition.carbs || 0) },
      { name: "Fat", value: Number(nutrition.fat || 0) },
    ],
    [nutrition]
  );

  const fmtG = (n) => `${Number(n || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 })} g`;

  const todayMacros = useMemo(() => {
    if (!Array.isArray(macro7d) || macro7d.length === 0) return { protein: 0, carbs: 0, fat: 0 };
    return macro7d[macro7d.length - 1];
  }, [macro7d]);

  return (
    <div className="h-full min-w-0 flex flex-col overflow-x-hidden">
      <div className="bg-white shrink-0">
        <div className="flex flex-col gap-4 px-5 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-cocoPro text-[18px] lg:text-[20px] text-[#2C2C2B]">My Nutrition</h1>
              <h2 className="font-cocoPro text-[13px] lg:text-[15px] text-[#9F9F9F]">View your nutrition history</h2>
            </div>
          </div>

          {/* กราฟย้อนหลัง 7 วัน */}
          <div className="mt-2">
            <div className="poppins-semibold mb-2 text-[13px] text-[#6F6A5B]">Macros — last 7 days</div>
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={macro7d} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                  <XAxis dataKey="date" interval={0} tick={{ fontSize: 12, fill: AXIS }} minTickGap={0} tickMargin={8} axisLine={false} tickLine={false} />
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
                    formatter={(val, name) => [`${Number(val).toLocaleString("th-TH")} g`, name]}
                    labelFormatter={(l) => `Date ${l}`}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="protein" stackId="macro" fill={MACRO_COLORS.protein}
                    shape={(props) => <Rectangle {...props} radius={getBarRadius(props.payload, "protein")} />}
                  />
                  <Bar dataKey="carbs" stackId="macro" fill={MACRO_COLORS.carbs}
                    shape={(props) => <Rectangle {...props} radius={getBarRadius(props.payload, "carbs")} />}
                  />
                  <Bar dataKey="fat" stackId="macro" fill={MACRO_COLORS.fat}
                    shape={(props) => <Rectangle {...props} radius={getBarRadius(props.payload, "fat")} />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend เล็กๆ */}
            <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-[#6F6A5B]">
              <span className="inline-flex items-center gap-2">
                <i className="inline-block w-3 h-3 rounded" style={{ background: MACRO_COLORS.carbs }} />
                <span>Carbs</span>
                <span className="font-semibold" style={{ color: MACRO_COLORS.carbs }}>{fmtG(todayMacros.carbs)}</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <i className="inline-block w-3 h-3 rounded" style={{ background: MACRO_COLORS.fat }} />
                <span>Fat</span>
                <span className="font-semibold" style={{ color: MACRO_COLORS.fat }}>{fmtG(todayMacros.fat)}</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <i className="inline-block w-3 h-3 rounded" style={{ background: MACRO_COLORS.protein }} />
                <span>Protein</span>
                <span className="font-semibold" style={{ color: MACRO_COLORS.protein }}>{fmtG(todayMacros.protein)}</span>
              </span>
            </div>
          </div>
          {/* ——— จบส่วนกราฟ 7 วัน ——— */}
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
              <div className="text-[#9F9F9F] text-[12px]">Lack of physical activity</div>
            </div>
          </div>
          <div className="text-[#9F9F9F] text-[13px] lg:text-[14px] cursor-pointer hover:underline" onClick={openList}>
            See All
          </div>
        </div>

        <div className="px-6 lg:px-7 py-3 h-full">
          {!latest ? (
            <div className="py-10 px-6 text-center text-sm md:text-md text-[#626262]">
              It looks like you don’t have any eating history yet. Try saving one from the Upload page.
            </div>
          ) : (
            <div className="bg-[#F4F4F4] w-full rounded-xl py-5 px-6 overflow-y-auto">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <div className="text-base lg:text-md poppins-semibold truncate">{latest.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center justify-center bg-[#2C2C2C] w-[17px] h-[17px] rounded-full">
                      <BsFire className="text-white" size={10} />
                    </div>
                    <div className="text-[11px] poppins-semibold">{latest.calories} Cal</div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="flex items-center gap-1 text-xs px-3 py-1 rounded-full border border-[#A9A9A9] hover:bg-black hover:text-white transition" onClick={openEdit}>
                    <FaRegEdit size={12} /> Edit
                  </button>
                  <button className="flex items-center gap-1 text-xs px-3 py-1 rounded-full border border-[#A9A9A9] hover:bg-black hover:text-white transition" onClick={deleteLatest}>
                    <MdDeleteOutline size={13} /> Delete
                  </button>
                </div>
              </div>

              {/* notes */}
              <p className="text-[11px] md:text-[12px] Fahkwang py-4 line-clamp-3 md:line-clamp-2">{latest.notes}</p>

              {/* PREVIEW Ingredients */}
              {Array.isArray(latest.customIngredients) && latest.customIngredients.length > 0 && (
                <div className="mt-2">
                  <div className="text-[12px] font-semibold mb-2">Ingredients</div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[12px] text-[#444]">
                    {latest.customIngredients.slice(0, 6).map((it, i) => (
                      <li key={i}>• {it.name} — {it.quantity ?? 0} {it.unit ?? "-"}</li>
                    ))}
                  </ul>
                  {latest.customIngredients.length > 6 && (
                    <div className="text-[11px] text-[#777] mt-1">+{latest.customIngredients.length - 6} more</div>
                  )}
                </div>
              )}

              {/* แถวเดิม: Protein | Carbs | Fat */}
              <div className="flex items-start gap-2 justify-start pt-5">
                <div className="flex items-center gap-1 border-r border-r-[#A9A9A9] pr-2">
                  <span className="font-bold text-[12px]">Protein</span>
                  <span className="font-bold text-[11px] text-[#626262]">{latest.protein}g</span>
                </div>
                <div className="flex items-center gap-2 border-r border-r-[#A9A9A9] pr-3">
                  <span className="font-bold text-[12px]">Carbs</span>
                  <span className="font-bold text-[11px] text-[#626262]">{latest.carbs}g</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[12px]">Fat</span>
                  <span className="font-bold text-[11px] text-[#626262]">{latest.fat}g</span>
                </div>
              </div>

              {/* Modal แก้ไข + Ingredients */}
              {isEditing && (
                <div className="mt-5 border border-[#A9A9A9] rounded-xl p-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="text-sm">
                      <span className="block mb-1">Food name</span>
                      <input
                        className="w-full border rounded-md px-3 py-2 outline-none"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </label>
                    <label className="text-sm">
                      <span className="block mb-1">Calories (Cal)</span>
                      <input
                        type="number"
                        className="w-full border rounded-md px-3 py-2 outline-none"
                        value={form.calories}
                        onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))}
                      />
                    </label>
                    <label className="text-sm">
                      <span className="block mb-1">Protein (g)</span>
                      <input
                        type="number"
                        className="w-full border rounded-md px-3 py-2 outline-none"
                        value={form.protein}
                        onChange={(e) => setForm((f) => ({ ...f, protein: e.target.value }))}
                      />
                    </label>
                    <label className="text-sm">
                      <span className="block mb-1">Carbs (g)</span>
                      <input
                        type="number"
                        className="w-full border rounded-md px-3 py-2 outline-none"
                        value={form.carbs}
                        onChange={(e) => setForm((f) => ({ ...f, carbs: e.target.value }))}
                      />
                    </label>
                    <label className="text-sm">
                      <span className="block mb-1">Fat (g)</span>
                      <input
                        type="number"
                        className="w-full border rounded-md px-3 py-2 outline-none"
                        value={form.fat}
                        onChange={(e) => setForm((f) => ({ ...f, fat: e.target.value }))}
                      />
                    </label>
                    <label className="text-sm md:col-span-2">
                      <span className="block mb-1">Dietary notes</span>
                      <textarea
                        rows={3}
                        className="w-full border rounded-md px-3 py-2 outline-none"
                        value={form.notes}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      />
                    </label>
                  </div>

                  {/* Ingredients */}
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

                    {/* QUICK ADD อยู่เหนือรายการ */}
                    <div className="mb-3">
                      <IngredientAutocomplete
                        value={quickName}
                        onChange={setQuickName}
                        onPick={({ name, unit }) => {
                          setCI((arr) => [...arr, { name, quantity: 0, unit: unit || "กรัม" }]);
                          setQuickName("");
                        }}
                        placeholder="ค้นหาวัตถุดิบแล้วกดเลือกเพื่อเพิ่ม…"
                        debounceMs={200}
                      />
                    </div>

                    {form.customIngredients.length === 0 ? (
                      <div className="text-[12px] text-[#777]">No ingredients in this item yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {form.customIngredients.map((it, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-12 gap-2 items-center bg-white/70 border border-neutral-200 rounded-xl p-2 overflow-visible"
                          >
                            {/* Name → Autocomplete */}
                            <div className="col-span-12 sm:col-span-5">
                              <IngredientAutocomplete
                                value={it.name || ""}
                                onChange={(v) => updateIngredientField(idx, "name", v)}
                                onPick={({ name, unit }) => {
                                  updateIngredientField(idx, "name", name);
                                  if (unit && !it.unit) updateIngredientField(idx, "unit", unit);
                                }}
                                placeholder="พิมพ์ค้นหาวัตถุดิบ…"
                                debounceMs={200}
                              />
                            </div>

                            {/* Qty */}
                            <input
                              type="number"
                              className="col-span-6 sm:col-span-3 min-w-0 w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="ปริมาณ"
                              value={it.quantity ?? ""}
                              onChange={(e) => updateIngredientField(idx, "quantity", e.target.value)}
                            />

                            {/* Unit */}
                            <input
                              className="col-span-4 sm:col-span-2 min-w-0 w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
                              placeholder="หน่วย"
                              list="unit-list"
                              value={it.unit ?? "กรัม"}
                              onChange={(e) => updateIngredientField(idx, "unit", e.target.value)}
                            />

                            {/* Remove */}
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

                        <datalist id="unit-list">
                          <option value="กรัม" />
                          <option value="มิลลิลิตร" />
                          <option value="ช้อนชา" />
                          <option value="ช้อนโต๊ะ" />
                          <option value="ชิ้น" />
                        </datalist>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      className="px-4 py-2 rounded-full border border-[#A9A9A9] hover:bg-black hover:text-white transition"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 rounded-full border border-[#A9A9A9] hover:bg-black hover:text-white transition"
                      onClick={saveEdit}
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isListOpen && (
        <div className="fixed inset-0 z-[200] flex items-end lg:items-center justify-center">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={closeList} />

          {/* drawer/modal */}
          <div
            className="
              relative bg-white w-full lg:w-[720px] lg:rounded-2xl
              max-h-[85vh] overflow-visible
              rounded-t-2xl p-4 lg:p-6
            "
          >
            <div className="flex items-center justify-between gap-3 pb-3 border-b">
              <h3 className="text-lg lg:text-xl font-semibold">All Saved Meals</h3>
              <button className="px-3 py-1 cursor-pointer" onClick={closeList}>
                <IoCloseCircle size={25} />
              </button>
            </div>

            <div className="mt-3 overflow-y-auto" style={{ maxHeight: "65vh" }}>
              {allMeals.length === 0 ? (
                <div className="py-10 text-center text-sm text-[#666]">ยังไม่มีประวัติการกิน</div>
              ) : (
                <ul className="divide-y">
                  {allMeals.map((m) => (
                    <li key={m.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate max-w-[55vw] lg:max-w-[420px]">{m.name}</p>
                          <span className="text-xs text-[#777]">{m.calories} Cal · P{m.protein} C{m.carbs} F{m.fat}</span>
                        </div>
                        <p className="text-xs pt-3 text-[#999] mt-1 line-clamp-2">{m.notes}</p>
                        {getItemDateYMD(m) && (
                          <p className="text-[11px] pt-1 text-[#5c5c5c] mt-1">
                            {new Date(m.consumedAt ?? m.consumed_at ?? m.date).toLocaleString()}
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
                          onClick={() => deleteMeal(m.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
