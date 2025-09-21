import { RiDashboardFill } from "react-icons/ri";
import { Link, useNavigate } from "react-router-dom";
import { IoHome, IoFastFoodSharp } from "react-icons/io5";
import { RiFolderUploadFill } from "react-icons/ri";
import { MdOutlineLogout } from "react-icons/md";
import { FaUserEdit } from "react-icons/fa";
import { useEffect, useState } from "react";
import { userPreview } from "../API/user";
import { logoutUser } from "../API/auth";
import fallbackUser from "../../assets/images/user.jpg";

const backendURL = "http://100.100.45.89:3201";

const K = {
  token: "userToken",
  user: "user",
  profileImageURL: "profileImageURL",
  fetchedFlag: "session:userFetched",
};

const safeParse = (raw) => { try { return raw ? JSON.parse(raw) : null; } catch { return null; } };
const buildImageURL = (raw) => (!raw ? "" : raw.startsWith("http") ? raw : `${backendURL}${raw}`);

export const SideBar = () => {
  const [profileImage, setProfileImage] = useState(fallbackUser);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  const readCacheIntoState = () => {
    const u = safeParse(localStorage.getItem(K.user));
    const img = localStorage.getItem(K.profileImageURL) || "";
    setUserData(u ? { user: u } : null);
    setProfileImage(img ? buildImageURL(img) : fallbackUser);
  };

  const writeCacheFromAPI = (res) => {
    if (!res?.user) return;
    const u = res.user;
    localStorage.setItem(K.user, JSON.stringify({ name: u.name }));
    if (u.profilePicture) {
      const url = `${backendURL}/uploads/${u.profilePicture}`;
      localStorage.setItem(K.profileImageURL, url);
    }
  };

  const fetchOncePerSession = async () => {
    const hasToken = !!localStorage.getItem(K.token);
    if (!hasToken) return null;
    if (sessionStorage.getItem(K.fetchedFlag) === "1") return null;
    const res = await userPreview();
    writeCacheFromAPI(res);
    sessionStorage.setItem(K.fetchedFlag, "1");
    return res;
  };

  useEffect(() => {
    readCacheIntoState();
    (async () => {
      try {
        const res = await fetchOncePerSession();
        if (res?.user) readCacheIntoState();
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onLogin = async () => {
      sessionStorage.removeItem(K.fetchedFlag);
      try { await fetchOncePerSession(); } catch {}
      readCacheIntoState();
    };
    const onLogout = () => { setUserData(null); setProfileImage(fallbackUser); };
    const onProfileUpdated = async () => {
      try { const res = await userPreview(); writeCacheFromAPI(res); } catch {}
      readCacheIntoState();
    };
    window.addEventListener("auth:login", onLogin);
    window.addEventListener("auth:logout", onLogout);
    window.addEventListener("profile:updated", onProfileUpdated);
    return () => {
      window.removeEventListener("auth:login", onLogin);
      window.removeEventListener("auth:logout", onLogout);
      window.removeEventListener("profile:updated", onProfileUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async (e) => {
    e.preventDefault();
    try { await logoutUser(); } catch {}
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.dispatchEvent(new Event("auth:logout"));
    } finally {
      navigate("/");
    }
  };

  const menuList = [
    { label: "Home", icon: <IoHome size={20} />, href: "/" },
    { label: "Upload", icon: <RiFolderUploadFill size={20} />, href: "/upload" },
    { label: "Dashboard", icon: <RiDashboardFill size={20} />, href: "/dashboard" },
    { label: "Profile Settings", icon: <FaUserEdit size={20} />, href: "/edit" },
    { label: "Nutrition Search", icon: <IoFastFoodSharp size={20} />, href: "/nutrition" },
  ];

  return (
    <div className="flex flex-col justify-between bg-[#2C2C2C] text-white h-full w-full">
      <div className="flex flex-col pt-6">
        <div className="flex flex-col gap-7 items-center py-6">
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

          <img
            src={profileImage || fallbackUser}
            onError={(e) => (e.currentTarget.src = fallbackUser)}
            className="rounded-full border w-24 h-24 lg:w-30 lg:h-30 object-cover"
            alt="profile"
          />

          <div className="flex flex-col gap-1 text-center">
            <p className="font-light text-[13px]">Welcome Back</p>
            <h1 className="font-cocoPro text-lg lg:text-xl">
              {userData?.user?.name ?? "Loading..."}
            </h1>
          </div>
        </div>

        <nav>
          {menuList.map((it, idx) => (
            <Link
              key={idx}
              to={it.href}
              className="flex items-center py-4 lg:py-5 text-[14px] ml-3 rounded-tl-4xl rounded-bl-4xl hover:bg-white hover:text-black transition-colors"
            >
              <div className="flex gap-4 lg:gap-5 px-5">
                <span>{it.icon}</span>
                <span>{it.label}</span>
              </div>
            </Link>
          ))}
        </nav>
      </div>

      <div>
        <button
          className="flex gap-4 items-center px-8 pb-8 text-[14px]"
          onClick={handleLogout}
        >
          <MdOutlineLogout size={23} />
          <p>Sign out</p>
        </button>
      </div>
    </div>
  );
};
