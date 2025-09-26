import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from "recharts";
import { fetchEatingSummary, nutritionGoal } from "../API/nutritionGoal.js";
import { userPreviewRaw, userPreview } from "../API/user";
import { TbMenu3 } from "react-icons/tb";
import { FaUserEdit } from "react-icons/fa";
import { IoHome, IoFastFoodSharp } from "react-icons/io5";
import { RiFolderUploadFill, RiDashboardFill } from "react-icons/ri";
import { MdOutlineLogout } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../API/auth";
import { eatingHistory } from "../API/eatingHistory.js";
import { GiChickenLeg } from "react-icons/gi";
import { BsFire } from "react-icons/bs";
import { MdBakeryDining } from "react-icons/md";
import { FaTint } from "react-icons/fa";
import {
  TbTargetArrow,
  TbArrowDownRight,
  TbArrowUpRight,
  TbCheck,
  TbChevronRight,
} from "react-icons/tb";

const backendURL = "https://caloriepaws-node.azurewebsites.net"
const LS_CURRENT_WEIGHT = "ui:weightCurrent";

// ===== config สี & เกณฑ์ =====
const COLORS = {
  ok: "#2C2C2C",
  low: "#B0A7C6",
  over: "#9E3F32",
  remaining: "#D9D9D9",
};
const LOW_RATIO = 0.3; // <30% ของ goal = น้อยเกินไป

// ===== helpers ===== แก้ด้วย
const pickNumber = (...vals) => {
  for (const v of vals) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
};
const fmtKcal = (n) => `${Number(n || 0).toLocaleString("th-TH")} kcal`;
const toYMD = (v) =>
  typeof v === "string"
    ? v.slice(0, 10)
    : new Date(v).toISOString().slice(0, 10);

// ===== custom tooltip =====
const CaloriesTooltip = ({ active, payload, label, goal }) => {
  if (!active || !payload?.length) return null;
  const full = payload?.[0]?.payload ?? {};
  const actual = Number(full.actual || 0);
  const g = Number(goal || 0);

  const over = Math.max(0, actual - g);
  const remaining = Math.max(0, g - actual);

  const status = full.status; // "low" | "ok" | "over"
  const statusText =
    status === "low"
      ? "Not eating enough"
      : status === "over"
      ? "Over target"
      : "On track";
  const dotColor =
    status === "low" ? COLORS.low : status === "over" ? COLORS.over : COLORS.ok;

  return (
    <div
      className="rounded-xl shadow-lg border bg-white p-3 text-[13px]"
      style={{ minWidth: 200 }}
    >
      <div className="font-medium mb-1 flex items-center gap-2">
        <span
          style={{ background: dotColor }}
          className="inline-block w-2.5 h-2.5 rounded-full"
        />
        {label}
      </div>

      <div className="flex justify-between">
        <span>Actual</span>
        <span className="font-semibold">{fmtKcal(actual)}</span>
      </div>
      <div className="flex justify-between">
        <span>Goal</span>
        <span>{fmtKcal(g)}</span>
      </div>

      {/* NEW: Remaining / Over by */}
      <div className="flex justify-between mt-1 ">
        <span>{over > 0 ? "Over by" : "Remaining"}</span>
        <span className="font-semibold" style={{ color: dotColor }}>
          {fmtKcal(over > 0 ? over : remaining)}
        </span>
      </div>

      <div className="mt-2 text-xs" style={{ color: dotColor }}>
        {statusText}
      </div>
    </div>
  );
};

