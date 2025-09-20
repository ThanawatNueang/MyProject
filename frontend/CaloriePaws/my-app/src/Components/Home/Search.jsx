import bento from "../../assets/images/bento.png";
import bentos from "../../assets/images/bentos.png";
import cucumber from "../../assets/images/cucumber.png";
import meals from "../../assets/images/meals.png";
import bentoLast from "../../assets/images/bentolast.png";
import { useNavigate } from "react-router-dom";
import { Button } from "../Shared/Button";

export const Search = () => {
  const NAVBAR_OFFSET = 96;

  const scrollToIdWithOffset = (id, offset = 0) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };
  return (
    <div className="container pt-20 py-20 sm:pt-30">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 relative">
        {/* column 1 */}
        <div className="bg-[linear-gradient(to_bottom,_#e6e6e6_0%,_#f2f2f2_52%,_#e5e5e5_100%)] rounded-[20px] md:p-4 h-[420px] md:sm:h-[550px] flex items-center justify-center">
          <img
            src={bento}
            className="w-[220px] sm:w-[250px] md:w-[320px]"
            alt=""
          />
        </div>

        {/* column 2 Food Search */}
        <div className="flex flex-col gap-5 h-full">
          <div className="flex flex-col justify-center items-start text-left px-10 gap-3 bg-white rounded-[20px] border-[0.5px] border-[#A7A7A7] shadow-[0px_-4px_3.6px_rgba(0,0,0,0.25)] h-[210px]">
            <p className="font-Demi text-4xl sm:text-[30px] md:text-[32px] xl:text-[36px]">
              Food Search
            </p>
            <p className="font-Ul text-[12px] md:text-[14px] line-clamp-4">
              Find meals and ingredients fast. Get instant calories and macros, then adjust portions or swap items before you save.
            </p>
          </div>
          {/* ปุ่ม Button */}
          <Button
            text="Search For a food"
            bgColor="bg-[#C0B275]"
            textColor="text-white"
            onClick={() =>
              scrollToIdWithOffset("food-search-section", NAVBAR_OFFSET)
            }
          />

          <div className="grid grid-cols-2 gap-3 relative lg:w-[77%] xl:w-[80%]">
            <div className="bg-[linear-gradient(to_bottom,_#E8E8E8_0%,_#F3F3F3_100%)] rounded-[20px] aspect-[3/4.5] flex justify-center items-center">
              <img
                src={meals}
                className="w-[120px] sm:w-[200px] lg:w-[130px]"
                alt=""
              />
            </div>
            <div className="bg-white rounded-[20px] aspect-[3/4.5] overflow-hidden">
              <img
                src={bentoLast}
                className="w-full h-full object-cover"
                alt=""
              />
            </div>
          </div>
        </div>

        {/* column 3  */}
        <div className="flex flex-col gap-3 relative">
          <div className="bg-[linear-gradient(to_bottom,_#E8E8E8_0%,_#F3F3F3_100%)] rounded-[20px] h-[210px] flex justify-center items-center">
            <img
              src={bentos}
              className="w-[250px] md:w-[350px] mx-auto"
              alt=""
            />
          </div>
          <div className="lg:absolute top-[222px] left-0 lg:-left-[80px] grid grid-cols-2 gap-3 z-20">
            <div className="bg-[linear-gradient(to_bottom,_#E8E8E8_0%,_#F3F3F3_100%)] rounded-[20px] h-[250px] sm:h-[330px] flex justify-center items-center">
              <img src={cucumber} className="w-[120px] sm:w-[170px]" alt="" />
            </div>
            <div className="flex flex-col justify-center px-5 sm:px-10 gap-3 bg-white rounded-[20px] border-[0.5px] border-[#A7A7A7] shadow-[0px_3px_3.6px_rgba(0,0,0,0.2)]">
              <p className="font-Demi text-2xl sm:text-[30px] md:text-[28px] xl:text-[36px]">
                Edit & <br /> Calculate!
              </p>
              <p className="font-Ul text-[12px] md:text-[14px] line-clamp-4">
                Tweak ingredients, units, and serving size—see calories and macros update instantly. Save the final version to your log.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
