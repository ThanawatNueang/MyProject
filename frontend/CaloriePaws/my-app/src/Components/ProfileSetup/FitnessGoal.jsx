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
          <GiStairsGoal size={30} />
        </div>
        <h1 className="font-Medi text-5xl text-center">
          Choose your fitness goal
        </h1>
        <p className="text-center text-[13px] text-[#929292] font-light">
          Let us know your goal so we can adjust your nutrition plan to match
          your needs.
        </p>
        <div className="flex flex-col w-full gap-5 px-80 ">
          <div className="flex flex-col gap-6 relative text-center w-full">
            {[
              {
                value: "lose",
                label: "Lose weight",
              },
              {
                value: "gain",
                label: "Gain weight",
              },
              {
                value: "maintain",
                label: "Maintain weight",
              },
            ].map((option) => (
              <label key={option.value} className="block w-full">
                <input
                  type="radio"
                  name="goal"
                  value={option.value}
                  className="hidden peer"
                  checked={goal === option.value}
                  onChange={() => handleSelect(option.value)}
                />
                <div
                  onClick={() => handleSelect(option.value)}
                  className={`w-full py-4 px-6 border-[0.5px] border-[#e8e8e8] rounded-full text-sm cursor-pointer
                  ${
                    goal === option.value
                      ? "bg-[#000000] text-white"
                      : "text-black transition shadow-sm"
                  }
                  `}
                >
                  {option.label}
                </div>
              </label>
            ))}
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
                ${goal ? "bg-black text-white" : "bg-gray-300 text-white"}
                `}
              onClick={handleNext}
              disabled={!goal}
            >
              {loading ? "Saving..." : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
