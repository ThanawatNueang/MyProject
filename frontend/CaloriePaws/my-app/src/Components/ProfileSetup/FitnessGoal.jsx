import { Link, useNavigate } from "react-router-dom";
import { GiStairsGoal } from "react-icons/gi";
import { useEffect, useState } from "react";
import { userPreview, userUpdateMe } from "../API/user";

export const FitnessGoal = () => {
  const navigate = useNavigate();
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);

  const toApi = {
    lose: "lose_weight",
    gain: "gain_weight",
    maintain: "maintain_weight",
  };

  const toUi = {
    lose_weight: "lose",
    gain_weight: "gain",
    maintain_weight: "maintain",
  };

  useEffect(() => {
    const savedData = localStorage.getItem("FitnessGoalData");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed?.goal) {
          setGoal(parsed.goal);
        }
      } catch (_) {}
    }

    const fetchUserPreview = async () => {
      try {
        const userData = await userPreview();
        const profile = userData?.user || userData?.data || userData;

        const ef = profile?.bodyGoal;

        if (ef && toUi[ef]) {
          const uiValue = toUi[ef];
          setGoal(uiValue);
          localStorage.setItem(
            "FitnessGoalData",
            JSON.stringify({ goal: uiValue })
          );
        }
      } catch (err) {
        console.log("ไม่สามารถดึงข้อมูลได้", err.message || err);
      }
    };
    fetchUserPreview();
  }, []);

  const handleSelect = (value) => {
    setGoal(value);
    localStorage.setItem("FitnessGoalData", JSON.stringify({ goal: value }));
  };

  const handleNext = async () => {
    if (!goal) return;
    try {
      setLoading(true);
      const payload = { bodyGoal: toApi[goal] };
      const userData = await userUpdateMe(payload);
      console.log("อัปเดตผู้ใช้สำเร็จ", userData?.message || userData);

      const confirmed = userData?.user?.bodyGoal;
      const uiValue = confirmed && toUi[confirmed] ? toUi[confirmed] : goal;
      localStorage.setItem(
        "FitnessGoalData",
        JSON.stringify({ goal: uiValue })
      );
      setGoal(uiValue);

      if (uiValue=== "lose" || uiValue === "gain") {
        navigate("/goal-target", { state: { goal: uiValue } });
      } else {
        navigate("/profile-setting");
      }
    } catch (err) {
      console.log("อัปเดตไม่สำเร็จ", err?.message || err);
      alert(`อัปเดตไม่สำเร็จ: ${err?.message || err}`);
    }finally{
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/activity-level");
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
        <GiStairsGoal size={30} />
      </div>

      <h1 className="font-Medi text-3xl sm:text-5xl text-center">
        Choose your fitness goal
      </h1>

      <p className="text-center text-sm sm:text-base text-gray-500 font-light leading-relaxed px-3">
        Let us know your goal so we can adjust your nutrition plan to match your needs.
      </p>

      {/* Options */}
      <div className="w-full max-w-md sm:max-w-lg px-2 sm:px-0">
        <div className="flex flex-col gap-3 sm:gap-4">
          {[
            { value: "lose", label: "Lose weight" },
            { value: "gain", label: "Gain weight" },
            { value: "maintain", label: "Maintain weight" },
          ].map((option) => (
            <label key={option.value} className="block w-full">
              <input
                type="radio"
                name="goal"
                value={option.value}
                className="hidden peer"
                checked={goal === option.value}
                onChange={() => handleSelect(option.value)}
                aria-checked={goal === option.value}
              />
              <div
                onClick={() => handleSelect(option.value)}
                className={`w-full py-3 sm:py-4 px-5 sm:px-6 rounded-full border text-sm sm:text-base text-left leading-snug transition
                  ${goal === option.value
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-gray-300 shadow-sm hover:border-gray-400"}
                `}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleSelect(option.value)}
              >
                {option.label}
              </div>
            </label>
          ))}
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
              ${goal ? "bg-black text-white" : "bg-gray-300 text-white cursor-not-allowed"}`}
            onClick={handleNext}
            disabled={!goal || loading}
          >
            {loading ? "Saving..." : "Next"}
          </button>
        </div>
      </div>
    </div>
  </div>
);

};
