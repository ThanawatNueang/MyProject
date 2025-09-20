import react from 'react'
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
