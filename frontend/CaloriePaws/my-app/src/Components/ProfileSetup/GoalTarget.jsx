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
    <div className="container">
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

      <div className="flex flex-col gap-10 p-10 items-center w-full h-full">
        <div className="flex rounded-full p-3 shadow-lg border-[0.5px] border-[#e4e4e4]">
          <FaWeightScale size={20} />
        </div>

        <h1 className="font-Medi text-5xl text-center">
          {goal === "lose"
            ? "What would be your ideal weight?"
            : goal === "gain"
            ? "What would be your ideal gain?"
            : "What would be your ideal weight?"}
        </h1>

        <div className="flex flex-col w-full gap-5 px-80 ">
          <div className="flex flex-col gap-6 relative text-center w-full">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              placeholder="Enter amount in kg"
              value={kg}
              onChange={handleKgChange}
              className="w-full max-w-md mx-auto shadow-sm rounded-full py-3 px-6 outline-none border border-[#e8e8e8] text-sm"
            />
          </div>

          <div className="flex gap-3 pt-5">
            <button
              className="w-full cursor-pointer bg-black rounded-full p-2.5 text-white font-Medi text-[22px]"
              onClick={handleBack}
              disabled={loading}
            >
              Back
            </button>
            <button
              className={`w-full cursor-pointer rounded-full p-2.5 font-Medi text-[22px]
                ${kg ? "bg-black text-white" : "bg-gray-300 text-white"}`}
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
