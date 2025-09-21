import { BsArrowUpRight } from "react-icons/bs";
import foodPlaceholder from "../../assets/images/foodplaceholder.png"

export const UserFeatureTable = () => {
const features = [
    { number: 1, title: "Save Your Meals" },
    { number: 2, title: "Track Your Food History" },
    { number: 3, title: "Energy & Nutrient Statistics" },
    { number: 4, title: "Set Daily Calorie Goals" },
    { number: 5, title: "Personalized Suggestions" },
  ];

  return (
    <div className="container py-30 md:py-20">
        <div className="bg-white border-t border-b border-black">
            <div className="grid grid-cols-1 md:grid-cols-2 min-h-[400px]">
                {/* Left side - For Logged-In Users */}
                <div className="p-6 sm:p-8 border-b md:border-b-0 md:border-r border-black h-full">
                    <div className="flex flex-col justify-between h-full">
                        <div>
                            <div className="flex items-start justify-between mb-6">
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-Demi select-none">
                                    For Logged - In <br/> Users
                                </h2>
                                <div className="mt-2">
                                    <BsArrowUpRight size={40} />
                                </div>
                            </div>
                        </div>
                    
            
                {/* Food image placeholder */}
                <div className="w-[350px] h-[240px] bg-[linear-gradient(to_bottom,_#e6e6e6_0%,_#f2f2f2_52%,_#e5e5e5_100%)] flex items-center justify-center self-center sm:self-end">
                   <img src={foodPlaceholder} className="w-70   " alt="" />
                </div>
            </div>
        </div>

            {/* Right side - Features list */}
                <div className="">
                    <div className="space-y-0">
                        {features.map((feature, index) => (
                        <div key={feature.number}>
                            <div className="flex items-center gap-6 py-6 px-8 select-none">
                            <div className="flex-shrink-0 w-10 h-10 bg-[#C0B275] text-white rounded-full flex items-center justify-center font-medium text-xl">
                                {feature.number}
                            </div>
                            <span className="text-xl lg:text-3xl font-medium text-black italic cursor-pointer hover:font-light">
                                {feature.title}
                            </span>
                            </div>
                            {index < features.length - 1 && (
                            <div className="border-b border-black"></div>
                            )}
                        </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};