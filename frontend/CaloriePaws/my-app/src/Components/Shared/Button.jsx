import React from 'react'

export const Button = ({ text, bgColor, textColor, onClick }) => {
  return (
    <div>
        <button
        type="button"
        onClick={onClick}
        className={`${bgColor} ${textColor} cursor-pointer hover:scale-105 rounded-full py-5 w-full lg:w-[80%] mx-auto font-coco text-lg md:text-xl hover:bg-[#000000] hover-white-cursor p-5 text-center transition-all duration-300`}
        >{text}
      </button>
    </div>
  )
}
