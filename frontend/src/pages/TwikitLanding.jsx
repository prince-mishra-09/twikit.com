import React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Shield,
  EyeOff,
  Clock,
  Users,
  Feather,
} from "lucide-react";

/* ---------------- BRAND TOKENS ---------------- */
const colors = {
  primary: "#6366F1", // calm indigo
  dark: "#0D0F14",
  muted: "#6B7280",
  light: "#F9FAFB",
};

const Section = ({ children, className = "" }) => (
  <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
    {children}
  </section>
);

/* ---------------- NAV ---------------- */
const Nav = () => (
  <header className="sticky top-0 z-40 backdrop-blur bg-white/80 border-b">
    <Section className="flex items-center justify-between py-3">
      <a href="/" className="font-extrabold text-xl text-gray-900">
        Twikit
      </a>
      <div className="flex items-center gap-4">
        <a href="/login" className="text-sm text-gray-700">
          Log in
        </a>
        <a
          href="/register"
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
          style={{ background: colors.primary }}
        >
          Join quietly
        </a>
      </div>
    </Section>
  </header>
);

/* ---------------- HERO ---------------- */
const Hero = () => (
  <div className="bg-gradient-to-b from-white to-[#F4F6FF]">
    <Section className="py-20 text-center">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900"
      >
        A calmer social space —
        <br />
        built for <span style={{ color: colors.primary }}>real people</span>.
      </motion.h1>

      <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600">
        Twikit is a privacy-first social network where you can browse freely,
        share intentionally, and engage without performance pressure.
      </p>

      <div className="mt-8 flex justify-center gap-4 flex-wrap">
        <a
          href="/"
          className="rounded-xl px-6 py-3 text-sm font-semibold border"
        >
          Explore without account
        </a>
        <a
          href="/register"
          className="rounded-xl px-6 py-3 text-sm font-semibold text-white"
          style={{ background: colors.primary }}
        >
          Create account
        </a>
      </div>
    </Section>
  </div>
);

/* ---------------- UI PREVIEW ---------------- */
const UIPreview = () => (
  <Section className="py-20">
    <h2 className="text-3xl font-extrabold text-center mb-10">
      See how Twikit feels
    </h2>

    <div className="grid md:grid-cols-3 gap-6">
      {[
        { src: "/landing/feed.webp", label: "Calm chronological feed" },
        { src: "/landing/post.webp", label: "Focused posts & reflections" },
        { src: "/landing/create.webp", label: "Intentional sharing" },
      ].map((item) => (
        <div
          key={item.src}
          className="rounded-3xl border bg-white p-3 shadow-sm"
        >
          <img
            src={item.src}
            alt={item.label}
            className="rounded-2xl w-full h-auto"
            loading="lazy"
          />
          <p className="mt-3 text-center text-sm text-gray-600">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  </Section>
);

/* ---------------- DIFFERENCES ---------------- */
const Feature = ({ Icon, title, desc }) => (
  <div className="rounded-2xl border bg-white p-6">
    <Icon className="h-6 w-6 mb-4 text-indigo-500" />
    <h3 className="font-semibold text-lg mb-1">{title}</h3>
    <p className="text-sm text-gray-600">{desc}</p>
  </div>
);

const Differences = () => (
  <Section className="py-20">
    <h2 className="text-3xl font-extrabold text-center mb-10">
      How Twikit is different
    </h2>

    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <Feature
        Icon={Clock}
        title="Chronological feed"
        desc="No algorithms deciding what you should see or feel."
      />
      <Feature
        Icon={Sparkles}
        title="Real & Less Real feedback"
        desc="Public appreciation, private reflection — no public negativity."
      />
      <Feature
        Icon={EyeOff}
        title="Browse without account"
        desc="Explore first. Join only when it feels right."
      />
      <Feature
        Icon={Shield}
        title="Privacy by default"
        desc="Control visibility, interactions, and presence."
      />
      <Feature
        Icon={Feather}
        title="Calm interactions"
        desc="No aggressive animations or dopamine loops."
      />
      <Feature
        Icon={Users}
        title="People over performance"
        desc="Designed for connection, not virality."
      />
    </div>
  </Section>
);

/* ---------------- COMING SOON ---------------- */
const ComingSoon = () => (
  <div className="bg-[#F4F6FF]">
    <Section className="py-20">
      <h2 className="text-3xl font-extrabold text-center mb-10">
        Coming soon
      </h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
        {[
          "Intentional communities",
          "Creator tips (non-viral)",
          "Long-form reflections",
          "Advanced privacy controls",
          "Desktop-first experience",
        ].map((item) => (
          <div
            key={item}
            className="rounded-xl border bg-white px-4 py-3 text-center"
          >
            {item}
          </div>
        ))}
      </div>
    </Section>
  </div>
);

/* ---------------- CTA ---------------- */
const CTA = () => (
  <div className="bg-gray-900">
    <Section className="py-20 text-center">
      <h2 className="text-3xl md:text-4xl font-extrabold text-white">
        Join when it feels right.
      </h2>
      <p className="mt-4 text-gray-400 max-w-xl mx-auto">
        No pressure. No noise. Just a calmer place to exist online.
      </p>

      <div className="mt-6 flex justify-center gap-4 flex-wrap">
        <a
          href="/register"
          className="rounded-xl px-6 py-3 text-sm font-semibold text-white"
          style={{ background: colors.primary }}
        >
          Create account
        </a>
        <a
          href="/login"
          className="rounded-xl px-6 py-3 text-sm font-semibold border border-white/30 text-white"
        >
          Log in
        </a>
      </div>
    </Section>
  </div>
);

/* ---------------- FOOTER ---------------- */
const Footer = () => (
  <footer className="border-t">
    <Section className="py-8 text-sm text-gray-500 flex flex-col md:flex-row justify-between gap-4">
      <span>© 2025 Twikit</span>
      <div className="flex gap-4">
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/contact">Contact</a>
      </div>
    </Section>
  </footer>
);

/* ---------------- PAGE ---------------- */
export default function TwikitLanding() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Nav />
      <Hero />
      <UIPreview />
      <Differences />
      <ComingSoon />
      <CTA />
      <Footer />
    </div>
  );
}
