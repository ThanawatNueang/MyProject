import React, { useState } from 'react'
import { MdOutlineLogin } from "react-icons/md";
import { Link, useNavigate } from 'react-router-dom';
import imageLog from '../../assets/images/Subtract.png'
import { FaUser } from "react-icons/fa";
import { IoMdLock } from "react-icons/io";
import { GrFormViewHide, GrFormView } from "react-icons/gr";
import { loginUser } from '../API/auth';


export const SignIn = () => {
const [showPassword, setShowPassword] = useState(false);
const [password, setPassword] = useState("");
const [name, setName] = useState("");

const navigate = useNavigate("");


const handleSignIn = async () => {
    const data = {
        name,
        password
    }

    if(!name || !password){
        alert("Please enter both username and password");
        return;
    }

    const res = await loginUser(data);
    console.log("response from API", res);

    navigate('/dashboard');
  setTimeout(() => {
    window.location.reload();
  }, 100);
}

  return (
    <div className='container'>
         <div className="flex justify-between items-center pt-10 py-6">
            <Link 
            to="/"
            className="text-xl lg:text-3xl font-prompt cursor-pointer">
            Calorie
            <span className="relative inline-block">
                <div className="oval oval1 absolute"></div>
                <div className="oval oval2 absolute"></div>
                <div className="oval oval3 absolute"></div>
                <div className="oval oval4 absolute"></div>
                <div className="oval oval5 absolute"></div>
                Paws
            </span>
            </Link>
        </div>

        {/* singIn */}
        <div className='flex justify-center items-center pb-6 gap-5'>
            {/* side left */}
            <div className='flex flex-col gap-10 sm:p-10 items-center w-full h-full'>
                <div className='flex rounded-full p-3 shadow-lg border-[0.5px] border-[#e4e4e4]'>
                    <MdOutlineLogin size={30} />
                </div>
                <h1 className='font-Medi text-5xl'>Welcome Back</h1>
                <p className='text-center text-[13px] text-[#929292] font-light'>Upload a meal photo or log foods get instant calories, protein, carbs, and fat. Adjust portions, see what’s left for today, and keep your goals on track.</p>
                <div className='flex flex-col w-full gap-5 px-4 pt-5'>
                    <div className='relative w-full'>
                        <FaUser size={10} className='absolute left-6 top-1/2 transform -translate-y-1/2 text-[#696969]'/>
                        <input 
                        type="text"
                        placeholder='User Name'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className='w-full shadow-sm rounded-full py-3 px-13 outline-none border-[0.5px] border-[#e8e8e8] text-sm' 
                        />
                    </div>
                    <div className="relative w-full">
                        <IoMdLock size={13} className='absolute left-6 top-1/2 transform -translate-y-1/2 text-[#696969]'/>
                        <input 
                            type={showPassword ? "text" : "password"}
                            placeholder='Password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className='w-full shadow-sm rounded-full py-3 px-13 outline-none border-[0.5px] border-[#e8e8e8] text-sm' 
                        />
                        {/* toggle show/hide password */}
                        <div 
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#696969] cursor-pointer"
                        onClick={() => setShowPassword(!showPassword)}
                        > 
                        {showPassword ? <GrFormView size={24}/> : <GrFormViewHide size={20}/>}   
                        </div>
                    </div>
                <div className='flex justify-between items-center px-5 py-3'>
                </div>

                {/* sign in button */}
                 <button 
                    className='w-full cursor-pointer bg-black rounded-full p-2.5 text-white font-Medi text-[22px]'
                    onClick={handleSignIn}
                    >Sign In
                 </button>
                 
                 <div className='flex justify-center items-center gap-3 pt-5'>
                    <p className='text-[13px] text-[#8C8C8C]'>Don’t have an account ? </p>
                    <Link
                    to="/signup" 
                    className='text-[15px] text-black hover:underline'>Sign Up</Link>
                 </div>
                </div>
            </div>
            {/* side right */}
            <div className='relative hidden lg:flex items-center justify-center w-full h-full'>
                <img src={imageLog} alt="" />  
            </div>
        </div>
    </div>
  );
};  

