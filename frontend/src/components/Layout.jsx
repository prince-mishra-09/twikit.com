import React from "react";
import { useLocation } from "react-router-dom";
import { UserData } from "../context/UserContext";
import NavigationBar from "./NavigationBar";
import Sidebar from "./Sidebar";
import RightBar from "./RightBar";

const Layout = ({ children }) => {
    const { isAuth } = UserData();
    const location = useLocation();
    const isReels = location.pathname === "/reels";
    const isChat = location.pathname === "/chat";

    // Auth pages where we hide sidebars
    const isAuthPage = location.pathname === "/login" || location.pathname === "/landing" || location.pathname === "/register";

    // Special case: "/" is Landing if NOT auth, Home if auth.
    // If it's "/" and !isAuth, treat as auth page (hide sidebar).
    const isLanding = location.pathname === "/" && !isAuth;

    // Check if we should show the desktop sidebars
    const showSidebars = !isReels && !isChat && !isAuthPage && !isLanding;

    return (
        <div className="flex bg-[var(--bg-primary)] h-[100dvh]">

            {/* Left Sidebar - Desktop Only & Conditionally Rendered */}
            {showSidebars && <Sidebar />}

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col h-full relative ${showSidebars ? 'md:ml-[244px]' : ''}`}>

                {/* Scrollable Area */}
                <div
                    id="main-content"
                    className={`flex-1 w-full ${isReels ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden'} custom-scrollbar relative`}
                >
                    {/* Content Wrapper to center feed if needed */}
                    <div className={`w-full min-h-full ${showSidebars ? 'flex justify-center' : ''}`}>
                        {/* If showing sidebars, constrain width and margin for RightBar */}
                        <div className={`w-full ${showSidebars ? 'max-w-[630px] lg:mr-[320px]' : ''}`}>
                            {children}
                            {/* Bottom spacer for Mobile NavigationBar */}
                            {!isReels && !isChat && !isAuthPage && !isLanding && <div className="h-20 md:hidden"></div>}
                        </div>
                    </div>
                </div>

                {/* Mobile Bottom Nav */}
                <NavigationBar />
            </div>

            {/* Right Sidebar - Desktop Only & Conditionally Rendered */}
            {showSidebars && <RightBar />}

        </div>
    );
};

export default Layout;
