// UserMenu.jsx
import { IoMdArrowDropdown } from "react-icons/io";
import fallbackUser from "../../assets/images/user.jpg";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userPreview, userUpdateMe } from "../API/user.js";
import { logoutUser } from "../API/auth.js";
import { FaRegEdit } from "react-icons/fa";
import { IoChevronBack } from "react-icons/io5";

const backendURL = "http://100.100.45.89:3201";

// ===== Storage Keys =====
const K = {
  user: "user", // JSON: { name/username, ... }
  profileImageURL: "profileImageURL",
  token: "userToken",
  fetchedFlag: "session:userFetched", // ใช้ sessionStorage
};

// ===== Utils =====
const safeParse = (raw) => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ดึง user object ออกจาก response ได้หลายรูปแบบ
function getUserFrom(resp) {
  return resp?.user || resp?.data?.user || resp?.data || resp?.updatedUser || null;
}

// เซฟ cache จากผล API (merge ของเดิมกันฟิลด์หาย)
function writeCacheFromAPI(resp) {
  const u = getUserFrom(resp);
  if (!u) return;

  const prev = safeParse(localStorage.getItem(K.user)) || {};
  const normalized = { ...u };
  // map username -> name ถ้า backend ส่ง username มา
  if (normalized.username && !normalized.name) normalized.name = normalized.username;

  localStorage.setItem(K.user, JSON.stringify({ ...prev, ...normalized }));

  // อัปเดต URL รูป
  if (normalized.profilePicture) {
    const url = normalized.profilePicture.startsWith?.("http")
      ? normalized.profilePicture
      : `${backendURL}/uploads/${normalized.profilePicture}`;
    localStorage.setItem(K.profileImageURL, url);
  }
}

// อ่าน cache -> state
function readCacheIntoState({ setName, setProfileImage }) {
  const u = safeParse(localStorage.getItem(K.user));
  setName(u?.name || u?.username || "");

  let img = localStorage.getItem(K.profileImageURL) || "";
  if (img && !img.startsWith("http")) img = `${backendURL}${img}`;
  setProfileImage(img || fallbackUser);
}

// ดึง API แค่ครั้งเดียวต่อ session
async function fetchOncePerSession() {
  const hasToken = !!localStorage.getItem(K.token);
  if (!hasToken) return null;

  if (sessionStorage.getItem(K.fetchedFlag) === "1") {
    return null; // เคยดึงแล้วใน session นี้
  }

  const ud = await userPreview();
  writeCacheFromAPI(ud);
  sessionStorage.setItem(K.fetchedFlag, "1");
  return ud;
}

