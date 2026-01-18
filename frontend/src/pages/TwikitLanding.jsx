import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Clock, EyeOff, Hash } from "lucide-react";

/* ---------------- ANIMATIONS ---------------- */
const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (delay = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: "easeOut", delay }
    })
};

const staggerContainer = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.1 }
    }
};

/* ---------------- COMPONENTS ---------------- */
const Section = ({ children, className = "", ...props }) => (
    <section className={`px-6 py-24 md:py-32 max-w-7xl mx-auto ${className}`} {...props}>
        {children}
    </section>
);

const FeaturePost = ({ title, subtitle, color = "bg-indigo-500" }) => (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm">
        <div className={`w-10 h-10 rounded-full shrink-0 ${color} opacity-20`} />
        <div className="space-y-2 w-full">
            <div className={`h-4 w-1/3 rounded bg-white/10`} />
            <div className={`h-16 w-full rounded bg-white/5`} />
        </div>
    </div>
);

/* ---------------- PAGE ---------------- */
export default function TwikitLanding() {
    return (
        <div className="min-h-screen bg-[#0B0F14] text-gray-200 font-sans selection:bg-indigo-500/30">

            {/* HEADER */}
            <header className="fixed top-0 w-full z-50 bg-[#0B0F14]/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="text-xl font-bold text-white tracking-tight">Twikit</Link>
                    <div className="flex items-center gap-6">
                        <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Log in</Link>
                        <Link to="/register" className="text-sm px-5 py-2 rounded-full bg-white text-black font-medium hover:bg-gray-200 transition-colors">Sign up</Link>
                    </div>
                </div>
            </header>

            {/* 1. HERO SECTION */}
            <Section className="text-center pt-32 pb-20">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                    className="max-w-3xl mx-auto space-y-8"
                >
                    <motion.h1
                        variants={fadeUp} custom={0}
                        className="text-4xl md:text-6xl font-semibold tracking-tight text-white leading-[1.1]"
                    >
                        Social media that doesn’t want to control you.
                    </motion.h1>

                    <motion.p
                        variants={fadeUp} custom={0.2}
                        className="text-lg md:text-xl text-gray-400 font-light"
                    >
                        Chronological feed. Privacy by default. No addictive algorithms.
                    </motion.p>

                    <motion.div
                        variants={fadeUp} custom={0.4}
                        className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4"
                    >
                        <Link
                            to="/feed"
                            className="px-8 py-4 rounded-full bg-white text-black font-medium hover:bg-gray-200 transition-all active:scale-95 text-base"
                        >
                            Enter Twikit
                        </Link>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                const element = document.getElementById("philosophy");
                                if (element) element.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="text-gray-400 hover:text-white transition-colors underline-offset-4 hover:underline text-sm bg-transparent border-none cursor-pointer"
                        >
                            Learn the philosophy
                        </button>
                    </motion.div>
                </motion.div>

                {/* Hero Visual Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="mt-20 max-w-xs mx-auto p-2 bg-[#1A1F26] rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden"
                >
                    <div className="bg-[#0B0F14] rounded-[2rem] overflow-hidden leading-none border border-white/5 relative">
                        <img src="/landing/feed.webp" alt="Twikit Feed" className="w-full h-auto object-cover opacity-90" />

                        {/* Gradient Overlay for seamless blending */}
                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0B0F14] to-transparent z-10" />
                    </div>
                </motion.div>
            </Section>

            {/* 2. PROBLEM SECTION */}
            <Section className="border-t border-white/5">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-semibold text-white mb-8 leading-tight">
                            Modern social media is <span className="text-red-400/80">loud</span> by design.
                        </h2>
                    </div>
                    <div className="space-y-8">
                        {[
                            "Endless scrolling engineered for addiction",
                            "Algorithms deciding what users see",
                            "Privacy treated as an afterthought"
                        ].map((text, i) => (
                            <div key={i} className="flex gap-4 items-center text-gray-400">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400/50" />
                                <span className="text-lg font-light">{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* 3. THE TWIKIT WAY */}
            <Section id="philosophy" className="bg-[#0D1117]">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-semibold text-white">Twikit is calm by design, not by promise.</h2>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: "Chronological", desc: "No algorithms. You see what you follow.", icon: Clock },
                        { title: "Privacy-first", desc: "Your data stays yours. No tracking.", icon: Shield },
                        { title: "Intentional", desc: "Interactions that mean something.", icon: Hash },
                        { title: "Freedom", desc: "Leave anytime. No dark patterns.", icon: EyeOff },
                    ].map((item, i) => (
                        <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                            <item.icon className="w-8 h-8 text-indigo-400 mb-4 opacity-80" strokeWidth={1.5} />
                            <h3 className="text-lg font-medium text-white mb-2">{item.title}</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* 4. FEATURES (RESTRAINED) */}
            <Section>
                <div className="max-w-5xl mx-auto space-y-16">
                    <div className="text-center space-y-6">
                        <h2 className="text-3xl font-semibold text-white">Everything you expect. Nothing you don’t.</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto text-lg font-light">
                            We stripped away the noise to focus on what matters: connection, clarity, and control.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Text Features */}
                        <div className="space-y-6">
                            {[
                                "Intentional sharing (Posts & Reels)",
                                "Quiet stories (Manual navigation)",
                                "Private messaging with controls",
                                "Mute, hide, block for peace"
                            ].map((text, i) => (
                                <div key={i} className="flex items-center gap-4 py-4 border-b border-white/5">
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
                                        <div className="w-2 h-2 rounded-full bg-indigo-400" />
                                    </div>
                                    <span className="text-lg text-gray-300 font-light">{text}</span>
                                </div>
                            ))}
                        </div>

                        {/* Visual Showcase (Post + Create) */}
                        <div className="relative h-[400px] w-full">
                            <div className="absolute top-0 right-10 w-48 rounded-2xl overflow-hidden border border-white/10 shadow-2xl z-10 rotate-3 hover:rotate-0 transition-transform duration-500">
                                <img src="/landing/post.webp" alt="Post UI" className="w-full h-auto opacity-90" />
                            </div>
                            <div className="absolute bottom-0 left-10 w-48 rounded-2xl overflow-hidden border border-white/10 shadow-2xl -rotate-2 hover:rotate-0 transition-transform duration-500">
                                <img src="/landing/create.webp" alt="Create UI" className="w-full h-auto opacity-90" />
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* 5. TRUST / VALUES */}
            <Section className="border-y border-white/5 bg-[#0D1117] text-center">
                <h2 className="text-3xl font-semibold text-white mb-12">Built for people, not metrics.</h2>
                <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 text-gray-400 text-lg font-light">
                    <span>No addictive recommendation engine</span>
                    <span className="hidden md:inline text-white/10">•</span>
                    <span>No selling user attention</span>
                    <span className="hidden md:inline text-white/10">•</span>
                    <span>No shadow reach manipulation</span>
                </div>
                <p className="mt-12 text-sm text-gray-500">We believe social media should respect your time.</p>
            </Section>

            {/* 6. FINAL CTA */}
            <Section className="text-center py-32">
                <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6">Join the public beta.</h2>
                <p className="text-xl text-gray-400 font-light mb-10">
                    Calm social media. Open access. Leave whenever you want.
                </p>
                <Link
                    to="/register"
                    className="inline-block px-10 py-4 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all active:scale-95"
                >
                    Create account
                </Link>
            </Section>

            {/* 7. FOOTER */}
            <footer className="border-t border-white/5 bg-[#07090C] py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-xl font-bold text-white tracking-tight">Twikit</div>

                    <div className="flex gap-8 text-sm text-gray-500">
                        <span className="cursor-pointer hover:text-white transition-colors">Philosophy</span>
                        <span className="cursor-pointer hover:text-white transition-colors">Privacy</span>
                        <span className="cursor-pointer hover:text-white transition-colors">Contact</span>
                    </div>

                    <div className="text-xs text-gray-600">
                        © 2026 Twikit. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
