import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SiWelcometothejungle } from "react-icons/si";
import { GiBodyHeight } from "react-icons/gi";
import { FaWeight } from "react-icons/fa";
import { FaMale } from "react-icons/fa";
import { FaFemale } from "react-icons/fa";

export const SetupSec = () => {
    const [user, setUser] = useState("")
    const [height, setHeight] = useState("");
    const [weight, setWeihgt] = useState("");
    const [gender, setGender] = useState("");
    const navigate = useNavigate();

    const handleNext = () => {
        navigate("/activity-level");
    }

    const handleBack = () => {
        navigate("/ProfileSetup");
    }
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
        Welcome {user}
      </h1>
      <p className="text-center text-sm sm:text-base text-gray-500 font-light">
        Please enter your weight and BMI 🏋🏻
      </p>

      {/* Form */}
      <div className="flex flex-col w-full gap-4 sm:gap-5 max-w-md sm:max-w-lg pt-5 px-2 sm:px-0">
        {/* Height */}
        <div className="relative w-full">
          <GiBodyHeight
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
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
        <div className="relative w-full">
          <FaWeight
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="number"
            placeholder="Weight (kg)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full shadow-sm rounded-full py-3 pl-12 pr-4 outline-none border border-gray-300 text-sm"
          />
        </div>

        {/* Gender */}
        <div className="flex flex-col gap-3 items-center">
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

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-5">
          <button
            className="w-full rounded-full py-3 bg-black text-white font-Medi text-lg sm:text-xl"
            onClick={handleBack}
          >
            Back
          </button>
          <button
            className={`w-full rounded-full py-3 font-Medi text-lg sm:text-xl transition
              ${
                weight && height && gender
                  ? "bg-black text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
              }`}
            onClick={handleNext}
            disabled={!weight || !height || !gender}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
);

};