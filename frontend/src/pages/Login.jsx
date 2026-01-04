import React, { useState } from "react";
import "./bgAnimation.css";
import { Link, useNavigate } from "react-router-dom";
import { UserData } from "../context/UserContext";
import { PostData } from "../context/PostContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { loginUser, loading } = UserData();
  const { fetchPosts } = PostData();

  const handleSubmit = (e) => {
    e.preventDefault();
    loginUser(email, password, navigate, fetchPosts);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F14] text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0B0F14] overflow-hidden">
      {/* Soft background glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-[#111827]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-semibold text-white text-center">
          Welcome back
        </h1>
        <p className="text-gray-400 text-sm text-center mt-2">
          Log in to continue on <span className="text-indigo-400">Twikit</span>
        </p>

        {/* Form */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full px-4 py-3 rounded-xl bg-[#0B0F14] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 transition"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-xl bg-[#0B0F14] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 transition"
              required
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-white transition select-none"
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl text-white font-medium bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-90 active:scale-[0.98] transition"
          >
            Log In
          </button>
        </form>

        <p className="text-sm text-gray-400 text-center mt-6">
          New on Twikit?{" "}
          <Link
            to="/register"
            className="text-indigo-400 hover:text-indigo-300 transition"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
