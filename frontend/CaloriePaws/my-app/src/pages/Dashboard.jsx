import { SideBar } from "../Components/Dashboard/SideBar";
import { MainContent } from "../Components/Dashboard/MainContent";
import { Aside } from "../Components/Dashboard/Aside";


export const Dashboard = () => {
  return (
    <div
      className="
       grid
       grid-cols-1
       md:grid-cols-[250px_1fr_360px]
       lg:grid-cols-[250px_1fr_380px]
       w-full
       min-h-screen
      "
    >
      {/* Sidebar (เฉพาะ >= md) */}
      <div className="hidden md:block bg-white">
        <SideBar />
      </div>

      {/* Main Content */}
      <div className="
      bg-[#F4F4F4] pt-6 sm:pt-8 px-4 sm:px-6 md:px-8 lg:px-10
      min-w-0 min-h-0
      lg:h-[100svh] lg:overflow-y-auto overscroll-y-contain
      ">
        <MainContent />
      </div>

      {/* Aside: มือถืออยู่ล่าง, เดสก์ท็อป sticky ขวา */}
      <aside className="order-3 lg:order-none bg-white
      min-w-0 min-h-0
      lg:sticky lg:top-0 h-auto
      lg:h-[100svh] overflow-visible lg:overflow-y-auto overscroll-y-contain
      ">
        <Aside />
      </aside>
    </div>
  );
};

