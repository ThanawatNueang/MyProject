import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import { Home } from './Components/Home/Home'
import { Navbar } from './Components/NavBar/Navbar'
import { Upload } from "./pages/Upload";
import { Dashboard } from "./pages/Dashboard";
import { Edit } from "./pages/Edit";
import { SignIn } from './Components/Register/SignIn';
import { SignUp } from './Components/Register/SignUp';
import { ProfileSetup } from './Components/ProfileSetup/ProfileSetup';
import { SetupSec } from './Components/ProfileSetup/SetupSec';
import { ActivityLevel } from './Components/ProfileSetup/activityLevel';
import { FitnessGoal } from './Components/ProfileSetup/FitnessGoal';
import { GoalTarget } from './Components/ProfileSetup/GoalTarget';
import { ProfileSetting } from './Components/ProfileSetup/ProfileSetting';
import { SearchBar } from './Components/Home/SearchBar';
import RequireAuth from './Components/Shared/RequireAuth';


function App() {

  return (
    <>
      <Navbar/>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/upload' element={<Upload/>} />
        <Route element={<RequireAuth/>}>
          <Route path='/dashboard' element={<Dashboard/>} />
          <Route path='/edit' element={<Edit/>} />
        </Route>

        <Route path='/signin' element={<SignIn/>}/>
        <Route path='/signup' element={<SignUp/>}/>
        <Route path='/ProfileSetup' element={<ProfileSetup/>} />
        <Route path='/setupsec' element={<SetupSec/>} />
        <Route path='/activity-level' element={<ActivityLevel/>}/>
        <Route path='/finessgoals' element={<FitnessGoal/>} />
        <Route path='/goal-target' element={<GoalTarget/>} />
        <Route path='/profile-setting' element={<ProfileSetting/>} /> 
      </Routes>
    </>
  )
}

export default App
