import { FiSearch } from "react-icons/fi";

export const SearchBar = () => {
  return (
    <div className="relative group">
      <div className="flex items-center bg-[#c0b275] h-10 rounded-full px-2 transition-all duration-300 group-hover:w-64 w-10 overflow-hidden">
        <input
          type="text"
          placeholder="Search"
          className="bg-transparent outline-none text-white placeholder-white w-0 group-hover:w-full transition-all duration-300 text-sm px-2"
        />
        <button className="flex items-center justify-center bg-[#c0b275] text-white w-10 h-10 rounded-full transition-all duration-300 group-hover:bg-white group-hover:text-[#c0b275]">
          <FiSearch className="text-lg" />
        </button>
      </div>
    </div>
  );
};
