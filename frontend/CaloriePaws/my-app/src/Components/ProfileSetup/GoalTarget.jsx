import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { FaWeightScale } from "react-icons/fa6";
import { userPreview, userUpdateMe } from "../API/user";

export const GoalTarget = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const goalFromState = state?.goal || ""; // "lose" | "gain" | "maintain"
  const [goal, setGoal] = useState(goalFromState);

  const [kg, setKg] = useState("");
  const [currentWeight, setCurrentWeight] = useState(null); // ดึงจาก backend เพื่อตรวจตรรกะ
  const [loading, setLoading] = useState(false);

  // inline error + touched
  const [errors, setErrors] = useState({ kg: "", form: "" });
  const [touched, setTouched] = useState({ kg: false });

  // ดึงค่าจาก LS + backend
  useEffect(() => {
    let mounted = true;

    // goal จาก LS (ถ้าไม่มีใน state)
    if (!goalFromState) {
      const fg = localStorage.getItem("FitnessGoalData");
      if (fg) {
        try {
          const parsed = JSON.parse(fg);
          if (parsed?.goal) setGoal(parsed.goal);
        } catch {}
      }
    }
    // kg จาก LS
    const saved = localStorage.getItem("GoalTargetData");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.kg != null) setKg(String(parsed.kg));
      } catch {}
    }

    (async () => {
      try {
        const userData = await userPreview();
        if (!mounted) return;
        const profile = userData?.user || userData?.data || userData || {};
        if (profile?.weight != null) setCurrentWeight(Number(profile.weight));
        if (profile?.fitnessGoal != null) {
          setKg(String(profile.fitnessGoal));
          localStorage.setItem("GoalTargetData", JSON.stringify({ kg: profile.fitnessGoal }));
        }
      } catch (err) {
        console.log("โหลดข้อมูลผู้ใช้ไม่สำเร็จ:", err?.message || err);
      }
    })();

    return () => { mounted = false; };
  }, [goalFromState]);

  // ปรับ input: รับเฉพาะตัวเลข ทศนิยมเดียว รองรับคอมมา
  const handleKgChange = (e) => {
    let val = e.target.value.replace(",", ".").trim();
    // อนุญาตเลขล้วน ทศนิยมเดียว หรือค่าว่าง
    if (/^\d*\.?\d*$/.test(val)) {
      setKg(val);
      if (touched.kg) validateKg(val, goal, currentWeight); // validate real-time หลังแตะแล้ว
    }
  };

  const validateKg = (val, goalType, cw) => {
    const msg = (() => {
      if (val === "") return ""; // ยังไม่โชว์ error จนกว่าจะพิมพ์อะไรแล้ว blur
      const num = Number(val);
      if (!Number.isFinite(num)) return "Please enter a valid number.";
      if (num <= 0) return "Target must be greater than 0.";
      if (num < 20 || num > 300) return "Target should be between 20–300 kg.";

      // ตรรกะตาม goal (มี currentWeight ถึงจะเช็คได้)
      if (cw && Number.isFinite(cw)) {
        if (goalType === "lose" && num >= cw) return "For losing weight, target must be lower than your current weight.";
        if (goalType === "gain" && num <= cw) return "For gaining weight, target must be higher than your current weight.";
        // maintain: ไม่บังคับ แต่ถ้าอยากเข้ม ให้: Math.abs(num - cw) <= 1
      }
      return "";
    })();
    setErrors((p) => ({ ...p, kg: msg }));
    return msg === "";
  };

  const onKgBlur = () => {
    setTouched((t) => ({ ...t, kg: true }));
    validateKg(kg, goal, currentWeight);
  };

  const isNextDisabled = useMemo(() => {
    const hasError = !!errors.kg;
    const empty = kg.trim() === "";
    return loading || empty || hasError;
  }, [kg, loading, errors.kg]);

  const handleNext = async () => {
    if (loading) return;
    // final validate
    const ok = validateKg(kg, goal, currentWeight);
    if (!ok) return;

    try {
      setLoading(true);
      const num = Number(kg);
      const res = await userUpdateMe({ fitnessGoal: num });
      const confirmed = res?.user?.fitnessGoal;
      const finalKg = typeof confirmed === "number" ? confirmed : num;

      localStorage.setItem("GoalTargetData", JSON.stringify({ kg: finalKg }));
      navigate("/profile-setting");
    } catch (err) {
      console.log("อัปเดตไม่สำเร็จ:", err?.message || err);
      setErrors((p) => ({ ...p, form: "Save failed. Please try again." }));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate("/finessgoals");

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center pt-10 py-6">
          <Link to="/" className="text-xl lg:text-3xl font-prompt cursor-pointer">
            Calorie
            <span className="relative inline-block">
              <div className="oval oval1 absolute"></div>
              <div className="oval oval2 absolute"></div>
              <div className="oval oval3 absolute"></div>
              <div className="oval oval4 absolute"></div>
              <div className="oval oval5 absolute"></div>
              Paws
            </span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-screen-md px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:gap-10 items-center w-full py-8 sm:py-10">
          <div className="flex rounded-full p-3 sm:p-4 shadow-lg border-[0.5px] border-[#e4e4e4]">
            <FaWeightScale className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          <h1 className="font-Medi text-3xl sm:text-4xl text-center leading-snug">
            {goal === "lose"
              ? "What would be your ideal weight?"
              : goal === "gain"
              ? "What would be your ideal gain?"
              : "What would be your ideal weight?"}
          </h1>

          <div className="flex flex-col w-full gap-4 sm:gap-5">
            {/* Target kg */}
            <div className="flex flex-col gap-1 sm:gap-2 w-full items-center">
              <div className="w-full max-w-md">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  placeholder="Enter amount in kg"
                  value={kg}
                  onChange={handleKgChange}
                  onBlur={onKgBlur}
                  aria-invalid={touched.kg && !!errors.kg}
                  className={`w-full shadow-sm rounded-full py-3 px-6 outline-none border text-sm ${
                    touched.kg && errors.kg ? "border-red-500" : "border-[#e8e8e8]"
                  }`}
                />
                {touched.kg && errors.kg && (
                  <p role="alert" className="text-red-600 text-xs mt-1">{errors.kg}</p>
                )}
                {!errors.kg && currentWeight != null && (
                  <p className="text-[11px] text-[#999] mt-1">
                    Current weight: <span className="font-medium">{currentWeight} kg</span>
                    {goal === "lose" && " · target should be lower"}
                    {goal === "gain" && " · target should be higher"}
                  </p>
                )}
              </div>
            </div>

            {errors.form && (
              <p role="alert" className="text-red-600 text-sm text-center">{errors.form}</p>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-3">
              <button
                className="w-full cursor-pointer bg-black rounded-full py-2.5 sm:py-3 text-white font-Medi text-lg sm:text-xl"
                onClick={handleBack}
                disabled={loading}
              >
                Back
              </button>
              <button
                className={`w-full cursor-pointer rounded-full py-2.5 sm:py-3 font-Medi text-lg sm:text-xl ${
                  isNextDisabled ? "bg-gray-300 text-white cursor-not-allowed" : "bg-black text-white"
                }`}
                onClick={handleNext}
                disabled={isNextDisabled}
              >
                {loading ? "Saving..." : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
