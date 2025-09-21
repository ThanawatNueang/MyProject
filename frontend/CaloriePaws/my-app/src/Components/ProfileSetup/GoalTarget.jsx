import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaWeightScale } from "react-icons/fa6";
import { userPreview, userUpdateMe } from "../API/user";

export const GoalTarget = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const goalFromState = state?.goal || "";
  const [goal, setGoal] = useState(goalFromState);
  const [kg, setKg] = useState("");
  const [loading, setLoading] = useState(false);

 
  useEffect(() => {
    if (!goalFromState) {
      const fg = localStorage.getItem("FitnessGoalData");
      if (fg) {
        try {
          const parsed = JSON.parse(fg);
          if (parsed?.goal) setGoal(parsed.goal);
        } catch {}
      }
    }

    const saved = localStorage.getItem("GoalTargetData");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.kg) setKg(String(parsed.kg));
      } catch {}
    }

    const syncFromBackend = async () => {
      try {
        const userData = await userPreview();
        const profile = userData?.user || userData?.data || userData;
        if (profile?.fitnessGoal != null) {
          setKg(String(profile.fitnessGoal));
          localStorage.setItem("GoalTargetData", JSON.stringify({ kg: profile.fitnessGoal }));
        }
      } catch (err) {
        console.log("โหลดเป้าหมายจากเซิร์ฟเวอร์ไม่สำเร็จ:", err?.message || err);
      }
    };
    syncFromBackend();
  }, [goalFromState]);

  const handleKgChange = (e) => {
    const val = e.target.value;
    if (/^\d*\.?\d*$/.test(val)) {
      setKg(val);
    }
  };

  const saveToLS = (nextKg) => {
    localStorage.setItem("GoalTargetData", JSON.stringify({ kg: nextKg }));
  };

  const handleNext = async () => {
    const num = parseFloat(kg);
    if (isNaN(num)) return;
    if (num <= 0) {
      alert("กรุณากรอกค่าน้ำหนักมากกว่า 0");
      return;
    }
    // ใส่ช่วงคร่าว ๆ กันพลาด
    if (num < 20 || num > 300) {
      if (!confirm("ค่าน้ำหนักอยู่นอกช่วงปกติ (20–300 kg) แน่ใจหรือไม่ที่จะใช้ค่านี้?")) {
        return;
      }
    }

    try {
      setLoading(true);
      const payload = { fitnessGoal: num };
      const res = await userUpdateMe(payload);
      console.log("อัปเดตสำเร็จ:", res?.message || res);

      const confirmed = res?.user?.fitnessGoal;
      const finalKg = typeof confirmed === "number" ? confirmed : num;

      saveToLS(finalKg);

      navigate("/profile-setting");
    } catch (err) {
      console.log("อัปเดตไม่สำเร็จ:", err?.message || err);
      alert(`อัปเดตไม่สำเร็จ: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/finessgoals");
  };

return (
  <div className="container mx-auto">
    {/* Header */}
    <div className="flex justify-between items-center pt-6 sm:pt-10 pb-4 sm:pb-6 px-4 sm:px-8">
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

    {/* Body */}
    <div className="flex flex-col items-center w-full gap-6 sm:gap-10 p-6 sm:p-10">
      <div className="flex rounded-full p-3 shadow-md border border-gray-200">
        <FaWeightScale size={20} />
      </div>

      <h1 className="font-Medi text-3xl sm:text-5xl text-center">
        {goal === "lose"
          ? "What would be your ideal weight?"
          : goal === "gain"
          ? "What would be your ideal gain?"
          : "What would be your ideal weight?"}
      </h1>

      {/* Input */}
      <div className="w-full max-w-md sm:max-w-lg px-2 sm:px-0">
        <div className="flex flex-col gap-4 sm:gap-5 text-center">
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.1"
            placeholder="Enter amount in kg"
            value={kg}
            onChange={handleKgChange}
            className="w-full shadow-sm rounded-full py-3 px-6 outline-none border border-gray-300 text-sm sm:text-base"
            aria-label="Target weight (kg)"
          />
          {/* hint (optional) */}
          <p className="text-xs sm:text-sm text-gray-500">
            Use decimals if needed, e.g. <span className="font-medium">65.5</span> kg
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-md sm:max-w-lg mt-4 sm:mt-6 px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className="w-full rounded-full py-3 bg-black text-white font-Medi text-lg sm:text-xl disabled:opacity-50"
            onClick={handleBack}
            disabled={loading}
          >
            Back
          </button>

          <button
            className={`w-full rounded-full py-3 font-Medi text-lg sm:text-xl transition
              ${kg ? "bg-black text-white" : "bg-gray-300 text-white cursor-not-allowed"}`}
            onClick={handleNext}
            disabled={!kg || loading}
          >
            {loading ? "Saving..." : "Next"}
          </button>
        </div>
      </div>
    </div>
  </div>
);

};
