import { create } from "zustand";
import { userPreview, userPreviewRaw } from "../Components/API/user";
import { nutritionGoal } from "../Components/API/nutritionGoal";
import { eatingHistory } from "../Components/API/eatingHistory";

const fmtDate = (d) => d.toISOString().split("T")[0];

export const useAppStore = create((set, get) => ({
  // ---------- STATE ----------
  user: null,
  profileImage: "",
  caloriesDaily: null,
  weight: null,
  history7d: [],
  // flags
  loaded: {
    user: false,
    calories: false,
    weight: false,
    history7d: false,
  },

  // ---------- ACTIONS ----------
  loadUserOnce: async () => {
    const { loaded } = get();
    if (loaded.user) return;
    const res = await userPreview();
    const backendURL = "http://100.100.45.89:3201";
    set({
      user: res?.user || null,
      profileImage: res?.user?.profilePicture
        ? `${backendURL}/uploads/${res.user.profilePicture}`
        : "",
      loaded: { ...loaded, user: true },
    });
  },

  loadCaloriesOnce: async () => {
    const { loaded } = get();
    if (loaded.calories) return;
    const ng = await nutritionGoal();
    set({
      caloriesDaily: ng || null,
      loaded: { ...loaded, calories: true },
    });
  },

  loadWeightOnce: async () => {
    const { loaded } = get();
    if (loaded.weight) return;
    const w = await userPreviewRaw();
    set({
      weight: w || null,
      loaded: { ...loaded, weight: true },
    });
  },

  loadHistory7dOnce: async () => {
    const { loaded, caloriesDaily } = get();
    if (loaded.history7d) return;
    if (!caloriesDaily) return; // รอให้มีเป้าหมายแคลก่อน

    const today = new Date();
    const past7 = new Date(); past7.setDate(today.getDate() - 6);
    const result = await eatingHistory(fmtDate(past7), fmtDate(today));

    const temp = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit" });

      const calories = (result?.data || [])
        .filter((it) => it.consumed_at?.startsWith(iso))
        .reduce((sum, it) => sum + it.calculated_calories, 0);

      temp.push({
        date: label,
        actual: calories,
        remaining: Math.max(0, (caloriesDaily?.dailyCalorieGoal ?? 1800) - calories),
      });
    }

    set({
      history7d: temp,
      loaded: { ...loaded, history7d: true },
    });
  },

  // เรียกชุดโหลดหลักหลัง “login”
  hydrateAfterLogin: async () => {
    await Promise.all([
      get().loadUserOnce(),
      get().loadCaloriesOnce(),
      get().loadWeightOnce(),
    ]);
    await get().loadHistory7dOnce();
  },

  // เคลียร์ทั้งหมดตอน “logout”
  clearAfterLogout: () =>
    set({
      user: null,
      profileImage: "",
      caloriesDaily: null,
      weight: null,
      history7d: [],
      loaded: { user: false, calories: false, weight: false, history7d: false },
    }),
}));
