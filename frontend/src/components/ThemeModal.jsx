import React from "react";
import { useTheme } from "../context/ThemeContext";
import { FaCheck } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

const ThemeModal = ({ onClose }) => {
    const { theme, setTheme, grain, setGrain, themes } = useTheme();

    // Prevent background scrolling
    React.useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-[var(--bg-primary)]/80 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200">
            <div
                className="bg-[var(--card-bg)] w-full h-full md:h-auto md:max-w-2xl md:rounded-3xl border-none md:border md:border-[var(--border)] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
                    <div>
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">Display</h2>
                        <p className="text-sm text-[var(--text-secondary)]">Customize your view</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        <IoClose size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                    {/* Themes Grid */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Color Theme</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {themes.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id)}
                                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${theme === t.id
                                        ? "border-[var(--accent)] bg-[var(--accent)]/5 ring-1 ring-[var(--accent)]"
                                        : "border-[var(--border)] hover:border-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/50"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Color Preview */}
                                        <div
                                            className="w-12 h-12 rounded-full shadow-inner border border-white/10 shrink-0"
                                            style={{
                                                background: `linear-gradient(135deg, ${t.colors[0]} 0%, ${t.colors[1]} 50%, ${t.colors[2]} 100%)`
                                            }}
                                        />
                                        <div className="text-left">
                                            <p className={`font-semibold ${theme === t.id ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                                                {t.name}
                                            </p>
                                            <p className={`text-[10px] ${theme === t.id ? "text-[var(--text-secondary)]" : "opacity-70 text-[var(--text-secondary)]"}`}>
                                                {t.description}
                                            </p>
                                            {theme === t.id && <p className="text-xs text-[var(--accent)] font-medium mt-1">Active</p>}
                                        </div>
                                    </div>

                                    {theme === t.id && (
                                        <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white shrink-0">
                                            <FaCheck size={14} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Accessiblity / Grain Toggle */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Accessibility & Effects</h3>

                        <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/10">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${grain ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "bg-gray-500/10 text-gray-500"}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-[var(--text-primary)] font-medium">Grain Texture</p>
                                    <p className="text-xs text-[var(--text-secondary)]">Adds a subtle noise overlay</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setGrain(!grain)}
                                className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${grain ? "bg-[var(--accent)]" : "bg-gray-600"}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 shadow-sm ${grain ? "left-7" : "left-1"}`} />
                            </button>
                        </div>
                    </div>

                </div>

                <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-secondary)]/30 text-center">
                    <button
                        onClick={onClose}
                        className="text-[var(--accent)] font-medium text-sm hover:underline"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ThemeModal;
