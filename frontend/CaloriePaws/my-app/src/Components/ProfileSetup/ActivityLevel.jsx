import { Link, useNavigate } from "react-router-dom";
import { GiHealing } from "react-icons/gi";
import { useEffect, useState } from "react";
import { userPreview, userUpdateMe } from "../API/user";

export const ActivityLevel = () => {
  const navigate = useNavigate();
  const [selectLifeStyle, setSelectStyle] = useState("");
  const [loading, setLoading] = useState(false);

  const toApi = {
    sedentary: "no_exercise",
    light: "light_activity",
    moderate: "moderate_activity",
    active: "active",
    very_active: "very_active",
  };

  const toUi = {
    no_exercise: "sedentary",
    light_activity: "light",
    moderate_activity: "moderate",
    active: "active",
    very_active: "very_active",
  };

  useEffect(() => {
    const savedData = localStorage.getItem("ActivityData");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed?.lifestyle) {
          setSelectStyle(parsed.lifestyle);
        }
      } catch (_) {}
    }

    const fetchUserPreview = async () => {
      try {
        const userData = await userPreview();
        const profile = userData?.user || userData?.data || userData;

        const ef = profile?.exerciseFrequency;

        if (ef && toUi[ef]) {
          const uiValue = toUi[ef];
          setSelectStyle(uiValue);
          localStorage.setItem(
            "ActivityData",
            JSON.stringify({ lifestyle: uiValue })
          );
        }
      } catch (err) {
        console.log("ไม่สามารถดึงข้อมูลได้", err.message || err);
      }
    };

    fetchUserPreview();
  }, []);

  const handleSelect = (value) => {
    setSelectStyle(value);
    localStorage.setItem("ActivityData", JSON.stringify({ lifestyle: value }));
  };

  const handleNext = async () => {
    if (!selectLifeStyle) return;
    try {
      setLoading(true);

      const payload = { exerciseFrequency: toApi[selectLifeStyle] };
      const userData = await userUpdateMe(payload);
      console.log("อัปเดตผู้ใช้สำเร็จ", userData?.message || userData);

      localStorage.setItem(
        "ActivityData",
        JSON.stringify({ lifestyle: selectLifeStyle })
      );

      navigate("/finessgoals");
    } catch (err) {
      console.log("ไม่สามารถดึงข้อมูลผู้ใช้ได้", err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/ProfileSetup");
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
          <GiHealing size={30} />
        </div>
        <h1 className="font-Medi text-5xl text-center">
          What type of lifestyle do you have?
        </h1>
        <p className="text-center text-[13px] text-[#929292] font-light">
          Please tell us about your level of physical activity <br /> so we can
          adjust your nutritional goals accordingly
        </p>
        <div className="flex flex-col w-full gap-5 px-80 ">
          <div className="flex flex-col gap-6 relative text-center w-full">
            {[
              {
                value: "sedentary",
                label: "Sedentary (Little or no exercise)",
              },
              {
                value: "light",
                label:
                  " Lightly active (Light exercise or sports 1–2 days/week)",
              },
              {
                value: "moderate",
                label:
                  "Moderately active (Moderate exercise or sports 3–5 days/week)",
              },
              {
                value: "active",
                label: "Active (Hard exercise or sports 6–7 days/week)",
              },
              {
                value: "very_active",
                label:
                  "Very active (Very hard exercise or a physically demanding job)",
              },
            ].map((option) => (
              <label key={option.value} className="block w-full">
                <input
                  type="radio"
                  name="lifestyle"
                  value={option.value}
                  className="hidden peer"
                  checked={selectLifeStyle === option.value}
                  onChange={() => handleSelect(option.value)}
                />
                <div
                  className={`w-full py-4 px-6 border-[0.5px] border-[#e8e8e8] rounded-full text-sm cursor-pointer
                      ${
                        selectLifeStyle === option.value
                          ? "bg-black text-white"
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
                ${
                  selectLifeStyle
                    ? "bg-black text-white"
                    : "bg-gray-300 text-white"
                }
                `}
              onClick={handleNext}
              disabled={!selectLifeStyle}
            >
              {loading ? "Saving..." : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
