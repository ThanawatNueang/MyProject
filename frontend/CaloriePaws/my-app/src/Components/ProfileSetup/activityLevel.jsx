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
        <GiHealing size={30} />
      </div>

      <h1 className="font-Medi text-3xl sm:text-5xl text-center">
        What type of lifestyle do you have?
      </h1>

      <p className="text-center text-sm sm:text-base text-gray-500 font-light leading-relaxed px-3">
        Please tell us about your level of physical activity{" "}
        <span className="hidden sm:inline"><br /></span>
        so we can adjust your nutritional goals accordingly
      </p>

      {/* Options */}
      <div className="w-full max-w-md sm:max-w-lg px-2 sm:px-0">
        <div className="flex flex-col gap-3 sm:gap-4">
          {[
            { value: "sedentary",   label: "Sedentary (Little or no exercise)" },
            { value: "light",       label: "Lightly active (Light exercise or sports 1–2 days/week)" },
            { value: "moderate",    label: "Moderately active (Moderate exercise or sports 3–5 days/week)" },
            { value: "active",      label: "Active (Hard exercise or sports 6–7 days/week)" },
            { value: "very_active", label: "Very active (Very hard exercise or a physically demanding job)" },
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
                className={`w-full py-3 sm:py-4 px-5 sm:px-6 rounded-full border text-sm sm:text-base text-left leading-snug transition
                  ${selectLifeStyle === option.value
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-gray-300 shadow-sm hover:border-gray-400"}
                `}
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
              ${selectLifeStyle ? "bg-black text-white" : "bg-gray-300 text-white cursor-not-allowed"}`}
            onClick={handleNext}
            disabled={!selectLifeStyle || loading}
          >
            {loading ? "Saving..." : "Next"}
          </button>
        </div>
      </div>
    </div>
  </div>
);

};