// ===== Modal Component =====
function EditProfileModal({
  open,
  onClose,
  initialName,
  initialImage,
  onUpdated,
}) {
  const [name, setName] = useState(initialName || "");
  const [preview, setPreview] = useState(initialImage || fallbackUser);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // sync initial props เมื่อ modal เปิดใหม่
  useEffect(() => {
    if (open) {
      setName(initialName || "");
      setPreview(initialImage || fallbackUser);
      setFile(null);
    }
  }, [open, initialName, initialImage]);

  // ปิดด้วย ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return alert("กรุณาเลือกรูปภาพ");
    if (f.size > 5 * 1024 * 1024) return alert("ไฟล์ใหญ่เกิน 5MB");
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url); // พรีวิวทันที
  };

  const onSave = async () => {
    // ถ้าไม่เปลี่ยนอะไรเลยก็ปิดเฉย ๆ
    if (!file && name === initialName) {
      onClose?.();
      return;
    }
    try {
      setSaving(true);
      const form = new FormData();
      // NOTE: ถ้า backend ใช้ "username" ให้แก้ "name" เป็น "username"
      if (name && name !== initialName) form.append("name", name);
      if (file) form.append("profilePicture", file);

      const res = await userUpdateMe(form);

      // เขียน cache จาก response (ถ้ามี)
      writeCacheFromAPI(res);

      // ===== OPTIMISTIC UPDATE: ส่งค่าใหม่ให้ parent เซ็ตทันที =====
      const u = getUserFrom(res) || {};
      const finalName = u.name ?? u.username ?? name; // ไม่มีใน resp ก็ใช้ค่าที่พิมพ์
      let finalUrl;
      if (u.profilePicture) {
        finalUrl = u.profilePicture.startsWith?.("http")
          ? u.profilePicture
          : `${backendURL}/uploads/${u.profilePicture}`;
      } else if (file) {
        finalUrl = preview; // ใช้ objectURL ให้เด้งไว
      } else {
        finalUrl = initialImage;
      }
      onUpdated?.({ name: finalName, profileImageURL: finalUrl });

      // แจ้งทั้งแอป
      window.dispatchEvent(new Event("profile:updated"));

      onClose?.();
    } catch (err) {
      console.error(err);
      alert("อัปเดตโปรไฟล์ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* modal */}
      <div className="relative z-[1000] w-[90%] max-w-md bg-white rounded-2xl shadow-2xl p-5 sm:p-6">
        {/* header: back + center title */}
        <div className="relative flex items-center h-12">
          <button
            type="button"
            className="absolute left-0 top-1/2 -translate-y-1/2 p-2 cursor-pointer"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            <IoChevronBack className="text-2xl" />
          </button>
          <h3 className="mx-auto text-xl font-semibold font-prompt">
            My Profile
          </h3>
        </div>

        {/* avatar + pick button */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-28 h-28 rounded-full overflow-hidden border">
            <img
              src={preview || fallbackUser}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.src = fallbackUser)}
            />
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-full cursor-pointer border text-sm hover:bg-gray-50"
          >
            Edit Profile Image
          </button>
          <input
            type="file"
            accept="image/*"
            hidden
            ref={fileInputRef}
            onChange={onPickFile}
          />

          {/* name input */}
          <div className="w-full">
            <label className="block text-lg mb-1 font-prompt">username</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-[20px] font-prompt border border-[#e3e3e3] shadow-sm rounded-full px-5 py-3 outline-none"
              placeholder="username"
            />
          </div>
        </div>

        {/* actions */}
        <div className="mt-6 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="w-full px-4 py-2 font-prompt rounded-full bg-[#C0B275] text-white hover:bg-[#ac9f66] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Main Component =====
export const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState(fallbackUser);
  const [isAuthed, setIsAuthed] = useState(!!localStorage.getItem(K.token));

  // modal state
  const [editOpen, setEditOpen] = useState(false);

  const navigate = useNavigate();

  // init: sync จาก cache ก่อน แล้วค่อยลอง fetchOncePerSession
  useEffect(() => {
    readCacheIntoState({ setName, setProfileImage });
    setIsAuthed(!!localStorage.getItem(K.token));

    (async () => {
      try {
        const ud = await fetchOncePerSession();
        if (ud?.user) {
          readCacheIntoState({ setName, setProfileImage });
          setIsAuthed(true);
        }
      } catch {
        // เงียบ ๆ
      }
    })();
  }, []);

  // กดนอก dropdown → ปิด
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ฟัง event จากที่อื่น ๆ ในแอป
  useEffect(() => {
    const onLogin = () => {
      sessionStorage.removeItem(K.fetchedFlag);
      setIsAuthed(true);
      fetchOncePerSession().finally(() =>
        readCacheIntoState({ setName, setProfileImage })
      );
    };

    const onLogout = () => {
      setIsAuthed(false);
      setName("");
      setProfileImage(fallbackUser);
    };

    const onProfileUpdated = () => {
      (async () => {
        try {
          const ud = await userPreview();
          writeCacheFromAPI(ud);
        } catch {}
        readCacheIntoState({ setName, setProfileImage });
      })();
    };

    window.addEventListener("auth:login", onLogin);
    window.addEventListener("auth:logout", onLogout);
    window.addEventListener("profile:updated", onProfileUpdated);
    return () => {
      window.removeEventListener("auth:login", onLogin);
      window.removeEventListener("auth:logout", onLogout);
      window.removeEventListener("profile:updated", onProfileUpdated);
    };
  }, []);

  // ถ้า logout ระหว่างเปิดโมดัล ให้ปิดโมดัลอัตโนมัติ
  useEffect(() => {
    if (!isAuthed && editOpen) setEditOpen(false);
  }, [isAuthed, editOpen]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {}

    try {
      // ล้างทุกอย่าง
      localStorage.clear();
      sessionStorage.clear();

      // ลบ cookie เผื่อใช้ cookie-auth
      document.cookie.split(";").forEach((c) => {
        const n = c.split("=")[0].trim();
        if (n)
          document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      });

      // ถ้ามี axios global header
      if (
        typeof axios !== "undefined" &&
        axios?.defaults?.headers?.common?.Authorization
      ) {
        delete axios.defaults.headers.common.Authorization;
      }

      setIsAuthed(false);
      setName("");
      setProfileImage(fallbackUser);

      window.dispatchEvent(new Event("auth:logout"));
    } finally {
      navigate("/");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ป๊อปอัปแก้โปรไฟล์: เรนเดอร์เฉพาะตอนล็อกอิน */}
      {isAuthed && (
        <EditProfileModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          initialName={name}
          initialImage={profileImage}
          onUpdated={({ name: newName, profileImageURL: newUrl } = {}) => {
            // เด้งทันที (optimistic) + เขียน cache เผื่อ backend ไม่ส่ง user กลับมา
            if (typeof newName === "string") {
              setName(newName);
              const prev = safeParse(localStorage.getItem(K.user)) || {};
              localStorage.setItem(K.user, JSON.stringify({ ...prev, name: newName }));
            }
            if (typeof newUrl === "string") {
              setProfileImage(newUrl);
              localStorage.setItem(K.profileImageURL, newUrl);
            }
          }}
        />
      )}

      <button
        className="flex items-center rounded-full bg-[#F6F6F6] border-[0.5px] border-[#C4C4C4] hover:bg-gray-200 pr-3 transition cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <img
          src={profileImage || fallbackUser}
          alt="Profile"
          className="w-7 h-7 sm:w-9 sm:h-9 md:w-8 md:h-8 rounded-full object-cover border border-[#C4C4C4]"
          onError={(e) => (e.currentTarget.src = fallbackUser)}
        />
        <div className="w-6 h-6 flex items-center justify-center">
          <IoMdArrowDropdown className="text-[#848484] text-sm" />
        </div>
      </button>

      <div
        role="menu"
        aria-label="User menu"
        className={`absolute right-0 mt-2 w-60 bg-white border-[0.5px] border-[#e0e0e0] text-black rounded-xl shadow-xl z-50 p-4 space-y-2 transition-all duration-300 transform origin-top-right
        ${
          isOpen
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-1 space-x-2">
          <div className="flex justify-between w-full">
            <div className="flex items-center gap-4">
              <img
                src={profileImage || fallbackUser}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => (e.currentTarget.src = fallbackUser)}
              />
              <p className="text-sm font-medium truncate">{name || "Guest"}</p>
            </div>

            {/* ปุ่มแก้ไข → เปิด modal (เฉพาะตอน login) */}
            {isAuthed && (
              <button
                type="button"
                className="flex items-center cursor-pointer hover:opacity-80"
                onClick={() => {
                  setEditOpen(true);
                  setIsOpen(false); // ปิดเมนูหลักก่อน
                }}
                title="Edit profile"
              >
                <FaRegEdit size={15} />
              </button>
            )}
          </div>
        </div>

        <hr className="border-[#e0e0e0]" />
        {isAuthed ? (
          <button
            onClick={handleLogout}
            className="block w-full text-center cursor-pointer bg-[#C0B275] text-white text-[20px] font-medium py-2 rounded-md hover:bg-[#ac9f66] transition"
          >
            Sign out
          </button>
        ) : (
          <>
            <Link
              to="/signin"
              className="block w-full text-center cursor-pointer bg-[#C0B275] text-white text-[20px] font-medium py-2 rounded-md hover:bg-[#ac9f66] transition"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="block w-full text-center cursor-pointer border border-white text-[20px] text-black font-medium py-2 rounded-md bg-[#e5e5e5] hover:bg-[#d4d4d4] hover:text-black transition"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </div>
  );
};
