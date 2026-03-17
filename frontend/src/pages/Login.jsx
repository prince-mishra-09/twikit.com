import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserData } from "../context/UserContext";
import { PostData } from "../context/PostContext";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser, FiLock, FiMail, FiEye, FiEyeOff, FiArrowRight, FiArrowLeft
} from "react-icons/fi";
import { createPortal } from "react-dom";

/* ─── Slide animation ─────────────────────────────────────── */
const variants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP
  const [forgotDir, setForgotDir]   = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOTP, setForgotOTP] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();
  const { loginUser, loading } = UserData();
  const { fetchPosts } = PostData();
  const { theme } = useTheme();

  const handleSubmit = (e) => {
    e.preventDefault();
    loginUser(identifier, password, navigate, fetchPosts);
  };

  const goForgot = (n) => {
    setForgotDir(n > forgotStep ? 1 : -1);
    setForgotError("");
    setForgotStep(n);
  };

  // Forgot Password: Send OTP
  const handleSendResetOTP = async (e) => {
    e.preventDefault();
    setForgotError("");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail)) return setForgotError("Please enter a valid email address");

    setForgotLoading(true);
    try {
      await axios.post("/api/auth/forgot-password", { email: forgotEmail });
      goForgot(2);
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

    if (forgotOTP.length !== 4) return setForgotError("OTP must be 4 digits");
    if (newPassword.length < 6) return setForgotError("Password must be at least 6 characters");

    setForgotLoading(true);
    try {
      const { data } = await axios.post("/api/auth/reset-password", {
        email: forgotEmail,
        otp: forgotOTP,
        newPassword
      });
      // Success
      closeForgotModal();
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
          <p className="text-[var(--text-secondary)] text-sm">Logging in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[var(--bg-primary)] overflow-hidden px-4">
      {/* Ambient glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none"
           style={{ background: "var(--accent)", opacity: 0.06 }} />
      <div className="absolute bottom-0 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none"
           style={{ background: "var(--accent)", opacity: 0.04 }} />

      <div className="relative z-10 w-full max-w-sm">

        {/* Logo */}
        <div className="flex justify-center mb-10">
          <img
            src={theme === "matcha" || theme === "retro" ? "/images/xwaked-black.png" : "/images/xwaked-white.png"}
            alt="xwaked"
            className="h-16 w-auto drop-shadow-xl"
          />
        </div>

        {/* Card */}
        <div className="bg-[var(--card-bg)]/80 backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-2xl p-7 overflow-hidden">
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
              Welcome back
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              Log in to continue on <span className="text-[var(--accent)] font-medium">xwaked</span>
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="relative">
                <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
                <input
                  type="text"
                  placeholder="Email or Username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition text-sm"
                  required
                />
              </div>

              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                >
                  {showPassword ? <FiEyeOff size={16}/> : <FiEye size={16}/>}
                </button>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] transition font-medium"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl text-[var(--text-on-accent)] font-semibold bg-[var(--accent)] hover:opacity-90 active:scale-[0.98] transition flex items-center justify-center gap-2 text-sm mt-2"
              >
                Log In <FiArrowRight size={16} />
              </button>
            </form>
          </motion.div>
        </div>

        <p className="text-sm text-[var(--text-secondary)] text-center mt-6">
          New on xwaked?{" "}
          <Link to="/register" className="text-[var(--accent)] hover:opacity-80 transition font-medium">
            Create an account
          </Link>
        </p>
      </div>

      {/* Suggestion Message - Absolute bottom */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center pointer-events-none px-4">
        <p className="text-[var(--text-secondary)] text-xs text-center">
          Your friends are waiting inside. Let’s go!
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && createPortal(
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl shadow-2xl p-7 overflow-hidden">
            
            <button
              onClick={closeForgotModal}
              className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition text-2xl leading-none"
            >
              &times;
            </button>

            {/* Error Message */}
            <AnimatePresence mode="wait">
              {forgotError && (
                <motion.p
                  key="err"
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-[var(--danger)] text-xs text-center mb-4 bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-xl py-2 px-3 mt-4"
                >
                  {forgotError}
                </motion.p>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait" custom={forgotDir}>
              
              {/* STEP 1: Request Email */}
              {forgotStep === 1 && (
                <motion.div key="fs1" custom={forgotDir} variants={variants}
                  initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className={forgotError ? "" : "pt-4"}
                >
                  <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Reset Password</h2>
                  <p className="text-[var(--text-secondary)] text-sm mb-6">Enter your email to receive a code.</p>

                  <form onSubmit={handleSendResetOTP} className="space-y-4">
                    <div className="relative">
                      <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16}/>
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition text-sm"
                        required
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full py-3 rounded-xl text-[var(--text-on-accent)] font-semibold bg-[var(--accent)] hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                    >
                      {forgotLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Sending…
                        </span>
                      ) : (
                        <><span>Send Code</span><FiArrowRight size={16}/></>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* STEP 2: OTP + New Password */}
              {forgotStep === 2 && (
                <motion.div key="fs2" custom={forgotDir} variants={variants}
                  initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className={forgotError ? "" : "pt-4"}
                >
                  <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Check your email</h2>
                  <p className="text-[var(--text-secondary)] text-sm mb-6">Enter code sent to <span className="text-[var(--accent)]">{forgotEmail}</span></p>

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0   0   0   0"
                      value={forgotOTP}
                      onChange={(e) => setForgotOTP(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      maxLength={4}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-center text-2xl font-bold tracking-[0.4em] placeholder-[var(--text-secondary)]/30 focus:outline-none focus:border-[var(--accent)] transition"
                      required
                      autoFocus
                    />

                    <div className="relative">
                      <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16}/>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition text-sm"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((p) => !p)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                      >
                        {showNewPassword ? <FiEyeOff size={16}/> : <FiEye size={16}/>}
                      </button>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => goForgot(1)}
                        className="w-12 h-12 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition shrink-0"
                      >
                        <FiArrowLeft size={18}/>
                      </button>
                      <button
                        type="submit"
                        disabled={forgotLoading || forgotOTP.length !== 4 || newPassword.length < 6}
                        className="flex-1 py-3 rounded-xl text-[var(--text-on-accent)] font-semibold bg-[var(--accent)] hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                      >
                        {forgotLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Resetting…
                          </span>
                        ) : "Reset Password"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Login;
