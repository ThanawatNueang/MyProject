import { useEffect, useState, useRef, useCallback } from "react";
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
import { IoHome, IoFastFoodSharp } from "react-icons/io5";
import { RiFolderUploadFill, RiDashboardFill } from "react-icons/ri";
import { MdFoodBank, MdOutlineLogout } from "react-icons/md";
import { eatingHistory } from "../API/eatingHistory.js";

const backendURL = "http://100.100.45.89:3201";
const LS_CURRENT_WEIGHT = "ui:weightCurrent";

// ===== config สี & เกณฑ์ =====
const COLORS = {
  ok: "#2C2C2C",
  low: "#B0A7C6",
  over: "#9E3F32",
  remaining: "#D9D9D9",
};
const LOW_RATIO = 0.3; // <30% ของ goal = น้อยเกินไป

// ===== helpers =====
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
        <span>{fmtKcal(goal)}</span>
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
    { label: "Nutrition", icon: <IoFastFoodSharp size={20} />, href: "/" },
    {
      label: "Profile Settings",
      icon: <MdFoodBank size={20} />,
      href: "/edit",
    },
  ];

  return (
    <div className="flex flex-col w-full min-w-0">
      <div className="flex items-center gap-8">
        <div
          className="lg:hidden text-3xl cursor-pointer relative z-[160]"
          onClick={() => setIsMenuOpen((v) => !v)}
        >
          <TbMenu3 className={isMenuOpen ? "text-white" : "text-black"} />
        </div>
        <div className="font-cocoPro">
          <h1 className="text-[20px]">Dashboard</h1>
          <p className="text-[15px] text-[#9F9F9F]">nutrition Updates</p>
        </div>
      </div>

      {/* cards */}
      <section className="pt-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-7">
          <div className="flex flex-col gap-3 justify-center px-6 lg:px-8 bg-[#C0B275] h-45 text-[#2C2C2C] rounded-4xl">
            <p className="poppins-semibold text-lg lg:text-2xl">
              Calories Today
            </p>
            <p className="text-[26px] xl:text-[25px] poppins-semibold">
              {summaryCalories?.calories ?? "Loading..."} Kcal
            </p>
            <div className="flex items-center gap-2">
              <p className="poppins-semibold text-md">Goal</p>
              <p className="poppins-semibold text-sm">
                {caloriesDaily?.dailyCalorieGoal ?? "Loading..."} Kcal
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 justify-center px-6 lg:px-8 bg-[#909C6F] text-[#2C2C2C] h-45 rounded-4xl">
            <p className="poppins-semibold text-lg lg:text-2xl">Weight</p>
            <p className="text-[26px] lg:text-[25px] poppins-semibold">
              {realWeight != null ? `${realWeight} Kg` : "Loading..."}
            </p>
            {/* ✅ แสดง Goal เฉพาะเมื่อไม่ใช่ maintain */}
            {bodyGoal !== "maintain" && (
              <div className="flex items-center gap-2">
                <p className="poppins-semibold text-md">Goal</p>
                <p className="poppins-semibold text-sm">
                  {goalWeight != null ? `${goalWeight} kg` : "—"}
                </p>
              </div>
            )}
          </div>
        </div>
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

      {/* Mobile overlay menu */}
      <div
        className={`lg:hidden fixed inset-0 z-[150] bg-[#2C2C2C] text-white transform transition-all duration-500 ${
          isMenuOpen
            ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col gap-7 items-center pt-24 pb-10">
          <Link to="/" className="text-3xl font-prompt">
            Calorie Paws
          </Link>
          {profileImage ? (
            <img
              src={profileImage}
              className="rounded-full border w-32 h-32 object-cover"
              alt=""
            />
          ) : (
            <div className="rounded-full border w-32 h-32 bg-white/10" />
          )}
          <div className="text-center">
            <p className="font-light text-[13px]">Welcome Back</p>
            <h1 className="font-cocoPro text-xl">
              {userData?.user?.name ?? "Loading..."}
            </h1>
          </div>
        </div>
        <nav>
          {menuList.slice(0, 4).map((it, i) => (
            <Link
              key={i}
              to={it.href}
              className="flex items-center gap-5 px-8 py-4 hover:bg-white hover:text-black"
            >
              {it.icon} <span>{it.label}</span>
            </Link>
          ))}
        </nav>
        <div className="px-8 py-8 flex items-center gap-4">
          <MdOutlineLogout size={23} /> <span>Sign out</span>
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
