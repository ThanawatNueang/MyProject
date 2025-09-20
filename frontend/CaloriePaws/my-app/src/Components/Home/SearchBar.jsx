// components/FoodSearchBar.jsx
import { useRef, useState } from "react";
import { IoSearch } from "react-icons/io5";
import { suggestFoods, getFoodByName } from "../API/search";
import { BsFire } from "react-icons/bs";
import { TbMeat, TbBread, TbDroplet } from "react-icons/tb";

export const SearchBar = ({ beforeText, defaultQuery = "", onResults }) => {
  const [q, setQ] = useState(defaultQuery);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState([]);
  const [food, setFood] = useState(null);

  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  // refs สำหรับวัดพื้นที่
  const formWrapRef = useRef(null);
  const [dropUp, setDropUp] = useState(false);

  // highlight คำค้น
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const highlight = (text, query) => {
    if (!query) return text;
    const parts = String(text).split(new RegExp(`(${esc(query)})`, "gi"));
    return parts.map((p, i) =>
      p.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="rounded px-0.5 bg-amber-100 text-amber-900">
          {p}
        </mark>
      ) : (
        <span key={i}>{p}</span>
      )
    );
  };

  const fetchSuggest = async (keyword) => {
    const kw = keyword.trim();
    if (!kw) {
      setResult([]);
      onResults?.([]);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setErr("");
    try {
      const data = await suggestFoods(kw, { signal: controller.signal });
      const list = Array.isArray(data) ? data : [];
      setResult(list);
      onResults?.(list);
      // คำนวณว่าจะเด้งขึ้นไหม (ถ้าพื้นที่ล่างไม่พอ)
      requestAnimationFrame(() => {
        const rect = formWrapRef.current?.getBoundingClientRect();
        if (!rect) return;
        const estimated = list.length * 48 + 16; // ประมาณความสูงรายการทั้งหมด
        const spaceBelow = window.innerHeight - rect.bottom - 24;
        setDropUp(spaceBelow < estimated);
      });
    } catch (e) {
      if (e.name !== "AbortError") {
        setErr("เกิดข้อผิดพลาดระหว่างค้นหา");
        setResult([]);
        onResults?.([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePick = async (name) => {
    setQ(name);
    setResult([]);
    setLoading(true);
    setErr("");
    try {
      const data = await getFoodByName(name);
      setFood(data);
      onResults?.(data);
    } catch {
      setErr("โหลดรายละเอียดเมนูไม่สำเร็จ");
      setFood(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    // ยกเลิก request เดิม (ถ้ามี)
    if (abortRef.current) abortRef.current.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    setQ(""); // ล้างข้อความในช่อง
    setResult([]); // ปิด dropdown
    setFood(null); // ล้างการ์ดผลลัพธ์
    setErr(""); // ล้าง error
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // ถ้าไม่อยากมี dropdown ให้เปลี่ยนเป็น: handlePick(q.trim());
    fetchSuggest(q.trim());
  };

  return (
    <div
      id="food-search-section"
      className="container pt-15 lg:pt-40 py-20 scroll-mt-28"
    >
      <div className="text-center pb-8">
        <h1 className="text-2xl sm:text-5xl font-coco pb-5 lg:pb-10">
          {beforeText}
        </h1>
        <p className="font-Ul text-[9px] lg:text-lg pb-6 lg:pb-10 text-[#686868]">
          Search and learn about calories, protein, carbohydrates,
          <br />
          and nutrients in the foods you love.
        </p>
      </div>

      <div className="w-full bg-[#efefef] rounded-[40px] px-4 sm:px-6 py-20">
        {/* wrapper นี้ใช้วัดตำแหน่งเพื่อ flip */}
        <div ref={formWrapRef} className="mx-auto w-full max-w-4xl relative">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-3 bg-white rounded-full pl-6 pr-2 h-14
                       shadow-[0_10px_24px_rgba(0,0,0,0.12)] border-[0.5px] border-[#A7A7A7]"
          >
            <input
              value={q}
              onChange={(e) => {
                const v = e.target.value;
                setQ(v);
                if (debounceRef.current) clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => fetchSuggest(v), 220);
              }}
              placeholder="Search for a dish… e.g., shrimp fried rice, Pad Thai"
              className="w-full bg-transparent outline-none text-[15px] leading-6
                         placeholder:italic placeholder:text-gray-400 font-light"
            />
            <button
              type="button" // << สำคัญ: ไม่ให้ submit form
              onClick={handleClear} // << เรียกฟังก์ชันล้าง
              disabled={loading || q.length === 0}
              className="relative flex items-center gap-2 rounded-full px-5 sm:px-6 py-2.5
             bg-gradient-to-b from-[#d9cd9a] to-[#c9bb86] text-white font-medium
             hover:brightness-105 active:scale-[0.98] transition
             shadow-[0_10px_18px_rgba(201,187,134,0.45)] disabled:opacity-60"
              aria-label="clear"
            >
              <span className="font-Ul text-sm sm:text-base cursor-pointer">
                clear
              </span>
            </button>
          </form>

          {/* Suggestion list: ไม่ใส่ max-h/overflow และ flip ได้ */}
          {result.length > 0 && (
            <ul
              className={`absolute left-0 right-0 ${
                dropUp ? "bottom-[calc(100%+10px)]" : "top-[calc(100%+10px)]"
              } p-2 space-y-1
              bg-white/90 backdrop-blur rounded-2xl
                shadow-[0_12px_30px_rgba(0,0,0,0.12)] z-10`}
              role="listbox"
            >
              {result.map((item) => (
                <li
                  key={item.id}
                  role="option"
                  onClick={() => handlePick(item.name)}
                  className="
                    flex items-center gap-3 p-3
                    rounded-xl bg-white
                    border border-zinc-100
                    shadow-[0_2px_8px_rgba(0,0,0,0.06)]
                    hover:shadow-[0_6px_16px_rgba(0,0,0,0.10)]
                    hover:-translate-y-[1px]
                    active:translate-y-0
                    transition cursor-pointer"
                >
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#f3efe1] text-[#9f8f53] text-sm">
                    🍽
                  </span>
                  <span className="font-Ul">{highlight(item.name, q)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {err && (
          <p className="mx-auto w-full max-w-4xl mt-4 text-red-600 text-sm">
            {err}
          </p>
        )}

        {/* การ์ดผลลัพธ์ */}
        {food && (
          <div className="mx-auto w-full max-w-4xl mt-8 bg-white rounded-3xl border border-zinc-200 shadow-lg p-6">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <h3 className="text-2xl font-semibold">{food.name}</h3>
                {food.serving_size && (
                  <p className="text-sm text-gray-500">{food.serving_size} g</p>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <GoldPillStat
                theme="calories"
                icon={BsFire}
                label="Calories"
                value={`${food?.calculated_nutrition?.calories ?? "-"} kcal`}
              />
              <GoldPillStat
                theme="protein"
                icon={TbMeat}
                label="Protein"
                value={`${food?.calculated_nutrition?.protein ?? "-"} g`}
              />
              <GoldPillStat
                theme="carbs"
                icon={TbBread}
                label="Carbs"
                value={`${food?.calculated_nutrition?.carbohydrates ?? "-"} g`}
              />
              <GoldPillStat
                theme="fat"
                icon={TbDroplet}
                label="Fat"
                value={`${food?.calculated_nutrition?.fat ?? "-"} g`}
              />
            </div>

            {Array.isArray(food.ingredients) && food.ingredients.length > 0 && (
              <IngredientsGrid items={food.ingredients} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ======= Ingredients (การ์ดแถว + pill โทนทองอ่อน) =======
function IngredientsGrid({ items = [] }) {
  if (!items.length) return null;
  return (
    <section className="mt-8">
      <h4 className="text-xl font-semibold mb-4">Ingredients</h4>

      {/* 1 คอลัมน์บนมือถือ, 2 คอลัมน์ตั้งแต่ sm ขึ้นไป */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((ing) => (
          <IngredientRow key={ing.id || ing.name} ing={ing} />
        ))}
      </div>
    </section>
  );
}

function IngredientRow({ ing }) {
  return (
    <div
      className="
        group flex items-center justify-between gap-3
        rounded-2xl border border-zinc-200 bg-white/70
        px-4 py-2.5 hover:shadow-sm transition
      "
    >
      {/* ชื่อวัตถุดิบ */}
      <div className="min-w-0 flex items-center gap-3">
        <span
          className="
            inline-block w-2.5 h-2.5 rounded-full
            bg-[#C9BB86] group-hover:scale-110 transition
          "
          aria-hidden
        />
        <span className="truncate text-[15px] text-zinc-900">{ing.name}</span>
      </div>

      {/* ปริมาณเป็น pill (ธีมทองอ่อน) */}
      <span
        className="
          shrink-0 rounded-full px-3 py-1 text-[13px]
          bg-[#F0EAD2] text-[#5F5A3B]
        "
      >
        {fmtQty(ing.quantity)}
        {ing.unit || ""}
      </span>
    </div>
  );
}

function fmtQty(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return n ?? "-";
  return num.toLocaleString("th-TH", { maximumFractionDigits: 2 });
}

// ======= GoldPillStat: สีทึบ ไม่มีกราเดียนต์/ขอบขาว รองรับไอคอน =======
function GoldPillStat({ label, value, icon: Icon, theme = "calories" }) {
  const COLORS = {
    calories: "#C0B374",
    protein: "#909C6F",
    carbs: "#606B42",
    fat: "#A25E2C",
  };
  const bg = COLORS[theme] || COLORS.calories;

  return (
    <div className="relative rounded-[24px]">
      <div
        className="relative rounded-[24px] min-h-[110px] text-white px-6 pt-5 pb-6
                   shadow-[0_10px_20px_rgba(0,0,0,0.14)] overflow-hidden
                   transition-transform hover:scale-[1.01]"
        style={{ backgroundColor: bg }}
      >
        <div className="relative flex justify-center mb-2">
          <div
            className="w-10 h-10 rounded-full bg-white/10 shadow-inner
                          flex items-center justify-center"
          >
            {Icon ? <Icon size={20} className="text-white/95" /> : null}
          </div>
        </div>

        <div className="relative text-center">
          <div className="text-[13px] opacity-90 tracking-wide">{label}</div>
          <div className="mt-1 text-[22px] font-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
}
