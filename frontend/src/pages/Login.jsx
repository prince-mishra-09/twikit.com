import React, { useState } from "react";
import "./bgAnimation.css";
import { Link, useNavigate } from "react-router-dom";
import { UserData } from "../context/UserContext";
import { PostData } from "../context/PostContext";
import axios from "axios";
import { createPortal } from "react-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOTP, setForgotOTP] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();
  const { loginUser, loading } = UserData();
  const { fetchPosts } = PostData();

  const handleSubmit = (e) => {
    e.preventDefault();
    loginUser(email, password, navigate, fetchPosts);
  };

  // Forgot Password: Send OTP
  const handleSendResetOTP = async (e) => {
    e.preventDefault();
    setForgotError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail)) {
      return setForgotError("Please enter a valid email address");
    }

    setForgotLoading(true);

    try {
      const { data } = await axios.post("/api/auth/forgot-password", { email: forgotEmail });
      setForgotStep(2);
      setForgotError("");
    } catch (error) {
      setForgotError(error.response?.data?.message || "Failed to send reset code");
    } finally {
      setForgotLoading(false);
    }
  };

  // Forgot Password: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError("");

    if (forgotOTP.length !== 4) {
      return setForgotError("OTP must be 4 digits");
    }

    if (newPassword.length < 6) {
      return setForgotError("Password must be at least 6 characters");
    }

    setForgotLoading(true);

    try {
      const { data } = await axios.post("/api/auth/reset-password", {
        email: forgotEmail,
        otp: forgotOTP,
        newPassword
      });

      // Success - close modal and show success message
      setShowForgotModal(false);
      setForgotStep(1);
      setForgotEmail("");
      setForgotOTP("");
      setNewPassword("");
      alert(data.message);
    } catch (error) {
      setForgotError(error.response?.data?.message || "Failed to reset password");
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep(1);
    setForgotEmail("");
    setForgotOTP("");
    setNewPassword("");
    setForgotError("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[var(--bg-primary)] overflow-hidden">
      {/* Soft background glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-[var(--card-bg)]/80 backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-semibold text-[var(--text-primary)] text-center">
          Welcome back
        </h1>
        <p className="text-[var(--text-secondary)] text-sm text-center mt-2">
          Log in to continue on <span className="text-[var(--accent)]">Twikit</span>
        </p>

        {/* Form */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition"
              required
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-white transition select-none"
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-sm text-[var(--accent)] hover:opacity-80 transition"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl text-white font-medium bg-[var(--accent)] hover:opacity-90 active:scale-[0.98] transition"
          >
            Log In
          </button>
        </form>

        <p className="text-sm text-[var(--text-secondary)] text-center mt-6">
          New on Twikit?{" "}
          <Link
            to="/register"
            className="text-[var(--accent)] hover:opacity-80 transition"
          >
            Create an account
          </Link>
        </p>
      </div>

      {showForgotModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Reset Password</h2>
              <button
                onClick={closeForgotModal}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-6 space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${forgotStep >= 1 ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
                1
              </div>
              <div className={`w-12 h-0.5 ${forgotStep >= 2 ? 'bg-[var(--accent)]' : 'bg-[var(--bg-secondary)]'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${forgotStep >= 2 ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
                2
              </div>
            </div>

            {/* Error Message */}
            {forgotError && (
              <p className="text-red-400 text-sm text-center mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                {forgotError}
              </p>
            )}

            {/* Step 1: Email */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendResetOTP} className="space-y-4">
                <div>
                  <label className="text-[var(--text-secondary)] text-sm mb-2 block">Email Address</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 rounded-xl text-white font-medium bg-[var(--accent)] hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50"
                >
                  {forgotLoading ? "Sending..." : "Send Reset Code"}
                </button>
              </form>
            )}

            {/* Step 2: OTP + New Password */}
            {forgotStep === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="text-[var(--text-secondary)] text-sm mb-2 block">Verification Code</label>
                  <p className="text-[var(--text-secondary)] text-xs mb-3">
                    We sent a 4-digit code to <span className="text-[var(--accent)]">{forgotEmail}</span>
                  </p>
                  <input
                    type="text"
                    placeholder="Enter 4-digit code"
                    value={forgotOTP}
                    onChange={(e) => setForgotOTP(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-center text-2xl tracking-widest placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition"
                    required
                  />
                </div>

                <div>
                  <label className="text-[var(--text-secondary)] text-sm mb-2 block">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition"
                      required
                    />
                    <span
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-white transition select-none"
                    >
                      {showNewPassword ? "🙈" : "👁️"}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading || forgotOTP.length !== 4}
                  className="w-full py-3 rounded-xl text-white font-medium bg-[var(--accent)] hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50"
                >
                  {forgotLoading ? "Resetting..." : "Reset Password"}
                </button>

                <button
                  type="button"
                  onClick={() => setForgotStep(1)}
                  className="w-full py-2 text-gray-400 hover:text-white text-sm transition"
                >
                  ← Change Email
                </button>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Login;
