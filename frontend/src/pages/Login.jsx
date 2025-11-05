import React,{useState} from 'react'
import "./bgAnimation.css"
import { Link, useNavigate } from "react-router-dom";
import { UserData } from '../context/UserContext';
const Login = () => {
  
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const {loginUser,loading} = UserData();

    const handleSubmit = (e) => {
        e.preventDefault();
        // console.log("Form submitted:", password,email);
        loginUser(email,password,navigate)
    };

    return (
        <>
        {
            loading?(<h1>loading...</h1>):(<div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-pink-700 to-indigo-800 overflow-hidden">

            
            <div className="z-10 max-w-md w-full bg-black/80 rounded-2xl shadow-2xl p-8 space-y-6 backdrop-blur-md border border-purple-400">
                <h1 className="text-3xl font-bold text-center text-white tracking-wide">
                    Login To Your Account
                </h1>

                

                {/* Registration Form */}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    
                    <div>
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e)=>setEmail(e.target.value)}
                            placeholder="Email"
                            className="w-full px-4 py-2 rounded-lg bg-black/50 border border-purple-400 text-white focus:ring-2 focus:ring-pink-400 focus:outline-none placeholder-gray-300 transition-all duration-300"
                            required
                        />
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={password}
                            onChange={(e)=>setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full px-4 py-2 rounded-lg bg-black/50 border border-purple-400 text-white focus:ring-2 focus:ring-pink-400 focus:outline-none placeholder-gray-300 transition-all duration-300"
                            required
                        />
                        <span
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2/4 -translate-y-2/4 cursor-pointer text-white select-none"
                        >
                            {showPassword ? "🙈" : "👁️"}
                        </span>
                    </div>

                    

                    <button
                        type="submit"
                        className="w-full py-2 rounded-lg text-white bg-gradient-to-r from-pink-500 to-purple-500 shadow-lg hover:scale-105 transition-all duration-300"
                    >
                        Login
                    </button>
                </form>

                <p className="text-sm text-gray-300 text-center">
                    Not an account yet?{" "}
                    <Link to="/register" className="text-pink-400 hover:underline">
                        Register now
                    </Link>
                </p>
            </div>
        </div>)
        }
        </>
    );
  
}

export default Login
