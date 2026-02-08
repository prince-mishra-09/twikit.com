import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Default to 'signature' (The Signature Core) if no theme is saved
    const [theme, setTheme] = useState(localStorage.getItem("twikit-theme") || "signature");

    // Audio for theme switch (optional/future) - kept simple for now

    const [grain, setGrain] = useState(localStorage.getItem("twikit-grain") === "true");

    useEffect(() => {
        // Apply theme data attribute to document root
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("twikit-theme", theme);
    }, [theme]);

    useEffect(() => {
        // Toggle grain class on body
        if (grain) {
            document.body.classList.add("grain-overlay");
        } else {
            document.body.classList.remove("grain-overlay");
        }
        localStorage.setItem("twikit-grain", grain);
    }, [grain]);

    const themes = [
        { id: "signature", name: "Signature Core", colors: ["#F9F7F2", "#1A1A1B", "#5D5FEF"], description: "Stay balanced with the perfect mix of clean aesthetics and modern utility." },
        { id: "cyber", name: "Cyber Neon", colors: ["#0D0D0D", "#FFFFFF", "#00FFD1"], description: "Fuel your main character energy with high-contrast lights and midnight vibes." },
        { id: "matcha", name: "Soft Matcha", colors: ["#E8F3E8", "#2D3A2D", "#88AB8E"], description: "A digital detox for your eyes—calm, organic, and purely aesthetic." },
        { id: "retro", name: "Retro Pop", colors: ["#FFF0F5", "#FF007A", "#FFD700"], description: "Unapologetically loud and nostalgic. Welcome to the Y2K glitch." },
    ];

    return (
        <ThemeContext.Provider value={{ theme, setTheme, grain, setGrain, themes }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
