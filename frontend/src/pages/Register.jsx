import React, { useState, useRef } from "react";


import { Link, useNavigate } from "react-router-dom";
import { UserData } from "../context/UserContext";
import { PostData } from "../context/PostContext";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [file, setFile] = useState("");
  const [filePrev, setFilePrev] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef(null);

  const { registerUser, loading } = UserData();
  const { fetchPosts } = PostData();
  const navigate = useNavigate();

  const changeFileHandler = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Only image files are allowed");
      return;
    }

    // if (selectedFile.size > 2 * 1024 * 1024) {
    //   setError("Image size must be less than 2MB");
    //   return;
    // }

    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);

    reader.onloadend = () => {
      setFilePrev(reader.result);
      setFile(selectedFile);
      setError("");
    };
  };

  const submitHandler = (e) => {
    e.preventDefault();

    // Username validation
    if (name.trim().length > 20) {
      return setError("Username must be under 20 characters");
    }
    if (name.trim().length < 3) {
      return setError("Username must be at least 3 characters long");
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return setError("Please enter a valid email address");
    }

    // Password validation
    if (password.length < 6) {
      return setError("Password must be at least 6 characters long");
    }

    // Gender validation
    if (!gender) {
      return setError("Please select your gender");
    }

    // File validation
    if (!file) {
      return setError("Profile image is required");
    }

    setError("");

    const formdata = new FormData();
    formdata.append("name", name);
    formdata.append("email", email);
    formdata.append("password", password);
    formdata.append("gender", gender);
    formdata.append("file", file);

    registerUser(formdata, navigate, fetchPosts);
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
      {/* Background glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>

      {/* Register Card */}
      <div className="relative z-10 w-full max-w-md bg-[#111827]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-semibold text-white text-center">
          Create your account
        </h1>
        <p className="text-gray-400 text-sm text-center mt-2">
          Join <span className="text-indigo-400">Twikit</span> and start sharing
        </p>

        {/* Error Message */}
        {error && (
          <p className="text-red-400 text-sm text-center mt-4">
            {error}
          </p>
        )}

        <form className="mt-6 space-y-4" onSubmit={submitHandler}>
          {/* Profile Image */}
          <div className="flex justify-center">
            <div
              onClick={() => fileInputRef.current.click()}
              className="relative cursor-pointer group"
            >
              {filePrev ? (
                <img
                  src={filePrev}
                  alt="profile"
                  className="w-28 h-28 rounded-full object-cover border border-white/20"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-[#0B0F14] border border-dashed border-white/20 flex items-center justify-center text-gray-500 text-sm">
                  Upload
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition">
                Change Photo
              </div>
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={changeFileHandler}
              className="hidden"
              required
            />
          </div>


          <input
            type="text"
            placeholder="Username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#0B0F14] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 transition"
            required
          />

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#0B0F14] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 transition"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 rounded-xl bg-[#0B0F14] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 transition"
              required
            />

            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-white transition select-none"
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>


          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#0B0F14] border border-white/10 text-gray-400 focus:outline-none focus:border-indigo-400 transition"
            required
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <button
            type="submit"
            className="w-full py-3 rounded-xl text-white font-medium bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-90 active:scale-[0.98] transition"
          >
            Create Account
          </button>
        </form>

        <p className="text-sm text-gray-400 text-center mt-6">
          Already on Twikit?{" "}
          <Link
            to="/login"
            className="text-indigo-400 hover:text-indigo-300 transition"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
