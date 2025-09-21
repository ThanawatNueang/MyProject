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

      <div className="flex flex-col gap-10 p-10 items-center justify-center w-full h-full">
        <h1 className="font-Medi text-5xl text-center">Pick a profile picture 📸</h1>
        <p className="text-center text-[13px] text-[#929292] font-light">
          Have a favorite selfie? Upload it now.
        </p>

        <div className="flex items-center flex-col w-full gap-5 px-80 ">
          <div className="flex w-60 h-60">
            <div className="relative z-10">
              <label htmlFor="fileInput" className="cursor-pointer">
                <img
                  src={imagePreview || user}
                  alt="Profile Preview"
                  className="rounded-full w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.src = user)}
                />
                <div className="bg-black text-white text-3xl absolute bottom-0 right-0 z-20 p-5 rounded-full">
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
        </div>

        <div className="flex w-full gap-3 px-80 pt-5">
          <button
            className="w-full cursor-pointer bg-black rounded-full p-2.5 text-white font-Medi text-[22px]"
            onClick={handleBack}
            disabled={loading}
          >
            Back
          </button>
          <button
            className="w-full cursor-pointer bg-black rounded-full p-2.5 text-white font-Medi text-[22px]"
            onClick={handleNext}
            disabled={loading}
          >
            {loading ? "Saving..." : imagePreview ? "Finish" : "Skip"}
          </button>
        </div>
      </div>
    </div>
  );
};
