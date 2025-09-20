import React from 'react'

export const Healthier = ({ beforeText, highlightText, afterText, highlightColor }) => {
  return (
    <div className='container flex justify-center items-center py-20 select-none'>
        <div className='flex flex-col sm:flex-row gap-1 md:gap-4 font-Semi items-center'>
            <h1 className='text-xl sm:text-2xl lg:text-4xl'>{beforeText}</h1>
            <h1 className={`${highlightColor} text-2xl sm:text-3xl lg:text-6xl`}>{highlightText}</h1>
            <h1 className='text-xl sm:text-2xl lg:text-4xl'>{afterText}</h1>   
        </div>
    </div>
  )
}
