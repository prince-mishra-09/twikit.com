import React, { useState, useEffect } from "react";
import { IoClose, IoBug } from "react-icons/io5";

const BugReportTooltip = ({ position = "top" }) => {
    const [isVisible, setIsVisible] = useState(false);
    const storageKey = "xwaked-bug-tool-hint-v6";

    useEffect(() => {
        const hasSeen = localStorage.getItem(storageKey);
        if (!hasSeen) {
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem(storageKey, "true");
    };

    if (!isVisible) return null;

    const positionClasses = {
        top: "bottom-full mb-4 left-1/2 -translate-x-1/2",
        bottom: "top-full mt-4 left-1/2 -translate-x-1/2",
        right: "left-full ml-4 top-1/2 -translate-y-1/2",
        left: "right-full mr-4 top-1/2 -translate-y-1/2",
    };

    const arrowClasses = {
        top: "top-full left-1/2 -translate-x-1/2 border-t-[#ff6b00]",
        bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-[#ff6b00]",
        right: "right-full top-1/2 -translate-y-1/2 border-r-[#ff6b00]",
        left: "left-full top-1/2 -translate-y-1/2 border-l-[#ff6b00]",
    };

    return (
        <div className={`absolute z-[2000] w-72 animate-tooltip-bounce ${positionClasses[position]}`}>
            <div className="relative overflow-hidden rounded-[20px] p-[2px] bg-gradient-to-r from-[#ff8a00] to-[#ff4d00] shadow-2xl shadow-orange-500/50">
                <div className="relative bg-[#1a1a1a] rounded-[18px] p-4 border border-white/5">
                    {/* Decorative Light Effect */}
                    <div className="absolute -left-10 -top-10 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl"></div>

                    <div className="flex gap-4 items-center relative z-10">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/40 text-white">
                                <IoBug className="text-xl animate-pulse" />
                            </div>
                        </div>

                        <div className="flex-1">
                            <h4 className="text-white font-bold text-[15px] mb-0.5 leading-tight tracking-wide">
                                Help us grow! 🚀
                            </h4>
                            <p className="text-gray-300 text-[12px] leading-snug font-medium">
                                Found a bug? 🐞 Help us make <span className="text-[#ff8a00] font-bold">xwaked</span> better. Click here to report! ✨
                            </p>
                        </div>

                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleClose();
                            }}
                            className="flex-shrink-0 p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-gray-400 hover:text-white"
                        >
                            <IoClose className="text-lg" />
                        </button>
                    </div>
                </div>

                {/* Arrow */}
                <div className={`absolute w-0 h-0 border-[8px] border-transparent ${arrowClasses[position]}`}></div>
            </div>

            <style>{`
                @keyframes tooltip-bounce {
                    0%, 100% { transform: translate(var(--tw-translate-x), calc(var(--tw-translate-y) - 0px)); }
                    50% { transform: translate(var(--tw-translate-x), calc(var(--tw-translate-y) - 6px)); }
                }
                .animate-tooltip-bounce {
                    animation: tooltip-bounce 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default BugReportTooltip;
