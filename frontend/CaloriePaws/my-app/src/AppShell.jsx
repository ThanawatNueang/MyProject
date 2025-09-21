import { useEffect } from "react";
import { useAppStore } from "./store/useAppStore";

export default function AppShell({ children }) {
  const hydrateAfterLogin = useAppStore((s) => s.hydrateAfterLogin);
  const clearAfterLogout  = useAppStore((s) => s.clearAfterLogout);

  useEffect(() => {
    const onLogin  = () => hydrateAfterLogin();
    const onLogout = () => clearAfterLogout();
    window.addEventListener("auth:login", onLogin);
    window.addEventListener("auth:logout", onLogout);
    return () => {
      window.removeEventListener("auth:login", onLogin);
      window.removeEventListener("auth:logout", onLogout);
    };
  }, [hydrateAfterLogin, clearAfterLogout]);

  // รีเฟรชแล้วมี token → โหลดข้อมูลครั้งเดียว
  useEffect(() => {
    if (localStorage.getItem("userToken")) hydrateAfterLogin();
  }, [hydrateAfterLogin]);

  return children;
}