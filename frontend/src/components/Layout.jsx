import React from "react";
import { useLocation } from "react-router-dom";
import NavigationBar from "./NavigationBar";

const Layout = ({ children }) => {
    const location = useLocation();
    const isReels = location.pathname === "/reels";
    const isChat = location.pathname === "/chat";
    const isAuthPage = location.pathname === "/login" || location.pathname === "/landing" || (location.pathname === "/" && !localStorage.getItem("isAuth")); // Simplified check, actual auth check handled in components

    return (
        <div className="flex flex-col h-[100dvh] bg-[var(--bg-primary)]">
            {/* Scrollable Area */}
            <div
                id="main-content"
                className={`flex-1 w-full ${isReels ? 'overflow-hidden' : 'overflow-y-auto'} custom-scrollbar relative`}
            >
                {children}

                {/* Bottom spacer for NavigationBar */}
                {!isReels && !isChat && !isAuthPage && <div className="h-20"></div>}
            </div>

            <NavigationBar />
        </div>
    );
};

export default Layout;
