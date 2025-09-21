import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SiWelcometothejungle } from "react-icons/si";
import { FaUser } from "react-icons/fa";
import { SlCalender } from "react-icons/sl";
import { FaPerson } from "react-icons/fa6";
import { FaCalendarAlt } from "react-icons/fa";
import { GiBodyHeight } from "react-icons/gi";
import { FaWeight } from "react-icons/fa";
import { FaMale } from "react-icons/fa";
import { FaFemale } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { userPreview, userUpdateMe } from "../API/user";

export const ProfileSetup = () => {
  const navigate = useNavigate();

  // ใช้ null สำหรับวันที่ (ให้ DatePicker ทำงานถูกต้อง)
  const [birthDate, setBirthDate] = useState(null);
  const [age, setAge] = useState("");

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [gender, setGender] = useState("");

  const [loading, setLoading] = useState(false); // boolean จริง
  const [saving, setSaving] = useState(false);   // แยกสถานะบันทึก

  const [profileCurrent, setProfileCurrent] = useState({
    height: "",
    weight: "",
    birthDate: null,
    gender: "",
  });

  // helper: แปลง Date -> YYYY-MM-DD
  const toYMD = (dt) => {
    if (!dt) return "";
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // helper: แปลง raw birthdate จาก backend/localStorage เป็น Date
  const parseBirthDate = (raw) => {
    if (!raw) return null;

    // number หรือ string ตัวเลข (timestamp ms)
    if (typeof raw === "number" || /^\d+$/.test(String(raw))) {
      const d = new Date(Number(raw));
      return isNaN(d) ? null : d;
    }

    // ISO/ yyyy-mm-dd
    const d = new Date(raw);
    if (!isNaN(d)) return d;

    // dd/mm/yyyy
    const m1 = String(raw).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m1) {
      const [, dd, mm, yyyy] = m1;
      const d2 = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
      return isNaN(d2) ? null : d2;
    }

    // dd-mm-yyyy
    const m2 = String(raw).match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (m2) {
      const [, dd, mm, yyyy] = m2;
      const d3 = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
      return isNaN(d3) ? null : d3;
    }

    return null;
  };

  const calculateAge = (date) => {
    if (!date) return "";
    const today = new Date();
    let calculatedAge = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      calculatedAge--;
    }
    return calculatedAge;
  };

  const handleDateChange = (date) => {
    setBirthDate(date);
    setAge(calculateAge(date));
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // ลองอ่านจาก localStorage ก่อน (รองรับทั้ง birthDate และ birthdate)
        const savedData = localStorage.getItem("profileSetupData");
        if (savedData) {
          const parsed = JSON.parse(savedData);
          const rawBirth =
            parsed.birthDate ?? parsed.birthdate ?? parsed.dob ?? null;
          const bd = parseBirthDate(rawBirth);

          setHeight(parsed.height ?? "");
          setWeight(parsed.weight ?? "");
          setGender(parsed.gender ?? "");
          setBirthDate(bd);
          setAge(bd ? calculateAge(bd) : "");

          setProfileCurrent({
            height: parsed.height ?? "",
            weight: parsed.weight ?? "",
            birthDate: bd,
            gender: parsed.gender ?? "",
          });
          return;
        }

        // ถ้าไม่มี localStorage → ดึงจาก backend
        const res = await userPreview();
        const u = res?.user || res?.data || {};

        // รองรับหลายชื่อฟิลด์วันเกิด
        const rawBirth = u.birthDate ?? u.birthdate ?? u.dob ?? null;
        const bd = parseBirthDate(rawBirth);

        setProfileCurrent({
          height: u.height ?? "",
          weight: u.weight ?? "",
          birthDate: bd,
          gender: u.gender ?? "",
        });

        setHeight(u.height ?? "");
        setWeight(u.weight ?? "");
        setBirthDate(bd);
        setGender(u.gender ?? "");
        setAge(bd ? calculateAge(bd) : "");
      } catch (err) {
        console.error("โหลดโปรไฟล์ไม่สำเร็จ", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const hasProfileChanged = () => {
    return (
      String(height) !== String(profileCurrent.height) ||
      String(weight) !== String(profileCurrent.weight) ||
      toYMD(birthDate) !== toYMD(profileCurrent.birthDate) ||
      String(gender) !== String(profileCurrent.gender)
    );
  };

  const handleNext = async () => {
    // สร้าง payload เฉพาะฟิลด์ที่เปลี่ยนจริง
    const payload = {};
    if (String(height) !== String(profileCurrent.height)) {
      payload.height = Number(height);
    }
    if (String(weight) !== String(profileCurrent.weight)) {
      payload.weight = Number(weight);
    }
    if (toYMD(birthDate) !== toYMD(profileCurrent.birthDate)) {
      payload.birthdate = toYMD(birthDate); // << คีย์ที่ backend รองรับ + รูปแบบ YYYY-MM-DD
    }
    if (String(gender) !== String(profileCurrent.gender)) {
      payload.gender = gender;
    }

    try {
      setSaving(true);

      if (Object.keys(payload).length > 0) {
        const update = await userUpdateMe(payload);
        console.log("updated:", update);

        // sync snapshot ปัจจุบัน
        setProfileCurrent((prev) => ({
          height: payload.height ?? prev.height,
          weight: payload.weight ?? prev.weight,
          birthDate:
            typeof payload.birthdate !== "undefined"
              ? parseBirthDate(payload.birthdate)
              : prev.birthDate,
          gender: payload.gender ?? prev.gender,
        }));
      }

      // เก็บลง localStorage ให้สอดคล้องกับสิ่งที่ส่งจริง
      const toStore = {
        height,
        weight,
        birthdate: toYMD(birthDate),
        gender,
      };
      localStorage.setItem("profileSetupData", JSON.stringify(toStore));

      navigate("/activity-level");
    } catch (err) {
      console.log("เกิดข้อผิดพลาด:", err?.message || err);
    } finally {
      setSaving(false);
    }
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
      <div className="flex flex-col gap-6 sm:gap-10 p-6 sm:p-10 items-center w-full">
        <div className="flex rounded-full p-3 shadow-md border border-gray-200">
          <SiWelcometothejungle size={30} />
        </div>

        <h1 className="font-Medi text-3xl sm:text-5xl text-center">
          Welcome to our app!
        </h1>

        <p className="text-center text-sm sm:text-base text-gray-500 font-light leading-relaxed px-2 sm:px-4">
          Hi there!{" "}
          <span className="text-black font-semibold">
            What's your name and how old are you? 😊
          </span>
        </p>

        {/* Form */}
        <div className="flex flex-col w-full gap-4 sm:gap-5 px-2 sm:px-6 pb-6 max-w-md">
          {/* Height */}
          <div className="relative">
            <GiBodyHeight
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
            <input
              type="number"
              placeholder="Height (cm)"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full shadow-sm rounded-full py-3 pl-12 pr-4 outline-none border border-gray-300 text-sm"
            />
          </div>

          {/* Weight */}
          <div className="relative">
            <FaWeight
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
            <input
              type="number"
              placeholder="Weight (kg)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full shadow-sm rounded-full py-3 pl-12 pr-4 outline-none border border-gray-300 text-sm"
            />
          </div>

          {/* Birth date */}
          <div className="relative">
            <FaCalendarAlt
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
            <DatePicker
              selected={birthDate}
              onChange={handleDateChange}
              dateFormat="MM/dd/yyyy"
              placeholderText="Select your birth date"
              showYearDropdown
              scrollableYearDropdown
              yearDropdownItemNumber={100}
              maxDate={new Date()}
              className="w-full shadow-sm rounded-full py-3 pl-12 pr-4 outline-none border border-gray-300 text-sm"
              wrapperClassName="w-full"
            />
          </div>

          {/* Age */}
          <div className="relative">
            <FaPerson
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
            <input
              type="text"
              value={age}
              readOnly
              placeholder="Age"
              className="w-full shadow-sm rounded-full py-3 pl-12 pr-4 outline-none border border-gray-300 text-sm bg-gray-50"
            />
          </div>

          {/* Gender */}
          <div className="flex flex-col gap-3 items-center pt-2">
            <p className="text-sm">Gender</p>
            <div className="flex gap-4">
              <button
                type="button"
                className={`rounded-full p-3 transition-colors ${
                  gender === "male"
                    ? "bg-blue-300 text-white"
                    : "bg-gray-300 text-white"
                }`}
                onClick={() => setGender("male")}
              >
                <FaMale />
              </button>
              <button
                type="button"
                className={`rounded-full p-3 transition-colors ${
                  gender === "female"
                    ? "bg-pink-300 text-white"
                    : "bg-gray-300 text-white"
                }`}
                onClick={() => setGender("female")}
              >
                <FaFemale />
              </button>
            </div>
          </div>

          {/* Next */}
          <div className="pt-2">
            <button
              className={`w-full rounded-full py-3 font-Medi text-lg sm:text-xl transition-colors
              ${
                height && weight && birthDate && gender && !saving
                  ? "bg-black text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
              }`}
              onClick={handleNext}
              disabled={!height || !weight || !birthDate || !gender || saving}
            >
              {saving ? "Saving..." : loading ? "Loading..." : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
