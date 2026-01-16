import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserData } from "../context/UserContext";
import { PostData } from "../context/PostContext";
import axios from "axios";

const Register = () => {
  // Step management
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Registration

  // Step 1: Email
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // Step 2: OTP
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);

  // Step 3: Registration
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [file, setFile] = useState("");
  const [filePrev, setFilePrev] = useState("");

  // UI states
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const { registerUser, loading: registerLoading } = UserData();
  const { fetchPosts } = PostData();
  const navigate = useNavigate();

  // Step 1: Send OTP
  const sendOTP = async (e) => {
    e.preventDefault();
    setError("");

    // console.log("=== SEND OTP DEBUG ===");
    // console.log("Email state value:", email);
    // console.log("Email type:", typeof email);
    // console.log("Email length:", email?.length);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return setError("Please enter a valid email address");
    }

    setLoading(true);
    // console.log("Sending OTP to:", email);

    try {
      // console.log("Making API call to /api/auth/send-otp");
      // console.log("Request body:", { email });
      const { data } = await axios.post("/api/auth/send-otp", { email }, {
        timeout: 30000 // 30 second timeout
      });
      console.log("OTP sent successfully:", data);
      setEmailSent(true);
      setStep(2);
      setError("");
    } catch (error) {
      console.error("OTP send error:", error);
      console.error("Error response:", error.response?.data);
      setError(error.response?.data?.message || error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const verifyOTPHandler = async (e) => {
    e.preventDefault();
    setError("");

    if (otp.length !== 4) {
      return setError("OTP must be 4 digits");
    }

    setLoading(true);

    try {
      const { data } = await axios.post("/api/auth/verify-otp", { email, otp });
      setOtpVerified(true);
      setStep(3);
      setError("");
    } catch (error) {
      setError(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Check username availability (debounced)
  const checkUsernameAvailability = async (usernameValue) => {
    if (!usernameValue || usernameValue.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);

    try {
      const { data } = await axios.post("/api/auth/check-username", { username: usernameValue });
      setUsernameAvailable(data.available);
    } catch (error) {
      setUsernameAvailable(false);
    } finally {
      setCheckingUsername(false);
    }
  };

  // Debounce username check
  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);

    // Clear previous timeout
    if (window.usernameTimeout) {
      clearTimeout(window.usernameTimeout);
    }

    // Set new timeout
    window.usernameTimeout = setTimeout(() => {
      checkUsernameAvailability(value);
    }, 500);
  };

  // File handler
  const changeFileHandler = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Only image files are allowed");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);

    reader.onloadend = () => {
      setFilePrev(reader.result);
      setFile(selectedFile);
      setError("");
    };
  };

  // Step 3: Final registration
  const submitHandler = (e) => {
    e.preventDefault();

    // Username validation
    if (username && username.trim().length < 3) {
      return setError("Username must be at least 3 characters");
    }
    if (username && username.trim().length > 20) {
      return setError("Username must be under 20 characters");
    }
    if (username && usernameAvailable === false) {
      return setError("Username is already taken");
    }

    // Name validation
    if (name.trim().length < 3) {
      return setError("Name must be at least 3 characters long");
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
    if (username) formdata.append("username", username);
    formdata.append("file", file);

    registerUser(formdata, navigate, fetchPosts);
  };

  if (registerLoading) {
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

        {/* Step Indicator */}
        <div className="flex items-center justify-center mt-6 space-x-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
            1
          </div>
          <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-700'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
            2
          </div>
          <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-700'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
            3
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-red-400 text-sm text-center mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
            {error}
          </p>
        )}

        {/* STEP 1: Email */}
        {step === 1 && (
          <form className="mt-6 space-y-4" onSubmit={sendOTP}>
            <div>
              <label className="text-gray-300 text-sm mb-2 block">Email Address</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0B0F14] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-medium bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Verification Code"}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 2 && (
          <form className="mt-6 space-y-4" onSubmit={verifyOTPHandler}>
            <div>
              <label className="text-gray-300 text-sm mb-2 block">Verification Code</label>
              <p className="text-gray-400 text-xs mb-3">
                We sent a 4-digit code to <span className="text-indigo-400">{email}</span>
              </p>
              <input
                type="text"
                placeholder="Enter 4-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                className="w-full px-4 py-3 rounded-xl bg-[#0B0F14] border border-white/10 text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:border-indigo-400 transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 4}
              className="w-full py-3 rounded-xl text-white font-medium bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full py-2 text-gray-400 hover:text-white text-sm transition"
            >
              ← Change Email
            </button>
          </form>
        )}

        {/* STEP 3: Complete Registration */}
        {step === 3 && (
          <form className="mt-6 space-y-4" onSubmit={submitHandler}>
            {/* Profile Image */}
            <div className="flex justify-center flex-col items-center">
              <div
                onClick={() => fileInputRef.current.click()}
                className={`relative cursor-pointer group w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${file
                    ? "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                    : error && error.includes("Profile image")
                      ? "border-red-500 shadow-[0_0_15px_rgba(239,44,44,0.3)]"
                      : "border-dashed border-white/20 hover:border-indigo-400"
                  }`}
              >
                {filePrev ? (
                  <img
                    src={filePrev}
                    alt="profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="text-gray-500 text-xs text-center flex flex-col items-center">
                    <span className="text-xl mb-1">📸</span>
                    Upload
                  </div>
                )}

                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition">
                  {filePrev ? "Change" : "Select"}
                </div>
              </div>

              {file && (
                <p className="text-green-400 text-[10px] mt-2 font-medium bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                  Ready to go! ✨
                </p>
              )}

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={changeFileHandler}
                className="hidden"
              />
            </div>

            {/* Username (required) */}
            <div>
              <label className="text-gray-300 text-sm mb-2 block">
                Username <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Choose a unique username"
                  value={username}
                  onChange={handleUsernameChange}
                  className="w-full px-4 py-3 rounded-xl bg-[#0B0F14] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 transition"
                  required
                />
                {checkingUsername && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    Checking...
                  </span>
                )}
                {!checkingUsername && usernameAvailable === true && username.length >= 3 && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400 text-sm">
                    ✓ Available
                  </span>
                )}
                {!checkingUsername && usernameAvailable === false && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400 text-sm">
                    ✗ Taken
                  </span>
                )}
              </div>
            </div>

            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
        )}

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
