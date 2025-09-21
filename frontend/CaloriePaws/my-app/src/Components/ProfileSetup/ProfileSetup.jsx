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
  const [birthDate, setBirthDate] = useState("");
  const [age, setAge] = useState("");

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState("");

  useEffect(() => {
    const savedData = localStorage.getItem("profileSetupData");
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setHeight(parsedData.height || "");
      setWeight(parsedData.weight || "");
      setGender(parsedData.gender || "");
      setBirthDate(parsedData.birthDate ? new Date(parsedData.birthDate) : "");
      setAge(
        parsedData.birthDate ? calculateAge(new Date(parsedData.birthDate)) : ""
      );
      setProfileCurrent({
        height: parsedData.height || "",
        weight: parsedData.weight || "",
        birthDate: parsedData.birthDate ? new Date(parsedData.birthDate) : "",
        gender: parsedData.gender || "",
      });
    } else {
      const fetchProfile = async () => {
        try {
          const res = await userPreview();
          console.log("โหลดข้อมูลจาก backend:", res.user);
          const profile = res.user;

          setProfileCurrent({
            height: profile.height || "",
            weight: profile.weight || "",
            birthDate: profile.birthDate ? new Date(profile.birthDate) : "",
            gender: profile.gender || "",
          });

          setHeight(profile.height || "");
          setWeight(profile.weight || "");
          setBirthDate(profile.birthDate ? new Date(profile.birthDate) : "");
          setGender(profile.gender || "");
        } catch (err) {
          console.error("โหลดโปรไฟล์ไม่สำเร็จ", err);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, []);

  const [profileCurrent, setProfileCurrent] = useState({
    height: "",
    weight: "",
    birthDate: "",
    gender: "",
  });

  const calculateAge = (date) => {
    const today = new Date();
    let calculatedAge = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < date.getDate())
    ) {
      calculatedAge--;
    }
    return calculatedAge;
  };

  const handleDateChange = (date) => {
    setBirthDate(date);
    const calculatedAge = calculateAge(date);
    setAge(calculatedAge);
  };

  const hasProfileChanged = () => {
    return (
      height !== profileCurrent.height ||
      weight !== profileCurrent.weight ||
      birthDate?.toISOString() !== profileCurrent.birthDate?.toISOString() ||
      gender !== profileCurrent.gender
    );
  };

  const handleNext = async () => {
    const data = {
      height,
      weight,
      birthDate: birthDate?.toISOString(),
      gender,
    };
    try {
      if (hasProfileChanged()) {
        const update = await userUpdateMe(data);
        console.log(update);
      }

      localStorage.setItem("profileSetupData", JSON.stringify(data));

      navigate("/activity-level");
    } catch (err) {
      console.log("เกิดข้อผิดพลาด:", err.message);
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
                height && weight && birthDate && gender
                  ? "bg-black text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
              }`}
            onClick={handleNext}
            disabled={!height || !weight || !birthDate || !gender}
          >
            {loading ? "Saving..." : "Next"}
          </button>
        </div>
      </div>
    </div>
  </div>
);

};