export const MainContent = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileImage, setProfileImage] = useState();
  const [userData, setUserData] = useState(null);
  const [caloriesDaily, setCaloriesDaily] = useState();
  const [summaryCalories, setSummaryCalories] = useState();
  const [weight, setWeight] = useState();
  const [graphData, setGraphData] = useState([]);

  // modal แก้น้ำหนัก (UI only)
  const [editOpen, setEditOpen] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  const [macro7d, setMacro7d] = useState([]);

  const navigate = useNavigate();

  const handleLogout = async (e) => {
    e?.preventDefault?.();

    try {
      await logoutUser(); // ล็อกเอาต์ฝั่งเซิร์ฟเวอร์ (ล้มเหลวก็ยังเคลียร์ฝั่ง client ต่อ)
    } catch {}

    try {
      // เคลียร์ session ฝั่ง client
      localStorage.removeItem("userToken");
      localStorage.removeItem("user");
      localStorage.removeItem("profileImageURL");
      sessionStorage.removeItem("session:userFetched");

      // แจ้งคอมโพเนนต์อื่น ๆ ให้รีเซ็ตสถานะ
      window.dispatchEvent(new Event("auth:logout"));
    } finally {
      // ปิดเมนูมือถือ + กลับหน้าแรก + รีโหลดเพื่อเคลียร์ in-memory state
      setIsMenuOpen(false);
      navigate("/", { replace: true });
      setTimeout(() => window.location.reload(), 0);
    }
  };

  // น้ำหนักจริง
  const realWeight =
    (typeof weight === "number" ? weight : undefined) ??
    weight?.weight ??
    weight?.user?.weight ??
    undefined;

  // น้ำหนัก current (UI only)
  const [weightCurrent, setWeightCurrent] = useState(null);

  // ===== Responsive bar size =====
  const chartWrapRef = useRef(null);
  const [barSize, setBarSize] = useState(36);
  const [catGap, setCatGap] = useState(16);

  useEffect(() => {
    const el = chartWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width || 0;
      const bars = Math.max(1, graphData.length || 7);
      const est = Math.floor((w - 40) / (bars * 1.7));
      const finalBar = Math.max(16, Math.min(42, est));
      setBarSize(finalBar);
      setCatGap(Math.max(6, Math.min(24, Math.floor(finalBar * 0.5))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [graphData.length]);

  useEffect(() => {
    if (editOpen) setTimeout(() => inputRef.current?.focus(), 0);
  }, [editOpen]);

  // โหลดโปรไฟล์ + รูป
  useEffect(() => {
    (async () => {
      try {
        const res = await userPreview();
        setUserData(res);
        if (res?.user?.profilePicture) {
          setProfileImage(`${backendURL}/uploads/${res.user.profilePicture}`);
        }
      } catch {}
    })();
  }, []);

  // โหลดเป้าหมายแคลฯ
  useEffect(() => {
    (async () => {
      try {
        const userData = await nutritionGoal();
        setCaloriesDaily(userData);
      } catch {}
    })();
  }, []);

  const macroTargets = useMemo(() => {
    const goal = Number(caloriesDaily?.dailyCalorieGoal ?? 0);
    if (!goal) return null;

    const getRatio = (r, def) => {
      let v = Number(r);
      if (!Number.isFinite(v)) v = def;
      if (v > 1) v = v / 100; // รองรับ percent เช่น 30 -> 0.3
      return Math.max(0, Math.min(1, v));
    };

    // 1) ลองใช้ "กรัมต่อวัน" จาก API ถ้ามี
    const pG_api = pickNumber(
      caloriesDaily?.dailyProteinGoal,
      caloriesDaily?.proteinGoal,
      caloriesDaily?.protein_grams
    );
    const cG_api = pickNumber(
      caloriesDaily?.dailyCarbGoal,
      caloriesDaily?.carbGoal,
      caloriesDaily?.carb_grams
    );
    const fG_api = pickNumber(
      caloriesDaily?.dailyFatGoal,
      caloriesDaily?.fatGoal,
      caloriesDaily?.fat_grams
    );

    // 2) ถ้าไม่มีกรัม ให้คำนวณจากสัดส่วน
    let pR = getRatio(
      caloriesDaily?.macroRatio?.protein ??
        caloriesDaily?.proteinRatio ??
        caloriesDaily?.proteinPercent,
      0.3 // default 30%
    );
    let cR = getRatio(
      caloriesDaily?.macroRatio?.carbs ??
        caloriesDaily?.carbRatio ??
        caloriesDaily?.carbPercent,
      0.4 // default 40%
    );
    let fR = getRatio(
      caloriesDaily?.macroRatio?.fat ??
        caloriesDaily?.fatRatio ??
        caloriesDaily?.fatPercent,
      0.3 // default 30%
    );

    // normalize เผื่อรวมไม่เท่ากับ 1
    const sum = pR + cR + fR;
    if (sum > 0) {
      pR /= sum;
      cR /= sum;
      fR /= sum;
    }

    const proteinG = Math.round(pG_api ?? (goal * pR) / 4);
    const carbsG = Math.round(cG_api ?? (goal * cR) / 4);
    const fatG = Math.round(fG_api ?? (goal * fR) / 9);

    return {
      goal,
      protein: {
        grams: proteinG,
        kcal: proteinG * 4,
        ratio: Math.round(((proteinG * 4) / goal) * 100),
      },
      carbs: {
        grams: carbsG,
        kcal: carbsG * 4,
        ratio: Math.round(((carbsG * 4) / goal) * 100),
      },
      fat: {
        grams: fatG,
        kcal: fatG * 9,
        ratio: Math.round(((fatG * 9) / goal) * 100),
      },
    };
  }, [caloriesDaily]);

  // สรุปวันนี้
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchEatingSummary();
        setSummaryCalories(data);
      } catch {}
    })();
  }, []);

  // โหลดน้ำหนักจริง
  useEffect(() => {
    (async () => {
      try {
        const weightData = await userPreviewRaw();
        setWeight(weightData);
      } catch {}
    })();
  }, []);

  const u = weight?.user || weight?.data?.user || weight || null;
  const goalWeight = u?.fitnessGoal ?? null;

  const rawGoal = u?.bodyGoal;

  const bodyGoal =
    rawGoal === "lose_weight"
      ? "lose"
      : rawGoal === "gain_weight"
      ? "gain"
      : rawGoal === "maintain_weight"
      ? "maintain"
      : "";

  // โหลด/ตั้งค่าเริ่มต้น weightCurrent
  useEffect(() => {
    const saved = localStorage.getItem(LS_CURRENT_WEIGHT);
    if (saved != null) {
      const val = Number(saved);
      if (!Number.isNaN(val)) {
        setWeightCurrent(val);
        return;
      }
    }
    if (realWeight != null && weightCurrent == null) {
      setWeightCurrent(Number(realWeight));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realWeight]);

  // ===== Goal helpers (แสดงสถานะบน Dashboard) =====
  const goalLabel =
    bodyGoal === "lose"
      ? "Lose weight"
      : bodyGoal === "gain"
      ? "Gain weight"
      : bodyGoal === "maintain"
      ? "Maintain weight"
      : "—";

  const hasTarget =
    bodyGoal !== "maintain" && Number.isFinite(Number(goalWeight));

  const remainingKg = (() => {
    const cur = Number(realWeight);
    const target = Number(goalWeight);
    if (!hasTarget || !Number.isFinite(cur)) return null;
    // เหลืออีกเท่าไรถึงเป้าหมาย (lose = current - target, gain = target - current)
    const left =
      bodyGoal === "lose"
        ? cur - target
        : bodyGoal === "gain"
        ? target - cur
        : 0;
    return Math.max(0, Math.round(left * 10) / 10);
  })();

  // ✅ ประกาศ refreshGraph ไว้ "ก่อน" ทุก useEffect ที่จะใช้มัน (กัน TDZ)
  const refreshGraph = useCallback(async () => {
    if (!caloriesDaily) return;
    const today = new Date();
    const past7 = new Date();
    past7.setDate(today.getDate() - 6);
    const goal = Number(caloriesDaily?.dailyCalorieGoal ?? 1800);

    try {
      const result = await eatingHistory(toYMD(past7), toYMD(today));
      const rows = Array.isArray(result) ? result : [];
      const temp = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = toYMD(d);
        const labelTH = d.toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
        });

        const actual = rows
          .filter((it) => toYMD(it.consumed_at) === key)
          .reduce((sum, it) => sum + Number(it.calculated_calories || 0), 0);

        const within = Math.min(actual, goal);
        const over = Math.max(0, actual - goal);
        const remaining = Math.max(0, goal - actual);
        const ratio = goal > 0 ? actual / goal : 0;
        const status = over > 0 ? "over" : ratio < LOW_RATIO ? "low" : "ok";

        temp.push({ date: labelTH, actual, within, over, remaining, status });
      }
      setGraphData(temp);
    } catch {
      const temp = Array.from({ length: 7 }, (_, idx) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - idx));
        return {
          date: d.toLocaleDateString("th-TH", {
            day: "2-digit",
            month: "2-digit",
          }),
          actual: 0,
          within: 0,
          over: 0,
          remaining: Number(caloriesDaily?.dailyCalorieGoal ?? 1800),
          status: "low",
        };
      });
      setGraphData(temp);
    }
  }, [caloriesDaily]);

  // ✅ เรียก refreshGraph เมื่อ caloriesDaily พร้อม
  useEffect(() => {
    refreshGraph();
  }, [refreshGraph]);

  // ✅ ฟัง event จาก Aside แล้วรีเฟรช
  useEffect(() => {
    const onHistoryUpdated = async () => {
      try {
        const data = await fetchEatingSummary();
        setSummaryCalories(data);
      } catch {}
      refreshGraph();
    };

    window.addEventListener("history:updated", onHistoryUpdated);
    return () =>
      window.removeEventListener("history:updated", onHistoryUpdated);
  }, [refreshGraph]);

  // modal handlers
  const openEdit = () => {
    const base =
      weightCurrent != null
        ? weightCurrent
        : realWeight != null
        ? Number(realWeight)
        : "";
    setWeightInput(base === "" ? "" : String(base));
    setEditOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const saveWeight = async () => {
    const parsed = parseFloat(String(weightInput).replace(",", "."));
    if (Number.isNaN(parsed) || parsed <= 0 || parsed > 500) {
      alert("กรุณากรอกน้ำหนักเป็นตัวเลข 0–500 kg");
      return;
    }
    try {
      setSaving(true);
      setWeightCurrent(parsed);
      localStorage.setItem(LS_CURRENT_WEIGHT, String(parsed));
      setEditOpen(false);
    } catch {
      alert("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const menuList = [
    { label: "Home", icon: <IoHome size={20} />, href: "/" },
    {
      label: "Upload",
      icon: <RiFolderUploadFill size={20} />,
      href: "/upload",
    },
    {
      label: "Dashboard",
      icon: <RiDashboardFill size={20} />,
      href: "/dashboard",
    },
    {
      label: "Profile Settings",
      icon: <FaUserEdit size={20} />,
      href: "/edit",
    },
    {
      label: "Nutrition",
      icon: <IoFastFoodSharp size={20} />,
      href: "/#food-search-section",
    },
  ];

  //เพิ่มโค้ดนี้

  useEffect(() => {
    if (!isMenuOpen) return;
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, [isMenuOpen]);

  //เพิ่มโค้ดนี้
  const fmtG = (n) =>
    `${Number(n || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 })} g`;

  const toNum = (v) => {
    if (v == null) return 0;
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    return (
      Number.parseFloat(
        String(v)
          .replace(/[^\d.,-]/g, "")
          .replace(",", ".")
      ) || 0
    );
  };
  const pickFieldNum = (obj, keys) => {
    for (const k of keys)
      if (obj?.[k] != null && obj[k] !== "") return toNum(obj[k]);
    return 0;
  };

  const todayMacros = useMemo(() => {
    const s = summaryCalories || {};
    return {
      protein: pickFieldNum(s, [
        "protein",
        "protein_g",
        "proteinGrams",
        "totalProtein",
      ]),
      carbs: pickFieldNum(s, [
        "carbs",
        "carb",
        "carbohydrate",
        "carbohydrates",
        "carbs_g",
        "carb_g",
        "totalCarbs",
      ]),
      fat: pickFieldNum(s, ["fat", "fats", "fat_g", "fatGrams", "totalFat"]),
    };
  }, [summaryCalories]);

  // helpers
  const clamp0 = (n) => Math.max(0, Number(n) || 0);
  const fmtG2 = (n) =>
    `${clamp0(n).toLocaleString("th-TH", { maximumFractionDigits: 2 })} g`;

  // Remaining / Over-by for macros
  const remaining = useMemo(() => {
    if (!macroTargets) return null;

    const tP = Number(macroTargets.protein.grams || 0);
    const tC = Number(macroTargets.carbs.grams || 0);
    const tF = Number(macroTargets.fat.grams || 0);

    const aP = Number(todayMacros.protein || 0);
    const aC = Number(todayMacros.carbs || 0);
    const aF = Number(todayMacros.fat || 0);

    return {
      protein: { left: clamp0(tP - aP), over: clamp0(aP - tP) },
      carbs: { left: clamp0(tC - aC), over: clamp0(aC - tC) },
      fat: { left: clamp0(tF - aF), over: clamp0(aF - tF) },
    };
  }, [macroTargets, todayMacros]);

  return (
    <div className="flex flex-col w-full min-w-0 px-4 sm:px-6 lg:px-8 overflow-x-hidden max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-8">
        <div
          className="lg:hidden text-3xl cursor-pointer relative z-[160]"
          onClick={() => setIsMenuOpen((v) => !v)}
        >
          <TbMenu3 className={isMenuOpen ? "text-white" : "text-black"} />
        </div>
        <div className="font-cocoPro">
          <h1 className="text-lg sm:text-xl lg:text-2xl">Dashboard</h1>
          <p className="text-xs sm:text-sm text-[#9F9F9F]">nutrition Updates</p>
        </div>
      </div>

      {/* cards */}
      <section className="pt-6 w-full">
        <div className="grid [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))] gap-4 lg:gap-6">
          {(() => {
            const today = Number(summaryCalories?.calories ?? 0);
            const goal = Number(caloriesDaily?.dailyCalorieGoal ?? 0);
            const over = Math.max(0, today - goal);
            const remaining = Math.max(0, goal - today);
            const ratio = goal > 0 ? today / goal : 0;

            const status = !goal
              ? "—"
              : over > 0
              ? "Over target"
              : ratio < 0.3
              ? "Not enough"
              : "On track";

            const chipCls = !goal
              ? "bg-black"
              : over > 0
              ? "bg-red-600"
              : ratio < 0.3
              ? "bg-black"
              : "bg-emerald-600";

            const fmt = (n) => `${Number(n || 0).toLocaleString("th-TH")} kcal`;

            return (
              <div
                className="relative min-w-0 overflow-hidden rounded-3xl sm:rounded-4xl p-5 sm:p-6 lg:p-7 text-black
                    bg-[linear-gradient(135deg,#CEBF8A_0%,#B59F64_100%)]
                    shadow-[0_12px_28px_rgba(0,0,0,0.12)]"
              >
                {/* ไฮไลต์เบา ๆ */}
                <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/15 blur-2xl" />

                {/* Header + chip */}
                <div className="flex items-start justify-between">
                  <h3 className="text-lg lg:text-2xl font-semibold tracking-tight">
                    Calories Today
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-white text-[10px] sm:text-xs font-medium ${chipCls}`}
                  >
                    {over > 0 ? (
                      <TbArrowUpRight size={14} />
                    ) : (
                      <BsFire size={12} />
                    )}
                    {status}
                  </span>
                </div>

                {/* Current kcal */}
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-none tracking-tight">
                    {summaryCalories?.calories ?? "Loading..."}
                  </span>
                  <span className="text-xl md:text-2xl font-semibold opacity-90">
                    kcal
                  </span>
                </div>

                {/* Goal + remaining/over */}
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="inline-flex items-center gap-1.5 opacity-95">
                    <BsFire className="shrink-0" />
                    <span className="font-semibold">Goal</span>
                    <span className="font-medium">
                      {goal ? goal.toLocaleString("th-TH") : "—"} kcal
                    </span>
                  </span>
                  <div className="mt-2 text-xs sm:text-sm">
                    {over > 0 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full py-1 text-sm font-semibold text-black">
                        <TbArrowUpRight size={14} />
                        Over by {fmt(Math.abs(over))}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full py-1 text-[12px] font-semibold text-black">
                        <TbArrowDownRight size={14} />
                        Remaining {fmt(remaining)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
          <div
            className="relative overflow-hidden rounded-3xl sm:rounded-4xl p-5 sm:p-6 lg:p-7 text-black
                bg-[linear-gradient(135deg,#9AA87A_0%,#7E8B63_100%)]
                shadow-[0_12px_28px_rgba(0,0,0,0.12)]"
          >
            {/* ไฮไลต์เบา ๆ ด้านมุมขวา */}
            <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />

            {/* Header row */}
            <div className="flex items-start justify-between">
              <h3 className="text-lg lg:text-2xl font-semibold tracking-tight">
                Weight
              </h3>
              <span
                className={`inline-flex items-center gap-1.5 text-white rounded-full px-3 py-1 text-xs font-medium
                  ${
                    bodyGoal === "maintain"
                      ? "bg-black"
                      : bodyGoal === "lose"
                      ? "bg-black"
                      : "bg-black"
                  }`}
              >
                {bodyGoal === "lose" ? (
                  <TbArrowDownRight size={14} />
                ) : bodyGoal === "gain" ? (
                  <TbArrowUpRight size={14} />
                ) : (
                  <TbTargetArrow size={14} />
                )}
                {goalLabel}
              </span>
            </div>

            {/* Current weight */}
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-extrabold leading-none tracking-tight">
                {realWeight ?? "—"}
              </span>
              <span className="text-xl md:text-2xl font-semibold opacity-90">
                kg
              </span>
            </div>

            {/* Target / remaining */}
            {bodyGoal !== "maintain" && (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="inline-flex items-center gap-1.5 opacity-95">
                  <TbTargetArrow className="shrink-0" />
                  <span className="font-semibold">Target</span>
                  <span className="font-medium">{goalWeight ?? "—"} kg</span>
                </span>

                {hasTarget && remainingKg != null && (
                  <span
                    className={`inline-flex items-center gap-1.5 ${
                      remainingKg > 0 ? "opacity-95" : "text-black"
                    }`}
                  >
                    <span className="mx-1">•</span>
                    {remainingKg > 0 ? (
                      <span className="font-medium">
                        {remainingKg} kg to go
                      </span>
                    ) : (
                      <>
                        <TbCheck className="shrink-0" />
                        <span className="font-medium">Reached</span>
                      </>
                    )}
                  </span>
                )}
              </div>
            )}

            {/* CTA */}
            <a
              href="/edit"
              className="group mt-4 inline-flex items-center gap-1 text-sm font-medium text-black"
            >
              Adjust goal
              <TbChevronRight className="transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
        {macroTargets && (
          <section className="pt-5 lg:pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {/* Protein */}
              <div
                className="relative min-w-0 overflow-hidden rounded-3xl sm:rounded-4xl p-5 sm:p-6 lg:p-7 text-black
        bg-[linear-gradient(135deg,#B8C6D9_0%,#8FA4BC_100%)]
        shadow-[0_12px_28px_rgba(0,0,0,0.12)]"
              >
                <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/20 blur-2xl" />
                <h3 className="text-lg lg:text-2xl font-semibold tracking-tight">
                  Protein
                </h3>
                <h3 className="text-[13px] font-semibold">Consumed today</h3>
                <div className="mt-2 flex items-baseline gap-2 pb-2">
                  <span className="text-3xl sm:text-4xl font-extrabold leading-none tracking-tight">
                    {fmtG(todayMacros.protein)}
                  </span>
                </div>
                {/* <p className="mt-2 text-sm opacity-90">
                  ≈ {macroTargets.protein.kcal.toLocaleString("th-TH")} kcal •{" "}
                  {macroTargets.protein.ratio}%
                </p> */}
                <div className="flex items-center gap-2 text-sm">
                  <GiChickenLeg />
                  <span className="font-medium">Daily target</span>
                  <span className="font-medium">
                    {macroTargets.protein.grams} g
                  </span>
                </div>
                {/* Remaining / Over-by */}
                <span className="mt-1 inline-flex items-center gap-1 font-medium text-sm">
                  {remaining.protein.over > 0 ? (
                    <TbArrowUpRight size={14} />
                  ) : (
                    <TbArrowDownRight size={14} />
                  )}
                  {remaining.carbs.over > 0
                    ? `Over by ${fmtG2(remaining.protein.over)}`
                    : `Remaining ${fmtG2(remaining.protein.left)}`}
                </span>
              </div>

              {/* Carbs */}
              <div
                className="relative min-w-0 overflow-hidden rounded-3xl sm:rounded-4xl p-5 sm:p-6 lg:p-7 text-black
        bg-[linear-gradient(135deg,#E5D9B8_0%,#CDBB8B_100%)]
        shadow-[0_12px_28px_rgba(0,0,0,0.12)]"
              >
                <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/20 blur-2xl" />
                <h3 className="text-lg lg:text-2xl font-semibold tracking-tight">
                  Carbs
                </h3>
                <h3 className="text-[13px] font-semibold">Consumed today</h3>
                <div className="mt-2 flex items-baseline gap-2 pb-2">
                  <span className="text-3xl sm:text-4xl font-extrabold leading-none tracking-tight">
                    {fmtG(todayMacros.carbs)}
                  </span>
                </div>
                {
                  /* <p className="mt-2 text-sm opacity-90">
                  ≈ {macroTargets.carbs.kcal.toLocaleString("th-TH")} kcal •{" "}
                  {macroTargets.carbs.ratio}%
                </p> */
                  <div className="flex items-center gap-2 text-[13px]">
                    <MdBakeryDining size={20} />
                    <span className="font-medium">Daily target</span>
                    <span className="font-medium">
                      {macroTargets.carbs.grams} g
                    </span>
                  </div>
                }
                {/* Remaining / Over-by */}
                <span className="mt-1 inline-flex items-center gap-1 font-medium text-sm">
                  {remaining.carbs.over > 0 ? (
                    <TbArrowUpRight size={14} />
                  ) : (
                    <TbArrowDownRight size={14} />
                  )}
                  {remaining.carbs.over > 0
                    ? `Over by ${fmtG2(remaining.carbs.over)}`
                    : `Remaining ${fmtG2(remaining.carbs.left)}`}
                </span>
              </div>

              {/* Fat */}
              <div
                className="relative overflow-hidden rounded-3xl sm:rounded-4xl p-5 sm:p-6 lg:p-7 text-black
  bg-[linear-gradient(135deg,#D7BBB6_0%,#B48880_100%)]
  shadow-[0_12px_28px_rgba(0,0,0,0.12)]
  md:col-span-2 xl:col-span-1"
              >
                <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/18 blur-2xl" />
                <h3 className="text-lg lg:text-2xl font-semibold tracking-tight">
                  Fat
                </h3>
                <h3 className="text-[13px] font-semibold">Consumed today</h3>
                <div className="mt-2 flex items-baseline gap-2 pb-2">
                  <span className="text-3xl sm:text-4xl font-extrabold leading-none tracking-tight">
                    {fmtG(todayMacros.fat)}
                  </span>
                </div>
                {/* <p className="mt-2 text-sm opacity-90">
                  ≈ {macroTargets.fat.kcal.toLocaleString("th-TH")} kcal •{" "}
                  {macroTargets.fat.ratio}%
                </p> */}
                <div className="flex items-center gap-2 text-[13px]">
                  <FaTint />
                  <span className="font-medium">Daily target</span>
                  <span className="font-medium">
                    {macroTargets.fat.grams} g
                  </span>
                </div>
               {/* Remaining / Over-by */}
                <span className="mt-1 inline-flex items-center gap-1 font-medium text-sm">
                  {remaining.fat.over > 0 ? (
                    <TbArrowUpRight size={14} />
                  ) : (
                    <TbArrowDownRight size={14} />
                  )}
                  {remaining.carbs.over > 0
                    ? `Over by ${fmtG2(remaining.fat.over)}`
                    : `Remaining ${fmtG2(remaining.fat.left)}`}
                </span> 
              </div>
            </div>
          </section>
        )}
      </section>

      {/* ===== Chart ===== */}
      <section className="pt-10 sm:pb-0 min-w-0">
        {/* ป้าย Y-axis */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-[15px] font-semibold text-[#000]">
            Calories (kcal)
          </span>
        </div>

        <div
          ref={chartWrapRef}
          className="w-full h-[300px] sm:h-[340px] lg:h-[360px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            {(() => {
              const goal = Number(caloriesDaily?.dailyCalorieGoal ?? 1800);
              const maxActual =
                graphData.reduce(
                  (m, d) => Math.max(m, Number(d.actual || 0)),
                  0
                ) || 0;
              const yMax = Math.ceil(Math.max(goal, maxActual) / 100) * 100;

              return (
                <BarChart
                  data={graphData}
                  margin={{ top: 10, right: 12, bottom: 28, left: 8 }}
                  barCategoryGap={catGap}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "#333" }}
                    tickMargin={8}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, yMax]}
                    tickFormatter={(v) => v.toLocaleString("th-TH")}
                    tick={{ fontSize: 12, fill: "#333" }}
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    content={<CaloriesTooltip goal={goal} />}
                  />
                  <ReferenceLine
                    y={goal}
                    stroke="#909090"
                    strokeDasharray="4 4"
                    ifOverflow="extendDomain"
                    label={{
                      value: `Goal ${fmtKcal(goal)}`,
                      position: "right",
                      offset: 10,
                      fill: "#5f5f5f",
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="within"
                    stackId="a"
                    barSize={barSize}
                    radius={[0, 0, 16, 16]}
                  >
                    {graphData.map((d, i) => (
                      <Cell
                        key={i}
                        fill={d.status === "low" ? COLORS.low : COLORS.ok}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="over"
                    stackId="a"
                    fill={COLORS.over}
                    barSize={barSize}
                    radius={[16, 16, 0, 0]}
                  />
                  <Bar
                    dataKey="remaining"
                    stackId="a"
                    fill={COLORS.remaining}
                    barSize={barSize}
                    radius={[16, 16, 0, 0]}
                  />
                </BarChart>
              );
            })()}
          </ResponsiveContainer>
        </div>
        <div className="mt-3 pb-5 w-full flex flex-wrap justify-center items-center gap-x-8 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3.5 h-3.5 rounded-sm"
              style={{ backgroundColor: COLORS.ok }}
              aria-hidden
            />
            <span>On target</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3.5 h-3.5 rounded-sm"
              style={{ backgroundColor: COLORS.low }}
              aria-hidden
            />
            <span>Not enough</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3.5 h-3.5 rounded-sm"
              style={{ backgroundColor: COLORS.over }}
              aria-hidden
            />
            <span>Over target</span>
          </div>
        </div>
      </section>

      {/* Mobile overlay menu (no scroll) */}
      <div
        className={`lg:hidden fixed inset-0 z-[150] bg-[#2C2C2C] text-white transition-all duration-500
    ${
      isMenuOpen
        ? "translate-x-0 opacity-100"
        : "-translate-x-full opacity-0 pointer-events-none"
    }
  h-dvh overflow-hidden overscroll-none`} // สำคัญ!
        role="dialog"
        aria-modal="true"
        aria-label="Mobile menu"
      >
        <div className="mx-auto w-full max-w-md h-full flex flex-col">
          {/* profile: ย่อให้พอดีจอเล็ก */}
          <div className="px-4 pt-30 pb-4 flex flex-col items-center gap-4">
            {profileImage ? (
              <img
                src={profileImage}
                className="rounded-full border w-25 h-24 sm:w-24 sm:h-24 object-cover"
                alt=""
              />
            ) : (
              <div className="rounded-full border w-16 h-16 sm:w-24 sm:h-24 bg-white/10" />
            )}
            <div className="text-center leading-tight">
              <p className="font-light text-[11px] sm:text-[12px]">
                Welcome Back
              </p>
              <h1 className="font-cocoPro text-base sm:text-lg">
                {userData?.user?.name ?? "Loading..."}
              </h1>
            </div>
          </div>

          {/* nav: กินพื้นที่กลางพอดี ไม่สกอร์ */}
          <nav className="px-3 sm:px-6 flex-1">
            <ul className="grid grid-cols-1 gap-3">
              {menuList.slice(0, 5).map((it, i) => (
                <li key={i}>
                  <Link
                    to={it.href}
                    className="flex items-center gap-3 sm:gap-4 px-3 py-2 sm:px-5 sm:py-3 rounded-lg hover:bg-white/10 leading-none"
                  >
                    {it.icon}
                    <span className="text-[14px] sm:text-[15px]">
                      {it.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* sign out: ชิดล่าง + กัน safe area */}
          <div className="px-3 sm:px-6 pb-[max(12px,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 sm:gap-4 px-3 py-2 sm:px-5 sm:py-3 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 leading-none"
              aria-label="Sign out"
              title="Sign out"
            >
              <MdOutlineLogout size={23} />
              <span className="text-[14px] sm:text-[15px]">Sign out</span>
            </button>
          </div>
        </div>
      </div>
      {/* Modal: Edit Weight current (UI only) */}
      {editOpen && (
        <div
          className="fixed inset-0 z-[180] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-weight-title"
        >
          {/* ชั้นทับ: มืด + เบลอ */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !saving && setEditOpen(false)}
          />

          {/* กล่องป๊อปอัป */}
          <div className="relative z-[181] w-[90%] max-w-sm bg-white rounded-2xl shadow-xl p-5">
            <h3 id="edit-weight-title" className="text-lg font-semibold mb-3">
              Edit Current Weight
            </h3>

            <label className="text-sm text-gray-600">Weight (kg)</label>
            <input
              ref={inputRef}
              type="number"
              step="0.1"
              min="1"
              max="500"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 outline-none"
              placeholder="เช่น 52.5"
              disabled={saving}
            />

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setEditOpen(false)}
                disabled={saving}
                className="flex-1 cursor-pointer border rounded-full py-2 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={saveWeight}
                disabled={saving}
                className="flex-1 cursor-pointer rounded-full py-2 bg-[#C0B275] text-white hover:bg-[#ac9f66] disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>

            <p className="mt-3 text-center text-[11px] text-gray-500">
              * For comparison only — doesn’t update your account weight.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
