import bannerText from '../../assets/images/bannertxt.png'
import bannerPhone from '../../assets/images/bannerPhone.png'
import bannerFood from '../../assets/images/bannerFood.png'
import { BsArrowRight } from "react-icons/bs";
import { useNavigate } from "react-router-dom";

export const Banner = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/upload");
  };

  return (
    <div className='container relative'>
      <div className='relative w-full lg:h-[550px] bg-[radial-gradient(circle,_#E1E1E1_0%,_#F4F4F4_33%,_#F1F1F1_56%,_#E1E1E1_100%)] h-full rounded-3xl mt-22 overflow-visible'>
        <b className='absolute right-0 top-20 bg-[#ffffff] w-10 h-10'></b>
        <b className='absolute right-0 top-20 bg-[#E9E9E9] sm:bg-[#E4E3E4] rounded-br-3xl w-10 h-10'></b>
        
        <button 
          onClick={handleStart}
          className="absolute right-0 top-30 bg-white p-2 rounded-l-4xl z-50 cursor-pointer"
        >
          <div className="flex items-center justify-center border border-black rounded-full px-6 py-2 sm:px-8 sm:py-2">
            <span className="text-black font-Ul text-base sm:text-lg md:text-[15x]">Start Here</span>
            <span className="ml-2 sm:ml-3 text-xl text-black"><BsArrowRight /></span>
          </div>
        </button>

        <b className='absolute right-0 top-44.5 sm:top-45 bg-[#ffffff] w-10 h-10'></b>
        <b className='absolute right-0 top-44.5 sm:top-45 bg-[#F1F1F1] sm:bg-[#E4E3E4] rounded-tr-3xl w-10 h-10'></b>   
        
        <img 
          src={bannerText}
          className='absolute top-[-50px] md:top-[-80px] left-4 sm:left-8 md:left-12 lg:left-15 w-[550px] md:w-[500px] lg:w-[500px] xl:w-[600px] z-10'
        />
        
        <div className='flex flex-col-reverse sm:flex-row items-center sm:justify-between sm:items-end relative z-0'>
          <img src={bannerPhone} className='self-end sm:self-center -rotate-90 sm:rotate-0 w-[60vw] sm:w-[350px] md:w-[550px] lg:w-[600px] lg:-mb-25 xl:w-[750px] flex-shrink-0 -translate-y-9 z-10' alt="" />
          <img src={bannerFood} className='relative 
            w-[72vw] sm:w-[400px] md:w-[450px] lg:w-[580px] xl:w-[660px] flex-shrink-0 z-6 sm:-translate-x-30 md:-translate-x-20 lg:-translate-x-40 xl:-translate-x-50 transition-transform translate-y-10 sm:-translate-y-18 lg:-translate-y-20' alt="" />
        </div>
      </div>
    </div>
  )
}
