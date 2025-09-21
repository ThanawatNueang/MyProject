import { LuCircleUserRound } from "react-icons/lu";
import { Link, useNavigate } from "react-router-dom";
import imageUp from "../../assets/images/Subtract2.png";
import { FaUser } from "react-icons/fa";
import { IoMdLock } from "react-icons/io";
import { GrFormViewHide, GrFormView } from "react-icons/gr";
import { MdEmail } from "react-icons/md";
import { useState } from "react";
import { registerUser, loginUser } from "../API/auth";

const backendURL = "http://100.100.45.89:3201";

export const SignUp = () => {
  const [password, setPassword] = useState("");
  const [confrimPassword, setConfrimPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [checkEmail, setCheckEmail] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [passwordError, setPasswordError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const handleSignUp = async () => {
    const data = {
      name,
      email,
      password,
    };

    if (!name || !email || !password || !confrimPassword) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    if (checkEmail || passwordError) {
      alert("Please fix the errors before continuing");
      return;
    }

    try {
      const res = await registerUser(data);

      if (!res.ok) {
        alert(res?.data?.message || "Sign up failed");
        return;
      }

      let token = res?.data?.token;
      let userObj = res?.data?.user;
      const displayName = userObj?.name || name;

      if (token) localStorage.setItem("userToken", token);
      localStorage.setItem("user", JSON.stringify({ name: displayName }));

      const rawImg = userObj?.profileImageURL || userObj?.profileImage || "";
      const fullImg = rawImg
        ? rawImg.startsWith("http")
          ? rawImg
          : `${backendURL}${rawImg}`
        : "";
      if (fullImg) localStorage.setItem("profileImageURL", fullImg);

      // 5) แจ้ง component อื่น ๆ ให้ sync แล้วไปหน้าต่อไป
      window.dispatchEvent(new Event("auth:login"));
      navigate("/ProfileSetup");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Sign up failed");
    }
  };

  const isValidEmail = (email) => {
    const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!hasEmail) {
      setCheckEmail("Please enter a valid email address.");
    } else {
      setCheckEmail("");
    }
  };

  const checkPasswordStrength = (password) => {
    if (password.length < 8) {
      return "Please enter a password with at least 8 characters.";
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&_]/.test(password);

    const strength = [hasUpper, hasLower, hasNumber, hasSpecial].filter(
      Boolean
    ).length;

    if (strength === 1) return "Your password is too weak";
    if (strength === 2) return "Your password is weak";
    if (strength === 3) return "Your password is moderately strong";
    if (strength === 4) return "Great! Your password is strong";
  };

  const formatPassword = (value) => {
    if (password !== value) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
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

      {/* singIn */}
      <div className="flex justify-center items-center gap-5">
        {/* side left */}
        <div className="flex flex-col gap-10 sm:p-10 items-center w-full h-full">
          <div className="flex rounded-full p-3 shadow-lg border-[0.5px] border-[#e4e4e4]">
            <LuCircleUserRound size={30} />
          </div>
          <h1 className="font-Medi text-4xl lg:text-5xl text-center">
            Create Account
          </h1>
          <p className="text-center text-[10px] lg:text-[13px] text-[#929292] font-light">
            Upload a meal photo or log foods get instant calories, protein, carbs, and fat. Adjust portions, see what’s left for today, and keep your goals on track.{" "}
          </p>
          <div className="flex flex-col w-full gap-3 px-4 pt-5">
            <div className="pb-3">
              <div className="relative w-full">
                <FaUser
                  size={10}
                  className="absolute left-6 top-1/2 transform -translate-y-1/2 text-[#696969]"
                />
                <input
                  type="text"
                  placeholder="User Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full shadow-sm rounded-full py-3 px-13 outline-none border-[0.5px] border-[#e8e8e8] text-sm"
                />
              </div>
            </div>
            <div className="pb-3">
              <div className="relative w-full">
                <MdEmail
                  size={13}
                  className="absolute left-6 top-1/2 transform -translate-y-1/2 text-[#696969]"
                />
                <input
                  type="text"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEmail(value);
                    isValidEmail(value);
                  }}
                  className="w-full shadow-sm rounded-full py-3 px-13 outline-none border-[0.5px] border-[#e8e8e8] text-sm"
                />
              </div>
              {checkEmail && (
                <p className="text-red-600 text-sm px-5 mt-3">{checkEmail}</p>
              )}
            </div>
            <div className="">
              <div className="relative w-full">
                <IoMdLock
                  size={13}
                  className="absolute left-6 top-1/2 transform -translate-y-1/2 text-[#696969]"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPassword(value);
                    setPasswordStrength(checkPasswordStrength(value));
                  }}
                  className="w-full shadow-sm rounded-full py-3 px-13 outline-none border-[0.5px] border-[#e8e8e8] text-sm"
                />
                {/* toggle show/hide password */}
                <div
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#696969] cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <GrFormView size={24} />
                  ) : (
                    <GrFormViewHide size={20} />
                  )}
                </div>
              </div>
            </div>
            <p
              className={`text-sm px-5 ${
                passwordStrength === "Great! Your password is strong"
                  ? "text-green-600"
                  : passwordStrength === "Your password is moderately strong"
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {password && passwordStrength}
            </p>
            <div className="relative w-full">
              <IoMdLock
                size={13}
                className="absolute left-6 top-1/2 transform -translate-y-1/2 text-[#696969]"
              />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confrim Password"
                value={confrimPassword}
                onChange={(e) => {
                  const value = e.target.value;
                  setConfrimPassword(value);
                  formatPassword(value);
                }}
                className="w-full shadow-sm rounded-full py-3 px-13 outline-none border-[0.5px] border-[#e8e8e8] text-sm"
              />
              {/* toggle show/hide password */}
              <div
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#696969] cursor-pointer"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <GrFormView size={24} />
                ) : (
                  <GrFormViewHide size={20} />
                )}
              </div>
            </div>
            {passwordError && (
              <p className="text-sm text-red-600 px-5">{passwordError}</p>
            )}
            <div className="pt-3">
              <button
                className="w-full cursor-pointer bg-black rounded-full p-2.5 text-white font-Medi text-[22px] select-none"
                onClick={handleSignUp}
              >
                Sign Up
              </button>
            </div>
            <div className="flex justify-center items-center gap-3 pt-5">
              <p className="text-[13px] text-[#8C8C8C]">
                Already have an account ?
              </p>
              <Link
                to="/signin"
                className="text-[15px] text-black hover:underline"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
        {/* side right */}
        <div className="relative hidden lg:flex items-center justify-center w-full h-full">
          <img src={imageUp} alt="" />
          {/* <div
            className="absolute bottom-20 left-1/2 -translate-x-1/2 -translate-y-1/2 
                  text-white text-3xl text-center font-oplight drop-shadow-sm w-[400px]"
          >
            A revolutionary way to log <br />
            your meals with a single photo
          </div>
          <p className="absolute bottom-18 shadow-2xl text-center text-white font-light text-[10px]">
            Lorem Ipsum is simply dummy text of the printing and typesetting{" "}
            <br /> industry. Lorem Ipsum has been the industry's{" "}
          </p> */}
        </div>
      </div>
    </div>
  );
};
