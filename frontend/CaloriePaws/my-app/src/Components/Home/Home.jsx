import react from 'react'
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Banner } from './Banner'
import { Search } from './Search'
import { HealthTips } from './HealthTips'
import { RecentlyUpload } from './RecentlyUpload'
import { Footer } from './Footer'
import { UserFeatureTable } from './UserFeatureTable'
import { Healthier } from '../Shared/Healthier'
// import { PopularDish } from './PopularDish'
import { SearchBar } from './SearchBar'

export const Home = () => {
  const location = useLocation();

  useEffect(() => {
    const fromStateId = location.state?.scrollToId;
    const hashId = location.hash ? location.hash.slice(1) : null;
    const targetId = fromStateId || hashId;
    if (!targetId) return;

    const start = performance.now();
    let raf = 0;

    const tryScroll = () => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (performance.now() - start < 1500) {
        raf = requestAnimationFrame(tryScroll); // เผื่อ DOM/รูปยังโหลดไม่ทัน
      }
    };

    raf = requestAnimationFrame(tryScroll);
    return () => cancelAnimationFrame(raf);
  }, [location.hash, location.state]);
  return (
    <div>
        <Banner/>
        <Search/>
        <Healthier 
          beforeText="Get healthier, faster, in"
          highlightText="Three"
          afterText="easy moves!"
          highlightColor="text-[#C0B275]"
        />
        <HealthTips/>
        <UserFeatureTable/> 
        {/* <Healthier
          beforeText="Popular Dishes"
          highlightText="&"
          afterText="Calories"
          highlightColor="text-[#C0B275]" 
        /> */}
        {/* <PopularDish/> */}
        <SearchBar
          beforeText="Food Nutrition Search"
        />
        <Footer/>
    </div>
  )
}
