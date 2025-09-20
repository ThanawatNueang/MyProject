import { useEffect, useRef, useState } from "react";
import { SlCloudUpload } from "react-icons/sl";
import { BsFire } from "react-icons/bs";
import { GiChickenLeg } from "react-icons/gi";
import { MdBakeryDining } from "react-icons/md";
import { GiFat } from "react-icons/gi";
import { FaRegEdit } from "react-icons/fa";
import { LuSave } from "react-icons/lu";
import { MdDeleteOutline } from "react-icons/md";
import { uploadFood } from "../Components/API/uploadFood";
import { createEatingHistory } from "../Components/API/eatingHistory";
import {
  suggestIngredients,
  getIngredientById as apiGetIngredientById,
} from "../Components/API/search";

/* =========================
   Helpers (โภชนาการ + หน่วย)
   ========================= */
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
const toNum = (x) => (x == null ? 0 : Number(x)) || 0;

const normalizeMacro = (m) => ({
  calories: toNum(m?.calories ?? m?.kcal),
  protein: toNum(m?.protein),
  carbohydrates: toNum(m?.carbohydrates ?? m?.carbs),
  fat: toNum(m?.fat),
});
const addMacro = (a, b) => ({
  calories: (a?.calories || 0) + (b?.calories || 0),
  protein: (a?.protein || 0) + (b?.protein || 0),
  carbohydrates: (a?.carbohydrates || 0) + (b?.carbohydrates || 0),
  fat: (a?.fat || 0) + (b?.fat || 0),
});
const scaleMacro = (m, factor) => ({
  calories: (m?.calories || 0) * factor,
  protein: (m?.protein || 0) * factor,
  carbohydrates: (m?.carbohydrates || 0) * factor,
  fat: (m?.fat || 0) * factor,
});

