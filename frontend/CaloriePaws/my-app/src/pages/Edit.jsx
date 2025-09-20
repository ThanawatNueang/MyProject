import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { userPreview, userUpdateMe } from "../Components/API/user";
import { FaMale, FaFemale, FaWeight, FaCalendarAlt } from "react-icons/fa";
import { GiBodyHeight } from "react-icons/gi";

// Exercise maps
const MAP_UI_2_API = {
  sedentary: "no_exercise",
  light: "light_activity",
  moderate: "moderate_activity",
  active: "active",
  very_active: "very_active",
};
const MAP_API_2_UI = {
  no_exercise: "sedentary",
  light_activity: "light",
  moderate_activity: "moderate",
  active: "active",
  very_active: "very_active",
};

// Fitness goal maps
const MAP_GOAL_UI_2_API = {
  lose: "lose_weight",
  gain: "gain_weight",
  maintain: "maintain_weight",
};
const MAP_GOAL_API_2_UI = {
  lose_weight: "lose",
  gain_weight: "gain",
  maintain_weight: "maintain",
};

const calcAge = (date) => {
  if (!date) return "";
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
  return age;
};

export const Edit = () => {
  const navigate = useNavigate();

  const [snap, setSnap] = useState(null);

  // form state
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [birthDate, setBirthDate] = useState(null);
  const [gender, setGender] = useState("");
  const [lifestyle, setLifestyle] = useState("");
  const [bodyGoal, setBodyGoal] = useState(""); // <- fitness goal (lose/gain/maintain)
  const [weightGoal, setWeightGoal] = useState(""); // เป้าหมายน้ำหนัก (เลข kg)

  const age = useMemo(() => calcAge(birthDate), [birthDate]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [targetError, setTargetError] = useState(""); // ข้อความ error เป้าหมาย

  useEffect(() => {
    if (bodyGoal === "maintain") {
      setWeightGoal(""); // ล้างค่าในช่อง
      setTargetError(""); // ล้าง error
    }
  }, [bodyGoal]);

  function toNum(x) {
    const n = Number(x);
    return Number.isFinite(n) ? n : NaN;
  }

  function validateTarget(goal, currentWeight, target) {
    const cw = toNum(currentWeight);
    const tw = toNum(target);

    // ไม่ได้เลือก goal หรือเลือก maintain → ไม่ต้อง validate
    if (!goal || goal === "maintain") return "";

    // ยังไม่ได้กรอกตัวเลข
    if (!Number.isFinite(tw) || tw <= 0) {
      return "Please enter a valid target weight.";
    }
    if (!Number.isFinite(cw) || cw <= 0) {
      return "Please enter your current weight first.";
    }

    if (goal === "gain" && tw <= cw) {
      return "For gaining weight, target must be greater than your current weight.";
    }
    if (goal === "lose" && tw >= cw) {
      return "For losing weight, target must be less than your current weight.";
    }
    return "";
  }

  // initial load
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await userPreview();
        const u = res?.user || res?.data || {};
        console.log(
          "raw birth:",
          u.birthDate,
          u.birthdate,
          u.dob,
          typeof u.birthDate
        );

        const snapData = {
          height: u.height ?? "",
          weight: u.weight ?? "",
          birthDate: parseBirthDate(u.birthDate || u.birthdate || u.dob),
          gender: u.gender ?? "",
          lifestyle: MAP_API_2_UI[u.exerciseFrequency] ?? "",
          bodyGoal: MAP_GOAL_API_2_UI[u.bodyGoal] ?? "",
          weightGoal: u.fitnessGoal ?? "",
        };
        setSnap(snapData);

        setHeight(String(snapData.height || ""));
        setWeight(String(snapData.weight || ""));
        setBirthDate(snapData.birthDate);
        setGender(snapData.gender || "");
        setLifestyle(snapData.lifestyle || "");
        setBodyGoal(snapData.bodyGoal || "");
        setWeightGoal(String(snapData.weightGoal || ""));
      } catch (e) {
        console.log("โหลดข้อมูลผู้ใช้ไม่สำเร็จ:", e?.message || e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function parseBirthDate(raw) {
    if (!raw) return null;

    // กรณีส่งมาเป็น number หรือสตริงตัวเลข (timestamp)
    if (typeof raw === "number" || /^\d+$/.test(String(raw))) {
      const d = new Date(Number(raw));
      return isNaN(d) ? null : d;
    }

    // สตริง ISO หรือ yyyy-mm-dd (ส่วนใหญ่จะผ่าน)
    let d = new Date(raw);
    if (!isNaN(d)) return d;

    // รูปแบบ dd/mm/yyyy
    const m1 = String(raw).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m1) {
      const [_, dd, mm, yyyy] = m1;
      d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
      return isNaN(d) ? null : d;
    }

    // รูปแบบ dd-mm-yyyy
    const m2 = String(raw).match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (m2) {
      const [_, dd, mm, yyyy] = m2;
      d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
      return isNaN(d) ? null : d;
    }

    return null;
  }

  const targetValidationMsg = useMemo(() => {
    return validateTarget(bodyGoal, weight, weightGoal);
  }, [bodyGoal, weight, weightGoal]);

  useEffect(() => {
    setTargetError(targetValidationMsg);
  }, [targetValidationMsg]);

  const hasChanged = useMemo(() => {
    if (!snap) return false;
    const d1 = toYMD(birthDate);
    const d0 = toYMD(snap.birthDate);

    // ต้องนับ weightGoal ก็ต่อเมื่อ goal ปัจจุบันหรือค่าใน snap เป็น lose/gain
    const goalNeedsTargetNow = bodyGoal === "lose" || bodyGoal === "gain";
    const snapNeededTarget =
      snap.bodyGoal === "lose" || snap.bodyGoal === "gain";
    const considerTarget = goalNeedsTargetNow || snapNeededTarget;

    return (
      String(height) !== String(snap.height ?? "") ||
      String(weight) !== String(snap.weight ?? "") ||
      d1 !== d0 ||
      String(gender) !== String(snap.gender ?? "") ||
      String(lifestyle) !== String(snap.lifestyle ?? "") ||
      String(bodyGoal) !== String(snap.bodyGoal ?? "") ||
      (considerTarget && String(weightGoal) !== String(snap.weightGoal ?? ""))
    );
  }, [
    snap,
    height,
    weight,
    birthDate,
    gender,
    lifestyle,
    bodyGoal,
    weightGoal,
  ]);

  const requireTargetNow = useMemo(() => {
    if (!snap) return bodyGoal === "lose" || bodyGoal === "gain";
    const changedGoal = String(bodyGoal) !== String(snap.bodyGoal ?? "");
    return changedGoal && (bodyGoal === "lose" || bodyGoal === "gain");
  }, [snap, bodyGoal]);

  const mustHaveTarget = bodyGoal === "lose" || bodyGoal === "gain";
  const disabled =
    !hasChanged ||
    // ถ้าเป้าหมายจำเป็นต้องมี (เพิ่งเปลี่ยนเป็น lose/gain) แต่ยังไม่ได้กรอก
    (requireTargetNow && !weightGoal) ||
    // ถ้ามี error ใดๆ เกี่ยวกับ target
    !!targetValidationMsg;

  function toYMD(dt) {
    if (!dt) return "";
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const onSave = async () => {
    if (disabled || saving || !snap) return;

    try {
      setSaving(true);

      const payload = {};
      const d1 = toYMD(birthDate);
      const d0 = toYMD(snap.birthDate);

      // 1) ฟิลด์ที่เปลี่ยนจริงเท่านั้น
      if (String(height) !== String(snap.height ?? ""))
        payload.height = Number(height);
      if (String(weight) !== String(snap.weight ?? ""))
        payload.weight = Number(weight);
      if (d1 !== d0 && birthDate) payload.birthdate = d1;
      if (String(gender) !== String(snap.gender ?? "")) payload.gender = gender;
      if (String(lifestyle) !== String(snap.lifestyle ?? "")) {
        payload.exerciseFrequency = MAP_UI_2_API[lifestyle];
      }
      if (String(bodyGoal) !== String(snap.bodyGoal ?? "")) {
        payload.bodyGoal = MAP_GOAL_UI_2_API[bodyGoal];
      }

      // 2) จัดการ Target weight เฉพาะเมื่อ goal = lose/gain เท่านั้น
      if (mustHaveTarget) {
        // validate รอบสุดท้ายก่อนส่ง
        const msg = validateTarget(bodyGoal, weight, weightGoal);
        if (msg) {
          setTargetError(msg);
          alert(msg);
          setSaving(false);
          return;
        }

        // เพิ่งเปลี่ยน goal เป็น lose/gain → target ต้องมี
        if (requireTargetNow) {
          if (!weightGoal) {
            alert("Please enter a target weight for this goal.");
            setSaving(false);
            return;
          }
          payload.fitnessGoal = Number(weightGoal);
        } else if (
          // ไม่ได้เปลี่ยน goal แต่มีการแก้ target → อัปเดต
          String(weightGoal) !== String(snap.weightGoal ?? "") &&
          weightGoal !== ""
        ) {
          payload.fitnessGoal = Number(weightGoal);
        }
        // ถ้าไม่ได้แก้อะไรเกี่ยวกับ target เลย ก็ไม่ต้องใส่ fitnessGoal
      }
      // ถ้าเป็น maintain → ไม่ใส่ fitnessGoal เด็ดขาด

      // 3) กัน payload ว่าง
      if (Object.keys(payload).length === 0) {
        alert("No changes to save.");
        setSaving(false);
        return;
      }

      // 4) เรียก API
      await userUpdateMe(payload);

      // 5) sync snapshot
      setSnap({
        ...snap,
        height: payload.height ?? snap.height,
        weight: payload.weight ?? snap.weight,
        birthDate: payload.birthdate
          ? new Date(payload.birthdate)
          : snap.birthDate,
        gender: payload.gender ?? snap.gender,
        lifestyle, // ใช้ค่าล่าสุดจาก UI
        bodyGoal, // ใช้ค่าล่าสุดจาก UI
        weightGoal:
          typeof payload.fitnessGoal !== "undefined"
            ? payload.fitnessGoal
            : snap.weightGoal,
      });

      navigate("/dashboard");
    } catch (e) {
      console.log("บันทึกไม่สำเร็จ:", e?.message || e);
      alert("บันทึกไม่สำเร็จ ลองอีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center container p-10">
        <div className="text-5xl font-prompt">Loading profile…</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="max-w-3xl mx-auto px-6 pb-16">
        <h1 className="font-prompt text-3xl lg:text-5xl text-center mb-8">
          Profile Settings
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Height */}
          <label className="w-full">
            <span className="block mb-1 text-sm font-bold">Height (cm)</span>
            <div className="relative">
              <GiBodyHeight
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#696969] pointer-events-none"
              />
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                className="w-full shadow-sm rounded-full py-3 pl-9 pr-4 outline-none border border-[#e8e8e8] text-sm"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g. 170"
              />
            </div>
          </label>

          {/* Weight */}
          <label className="w-full">
            <span className="block mb-1 text-sm font-bold">Weight (kg)</span>
            <div className="relative">
              <FaWeight
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#696969] pointer-events-none"
              />
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                className="w-full shadow-sm rounded-full py-3 pl-9 pr-4 outline-none border border-[#e8e8e8] text-sm"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 65"
              />
            </div>
          </label>

          {/* Birthdate */}
          <label className="w-full">
            <span className="block mb-1 text-sm font-bold">Birth date</span>
            <div className="relative">
              <FaCalendarAlt
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#696969] pointer-events-none"
              />
              <DatePicker
                selected={birthDate}
                onChange={setBirthDate}
                dateFormat="MM/dd/yyyy"
                showYearDropdown
                scrollableYearDropdown
                yearDropdownItemNumber={100}
                maxDate={new Date()}
                className="shadow-sm rounded-full py-3 pl-9 pr-4 outline-none border border-[#e8e8e8] text-sm w-full"
                wrapperClassName="w-full" // << เพิ่มตรงนี้
                placeholderText="Select your birth date"
              />
            </div>
          </label>

          {/* Age */}
          <label className="w-full">
            <span className="block mb-1 text-sm font-bold">Age</span>
            <input
              type="text"
              readOnly
              value={age}
              className="w-full shadow-sm rounded-full py-3 px-4 outline-none border border-[#e8e8e8] text-sm bg-gray-50"
              placeholder="-"
            />
          </label>

          {/* Gender */}
          <div className="sm:col-span-2 text-center">
            <span className="block mb-2 text-sm font-bold">Gender</span>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                className={`rounded-full px-4 py-4 flex items-center gap-2 ${
                  gender === "male" ? "bg-[#9FD3F9] text-white" : "bg-gray-200"
                }`}
                onClick={() => setGender("male")}
              >
                <FaMale />
              </button>
              <button
                type="button"
                className={`rounded-full px-4 py-4 flex items-center gap-2 ${
                  gender === "female"
                    ? "bg-[#F99FF7] text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => setGender("female")}
              >
                <FaFemale />
              </button>
            </div>
          </div>

          {/* Lifestyle */}
          <div className="sm:col-span-2">
            <span className="block mb-2 text-sm font-bold">Lifestyle</span>
            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  value: "sedentary",
                  label: "Sedentary (little or no exercise)",
                },
                { value: "light", label: "Lightly active (1–2 days/week)" },
                {
                  value: "moderate",
                  label: "Moderately active (3–5 days/week)",
                },
                { value: "active", label: "Active (6–7 days/week)" },
                {
                  value: "very_active",
                  label: "Very active (hard exercise / demanding job)",
                },
              ].map((opt) => (
                <label key={opt.value} className="block">
                  <input
                    type="radio"
                    name="lifestyle"
                    className="hidden peer"
                    checked={lifestyle === opt.value}
                    onChange={() => setLifestyle(opt.value)}
                  />
                  <div
                    className={`w-full py-3 px-5 border rounded-full text-sm cursor-pointer ${
                      lifestyle === opt.value
                        ? "bg-black text-white"
                        : "bg-white border-[#e8e8e8]"
                    }`}
                  >
                    {opt.label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Fitness goal (ใส่ต่อท้าย Lifestyle ตามที่ขอ) */}
          <div className="sm:col-span-2">
            <span className="block mb-2 text-sm font-bold">Fitness goal</span>
            <div className="grid grid-cols-1 gap-3">
              {[
                { value: "lose", label: "Lose weight" },
                { value: "gain", label: "Gain weight" },
                { value: "maintain", label: "Maintain weight" },
              ].map((opt) => (
                <label key={opt.value} className="block">
                  <input
                    type="radio"
                    name="fitness_goal"
                    className="hidden peer"
                    checked={bodyGoal === opt.value}
                    onChange={() => setBodyGoal(opt.value)}
                  />
                  <div
                    className={`w-full py-3 px-5 border rounded-full text-sm cursor-pointer ${
                      bodyGoal === opt.value
                        ? "bg-black text-white"
                        : "bg-white border-[#e8e8e8]"
                    }`}
                    onClick={() => setBodyGoal(opt.value)}
                  >
                    {opt.label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Target weight (enable เมื่อเลือก lose/gain) */}
          {mustHaveTarget && (
            <label className="w-full sm:col-span-2">
              <span className="block mb-1 text-sm font-bold">
                Target weight (kg)
              </span>
              <div className="relative">
                <FaWeight
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#696969] pointer-events-none"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  className={`w-full shadow-sm rounded-full py-3 pl-9 pr-4 outline-none border text-sm ${
                    targetError
                      ? "border-red-400 bg-white"
                      : "border-[#e8e8e8] bg-white"
                  }`}
                  value={weightGoal}
                  onChange={(e) => setWeightGoal(e.target.value)}
                  placeholder="e.g. 45"
                />
              </div>
              {targetError && (
                <p className="text-xs text-red-500 mt-1">{targetError}</p>
              )}
            </label>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            className="w-full rounded-full py-3 border border-gray-300"
            onClick={() => navigate(-1)}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`w-full rounded-full py-3 ${
              !disabled ? "bg-black text-white" : "bg-gray-300 text-white"
            }`}
            onClick={onSave}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};
