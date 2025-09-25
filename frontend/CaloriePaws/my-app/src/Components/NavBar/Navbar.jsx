import { Link, useLocation } from "react-router-dom";
import { TbMenu3 } from "react-icons/tb";
import { UserMenu } from "./UserMenu";
import { useEffect, useState } from "react";
import { userPreview } from "../API/user";
import { nutritionGoal } from "../API/nutritionGoal";
import { fetchEatingSummary } from "../API/nutritionGoal.js";

export const Navbar = () => {
  const [name, setName] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [calories, setCalories] = useState(null);
  const [showCalories, setShowCalories] = useState(false);
  const [summaryCalories, setSummaryCalories] = useState();
  const location = useLocation();

  const hideNavbarParths = [
    "/signin",
    "/signup",
    "/ProfileSetup",
    "/setupsec",
    "/activity-level",
    "/finessgoals",
    "/goal-target",
    "/profile-setting",
    "/dashboard",
    "/editProfile",
  ];

  const syncNameFromLS = () => {
    const token = localStorage.getItem("userToken");
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    setName(
      token && (storedUser?.name || storedUser?.username)
        ? storedUser.name || storedUser.username
        : ""
    );
  };

  const fetchNutritionIfAuthed = async () => {
    const token = localStorage.getItem("userToken");
    if (!token) {
      setCalories(null);
      setShowCalories(false);
      return;
    }
    try {
      const data = await nutritionGoal();
      setCalories(data?.dailyCalorieGoal ?? null);
      setShowCalories(true);
    } catch {
      setShowCalories(false);
      setCalories(null);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchEatingSummary();
        setSummaryCalories(data?.calories ?? null);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    syncNameFromLS();
    const hasToken = !!localStorage.getItem("userToken");
    setShowCalories(hasToken);
    if (hasToken) fetchNutritionIfAuthed();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (!token) {
      setName("");
      setShowCalories(false);
      return;
    }
    (async () => {
      try {
        const ud = await userPreview();
        if (ud?.user?.name || ud?.user?.username)
          setName(ud.user.name || ud.user.username);
        setShowCalories(true);
      } catch {
        setShowCalories(false);
        setName("");
      }
    })();
  }, []);

  useEffect(() => {
    const onLogin = async () => {
      syncNameFromLS();
      await fetchNutritionIfAuthed();
    };

    const onLogout = () => {
      setName("");
      setCalories(null);
      setShowCalories(false);
    };

    const onProfileUpdated = (e) => {
      const newName = e?.detail?.name;
      if (typeof newName === "string" && newName.trim()) {
        setName(newName);
      } else {
        syncNameFromLS();
      }
    };

    const onStorage = (e) => {
      if (e.key === "user" || e.key === "userToken") {
        syncNameFromLS();
        const hasToken = !!localStorage.getItem("userToken");
        setShowCalories(hasToken);
        if (e.key === "userToken") {
          if (hasToken) fetchNutritionIfAuthed();
          else setCalories(null);
        }
      }
    };

    window.addEventListener("auth:login", onLogin);
    window.addEventListener("auth:logout", onLogout);
    window.addEventListener("profile:updated", onProfileUpdated);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("auth:login", onLogin);
      window.removeEventListener("auth:logout", onLogout);
      window.removeEventListener("profile:updated", onProfileUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    syncNameFromLS();
    setShowCalories(!!localStorage.getItem("userToken"));
  }, [location.pathname]);

  useEffect(() => {
    fetchNutritionIfAuthed();
  }, []);

  if (hideNavbarParths.includes(location.pathname)) return null;

  return (
    <div className="bg-white relative pt-2">
      {/* แถวบน: ใช้ container ที่ยืดหยุ่นขึ้น + ระยะขอบ responsive */}
      <div className="container mx-auto flex justify-between items-center px-3 sm:px-6 lg:px-8 pt-4 md:pt-6 pb-3 md:pb-4">
        {/* โลโก้ + tagline */}
        <div className="flex flex-col min-w-0">
          <Link
            to="/"
            className="text-lg sm:text-xl lg:text-3xl font-prompt cursor-pointer leading-tight"
          >
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
          <p className="font-inter text-[#7B7B7B] text-[10px] sm:text-[11px] lg:text-[12px]">
            Search and Upload
          </p>
        </div>

        {/* เมนูใหญ่ (desktop) */}
        <ul className="hidden lg:flex gap-6 xl:gap-10 border-[0.3px] rounded-full px-6 xl:px-12 py-2 font-prompt bg-[#f6f6f6] text-sm xl:text-base">
          <li>
            <Link to="/" className="border-r-[0.5px] pr-4 xl:pr-[30px]">
              Home
            </Link>
          </li>
          <li>
            <Link to="/upload" className="border-r-[0.5px] pr-4 xl:pr-[30px]">
              Upload
            </Link>
          </li>
          <li>
            <Link
              to="/dashboard"
              className="border-r-[0.5px] pr-4 xl:pr-[30px]"
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/edit">Profile Settings</Link>
          </li>
        </ul>

        {/* ปุ่มเมนู (mobile) */}
        <button
          type="button"
          className="lg:hidden text-2xl sm:text-3xl p-2 -mr-1 cursor-pointer z-[101]"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <TbMenu3 />
        </button>

        {/* Calories */}
        <div className="text-right min-w-0">
          <p className="text-xs sm:text-sm lg:text-2xl font-prompt truncate">
            {showCalories ? "Calories Today" : "Track Calories"}
          </p>
          <p className="font-inter text-[#c0b275] text-[10px] sm:text-[11px] lg:text-[12px]">
            {showCalories && calories != null ? `${summaryCalories} Kcal` : "(Sign In)"}
          </p>
        </div>
      </div>

      <div className="border-b pb-2 border-[#cfcfcf]" />

      {/* แถวล่าง: welcome + user menu */}
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 text-lg sm:text-2xl md:text-3xl">
        <div className="flex justify-between items-center gap-3">
          <p className="font-prompt px-2 sm:px-4 md:px-6 truncate">
            Welcome, {name || "Guest"}
          </p>
          <div className="flex items-center gap-3 sm:gap-5 md:gap-6 pr-2 sm:pr-4 md:pr-6">
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Mobile Drawer: ปรับ top ให้เหมาะกับสูงแถบด้านบนในแต่ละ breakpoint */}
      <div
        className={`lg:hidden fixed left-0 w-full h-screen bg-white shadow-md z-[100]
        transform transition-transform duration-300 ease-in-out
        top-[64px] sm:top-[72px] md:top-[80px]
        ${
          isMenuOpen
            ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        <ul className="flex flex-col h-full justify-center items-center font-prompt text-xl sm:text-lg space-y-10 sm:space-y-6 px-4">
          <li className="w-full max-w-md text-center">
            <Link
              to="/"
              className="block w-full py-4 rounded-lg hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
          </li>
          <li className="w-full max-w-md text-center">
            <Link
              to="/upload"
              className="block w-full py-4 rounded-lg hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Upload
            </Link>
          </li>
          <li className="w-full max-w-md text-center">
            <Link
              to="/dashboard"
              className="block w-full py-4 rounded-lg hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
          </li>
          <li className="w-full max-w-md text-center">
            <Link
              to="/edit"
              className="block w-full py-4 rounded-lg hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Profile Settings
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};
