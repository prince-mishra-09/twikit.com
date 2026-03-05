import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Default to 'signature' (The Signature Core) if no theme is saved
    const [theme, setTheme] = useState(localStorage.getItem("xwaked-theme") || "signature");

    // Audio for theme switch (optional/future) - kept simple for now

    const [grain, setGrain] = useState(localStorage.getItem("xwaked-grain") === "true");

    useEffect(() => {
        // Apply theme data attribute to document root
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("xwaked-theme", theme);
    }, [theme]);

    useEffect(() => {
        // Toggle grain class on body
        if (grain) {
            document.body.classList.add("grain-overlay");
        } else {
            document.body.classList.remove("grain-overlay");
        }
        localStorage.setItem("xwaked-grain", grain);
    }, [grain]);

    const themes = [
        { id: "cyber", name: "Dark Mode", colors: ["#000000", "#FFFFFF", "#999999"], description: "A minimalist, high-contrast monochrome experience for the refined eye." },
        { id: "signature", name: "Signature Core", colors: ["#0a0a0a", "#1a1a1a", "#2a2a2a"], description: "The original xwaked experience—dark, sleek, and timeless." },
        { id: "matcha", name: "Soft Matcha", colors: ["#E8F3E8", "#2D3A2D", "#88AB8E"], description: "A digital detox for your eyes—calm, organic, and purely aesthetic." },
        { id: "retro", name: "Retro Pop", colors: ["#FFF0F5", "#FF007A", "#FFD700"], description: "Unapologetically loud and nostalgic. Welcome to the Y2K glitch." },
    ];

    const cycleTheme = () => {
        const currentIndex = themes.findIndex(t => t.id === theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex].id);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, grain, setGrain, themes }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
