import { Link, useNavigate } from "react-router-dom";
import user from "../../assets/images/user.jpg";
import { FaPlus } from "react-icons/fa6";
import { useState, useEffect } from "react";
import { userUpdateMe } from "../API/user";

const API_BASE = "https://caloriepaws-node.azurewebsites.net"

export const ProfileSetting = () => {
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(false);

  // โหลด preview base64 จาก LS ถ้ามี
  useEffect(() => {
    const savedImage = localStorage.getItem("profileImage");
    if (savedImage) setImagePreview(savedImage);
  }, []);

  const handleNext = async () => {
    if (!fileData) {
      navigate("/");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("profilePicture", fileData);

      const res = await userUpdateMe(formData);
      console.log("อัปเดตรูปสำเร็จ", res?.message || res);

      if (res?.user?.profilePicture) {
        const bust = Date.now();
        const fullUrl = `${API_BASE}/uploads/${res.user.profilePicture}?t=${bust}`;
        localStorage.setItem("profileImageURL", fullUrl); // ให้ navbar/home ใช้
      }

      navigate("/");
    } catch (err) {
      console.error("อัปเดตรูปโปรไฟล์ไม่สำเร็จ", err?.message || err);
      alert("อัปเดตรูปไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate("/goal-target");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileData(file);

    // แสดง preview ทันที + เก็บ base64 เผื่อ fallback
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result;
      setImagePreview(base64Data);
      localStorage.setItem("profileImage", base64Data);
    };
    reader.readAsDataURL(file);
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
    <div className="flex flex-col items-center justify-center w-full gap-6 sm:gap-10 p-6 sm:p-10">
      <h1 className="font-Medi text-3xl sm:text-5xl text-center">
        Pick a profile picture 📸
      </h1>
      <p className="text-center text-sm sm:text-base text-gray-500 font-light">
        Have a favorite selfie? Upload it now.
      </p>

      {/* Avatar picker */}
      <div className="w-full max-w-md sm:max-w-lg px-2 sm:px-0">
        <div className="flex items-center justify-center">
          <div className="relative">
            <label
              htmlFor="fileInput"
              className="cursor-pointer block relative"
              aria-label="Upload profile image"
            >
              {/* รูปโปรไฟล์ */}
              <img
                src={imagePreview || user}
                alt="Profile Preview"
                onError={(e) => (e.currentTarget.src = user)}
                className="rounded-full object-cover w-40 h-40 sm:w-56 sm:h-56 shadow-sm border border-gray-200"
              />
              {/* ปุ่ม + มุมขวาล่าง */}
              <div className="absolute -bottom-2 -right-2 sm:bottom-0 sm:right-0 bg-black text-white text-2xl sm:text-3xl p-3 sm:p-4 rounded-full shadow-md">
                <FaPlus />
              </div>
            </label>

            <input
              type="file"
              id="fileInput"
              accept="image/jpeg, image/jpg, image/png"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
        </div>
        {/* hint เล็ก ๆ */}
        <p className="text-center text-xs sm:text-sm text-gray-500 mt-3">
          JPG or PNG • Up to 5&nbsp;MB
        </p>
      </div>

      {/* Actions */}
      <div className="w-full max-w-md sm:max-w-lg mt-4 sm:mt-6 px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className="w-full rounded-full py-3 bg-black text-white font-Medi text-lg sm:text-xl disabled:opacity-50"
            onClick={handleBack}
            disabled={loading}
          >
            Back
          </button>
          <button
            className={`w-full rounded-full py-3 font-Medi text-lg sm:text-xl transition
              ${!loading ? "bg-black text-white" : "bg-gray-300 text-white cursor-not-allowed"}`}
            onClick={handleNext}
            disabled={loading}
          >
            {loading ? "Saving..." : imagePreview ? "Finish" : "Skip"}
          </button>
        </div>
      </div>
    </div>
  </div>
);

};