export const Upload = ({ defaultQuery = "", onResults }) => {
  const [customIngredients, setCustomIngredients] = useState([]);
  const [totals, setTotals] = useState({
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
  });

  const uploadRef = useRef(null);
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUpload, setIsUpload] = useState(false);
  const [showTitle, setShowTitle] = useState(true);

  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", quantity: 0, unit: "" });

  // --- ฟอร์มเพิ่มวัตถุดิบ ---
  const [addIngredientText, setAddIngredientText] = useState("");
  const [addIngredientQty, setAddIngredientQty] = useState("");
  const [addIngredientUnit, setAddIngredientUnit] = useState("g");

  // --- Suggestion dropdown state ---
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const selectedSuggestRef = useRef(null);

  const defaultNotes = "No specific serving suggestions.";

  const [foodData, setFoodData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const inputRef = useRef(null);
  const [saving, setSaving] = useState(false);

  //เปลี่ยนชื่ออาหารกับเปลี่ยนปริมาณอาหาร
  const [editName, setEditName] = useState("");
  const [editQty, setEditQty] = useState("");

  const openFoodEdit = () => {
    setEditName(foodData?.name || "");
    const m = String(foodData?.serving_size || "").match(
      /(\d+(\.\d+)?)\s*(g|กรัม)/i
    );
    setEditQty(m ? m[1] : "");
    setEditOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const saveFoodMeta = () => {
    if (saving) return;
    setSaving(true);
    setFoodData((prev) => ({
      ...prev,
      name: (editName || "").trim() || prev.name,
      serving_size:
        editQty !== "" && !Number.isNaN(Number(editQty))
          ? `${Number(editQty)} g`
          : prev.serving_size,
    }));
    setEditOpen(false);
    setSaving(false);
  };

  useEffect(() => {
    if (editOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [editOpen]);

  const ACCEPT_MIMES = ["image/jpeg", "image/png"];
  const MAX_SIZE = 10 * 1024 * 1024;

  useEffect(() => {
    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  useEffect(
    () => () => {
      if (abortRef.current) abortRef.current.abort();
    },
    []
  );
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  useEffect(() => {
    if (editOpen) setTimeout(() => inputRef.current?.focus(), 0);
  }, [editOpen]);

  const handleClick = () => fileInputRef.current?.click();

  /* ======================
     คำนวณโภชนาการของแถวเดียว
     ====================== */
  const calcIngredientMacro = (it) => {
    const qty = Number(it.quantity) || 0;
    const unitRaw = (it.unit || "").toLowerCase().trim();
    const gramsPerUnit = UNIT_TO_GRAMS[unitRaw] ?? 1;
    const grams = gramsPerUnit * qty;

    // กรณีมี per 100 g/ml
    if (it.per100g) {
      const per = normalizeMacro(it.per100g);
      const factor = grams / 100;
      return scaleMacro(per, factor);
    }

    // กรณีมีค่า per 1 g/ml (จาก API getIngredientById)
    const hasPerUnit =
      it.calories_per_unit != null ||
      it.protein_per_unit != null ||
      it.carbohydrates_per_unit != null ||
      it.fat_per_unit != null;

    if (hasPerUnit) {
      const perUnit = normalizeMacro({
        calories: it.calories_per_unit,
        protein: it.protein_per_unit,
        carbohydrates: it.carbohydrates_per_unit,
        fat: it.fat_per_unit,
      });
      // perUnit เป็น “ต่อ 1 หน่วยฐาน (g/ml)” → คูณด้วย grams ที่ผู้ใช้ใส่
      return scaleMacro(perUnit, grams);
    }

    return { calories: 0, protein: 0, carbohydrates: 0, fat: 0 };
  };

  /* ======================
     คำนวณรวมจากรายการปัจจุบัน (เรียลไทม์)
     ====================== */
  const recalcTotals = (ingredients) => {
    const added = ingredients.reduce(
      (acc, it) => addMacro(acc, calcIngredientMacro(it)),
      { calories: 0, protein: 0, carbohydrates: 0, fat: 0 }
    );
    return {
      calories: Math.round(added.calories || 0),
      protein: added.protein || 0,
      carbohydrates: added.carbohydrates || 0,
      fat: added.fat || 0,
    };
  };

  // ทุกครั้งที่รายการเปลี่ยน -> คำนวณใหม่อัตโนมัติ
  useEffect(() => {
    setTotals(recalcTotals(customIngredients));
  }, [customIngredients]);

  /* -----------------------
     อัปโหลด + ประมวลผลรูป
     ----------------------- */
  const processFile = async (file) => {
    setSelectedFile(file);
    setIsAnalyzing(true);
    setErrorMsg("");

    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });

    try {
      const res = await uploadFood(file);
      const item = res?.results?.[0]?.food;
      if (!item) throw new Error("No food data returned");

      // วัตถุดิบจากรูปถือเป็น base (isCustom: false) แต่คำนวณรวมเหมือนกัน
      const baseList = (item.ingredients || []).map((x) => ({
        ...x,
        isCustom: false,
      }));
      setCustomIngredients(baseList);

      setFoodData({
        foodId:
          item.id ||
          item.foodId ||
          res?.results?.[0]?.foodId ||
          res?.results?.[0]?._id ||
          crypto.randomUUID(),
        name: item.name,
        className: res?.results?.[0]?.className,
        serving_size: item.serving_size,
        serving_suggestions: item.serving_suggestions,
        nutrition: normalizeMacro(
          item.calculated_nutrition || item.nutrition || {}
        ),
        consumedAt:
          item.consumedAt ||
          res?.results?.[0]?.consumedAt ||
          new Date().toISOString(),
      });

      setIsUpload(true);
      setShowTitle(false);
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || "Upload failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    processFile(file);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUpload) setIsDragging(true);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUpload) setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isUpload) return;
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (!ACCEPT_MIMES.includes(file.type)) {
      setErrorMsg("รองรับเฉพาะไฟล์ JPG/PNG เท่านั้น");
      return;
    }
    if (file.size > MAX_SIZE) {
      setErrorMsg("ไฟล์ใหญ่เกิน 10MB");
      return;
    }
    processFile(file);
  };

  /* ======================
     Suggestion (Autocomplete)
     ====================== */
  function normalizeSuggestPayload(raw) {
    const arr = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.results)
      ? raw.results
      : Array.isArray(raw?.items)
      ? raw.items
      : [];
    return arr.map((it, i) => {
      let raw100 =
        it.nutrition_per_100g ??
        it.nutritionPer100g ??
        it.per100g ??
        it.nutrition ??
        null;

      if (
        !raw100 &&
        (it.calories_per_unit || it.protein_per_unit || it.fat_per_unit)
      ) {
        const factor = 100;
        raw100 = {
          calories: (it.calories_per_unit ?? 0) * factor,
          protein: (it.protein_per_unit ?? 0) * factor,
          fat: (it.fat_per_unit ?? 0) * factor,
          carbohydrates: (it.carbohydrates_per_unit ?? 0) * factor,
        };
      }
      const per = raw100 ? normalizeMacro(raw100) : null;
      const hasValues =
        per && (per.calories || per.protein || per.carbohydrates || per.fat);
      return {
        id: it.id ?? it._id ?? String(i),
        name: it.name ?? it.title ?? it.ingredient_name ?? "",
        unit: it.unit ?? it.default_unit ?? "g",
        defaultQty: it.defaultQty ?? it.qty ?? 10,
        per100g: hasValues ? per : null,
      };
    });
  }

  async function fetchIngredient(keyword) {
    const kw = keyword.trim();
    if (!kw) {
      setResult([]);
      setSuggestOpen(false);
      onResults?.([]);
      return;
    }
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setErr("");
    try {
      const raw = await suggestIngredients(kw, { signal: controller.signal });
      const list = normalizeSuggestPayload(raw);
      setResult(list);
      setSuggestOpen(list.length > 0);
      setHighlightIndex(list.length > 0 ? 0 : -1);
      onResults?.(list);
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error(e);
        setErr("เกิดข้อผิดพลาดระหว่างค้นหา");
        setResult([]);
        setSuggestOpen(false);
        onResults?.([]);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleSelectSuggestion = (item) => {
    setAddIngredientText(item.name || "");
    setAddIngredientUnit(item.unit || "g");
    if (!addIngredientQty) setAddIngredientQty(String(item.defaultQty ?? 100));
    selectedSuggestRef.current = item;
    setSuggestOpen(false);
  };

  /* ======================
     เพิ่ม / แก้ไข / ลบ วัตถุดิบ
     ====================== */
  const handleAddIngredient = async (e) => {
    e.preventDefault();

    const name = (addIngredientText || "").trim();
    const qty = Number(addIngredientQty);
    const unit = (addIngredientUnit || "").trim().toLowerCase();

    if (!name) return;
    if (!unit) return alert("กรุณาเลือกหน่วย เช่น g หรือ ml");
    if (Number.isNaN(qty) || qty <= 0) return alert("กรุณากรอกจำนวนมากกว่า 0");

    const isDup = customIngredients.some(
      (it) => (it.name || "").toLowerCase() === name.toLowerCase()
    );
    if (isDup) return alert("มีวัตถุดิบนี้อยู่แล้ว");

    const chosen = selectedSuggestRef.current;
    let id = chosen?.id ?? null;

    if (!id) {
      // ถ้าไม่มี id จาก dropdown ก็ปล่อยให้บันทึกได้ก่อน (จะไม่มี per-unit)
      // หรือถ้าต้องการบังคับให้มี id เสมอ ให้ return alert ที่นี่
    }

    let detail = null;

    if (id) {
      try {
        detail = await apiGetIngredientById(id); // << per-unit จาก API จริง
      } catch (err) {
        console.warn("getIngredientById failed:", err);
      }
    }

    const ing = {
      id: id ?? undefined,
      name,
      quantity: qty,
      unit,
      isCustom: true,
      per100g: null, // เราใช้ per-unit เป็นหลักแล้ว
      calories_per_unit: detail?.calories_per_unit ?? null,
      protein_per_unit: detail?.protein_per_unit ?? null,
      fat_per_unit: detail?.fat_per_unit ?? null,
      carbohydrates_per_unit: detail?.carbohydrates_per_unit ?? null,
    };

    setCustomIngredients((prev) => [...prev, ing]);

    // reset form
    setAddIngredientText("");
    setAddIngredientQty("");
    setAddIngredientUnit("g");
    setResult([]);
    setSuggestOpen(false);
    setHighlightIndex(-1);
    selectedSuggestRef.current = null;
  };

  const handleDeleteItem = (index) => {
    setCustomIngredients((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditForm({ name: "", quantity: 0, unit: "" });
    }
  };

  const startEditItem = (index) => {
    const it = customIngredients[index];
    setEditingIndex(index);
    setEditForm({
      name: it.name || "",
      quantity:
        typeof it.quantity === "number"
          ? it.quantity
          : Number(it.quantity) || 0,
      unit: it.unit || "กรัม",
    });
  };

  const saveEditItem = async () => {
    const name = (editForm.name || "").trim();
    const qty = Number(editForm.quantity) || 0;
    const unit = (editForm.unit || "กรัม").trim();
    if (!name) return;

    const current = customIngredients[editingIndex];
    let id = current?.id ?? null;

    // ถ้าอยากอัปเดต per-unit ใหม่ทุกครั้งที่เปลี่ยนชื่อ → ดึง id แล้วค่อยเรียก API อีกที
    if ((current?.name || "").toLowerCase() !== name.toLowerCase()) {
      // ถ้ามีระบบค้นหา id จากชื่อ อาจเติมได้ที่นี่
      // ตอนนี้ถ้าไม่มี id จะคงค่าเดิมไว้
    }

    let detail = null;
    if (id) {
      try {
        detail = await apiGetIngredientById(id);
      } catch {}
    }

    setCustomIngredients((prev) =>
      prev.map((it, i) =>
        i === editingIndex
          ? {
              ...it,
              id,
              name,
              quantity: qty,
              unit,
              // per100g ไม่ใช้แล้ว
              calories_per_unit:
                detail?.calories_per_unit ?? it.calories_per_unit ?? null,
              protein_per_unit:
                detail?.protein_per_unit ?? it.protein_per_unit ?? null,
              fat_per_unit: detail?.fat_per_unit ?? it.fat_per_unit ?? null,
              carbohydrates_per_unit:
                detail?.carbohydrates_per_unit ??
                it.carbohydrates_per_unit ??
                null,
              isCustom: true,
            }
          : it
      )
    );

    setEditingIndex(null);
    setEditForm({ name: "", quantity: 0, unit: "" });
  };

  const cancelEditItem = () => {
    setEditingIndex(null);
    setEditForm({ name: "", quantity: 0, unit: "" });
  };
  const onEditKeyDown = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await saveEditItem();
    }
    if (e.key === "Escape") cancelEditItem();
  };

  /* ======================
     คีย์ในช่อง Add + ดีบาวซ์ค้นหา
     ====================== */
  const onAddKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!suggestOpen || result.length === 0) return;
      setHighlightIndex((i) => (i + 1) % result.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!suggestOpen || result.length === 0) return;
      setHighlightIndex((i) => (i - 1 + result.length) % result.length);
      return;
    }
    if (e.key === "Enter") {
      if (suggestOpen && result.length > 0 && highlightIndex >= 0) {
        const item = result[highlightIndex];
        handleSelectSuggestion(item);
      } else {
        handleAddIngredient(e);
      }
    }
    if (e.key === "Escape") setSuggestOpen(false);
  };

  const onChangeAddIngredientText = (v) => {
    setAddIngredientText(v);
    setErr("");
    selectedSuggestRef.current = null;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (v.trim().length >= 2) fetchIngredient(v);
      else {
        setResult([]);
        setSuggestOpen(false);
        setHighlightIndex(-1);
      }
    }, 220);
  };

  const handleSaveMeal = async () => {
    console.log(editName);
    console.log(foodData.name);

    if (!foodData || isSaving) return;

    try {
      setIsSaving(true);

      const normalizedIngredients = customIngredients.map((it, idx) => ({
        id: it.id ?? it._id ?? String(idx),
        name: it.name ?? "",
        quantity: Number(it.quantity ?? 0),
        unit: it.unit || "กรัม",
      }));

      const payload = {
        foodId: foodData.foodId,
        custom_food_name: editName || foodData.name,
        nutrition: {
          calories: totals.calories,
          protein: totals.protein,
          carbs: totals.carbohydrates, // ฝั่ง API ใช้ carbs
          fat: totals.fat,
        },
        customIngredients: normalizedIngredients,
        notes: foodData.serving_suggestions || defaultNotes,
        consumedAt: foodData.consumedAt,
        consumed_at: foodData.consumedAt,
      };
      console.log("payloaddddddd", payload);

      await createEatingHistory(payload);
      window.dispatchEvent(new Event("history:updated"));
      alert("บันทึกมื้ออาหารเรียบร้อย");
    } catch (err) {
      console.error(err);
      const msg = String(err?.message || "");
      if (msg.toLowerCase().includes("unauthorized")) {
        alert("กรุณาเข้าสู่ระบบ เพื่อบันทึกมื้ออาหารของคุณ");
        window.location.href = "/signin";
      } else {
        alert("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const pct = (val, max) => {
    const num = typeof val === "number" ? val : 0;
    return Math.min(100, Math.max(0, Math.round((num / max) * 100)));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 py-6 sm:py-8 font-Semi text-[#333]">
      {showTitle && (
        <h1 className="font-Medi text-3xl sm:text-5xl lg:text-6xl text-center pb-6 sm:pb-10 text-[#5D5D5D]">
          Upload Your Food
        </h1>
      )}

      {errorMsg && (
        <div className="mb-4 w-full rounded-lg border border-red-300 bg-red-50 text-red-700 p-3">
          {errorMsg}
        </div>
      )}

      <div
        ref={uploadRef}
        className={`transition-all duration-500 ${
          preview
            ? "bg-white"
            : `bg-[#F4F4F4] border border-dashed ${
                isDragging
                  ? "border-[#C0B275] bg-[#fff8e6]"
                  : "border-[#5D5D5D]"
              }`
        } rounded-2xl p-6 sm:p-8 md:p-10 min-h-[260px] sm:min-h-[320px]
         flex flex-col items-center justify-center gap-6 sm:gap-8 max-w-5xl mx-auto`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isAnalyzing ? (
          <p className="text-[#C0B275] text-lg sm:text-xl">
            Analyzing your food...
          </p>
        ) : !isUpload ? (
          <>
            <SlCloudUpload className="text-6xl sm:text-7xl text-[#5D5D5D]" />
            <div className="text-center">
              <p className="pb-3 sm:pb-5 text-sm sm:text-base lg:text-xl">
                Drag and drop your file here
              </p>
              <p className="text-[#C0B275] text-sm sm:text-base lg:text-xl">
                or click to select
              </p>
            </div>
            <button
              onClick={handleClick}
              className="bg-[#C0B275] text-white text-sm sm:text-base lg:text-xl px-5 sm:px-6 py-2 rounded-full hover:scale-105 transition"
            >
              Select File
            </button>
            <p className="text-[11px] sm:text-[12px] lg:text-[14px] font-Ul text-center">
              Supports: JPG, PNG, JPEG
            </p>

            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </>
        ) : (
          <>
            {/* ภาพ + ข้อมูลวิเคราะห์ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 w-full">
              {preview && (
                <img
                  src={preview}
                  alt="preview"
                  className="w-full h-full rounded-xl object-cover"
                />
              )}

              <div className="flex flex-col justify-between gap-6 w-full">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg md:text-xl text-[#5B5B5B] font-prompt">
                      Food Nutrition Analysis Result
                    </h2>
                    <h2 className="text-[32px] sm:text[36px] md:text-5xl Fahkwangs break-words">
                      {foodData?.name || foodData?.className || "-"}
                    </h2>
                    <div className="flex items-center gap-1 mt-2">
                      <p className="poppins-semibold text-[12px] sm:text-[13px] text-[#5B5B5B] font-bold">
                        {foodData?.serving_size || "-"} g
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center shrink-0">
                    <button
                      onClick={openFoodEdit}
                      className="inline-flex items-center gap-2 font-prompt cursor-pointer rounded-full border border-zinc-400 px-3 py-1.5
               hover:bg-black hover:text-white transition"
                      title="Edit"
                      aria-label="Edit"
                    >
                      <FaRegEdit className="text-[18px]" />
                      <span className="hidden sm:inline text-sm">Edit</span>
                    </button>

                    <button
                      onClick={handleSaveMeal}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 cursor-pointer font-prompt rounded-full border border-zinc-400 px-3 py-1.5
               hover:bg-black hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Save"
                      aria-label="Save"
                    >
                      <LuSave className="text-[18px]" />
                      <span className="hidden sm:inline text-sm">
                        {isSaving ? "Saving..." : "Save"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* สรุปโภชนาการ (จาก ingredients ปัจจุบันแบบเรียลไทม์) */}
                <div className="space-y-4 text-sm sm:text-base">
                  <div className="flex justify-between items-center border-b border-b-black/80 pb-3">
                    <span className="font-cocoPro">Nutrient ratio</span>
                  </div>

                  {/* Calories */}
                  <div className="flex justify-between items-center border-b border-b-[#746F6F] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center text-white text-[12px] bg-[#C0B275] w-5 h-5 rounded-full ">
                        <BsFire />
                      </div>
                      <span className="font-cocoPro text-sm">Calories</span>
                    </div>
                    <span className="font-inter font-semibold">
                      {Number.isFinite(totals.calories)
                        ? `${Math.round(totals.calories)} Cal`
                        : "—"}
                    </span>
                  </div>

                  {/* Protein */}
                  <div className="flex justify-between items-center border-b border-b-[#746F6F] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center text-white text-[12px] bg-[#C0B275] w-5 h-5 rounded-full">
                        <GiChickenLeg />
                      </div>
                      <span className="font-cocoPro text-sm">Protein</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-28 sm:w-32 bg-[#D8CD9C] rounded-full h-2.5">
                        <div
                          className="absolute right-0 bg-[#C0B275] h-2.5 rounded-full"
                          style={{ width: `${pct(totals.protein ?? 0, 100)}%` }}
                        />
                      </div>
                      <span className="font-inter font-semibold text-[12px] sm:text-[13px]">
                        {totals.protein != null
                          ? `${totals.protein.toFixed(1)} g`
                          : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Carbs */}
                  <div className="flex justify-between items-center border-b border-b-[#746F6F] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center text-white text-[14px] bg-[#C0B275] w-5 h-5 rounded-full">
                        <MdBakeryDining />
                      </div>
                      <span className="font-cocoPro text-sm">Carbs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-28 sm:w-32 bg-[#D8CD9C] rounded-full h-2.5">
                        <div
                          className="absolute right-0 bg-[#C0B275] h-2.5 rounded-full"
                          style={{
                            width: `${pct(totals.carbohydrates ?? 0, 300)}%`,
                          }}
                        />
                      </div>
                      <span className="font-inter font-semibold text-[12px] sm:text-[13px]">
                        {totals.carbohydrates != null
                          ? `${totals.carbohydrates.toFixed(1)} g`
                          : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Fat */}
                  <div className="flex justify-between items-center border-b border-b-[#746F6F] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center text-white text-[12px] bg-[#C0B275] w-5 h-5 rounded-full">
                        <GiFat />
                      </div>
                      <span className="font-cocoPro text-sm">Fat</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-28 sm:w-32 bg-[#D8CD9C] rounded-full h-2.5">
                        <div
                          className="absolute right-0 bg-[#C0B275] h-2.5 rounded-full"
                          style={{ width: `${pct(totals.fat ?? 0, 70)}%` }}
                        />
                      </div>
                      <span className="font-inter font-semibold text-[12px] sm:text-[13px]">
                        {totals.fat != null
                          ? `${totals.fat.toFixed(1)} g`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-7 md:p-9 border border-[#746F6F] rounded-xl cursor-pointer">
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-prompt mb-3 sm:mb-4">
                    Serving Suggestions
                  </h3>
                  <p className="text-[15px] sm:text-[16px] md:text-[17px] leading-relaxed font-light text-[#5B5B5B]">
                    {foodData?.serving_suggestions || defaultNotes}
                  </p>
                </div>
              </div>
            </div>

            {/* Ingredients editor */}
            <div className="mt-8 sm:mt-10 w-full p-5 sm:p-6 rounded-xl bg-white font-prompt">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-prompt font-semibold">
                  Edit Ingredients
                </h2>

                {/* Input group + dropdown */}
                <div className="relative flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                  <input
                    value={addIngredientText}
                    onChange={(e) => onChangeAddIngredientText(e.target.value)}
                    onKeyDown={onAddKeyDown}
                    placeholder="Add a new Ingredient..."
                    className="w-full sm:w-auto border border-[#746F6F] rounded-full px-4 sm:px-5 py-1 outline-none"
                    onFocus={() => setSuggestOpen(result.length > 0)}
                  />

                  {suggestOpen && (
                    <div className="absolute left-0 top-[110%] z-20 w-full sm:w-[320px] max-h-64 overflow-auto bg-white border border-[#ddd] rounded-lg shadow">
                      {loading && (
                        <div className="px-3 py-2 text-sm text-[#777]">
                          กำลังค้นหา...
                        </div>
                      )}
                      {!loading && err && (
                        <div className="px-3 py-2 text-sm text-red-600">
                          {err}
                        </div>
                      )}
                      {!loading && !err && result.length === 0 && (
                        <div className="px-3 py-2 text-sm text-[#777]">
                          ไม่พบวัตถุดิบ
                        </div>
                      )}
                      {!loading &&
                        !err &&
                        result.map((it, idx) => (
                          <button
                            key={it.id}
                            type="button"
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-black hover:text-white ${
                              idx === highlightIndex
                                ? "bg-black text-white"
                                : ""
                            }`}
                            onMouseEnter={() => setHighlightIndex(idx)}
                            onClick={() => handleSelectSuggestion(it)}
                          >
                            <div className="font-medium">{it.name}</div>
                            <div className="text-xs opacity-70">
                              default: {it.defaultQty ?? 100} {it.unit ?? "g"}
                            </div>
                          </button>
                        ))}
                    </div>
                  )}

                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.1"
                    value={addIngredientQty}
                    onChange={(e) => setAddIngredientQty(e.target.value)}
                    onKeyDown={onAddKeyDown}
                    placeholder="Qty"
                    className="w-28 sm:w-24 border border-[#746F6F] rounded-full px-4 sm:px-5 py-1 outline-none"
                  />

                  <select
                    value={addIngredientUnit}
                    onChange={(e) => setAddIngredientUnit(e.target.value)}
                    onKeyDown={onAddKeyDown}
                    className="border border-[#746F6F] rounded-full px-4 sm:px-5 py-1 outline-none"
                    title="Unit"
                  >
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                  </select>

                  <button
                    onClick={handleAddIngredient}
                    disabled={!addIngredientText.trim() || !addIngredientQty}
                    className="text-xs sm:text-sm border border-[#746F6F] px-3 sm:px-4 py-1 rounded-full text-gray-600 cursor-pointer hover:bg-black hover:text-white duration-300 disabled:opacity-50"
                  >
                    Add Ingredient
                  </button>

                  <span className="text-xs sm:text-sm px-2 py-1 rounded-full font-semibold">
                    {customIngredients.length} ingredients
                  </span>
                </div>
              </div>

              <div className="divide-y divide-[#746F6F] pt-4">
                {customIngredients.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap justify-between items-center gap-3 py-3 Fahkwang"
                  >
                    {editingIndex === idx ? (
                      <div className="flex w-full flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-3">
                          <input
                            autoFocus
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm((s) => ({
                                ...s,
                                name: e.target.value,
                              }))
                            }
                            onKeyDown={onEditKeyDown}
                            className="min-w-[200px] border border-[#746F6F] rounded-md px-3 py-2 outline-none"
                            placeholder="Ingredient name..."
                          />
                          <input
                            type="number"
                            value={editForm.quantity}
                            onChange={(e) =>
                              setEditForm((s) => ({
                                ...s,
                                quantity: e.target.value,
                              }))
                            }
                            onKeyDown={onEditKeyDown}
                            className="w-24 border border-[#746F6F] rounded-md px-3 py-2 outline-none"
                            placeholder="qty"
                          />
                          <input
                            value={editForm.unit}
                            onChange={(e) =>
                              setEditForm((s) => ({
                                ...s,
                                unit: e.target.value,
                              }))
                            }
                            onKeyDown={onEditKeyDown}
                            className="w-28 border border-[#746F6F] rounded-full px-3 py-2 outline-none"
                            placeholder="unit"
                            list="unit-list"
                          />
                          <datalist id="unit-list">
                            <option value="กรัม" />
                            <option value="มิลลิลิตร" />
                            <option value="ช้อนชา" />
                            <option value="ช้อนโต๊ะ" />
                            <option value="ชิ้น" />
                          </datalist>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={saveEditItem}
                            className="px-3 py-2 rounded-md border border-[#746F6F] hover:bg-black hover:text-white"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditItem}
                            className="px-3 py-2 rounded-md border border-[#746F6F] hover:bg-black hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-3 min-w-0">
                          <span className="text-[16px] sm:text-[17px] truncate">
                            {item.name}
                          </span>
                          <span className="text-[12px] sm:text-[13px] text-[#666]">
                            {item.quantity ?? 0} {item.unit ?? "-"}
                          </span>
                        </div>
                        <div className="flex gap-4 text-[#333]">
                          <FaRegEdit
                            size={20}
                            className="cursor-pointer hover:text-[#C0B275]"
                            onClick={() => startEditItem(idx)}
                          />
                          <MdDeleteOutline
                            size={20}
                            className="cursor-pointer hover:text-[#C0B275]"
                            onClick={() => handleDeleteItem(idx)}
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      {editOpen && (
        <div
          className="fixed inset-0 z-[180] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          ria-labelledby="edit-food-title"
        >
          {/* ชั้นทับที่ทำให้พื้นหลังมืด + เบลอ */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !saving && setEditOpen(false)} // คลิกนอกป๊อปอัปเพื่อปิด
          />

          {/* กล่องป๊อปอัป */}
          <div className="relative z-[181] w-[90%] max-w-sm bg-white rounded-2xl shadow-xl p-5">
            <h3 id="edit-food-title" className="text-lg font-cocoPro mb-3">
              Edit Food
            </h3>
            <label className="text-sm font-cocoPro text-gray-600">
              Food Name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveFoodMeta()}
              className="mt-1 w-full border rounded-lg px-3 py-2 outline-none"
              placeholder="ข้าวผัด"
              disabled={saving}
            /> 
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setEditOpen(false)}
                disabled={saving}
                className="flex-1 font-cocoPro cursor-pointer border rounded-full py-2 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={saveFoodMeta}
                disabled={saving}
                className="flex-1 font-cocoPro cursor-pointer rounded-full py-2 bg-[#C0B275] text-white hover:bg-[#ac9f66] disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
