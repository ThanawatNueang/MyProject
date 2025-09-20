import cafe from '../../assets/images/cafe.png'

export const HealthTips = () => {
  return (
   <div className='container relative py-20 md:py-40'>
      {/* Heading + Image */}
      <div className='flex items-center justify-center relative text-center'>
        <h1 className='font-prompt text-[75px] sm:text-[120px] md:text-[180px] lg:text-[220px] xl:text-[270px] z-0 leading-none'>
          CaloriePaws
        </h1>
        <img
          src={cafe}
          className='absolute z-10 w-[360px] sm:w-[380px] md:w-[400px] lg:w-[600px] xl:w-[800px] -top-10 sm:-top-20'
          alt=""
        />
      </div>

      {/* 3-column Text Section */}
      <div className='w-full flex flex-col md:flex-row justify-between px-4 sm:px-10 gap-30 mt-60 md:mt-20'>
        {/* Column 1 */}
        <div className='max-w-full md:max-w-[900px] text-center lg:text-left'>
          <p className='font-coco text-2xl sm:text-3xl md:text-lg md:text-left lg:text-3xl mb-2'>
            Search & Discover 
          </p>
          <p className='font-Ul text-[13px] sm:text-[md] md:text-sm md:text-left lg:text-lg'>
            Easily search for meals or<br /> ingredients with accurate <br /> nutrition details.
          </p>
        </div>

        {/* Column 2 */}
        <div className='max-w-full md:max-w-[400px] text-center lg:text-left md:mt-30 lg:mt-60 xl:mt-100'>
          <p className='font-coco text-2xl sm:text-3xl md:text-lg md:text-left lg:text-3xl mb-2'>
            Edit & Calculate
          </p>
          <p className='font-Ul text-[13px] sm:text-[md] md:text-sm md:text-left lg:text-lg'>
            Adjust portions or  <br /> units yourself, with automatic <br /> calorie and nutrient calculation.
          </p>
        </div>

        {/* Column 3 */}
        <div className='max-w-full md:max-w-[500px] text-center lg:text-right'>
          <p className='font-coco text-2xl sm:text-3xl md:text-lg lg:text-3xl mb-2'>
            Track & Improve
          </p>
          <p className='font-Ul text-[13px] sm:text-[md] md:text-sm md:text-right lg:text-lg'>
            Track your eating history, <br />  review past summaries, <br />  and improve your health goals
          </p>
        </div>
      </div>
    </div>
  )
}
