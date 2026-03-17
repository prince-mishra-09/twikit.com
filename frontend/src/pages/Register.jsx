import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserData } from "../context/UserContext";
import { PostData } from "../context/PostContext";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser, FiAtSign, FiLock, FiMail, FiEye, FiEyeOff,
  FiCheck, FiX, FiArrowRight, FiArrowLeft, FiRefreshCw,
} from "react-icons/fi";

/* ─── Password Strength Rules ─────────────────────────────── */
const RULES = [
  { id: "len",   label: "At least 8 characters",      test: (v) => v.length >= 8 },
  { id: "upper", label: "Uppercase letter (A–Z)",       test: (v) => /[A-Z]/.test(v) },
  { id: "lower", label: "Lowercase letter (a–z)",       test: (v) => /[a-z]/.test(v) },
  { id: "num",   label: "Number (0–9)",                 test: (v) => /[0-9]/.test(v) },
  { id: "spec",  label: "Special character (!@#$…)",    test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const strength = (pwd) => RULES.filter((r) => r.test(pwd)).length;

/* ─── Slide animation ─────────────────────────────────────── */
const variants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

/* ─── Suggestion Messages ────────────────────────────────── */
const STEP_MESSAGES = [
  "Don't worry, your data is safer than your hidden gallery. 😉",
  "Setting up your base... almost there! 🚀",
  "Verification is the first step to a secure community.",
  "By clicking finish, you're entering a world of pure vibes. ✨"
];

/* ─── Step dot indicator ───────────────────────────────────── */
const StepDots = ({ total, current }) => (
  <div className="flex items-center justify-center gap-2 mb-8">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className="rounded-full transition-all duration-300"
        style={{
          width: i === current ? 22 : 8,
          height: 8,
          backgroundColor:
            i < current
              ? "var(--accent)"
              : i === current
              ? "var(--accent)"
              : "var(--border)",
          opacity: i < current ? 0.4 : 1,
        }}
      />
    ))}
  </div>
);

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
const Register = () => {
  const [step, setStep] = useState(0); // 0:Name+Username  1:Password  2:Email  3:OTP
  const [dir, setDir]   = useState(1); // animation direction

  /* Step 0 */
  const [name, setName]                       = useState("");
  const [username, setUsername]               = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername]   = useState(false);
  const [suggestions, setSuggestions]         = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  /* Step 1 */
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  /* Step 2 */
  const [email, setEmail] = useState("");

  /* Step 3 */
  const [otp, setOtp]           = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  /* Common */
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const { registerUser, loading: registerLoading } = UserData();
  const { fetchPosts } = PostData();
  const { theme } = useTheme();
  const navigate = useNavigate();

  /* ─── Username availability (debounced 500ms) ──────────── */
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    const regex = /^[a-zA-Z0-9_.]{3,20}$/;
    if (!regex.test(username)) {
      setUsernameAvailable(false);
      return;
    }
    const ctrl = new AbortController();
    const tid = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const { data } = await axios.post(
          "/api/auth/check-username",
          { username },
          { signal: ctrl.signal }
        );
        setUsernameAvailable(data.available);
      } catch (e) {
        if (!axios.isCancel(e)) setUsernameAvailable(false);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);
    return () => { clearTimeout(tid); ctrl.abort(); };
  }, [username]);

  /* ─── Username suggestions (fetch when name >= 2 chars) ─── */
  const fetchSuggestions = useCallback(async (nameVal) => {
    if (!nameVal || nameVal.trim().length < 2) { setSuggestions([]); return; }
    setLoadingSuggestions(true);
    try {
      const { data } = await axios.get(
        `/api/auth/suggest-username?name=${encodeURIComponent(nameVal.trim())}`
      );
      setSuggestions(data.suggestions || []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    const tid = setTimeout(() => fetchSuggestions(name), 600);
    return () => clearTimeout(tid);
  }, [name, fetchSuggestions]);

  /* ─── Resend OTP countdown ─────────────────────────────── */
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  /* ─── Navigation helpers ───────────────────────────────── */
  const go = (n) => { setDir(n > step ? 1 : -1); setError(""); setStep(n); };

  /* ─── STEP 0: validate & next ──────────────────────────── */
  const handleStep0 = (e) => {
    e.preventDefault();
    if (name.trim().length < 2)  return setError("Name must be at least 2 characters");
    if (name.trim().length > 30) return setError("Name must be under 30 characters");
    if (!username)               return setError("Please enter a username");
    const regex = /^[a-zA-Z0-9_.]{3,20}$/;
    if (!regex.test(username))   return setError("Username: 3–20 chars, letters/numbers/._");
    if (usernameAvailable === false) return setError("Username is already taken");
    if (usernameAvailable !== true)  return setError("Please wait for username check");
    go(1);
  };

  /* ─── STEP 1: validate password ────────────────────────── */
  const handleStep1 = (e) => {
    e.preventDefault();
    if (strength(password) < 5) return setError("Please meet all password requirements");
    go(2);
  };

  /* ─── STEP 2: send OTP ─────────────────────────────────── */
  const handleStep2 = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return setError("Please enter a valid email address");
    setLoading(true);
    try {
      await axios.post("/api/auth/send-otp", { email }, { timeout: 30000 });
      setResendTimer(30);
      go(3);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  /* ─── STEP 3: verify OTP → register ────────────────────── */
  const handleStep3 = async (e) => {
    e.preventDefault();
    if (otp.length !== 4) return setError("Enter the 4-digit code");
    setLoading(true);
    try {
      await axios.post("/api/auth/verify-otp", { email, otp });
      // OTP verified — now register
      const formdata = new FormData();
      formdata.append("name", name.trim());
      formdata.append("email", email.toLowerCase().trim());
      formdata.append("password", password);
      formdata.append("username", username);
      registerUser(formdata, navigate, fetchPosts);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid code");
      setLoading(false);
    }
  };

  /* ─── Resend OTP ────────────────────────────────────────── */
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await axios.post("/api/auth/send-otp", { email }, { timeout: 30000 });
      setResendTimer(30);
      setError("");
      setOtp("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend");
    } finally {
      setLoading(false);
    }
  };

  if (registerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
          <p className="text-[var(--text-secondary)] text-sm">Creating your account…</p>
        </div>
      </div>
    );
  }

  const pwdStrength = strength(password);
  const strengthLabel  = ["", "Weak", "Fair", "Good", "Strong", "Perfect"][pwdStrength];
  const strengthColor  = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#00FFD1"][pwdStrength];

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

          <StepDots total={4} current={step} />

          {/* Error */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                key="err"
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-[var(--danger)] text-xs text-center mb-4 bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-xl py-2 px-3"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* ── Steps ─────────────────────────────────────── */}
          <AnimatePresence mode="wait" custom={dir}>

            {/* STEP 0 — Name + Username */}
            {step === 0 && (
              <motion.div key="s0" custom={dir} variants={variants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.22, ease: "easeOut" }}>

                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Let's get started</h2>
                <p className="text-[var(--text-secondary)] text-sm mb-6">Pick a name and a username</p>

                <form onSubmit={handleStep0} className="space-y-4">

                  {/* Name */}
                  <div className="relative">
                    <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
                    <input
                      type="text"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={30}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition text-sm"
                      required
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <div className="relative">
                      <FiAtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
                      <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => {
                          const v = e.target.value.toLowerCase().replace(/\s/g, "");
                          setUsername(v);
                          setUsernameAvailable(null);
                        }}
                        maxLength={20}
                        className="w-full pl-10 pr-24 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition text-sm"
                        required
                      />
                      {/* Status badge */}
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium">
                        {checkingUsername && (
                          <span className="text-[var(--text-secondary)]">Checking…</span>
                        )}
                        {!checkingUsername && usernameAvailable === true && username.length >= 3 && (
                          <span className="text-green-500 flex items-center gap-1"><FiCheck size={13}/> Free</span>
                        )}
                        {!checkingUsername && usernameAvailable === false && username.length >= 3 && (
                          <span className="text-red-500 flex items-center gap-1"><FiX size={13}/>
                            {/^[a-zA-Z0-9_.]{3,20}$/.test(username) ? "Taken" : "Invalid"}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Rule hint */}
                    {username.length >= 3 && !/^[a-zA-Z0-9_.]{3,20}$/.test(username) && (
                      <p className="text-[var(--danger)] text-[10px] mt-1 ml-1">
                        Only letters, numbers, dots, underscores (3–20 chars)
                      </p>
                    )}

                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                      <div className="mt-2.5">
                        <p className="text-[var(--text-secondary)] text-[10px] mb-1.5 ml-0.5 uppercase tracking-wide font-semibold">
                          Suggestions
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {suggestions.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => { setUsername(s); setUsernameAvailable(null); }}
                              className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
                            >
                              @{s}
                            </button>
                          ))}
                          {loadingSuggestions && (
                            <span className="text-[var(--text-secondary)] text-xs self-center">
                              <FiRefreshCw size={11} className="animate-spin inline mr-1"/>Loading…
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!name || !username || usernameAvailable !== true || checkingUsername}
                    className="w-full py-3 rounded-xl text-[var(--text-on-accent)] font-semibold bg-[var(--accent)] hover:opacity-90 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    Continue <FiArrowRight size={16}/>
                  </button>
                </form>
              </motion.div>
            )}

            {/* STEP 1 — Password */}
            {step === 1 && (
              <motion.div key="s1" custom={dir} variants={variants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.22, ease: "easeOut" }}>

                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Set a password</h2>
                <p className="text-[var(--text-secondary)] text-sm mb-6">Make it strong and unique</p>

                <form onSubmit={handleStep1} className="space-y-4">
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16}/>
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition text-sm"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                    >
                      {showPass ? <FiEyeOff size={16}/> : <FiEye size={16}/>}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {password && (
                    <div>
                      <div className="flex gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className="flex-1 h-1 rounded-full transition-all duration-300"
                            style={{ background: i < pwdStrength ? strengthColor : "var(--border)" }}
                          />
                        ))}
                      </div>
                      <p className="text-xs font-semibold" style={{ color: strengthColor }}>
                        {strengthLabel}
                      </p>
                    </div>
                  )}

                  {/* Rule checklist */}
                  <div className="space-y-1.5 py-1">
                    {RULES.map((r) => {
                      const ok = r.test(password);
                      return (
                        <div key={r.id} className="flex items-center gap-2 text-xs">
                          {ok
                            ? <FiCheck size={13} className="text-[var(--success)] shrink-0"/>
                            : <FiX     size={13} className="text-[var(--text-secondary)] shrink-0"/>}
                          <span style={{ color: ok ? "var(--success)" : "var(--text-secondary)" }}>
                            {r.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => go(0)}
                      className="w-12 h-12 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition shrink-0"
                    >
                      <FiArrowLeft size={18}/>
                    </button>
                    <button
                      type="submit"
                      disabled={pwdStrength < 5}
                      className="flex-1 py-3 rounded-xl text-[var(--text-on-accent)] font-semibold bg-[var(--accent)] hover:opacity-90 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                      Continue <FiArrowRight size={16}/>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 2 — Email */}
            {step === 2 && (
              <motion.div key="s2" custom={dir} variants={variants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.22, ease: "easeOut" }}>

                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Add your email</h2>
                <p className="text-[var(--text-secondary)] text-sm mb-6">
                  We'll send a verification code to confirm it's you
                </p>

                <form onSubmit={handleStep2} className="space-y-4">
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16}/>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition text-sm"
                      autoFocus
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => go(1)}
                      className="w-12 h-12 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition shrink-0"
                    >
                      <FiArrowLeft size={18}/>
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 rounded-xl text-[var(--text-on-accent)] font-semibold bg-[var(--accent)] hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Sending…
                        </span>
                      ) : (
                        <><span>Send Code</span><FiArrowRight size={16}/></>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 3 — OTP */}
            {step === 3 && (
              <motion.div key="s3" custom={dir} variants={variants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.22, ease: "easeOut" }}>

                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Check your email</h2>
                <p className="text-[var(--text-secondary)] text-sm mb-1">
                  We sent a 4-digit code to{" "}
                  <span className="text-[var(--accent)] font-medium">{email}</span>
                </p>

                {/* Spam note */}
                <div className="flex items-start gap-2 text-[10px] text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-3 py-2.5 mb-5 mt-3">
                  <span className="text-base leading-none mt-0.5">📬</span>
                  <span>
                    Didn't receive it? Please also check your{" "}
                    <strong className="text-[var(--text-primary)]">Spam / Junk</strong> folder — sometimes it lands there.
                  </span>
                </div>

                <form onSubmit={handleStep3} className="space-y-4">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0 0 0 0"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    maxLength={4}
                    className="w-full px-4 py-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-center text-3xl font-bold tracking-[0.6em] placeholder-[var(--text-secondary)]/30 focus:outline-none focus:border-[var(--accent)] transition"
                    autoFocus
                    required
                  />

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 4}
                    className="w-full py-3 rounded-xl text-[var(--text-on-accent)] font-semibold bg-[var(--accent)] hover:opacity-90 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Creating account…
                      </span>
                    ) : "Create Account 🎉"}
                  </button>

                  {/* Resend + change email */}
                  <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] pt-1">
                    <button
                      type="button"
                      onClick={() => go(2)}
                      className="hover:text-[var(--text-primary)] transition flex items-center gap-1"
                    >
                      <FiArrowLeft size={12}/> Change email
                    </button>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendTimer > 0 || loading}
                      className="hover:text-[var(--accent)] transition disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Login link */}
        <p className="text-sm text-[var(--text-secondary)] text-center mt-6">
          Already on xwaked?{" "}
          <Link to="/login" className="text-[var(--accent)] hover:opacity-80 font-medium transition">
            Log in
          </Link>
        </p>
      </div>

      {/* Dynamic Suggestion Message - Absolute bottom */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center pointer-events-none px-4">
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
            className="absolute text-[var(--text-secondary)] text-xs text-center"
          >
            {STEP_MESSAGES[step]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Register;
