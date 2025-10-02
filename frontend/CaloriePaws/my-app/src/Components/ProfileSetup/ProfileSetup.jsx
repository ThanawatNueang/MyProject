import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SiWelcometothejungle } from "react-icons/si";
import { FaPerson } from "react-icons/fa6";
import { FaCalendarAlt } from "react-icons/fa";
import { GiBodyHeight } from "react-icons/gi";
import { FaWeight, FaMale, FaFemale } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { userPreview, userUpdateMe } from "../API/user";

// ---------- helpers ----------
const parseNumber = (x) => {
  if (x == null) return NaN;
  const n = Number(String(x).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : NaN;
};
const isValidHeight = (h) => Number.isFinite(h) && h >= 50 && h <= 250;
const isValidWeight = (w) => Number.isFinite(w) && w >= 20 && w <= 300;
const toYMD = (dt) => {
  if (!dt || isNaN(dt)) return "";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const ProfileSetup = () => {
  const navigate = useNavigate();

  // form state
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [birthDate, setBirthDate] = useState(null); // Date|null
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  // ui state
  const [loading, setLoading] = useState(false);

  // inline errors (เหมือนหน้า SignUp)
  const [errors, setErrors] = useState({
    height: "",
    weight: "",
    birthDate: "",
    gender: "",
    form: "",
  });

  // snapshot จาก backend/LS ไว้เทียบตอน save
  const [profileCurrent, setProfileCurrent] = useState({
    height: "",
    weight: "",
    birthDate: null,
    gender: "",
  });

  // ---------- age calc ----------
  const calculateAge = (date) => {
    if (!date || isNaN(date)) return "";
    const today = new Date();
    let a = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) a--;
    return a;
  };
  const isValidBirthDate = (d) => {
    if (!d || isNaN(d)) return false;
    const now = new Date();
    if (d > now) return false;
    const a = calculateAge(d);
    return a >= 10 && a <= 100;
  };

  // ---------- load from LS -> backend ----------
  useEffect(() => {
    const saved = localStorage.getItem("profileSetupData");
    if (saved) {
      try {
        const j = JSON.parse(saved);
        const bd = j.birthDate ? new Date(j.birthDate) : null;
        setHeight(j.height || "");
        setWeight(j.weight || "");
        setGender(j.gender || "");
        setBirthDate(bd);
        setAge(bd ? String(calculateAge(bd)) : "");
        setProfileCurrent({
          height: j.height || "",
          weight: j.weight || "",
          birthDate: bd,
          gender: j.gender || "",
        });
        // ตั้งค่า error เริ่มต้นจากค่าที่มี (validate ทันที)
        if (!isValidHeight(parseNumber(j.height)))
          setErrors((p) => ({
            ...p,
            height: "Height must be between 50–250 cm.",
          }));
        if (!isValidWeight(parseNumber(j.weight)))
          setErrors((p) => ({
            ...p,
            weight: "Weight must be between 20–300 kg.",
          }));
        if (bd && !isValidBirthDate(bd))
          setErrors((p) => ({
            ...p,
            birthDate: "Age must be between 10–100 years.",
          }));
        return;
      } catch {}
    }

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await userPreview();
        const profile = res?.user || res?.data || res || {};
        const bd = profile.birthDate ? new Date(profile.birthDate) : null;
        if (!mounted) return;

        setProfileCurrent({
          height: profile.height || "",
          weight: profile.weight || "",
          birthDate: bd,
          gender: profile.gender || "",
        });

        setHeight(profile.height || "");
        setWeight(profile.weight || "");
        setBirthDate(bd);
        setGender(profile.gender || "");
        setAge(bd ? String(calculateAge(bd)) : "");

        // validate ทันทีตามค่าจาก backend
        if (!isValidHeight(parseNumber(profile.height)))
          setErrors((p) => ({
            ...p,
            height: "Height must be between 50–250 cm.",
          }));
        if (!isValidWeight(parseNumber(profile.weight)))
          setErrors((p) => ({
            ...p,
            weight: "Weight must be between 20–300 kg.",
          }));
        if (bd && !isValidBirthDate(bd))
          setErrors((p) => ({
            ...p,
            birthDate: "Age must be between 10–100 years.",
          }));
      } catch (e) {
        console.error("โหลดโปรไฟล์ไม่สำเร็จ", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ---------- real-time validation เหมือน SignUp ----------
  const onHeightChange = (v) => {
    setHeight(v);
    const num = parseNumber(v);
    setErrors((p) => ({
      ...p,
      height: isValidHeight(num) ? "" : "Height must be between 50–250 cm.",
    }));
  };

  const onWeightChange = (v) => {
    setWeight(v);
    const num = parseNumber(v);
    setErrors((p) => ({
      ...p,
      weight: isValidWeight(num) ? "" : "Weight must be between 20–300 kg.",
    }));
  };

  const onBirthDateChange = (d) => {
    setBirthDate(d);
    setAge(d ? String(calculateAge(d)) : "");
    let msg = "";
    if (!d) msg = "Please select your birth date.";
    else if (d > new Date()) msg = "Birth date cannot be in the future.";
    else if (!isValidBirthDate(d)) msg = "Age must be between 10–100 years.";
    setErrors((p) => ({ ...p, birthDate: msg }));
  };

  const onGenderSelect = (g) => {
    setGender(g);
    setErrors((p) => ({ ...p, gender: "" }));
  };

  // ---------- save ----------
  const hasProfileChanged = useMemo(
    () =>
      String(height) !== String(profileCurrent.height) ||
      String(weight) !== String(profileCurrent.weight) ||
      toYMD(birthDate) !== toYMD(profileCurrent.birthDate) ||
      String(gender) !== String(profileCurrent.gender),
    [height, weight, birthDate, gender, profileCurrent]
  );

  const handleNext = async () => {
    if (loading) return;

    // safety check (แม้จะ validate real-time แล้ว)
    const h = parseNumber(height);
    const w = parseNumber(weight);
    const finalErrors = {
      height: isValidHeight(h) ? "" : "Height must be between 50–250 cm.",
      weight: isValidWeight(w) ? "" : "Weight must be between 20–300 kg.",
      birthDate: birthDate
        ? birthDate > new Date()
          ? "Birth date cannot be in the future."
          : isValidBirthDate(birthDate)
          ? ""
          : "Age must be between 10–100 years."
        : "Please select your birth date.",
      gender: gender ? "" : "Please select your gender.",
      form: "",
    };
    setErrors(finalErrors);
    const anyError = Object.values(finalErrors).some((m, i) => i < 4 && m); // ไม่รวม form
    if (anyError) return;

    const payload = {};
    if (String(height) !== String(profileCurrent.height)) payload.height = h;
    if (String(weight) !== String(profileCurrent.weight)) payload.weight = w;
    if (toYMD(birthDate) !== toYMD(profileCurrent.birthDate))
      payload.birthdate = toYMD(birthDate);
    if (String(gender) !== String(profileCurrent.gender))
      payload.gender = gender;

    try {
      setLoading(true);
      if (hasProfileChanged && Object.keys(payload).length) {
        await userUpdateMe(payload);
      }
      localStorage.setItem(
        "profileSetupData",
        JSON.stringify({
          height: h,
          weight: w,
          birthDate: birthDate?.toISOString(),
          gender,
        })
      );
      navigate("/activity-level");
    } catch (err) {
      console.log("เกิดข้อผิดพลาด:", err?.message || err);
      setErrors((p) => ({ ...p, form: "Save failed. Please try again." }));
    } finally {
      setLoading(false);
    }
  };

  // ---------- UI helpers ----------
  const heightInvalid = !!errors.height;
  const weightInvalid = !!errors.weight;
  const birthInvalid = !!errors.birthDate;

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center pt-10 py-6">
          <Link
            to="/"
            className="text-xl lg:text-3xl font-prompt cursor-pointer"
          >
            Calorie
            <span className="relative inline-block">
              <div className="oval oval1 absolute" />
              <div className="oval oval2 absolute" />
              <div className="oval oval3 absolute" />
              <div className="oval oval4 absolute" />
              <div className="oval oval5 absolute" />
              Paws
            </span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-screen-md px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:gap-10 items-center w-full py-8 sm:py-10">
          <div className="flex rounded-full p-3 sm:p-4 shadow-lg border-[0.5px] border-[#e4e4e4]">
            <SiWelcometothejungle size={30} />
          </div>
          <h1 className="font-Medi text-3xl sm:text-4xl text-center">
            Welcome to our app!
          </h1>
          <p className="text-center text-xs sm:text-sm text-[#929292] font-light">
            Hi there!{" "}
            <span className="text-[#000000] font-bold">
              What's your name and how old are you? 😊
            </span>
          </p>

          {errors.form && (
            <p role="alert" className="text-sm text-red-600 -mt-2">
              {errors.form}
            </p>
          )}

          <div className="flex flex-col w-full gap-4 sm:gap-5">
            {/* Height */}
            <div className="flex items-center w-full rounded-full px-4 py-3 shadow-sm">
              <GiBodyHeight
                size={13}
                className="text-[#696969] mr-3"
              />
              <input
                type="number"
                placeholder="Height (cm)"
                value={height}
                onChange={(e) => onHeightChange(e.target.value)}
                onBlur={(e) => onHeightChange(e.target.value)} // ย้ำอีกทีตอน blur
                min={50}
                max={250}
                step="any"
                aria-invalid={heightInvalid}
                className={`flex-1 outline-none text-sm ${
                  heightInvalid ? "border-red-500" : "border-[#e8e8e8]"
                }`}
              />
              {errors.height && (
                <p className="text-red-500 text-xs mt-1">{errors.height}</p>
              )}
            </div>

            {/* Weight */}
            <div className="flex items-center w-full rounded-full px-4 py-3 shadow-sm">
              <FaWeight
                size={16}
                className="text-[#696969] mr-3"
              />
              <input
                type="number"
                placeholder="Weight (kg)"
                value={weight}
                onChange={(e) => onWeightChange(e.target.value)}
                onBlur={(e) => onWeightChange(e.target.value)}
                min={20}
                max={300}
                step="any"
                aria-invalid={weightInvalid}
                className={`flex-1 outline-none text-sm ${
                  weightInvalid ? "border-red-500" : "border-[#e8e8e8]"
                }`}
              />
              {errors.weight && (
                <p className="text-red-500 text-xs mt-1">{errors.weight}</p>
              )}
            </div>

            {/* Birthdate */}
            <div className="flex items-center w-full rounded-full px-4 py-3 shadow-sm">
              <FaCalendarAlt
                size={13}
                className="text-[#696969] mr-3"
              />
              <DatePicker
                selected={birthDate}
                onChange={onBirthDateChange}
                onCalendarClose={() => onBirthDateChange(birthDate)}
                dateFormat="MM/dd/yyyy"
                placeholderText="Select your birth date"
                showYearDropdown
                scrollableYearDropdown
                yearDropdownItemNumber={100}
                maxDate={new Date()}
                className={`flex-2 outline-none text-sm ${
                  birthInvalid ? "border-red-500" : "border-[#e8e8e8]"
                }`}
              />
              {errors.birthDate && (
                <p className="text-red-500 text-xs mt-1">{errors.birthDate}</p>
              )}
            </div>

            {/* Age (read-only) */}
            <div className="relative w-full">
              <FaPerson
                size={15}
                className="absolute left-6 top-1/2 -translate-y-1/2 text-[#696969]"
              />
              <input
                type="text"
                value={age}
                readOnly
                placeholder="Age"
                className="w-full shadow-sm rounded-full py-3 px-13 outline-none border-[0.5px] border-[#e8e8e8] text-sm bg-gray-50"
              />
            </div>

            {/* Gender */}
            <div className="flex flex-col gap-3 sm:gap-4 items-center">
              <p>Gender</p>
              <div className="flex gap-4 sm:gap-5">
                <div>
                  <button
                    type="button"
                    aria-pressed={gender === "male"}
                    className={`rounded-full p-3 cursor-pointer ${
                      gender === "male"
                        ? "bg-[#9FD3F9] text-white"
                        : "text-white bg-gray-300"
                    }`}
                    onClick={() => onGenderSelect("male")}
                  >
                    <FaMale />
                  </button>
                  <p className="text-sm">Male</p>
                </div>
                <div>
                  <button
                    type="button"
                    aria-pressed={gender === "female"}
                    className={`rounded-full p-3 cursor-pointer ${
                      gender === "female"
                        ? "bg-[#F99FF7] text-white"
                        : "bg-gray-300 text-white"
                    }`}
                    onClick={() => onGenderSelect("female")}
                  >
                    <FaFemale />
                  </button>
                  <p className="text-sm">Female</p>
                </div>
              </div>
              {errors.gender && (
                <p className="text-red-500 text-xs mt-1 text-center">
                  {errors.gender}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 sm:pt-3">
              <button
                className={`w-full cursor-pointer rounded-full py-2.5 sm:py-3 text-white font-Medi text-lg sm:text-xl ${
                  loading ? "bg-gray-300 cursor-not-allowed" : "bg-black"
                }`}
                onClick={handleNext}
                disabled={loading}
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
