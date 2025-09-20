// src/routes/RequireAuth.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function RequireAuth() {
  const token = localStorage.getItem("userToken");
  const location = useLocation();

  if (!token) {
    // ส่ง path ปัจจุบันไปให้หน้า SignIn รู้ว่ามาจากไหน
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />; // ผ่านแล้วค่อย render children (เช่น Dashboard)
}
