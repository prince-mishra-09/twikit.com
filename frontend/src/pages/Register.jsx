import React, { useState } from "react";
import "./bgAnimation.css"
import { Link } from "react-router-dom";

const Register = () => {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [agree, setAgree] = useState(false)

    const [showPassword, setShowPassword] = useState(false);


    

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Form submitted:", name, email, password);
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-pink-700 to-indigo-800 overflow-hidden">

            {/* Animated Twikit.com Text */}
            {/* <div className="absolute inset-0">
                {Array.from({ length: 30 }).map((_, i) => {
                    const neonColors = ["#ff4d6d", "#ff6ec7", "#8e2de2", "#4a00e0", "#00fff7", "#ff00f7"];
                    return (
                        <span
                            key={i}
                            className="twikit-text"
                            style={{
                                left: `${Math.random() * 100}%`,
                                fontSize: `${14 + Math.random() * 25}px`,
                                color: neonColors[Math.floor(Math.random() * neonColors.length)],
                                animationDuration: `${4 + Math.random() * 6}s`,
                                animationDelay: `${Math.random() * 5}s`,
                            }}
                        >
                            twikit.com
                        </span>
                    );
                })}
            </div> */}

            {/* Registration Card */}
            <div className="z-10 max-w-md w-full bg-black/80 rounded-2xl shadow-2xl p-8 space-y-6 backdrop-blur-md border border-purple-400">
                <h1 className="text-3xl font-bold text-center text-white tracking-wide">
                    Create Your Account
                </h1>

                {/* Social Buttons */}
                <div className="flex flex-col space-y-3">
                    {[
                        { name: "Google", icon: "https://img.icons8.com/color/24/google-logo.png", color: "hover:bg-red-500/20 hover:text-red-400" },
                        { name: "Facebook", icon: "https://img.icons8.com/color/24/facebook-new.png", color: "hover:bg-blue-500/20 hover:text-blue-400" },
                        { name: "X", icon: "https://img.icons8.com/ios-glyphs/24/twitter.png", color: "hover:bg-sky-400/20 hover:text-sky-300" },
                    ].map((btn) => (
                        <button
                            key={btn.name}
                            className={`flex items-center justify-center space-x-2 border border-gray-600 rounded-lg py-2 text-white transition-all duration-300 ${btn.color} hover:scale-105`}
                        >
                            <img src={btn.icon} alt={btn.name} />
                            <span>Sign up with {btn.name}</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-center space-x-2 text-gray-400 text-sm">
                    <span className="border-t border-gray-600 flex-1"></span>
                    <span>or sign up with email</span>
                    <span className="border-t border-gray-600 flex-1"></span>
                </div>

                {/* Registration Form */}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <input
                            type="text"
                            name="username"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Username"
                            className="w-full px-4 py-2 rounded-lg bg-black/50 border border-purple-400 text-white focus:ring-2 focus:ring-pink-400 focus:outline-none placeholder-gray-300 transition-all duration-300"
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                            onChange={(e) => setPassword(e.target.value)}
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

                    <div className="flex items-center space-x-2 text-white text-sm">
                        <input
                            type="checkbox"
                            name="agree"
                            checked={agree}
                            onChange={(e) => setAgree(e.target.checked)}
                            required
                            className="accent-pink-400"
                        />
                        <label>
                            I agree to the{" "}
                            <span className="text-pink-400 hover:underline cursor-pointer">
                                Terms
                            </span>{" "}
                            and{" "}
                            <span className="text-pink-400 hover:underline cursor-pointer">
                                Privacy Policy
                            </span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-2 rounded-lg text-white bg-gradient-to-r from-pink-500 to-purple-500 shadow-lg hover:scale-105 transition-all duration-300"
                    >
                        Sign Up
                    </button>
                </form>

                <p className="text-sm text-gray-300 text-center">
                    Already have an account?{" "}
                    <Link to="/login" className="text-pink-400 hover:underline">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
