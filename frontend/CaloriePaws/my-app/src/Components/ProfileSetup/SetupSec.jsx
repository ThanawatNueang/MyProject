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
          <SiWelcometothejungle size={30} />
        </div>
        <h1 className="font-Medi text-5xl">Welcome {user}</h1>
        <p className="text-center text-[13px] text-[#929292] font-light">
            Please enter your weight and BMI 🏋🏻
        </p>
        <div className="flex flex-col w-full gap-5 px-80 pt-5">
          <div className="relative w-full">
            <GiBodyHeight 
              size={13}
              className="absolute left-6 top-1/2 transform -translate-y-1/2 text-[#696969]"
            />
            <input
              type="number"
              placeholder="Height"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full shadow-sm rounded-full py-3 px-13 outline-none border-[0.5px] border-[#e8e8e8] text-sm"
            />
          </div>
          <div className="relative w-full">
            <FaWeight 
              size={13}
              className="absolute left-6 top-1/2 transform -translate-y-1/2 text-[#696969]"
            />
            <input
              type="number"
              placeholder="Weight (kg)"
              value={weight}
              onChange={(e) => setWeihgt(e.target.value)}
              className="w-full shadow-sm rounded-full py-3 px-13 outline-none border-[0.5px] border-[#e8e8e8] text-sm"
            />
            {/* toggle show/hide password */}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#696969] cursor-pointer"></div>
          </div>
          <div className="flex flex-col gap-4 items-center">
                <p>Gender</p>
                <div className="flex gap-5">
                    <button 
                    className={`rounded-full p-3 cursor-pointer
                      ${gender === 'male' ? 'bg-[#9FD3F9] text-white' : 'text-white bg-gray-300'}
                      `}
                    onClick={() => setGender('male')}
                    >
                      <FaMale />
                    </button>
                    <button 
                    className={`rounded-full p-3 cursor-pointer
                      ${gender === 'female' ? 'bg-[#F99FF7] text-white' : 'bg-gray-300 text-white'}
                      `}
                    onClick={() => setGender('female')}
                    >
                      <FaFemale />
                    </button>
                </div>
          </div>
          <div className="flex gap-3 pt-5">
            <button 
            className="w-full cursor-pointer bg-black rounded-full p-2.5 text-white font-Medi text-[22px]"
            onClick={handleBack}
            >
              Back
            </button>
            <button 
            className={`w-full cursor-pointer bg-black rounded-full p-2.5 text-white font-Medi text-[22px]
              ${weight && height && gender ? "bg-black text-white" : "bg-gray-300 text-gray cursor-not-allowed"}`
            }
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