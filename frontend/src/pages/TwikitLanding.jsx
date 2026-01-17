import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck, MessageSquare, Zap, Stars, Users } from "lucide-react";

// Brand palette (for quick tweaks)
const colors = {
  primary: "#1E70FF", // blue
  secondary: "#FF7A1E", // orange
  accent: "#00D8A6", // teal
  dark: "#0D0F14",
  mid: "#A3A9B6",
  light: "#F9FAFC",
};

const Section = ({ children, className = "" }) => (
  <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>{children}</section>
);

const Nav = () => (
  <header className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b border-neutral-200">
    <Section className="flex items-center justify-between py-3">
      <a href="#" className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-full flex items-center justify-center" style={{ background: colors.primary }}>
          <span className="text-white font-bold text-lg">T</span>
        </div>
        <span className="font-extrabold tracking-tight text-xl" style={{ color: colors.dark }}>Twikit</span>
      </a>
      <nav className="hidden md:flex items-center gap-8 text-sm">
        <a href="#features" className="hover:opacity-80" style={{ color: colors.dark }}>Features</a>
        <a href="#preview" className="hover:opacity-80" style={{ color: colors.dark }}>Preview</a>
        <a href="#community" className="hover:opacity-80" style={{ color: colors.dark }}>Community</a>
        <a href="#help" className="hover:opacity-80" style={{ color: colors.dark }}>Help</a>
      </nav>
      <div className="flex items-center gap-3">
        <a href="/login" className="hidden sm:inline text-sm" style={{ color: colors.dark }}>Log in</a>
        <button
          className="rounded-2xl px-5 py-5 text-sm font-semibold shadow-sm hover:shadow
             bg-[#1E70FF] text-white cursor-pointer"
        >
          <a href="/register">Join Now</a>
        </button>
      </div>
    </Section>
  </header>
);

const Hero = () => (
  <div className="bg-gradient-to-b from-white to-[#EEF4FF] border-b border-neutral-200">
    <Section className="py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
        <h1 className="font-extrabold tracking-tight leading-tight text-4xl md:text-6xl" style={{ color: colors.dark }}>
          Connect. Create. Express. <span style={{ color: colors.primary }}>The Twikit Way.</span>
        </h1>
        <p className="mt-5 text-base md:text-lg max-w-xl" style={{ color: colors.dark }}>
          A new-age social platform built for creators and communities — with real connection and zero noise.
        </p>
        <div className="mt-7 flex gap-3">
          <button className="cursor-pointer rounded-xl px-6 py-6 text-sm font-semibold shadow-sm " style={{ background: colors.primary, color: "#fff" }}> <a href="/register">Get Started</a> </button>
          <button className="cursor-pointer rounded-xl px-6 py-6 text-sm font-semibold border" style={{ background: "transparent", color: colors.primary, borderColor: colors.primary }}>Explore Posts</button>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 text-sm">
          {["Zero spam feed", "Creator earnings", "Privacy-first", "Realtime chat"].map((txt) => (
            <li key={txt} className="relative flex items-center gap-2">
              <CheckCircle2 size={18} style={{ color: colors.accent }} />
              <span style={{ color: colors.dark }}>{txt}</span>

              {/* 🎯 Add badge only for 'Creator earnings' */}
              {txt === "Creator earnings" && (
                <span
                  className="absolute -top-3.5 right-[20px] text-[10px] font-semibold bg-[#FF7A1E] text-white rounded-full  px-2 py-[2px] shadow-sm"
                >
                  Coming Soon
                </span>
              )}
            </li>
          ))}

        </ul>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} viewport={{ once: true }}>
        {/* Mock preview card */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl blur-2xl opacity-30" style={{ background: colors.primary }} />
          <div className="relative bg-white rounded-3xl shadow-xl p-4 md:p-6 border border-neutral-200">
            {/* Top bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full" style={{ background: colors.primary }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: colors.dark }}>@anu_creates</p>
                  <p className="text-xs" style={{ color: colors.mid }}>2m ago · Public</p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: "#EEF7F4", color: colors.accent }}>Following</span>
            </div>
            <p className="mt-3 text-sm" style={{ color: colors.dark }}>
              My first Twikit post ✨ Loving the clean vibes and real connections here.
            </p>
            <div className="mt-3 h-48 w-full rounded-2xl bg-gradient-to-br from-[#E1ECFF] to-white border border-neutral-200 overflow-hidden flex items-center justify-center">
              <img
                src="/images/landing1.webp"
                alt="Twikit Landing"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="mt-4 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1 text-neutral-700">
                <span className="font-bold text-indigo-600">Real</span> 1.8k
              </div>
              <div className="flex items-center gap-1 text-neutral-700"><MessageSquare className="h-4 w-4" /> 240</div>
              <div className="flex items-center gap-1 text-neutral-700"><Users className="h-4 w-4" /> Follow</div>
            </div>
          </div>
        </div>
      </motion.div>
    </Section>
  </div>
);

const Feature = ({ Icon, title, desc, tint }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} viewport={{ once: true }}
    className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-4" style={{ background: `${tint}22`, color: tint }}>
      <Icon className="h-5 w-5" />
    </div>
    <h3 className="font-semibold text-lg mb-1" style={{ color: colors.dark }}>{title}</h3>
    <p className="text-sm" style={{ color: colors.dark }}>{desc}</p>
  </motion.div>
);

const Features = () => (
  <Section id="features" className="py-16 md:py-24">
    <div className="text-center max-w-2xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: colors.dark }}>Why creators love Twikit</h2>
      <p className="mt-3 text-base" style={{ color: colors.mid }}>Built for meaningful connections, zero distractions, and real growth.</p>
    </div>
    <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <Feature Icon={Stars} title="Real Connections" desc="A smart, calm feed that surfaces people you truly care about." tint={colors.primary} />
      <Feature Icon={Zap} title="Zero Spam" desc="AI-assisted filtering keeps bots and spam away from your space." tint={colors.secondary} />
      <Feature Icon={ShieldCheck} title="Privacy First" desc="You choose who sees what — clear controls and transparency." tint={colors.accent} />
      <Feature Icon={MessageSquare} title="Creator Earnings" desc="Tips & memberships built in so your work pays off." tint={colors.primary} />
    </div>
  </Section>
);

const Preview = () => (
  <div id="preview" className="bg-white border-t border-b">
    <Section className="py-16 md:py-24">
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}>
          <div className="rounded-3xl border shadow-sm p-4 bg-white">
            <div className="h-72 rounded-2xl bg-gradient-to-br from-[#F3F7FF] to-white border" />
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="h-28 rounded-xl bg-gradient-to-br from-[#FFF2E8] to-white border" />
              <div className="h-28 rounded-xl bg-gradient-to-br from-[#E6FFF8] to-white border" />
              <div className="h-28 rounded-xl bg-gradient-to-br from-[#EEF1F6] to-white border" />
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} viewport={{ once: true }}>
          <h3 className="text-2xl md:text-3xl font-extrabold" style={{ color: colors.dark }}>Your world, organized beautifully</h3>
          <p className="mt-3 text-base" style={{ color: colors.dark }}>
            Clean layouts, clear hierarchy, and delightful interactions — so posting, discovering, and chatting feel effortless.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex items-start gap-3"><CheckCircle2 style={{ color: colors.accent }} className="mt-0.5" /> Smooth infinite feed with media previews</li>
            <li className="flex items-start gap-3"><CheckCircle2 style={{ color: colors.accent }} className="mt-0.5" /> Powerful composer for text, images, and short video</li>
            <li className="flex items-start gap-3"><CheckCircle2 style={{ color: colors.accent }} className="mt-0.5" /> Profiles that showcase your work and personality</li>
          </ul>
          <div className="mt-6 flex gap-3">
            <button className="cursor-pointer rounded-xl px-6" style={{ background: colors.primary, color: "#fff" }}> <a href="/register">Create your profile</a> </button>
            <button className="cursor-pointer rounded-xl px-6 border" style={{ background: "transparent", color: colors.primary, borderColor: colors.primary }}>See the feed</button>
          </div>
        </motion.div>
      </div>
    </Section>
  </div>
);

const Testimonials = () => (
  <div id="community" className="bg-[#E8F1FF]">
    <Section className="py-16 md:py-24">
      <div className="text-center max-w-2xl mx-auto">
        <h3 className="text-3xl font-extrabold" style={{ color: colors.dark }}>Loved by early creators</h3>
        <p className="mt-3 text-base" style={{ color: colors.dark }}>Real feedback from our beta community.</p>
      </div>
      <div className="mt-10 grid md:grid-cols-3 gap-5">
        {[{
          quote: "Finally a social app that feels peaceful yet exciting.", name: "@arjun_dev"
        }, { quote: "I earned my first ₹500 in tips. Twikit is fire!", name: "@anu_creates" }, { quote: "The feed shows what matters — not clickbait.", name: "@maya_ui" }].map((t, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05 }} viewport={{ once: true }}
            className="rounded-2xl bg-white p-6 border shadow-sm">
            <p className="text-sm" style={{ color: colors.dark }}>“{t.quote}”</p>
            <div className="mt-4 text-xs font-semibold" style={{ color: colors.primary }}>{t.name}</div>
          </motion.div>
        ))}
      </div>
    </Section>
  </div>
);

const BigCTA = () => (
  <div className="relative" style={{ background: colors.dark }}>
    <Section className="py-16 md:py-20 text-center">
      <h3 className="text-3xl md:text-4xl font-extrabold text-white">Ready to join the future of social?</h3>
      <p className="mt-3 text-base text-white/80 max-w-2xl mx-auto">Be part of the new wave — join thousands of early users building the next big thing.</p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button className="cursor-pointer rounded-xl px-6 py-6 text-sm font-semibold shadow" style={{ background: colors.primary, color: "#fff" }}> <a href="/register">Get Started for Free</a> </button>
        <button className="cursor-pointer rounded-xl px-6 py-6 text-sm font-semibold border border-white/20 text-white" variant="outline" style={{ background: "transparent" }}> <a href="/login">Log in</a> </button>
      </div>
    </Section>
  </div>
);

const Footer = () => (
  <footer className="border-t" style={{ background: colors.dark }}>
    <Section className="py-10 grid md:grid-cols-3 gap-6 items-center">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: colors.primary }}>
          <span className="text-white text-sm font-bold">T</span>
        </div>
        <span className="text-white/90 font-semibold">Twikit</span>
      </div>
      <nav className="flex flex-wrap gap-5 text-sm justify-center md:justify-center text-white/70">
        <a href="#help" className="hover:text-white">Help</a>
        <a href="/privacy" className="hover:text-white">Privacy</a>
        <a href="/terms" className="hover:text-white">Terms</a>
        <a href="/contact" className="hover:text-white">Contact</a>
      </nav>
      <p className="text-right text-xs text-white/60">© 2025 Twikit. All rights reserved.</p>
    </Section>
  </footer>
);

export default function TwikitLanding() {
  return (
    <div className="min-h-screen" style={{ background: colors.light, fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, 'Helvetica Neue', Arial, 'Apple Color Emoji', 'Segoe UI Emoji'" }}>
      <Nav />
      <main>
        <Hero />
        <Features />
        <Preview />
        <Testimonials />
        <BigCTA />
      </main>
      <Footer />
    </div>
  );
}
