import { Link, useLocation } from "react-router-dom";
import { TbMenu3 } from "react-icons/tb";
import { UserMenu } from "./UserMenu";
import { MdOutlineLanguage } from "react-icons/md";
import { useEffect, useState } from "react";
import { userPreview } from "../API/user";
import { nutritionGoal } from "../API/nutritionGoal";
import { fetchEatingSummary} from "../API/nutritionGoal.js";

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

  // helper
  const syncNameFromLS = () => {
    const token = localStorage.getItem("userToken");
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    setName(token && (storedUser?.name || storedUser?.username) ? (storedUser.name || storedUser.username) : "");
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
        console.log(data);
        setSummaryCalories(data?.calories ?? null);
      } catch {}
    })();
  }, []);

  // ตั้งค่าจาก LS ทันทีเมื่อเข้ามา
  useEffect(() => {
    syncNameFromLS();
    const hasToken = !!localStorage.getItem("userToken");
    setShowCalories(hasToken);
    if (hasToken) fetchNutritionIfAuthed();
  }, []);

  // (ถ้าจำเป็น) ดึงชื่อจาก backend เมื่อมี token
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
        if (ud?.user?.name || ud?.user?.username) setName(ud.user.name || ud.user.username);
        setShowCalories(true);
      } catch {
        setShowCalories(false);
        setName("");
      }
    })();
  }, []);

  // ฟังอีเวนต์ login/logout/profile:updated + storage (ข้ามแท็บ) ให้เด้งชื่อ/แคลฯ ทันที
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

    // อัปเดตชื่อทันทีหลังแก้ไขโปรไฟล์
    const onProfileUpdated = (e) => {
      // ถ้า UserMenu ส่ง CustomEvent พร้อม detail.name มาก็ใช้เลย
      const newName = e?.detail?.name;
      if (typeof newName === "string" && newName.trim()) {
        setName(newName);
      } else {
        // ไม่งั้นอ่านจาก localStorage (UserMenu เขียนค่าใหม่ไว้แล้ว)
        syncNameFromLS();
      }
    };

    // เปลี่ยนค่าใน localStorage จากอีกแท็บ/หน้าต่าง
    const onStorage = (e) => {
      if (e.key === "user" || e.key === "userToken") {
        syncNameFromLS();
        const hasToken = !!localStorage.getItem("userToken");
        setShowCalories(hasToken);
        if (e.key === "userToken") {
          if (hasToken) fetchNutritionIfAuthed();
          else {
            setCalories(null);
          }
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

  // รีเช็คเมื่อเปลี่ยน route (กันบางเคส)
  useEffect(() => {
    syncNameFromLS();
    setShowCalories(!!localStorage.getItem("userToken"));
  }, [location.pathname]);

  // ปิด scroll เมื่อเมนูเปิด
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "auto";
  }, [isMenuOpen]);

  // ดึงโภชนาการครั้งแรกเฉพาะตอนมี token
  useEffect(() => {
    fetchNutritionIfAuthed();
  }, []);

  if (hideNavbarParths.includes(location.pathname)) return null;

  return (
    <div className="bg-white relative">
      <div className="container flex justify-between items-center pt-10 py-6">
        <div className="flex flex-col">
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
          <p className="font-inter text-[#7B7B7B] text-[10px] lg:text[12px]">Search and Upload</p>
        </div>

        <ul className="hidden lg:flex gap-[60px] border-[0.3px] rounded-full px-12 py-2 font-prompt bg-[#f6f6f6]">
          <li>
            <Link to="/" className="border-r-[0.5px] pr-[30px]">
              Home
            </Link>
          </li>
          <li>
            <Link to="/upload" className="border-r-[0.5px] pr-[30px]">
              Upload
            </Link>
          </li>
          <li>
            <Link to="/dashboard" className="border-r-[0.5px] pr-[30px]">
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/edit">Profile Settings</Link>
          </li>
        </ul>

        <div className="lg:hidden text-3xl cursor-pointer z-[101]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <TbMenu3 />
        </div>

        <div className="text-end">
          <p className="text-sm lg:text-2xl font-prompt">{showCalories ? "Calories Today" : "Track Calories"}</p>
          <p className="font-inter text-[#c0b275] text-[10px] lg:text-[12px]">
            {showCalories && calories != null ? `${summaryCalories} Kcal` : "(Sign In)"}
          </p>
        </div>
      </div>

      <div className="border-b border-[#cfcfcf]"></div>

      <div className="container py-6 sm:py-8 text-xl sm:text-2xl md:text-3xl">
        <div className="flex justify-between items-center">
          <p className="font-prompt px-2 sm:px-8">Welcome, {name || "Guest"}</p>
          <div className="flex gap-4 sm:gap-6 md:gap-5 items-center pr-2 sm:pr-8">
            <UserMenu />
            {/* <MdOutlineLanguage className="bg-[#C0B275] text-white p-2 rounded-full text-3xl sm:text-4xl cursor-pointer" /> */}
          </div>
        </div>
      </div>

      <div
        className={`lg:hidden fixed top-[120px] left-0 w-full h-full bg-white shadow-md z-[100]
        transform transition-all duration-600 ease-in-out
        ${isMenuOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none"}`}
      >
        <ul className="flex-col h-full items-center pt-30 font-prompt text-lg">
          <li className="w-full text-center">
            <Link to="/" className="block w-full text-[20px] py-10" onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
          </li>
          <li className="w-full text-center">
            <Link to="/upload" className="block w-full text-[20px] py-10" onClick={() => setIsMenuOpen(false)}>
              Upload
            </Link>
          </li>
          <li className="w-full text-center">
            <Link to="/dashboard" className="block w-full text-[20px] py-10" onClick={() => setIsMenuOpen(false)}>
              Dashboard
            </Link>
          </li>
          <li className="w-full text-center">
            <Link to="/edit" className="block w-full text-[20px] py-10" onClick={() => setIsMenuOpen(false)}>
              Edit
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};
