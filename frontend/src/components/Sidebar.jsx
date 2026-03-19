import React, { useState, lazy, Suspense } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ReelsIcon from "./ReelsIcon";
import { UserData } from "../context/UserContext";
import { ChatData } from "../context/ChatContext";
import { NotificationData } from "../context/NotificationContext";
import { useTheme } from "../context/ThemeContext";
import AuraXIcon from "./AuraXIcon";
import BugReportTooltip from "./BugReportTooltip";
import { getOptimizedImage } from "../utils/imagekitUtils";

// Lazy-load CreatePostModal — it's large and unnecessary on first paint
const CreatePostModal = lazy(() => import("./CreatePostModal"));

// ── Inline SVG Icons (zero bundle overhead) ──────────────────────────────────
const HomeIcon = ({ filled }) => (
    <svg className="text-2xl w-6 h-6" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m3 9.5 9-7 9 7V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
    </svg>
);
const SearchSvgIcon = ({ filled }) => (
    <svg className="text-2xl w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={filled ? 2.5 : 1.8} strokeLinecap="round">
        <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
    </svg>
);
const ChatIcon = ({ filled }) => (
    <svg className="text-2xl w-6 h-6" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h4m-7 6 3-3H19a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
    </svg>
);
const BellIcon = ({ filled }) => (
    <svg className="text-2xl w-6 h-6" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" />
    </svg>
);
const PlusSqIcon = ({ filled }) => (
    <svg className="text-2xl w-6 h-6" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="18" height="18" rx="3" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" d="M12 8v8M8 12h8" />
    </svg>
);
const AccountCircleIcon = ({ filled }) => (
    <svg className="text-2xl w-6 h-6" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="10" r="3" />
        <path strokeLinecap="round" d="M6.168 18.849A4 4 0 0 1 10 17h4a4 4 0 0 1 3.832 1.849" />
    </svg>
);
const SparkleIcon = () => (
    <svg className="text-2xl w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
        <path d="M12 3v1M12 20v1M4.22 4.22l.7.7M19.07 19.07l.71.71M1 12h1M22 12h1M4.22 19.78l.7-.7M19.07 4.93l.71-.71" />
        <circle cx="12" cy="12" r="4" />
    </svg>
);
const LogoutIcon = () => (
    <svg className="text-2xl w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
);
const BarsIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);
const BugIcon = () => (
    <svg className="text-2xl w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
        <path d="M8 2l1.5 1.5M16 2l-1.5 1.5M9 9h6M9 15h6M5 12H3m18 0h-2M7 9l-2-2m14 2 2-2M7 15l-2 2m14-2 2 2" />
        <path d="M12 3a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V7a4 4 0 0 1 4-4z" />
    </svg>
);
// ────────────────────────────────────────────────────────────────────────────


const Sidebar = ({ isCollapsed, toggleSidebar }) => { // Accept props
    const { user, isAuth, logoutUser, setShowLoginPrompt, searchUser } = UserData();
    const { unreadCount } = NotificationData();
    const { createChat, setSelectedChat, totalUnreadMessages } = ChatData();
    const { theme, cycleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [showCreateModal, setShowCreateModal] = useState(false);

    // ... (rest of helper functions)

    const handleProtectedAction = (action) => {
        if (isAuth) {
            action();
        } else {
            setShowLoginPrompt(true);
        }
    };

    const handleReportBug = async () => {
        if (!isAuth) return setShowLoginPrompt(true);
        const toastId = toast.loading("Connecting to support...");
        try {
            const users = await searchUser("admin_prince");
            const admin = users.find(u => u.username === "admin_prince");

            if (admin) {
                const chat = await createChat(admin._id);
                if (chat) {
                    setSelectedChat(chat);
                    navigate("/chat", { state: { isBugReport: true } });
                    toast.success("Chat opened", { id: toastId });
                } else {
                    throw new Error("Could not create chat");
                }
            } else {
                toast.error("Admin user not found. Please try again later.", { id: toastId });
                navigate("/chat");
            }
        } catch (error) {
            toast.error("Something went wrong", { id: toastId });
            navigate("/chat");
        }
    };

    const navItems = [
        {
            name: "Home",
            path: "/",
            icon: () => <HomeIcon filled={false} />,
            activeIcon: () => <HomeIcon filled={true} />,
        },
        {
            name: "Search",
            path: "/search",
            icon: () => <SearchSvgIcon filled={false} />,
            activeIcon: () => <SearchSvgIcon filled={true} />,
        },
        {
            name: "Reels",
            path: "/reels",
            icon: (props) => <ReelsIcon {...props} />,
            activeIcon: (props) => <ReelsIcon {...props} />,
        },
        {
            name: "Messages",
            path: "/chat",
            icon: () => <ChatIcon filled={false} />,
            activeIcon: () => <ChatIcon filled={true} />,
            badge: totalUnreadMessages,
        },
        {
            name: "Notifications",
            path: "/notifications",
            icon: () => <BellIcon filled={false} />,
            activeIcon: () => <BellIcon filled={true} />,
            badge: unreadCount,
        },
        {
            name: "Create",
            action: () => handleProtectedAction(() => setShowCreateModal(true)),
            icon: () => <PlusSqIcon filled={false} />,
            activeIcon: () => <PlusSqIcon filled={true} />,
        },
        {
            name: "Profile",
            path: isAuth ? `/user/${user?._id}` : null,
            action: !isAuth ? () => setShowLoginPrompt(true) : null,
            icon: () => user?.profilePic?.url
                ? <img src={getOptimizedImage(user.profilePic.url, { isProfilePic: true, updatedAt: user.updatedAt, width: 100 })} alt="" className="w-6 h-6 rounded-full object-cover" />
                : <AccountCircleIcon filled={false} />,
            activeIcon: () => user?.profilePic?.url
                ? <img src={getOptimizedImage(user.profilePic.url, { isProfilePic: true, updatedAt: user.updatedAt, width: 100 })} alt="" className="w-6 h-6 rounded-full object-cover border-2 border-[var(--accent)]" />
                : <AccountCircleIcon filled={true} />,
            isProfile: true,
        },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <>
            {showCreateModal && (
                <Suspense fallback={null}>
                    <CreatePostModal setShow={setShowCreateModal} />
                </Suspense>
            )}

            <div
                className={`hidden md:flex flex-col h-screen fixed left-0 top-0 border-r border-[var(--border)] bg-[var(--bg-primary)] z-50 pt-8 pb-5 justify-between transition-all duration-300 ${isCollapsed ? "w-[80px] px-2 items-center" : "w-[244px] px-3"
                    }`}
            >

                {/* Logo & Toggle */}
                <div className={`mb-8 flex items-center ${isCollapsed ? "justify-center" : "px-4 justify-between"}`}>
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="flex items-center justify-center">
                            <img
                                src={theme === "matcha" || theme === "retro" ? "/images/xwaked-black.png" : "/images/xwaked-white.png"}
                                alt="xwaked"
                                className={`${isCollapsed ? "w-11" : "w-14"} h-auto hover:opacity-80 transition-all duration-300`}
                            />
                        </div>
                    </Link>

                    {!isCollapsed && (
                        <button
                            onClick={toggleSidebar}
                            className="text-[var(--text-primary)] p-2 rounded-full hover:bg-[var(--text-primary)]/10 transition-colors"
                            title="Collapse Sidebar"
                        >
                            <BarsIcon />
                        </button>
                    )}
                </div>

                {/* Nav Links */}
                <div className={`flex-1 flex flex-col gap-2 ${isCollapsed ? "items-center w-full" : ""}`}>
                    {navItems.map((item) => (
                        <div key={item.name} className="w-full">
                            {item.path ? (
                                <Link
                                    to={item.path}
                                    title={isCollapsed ? item.name : ""}
                                    className={`flex items-center p-3 rounded-xl transition-all duration-200 group hover:bg-[var(--text-primary)]/10 ${isCollapsed ? "justify-center gap-0" : "gap-4"
                                        } ${isActive(item.path) ? "font-bold" : "font-normal"}`}
                                >
                                    <div className="relative group-hover:scale-110 transition-transform duration-200">
                                        {isActive(item.path)
                                            ? <item.activeIcon className="text-2xl text-[var(--accent)]" />
                                            : <item.icon className="text-2xl text-[var(--text-primary)]" />
                                        }
                                        {item.badge > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--danger)] text-[10px] text-white overflow-hidden border border-[var(--bg-primary)] animate-pulse">
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                    {!isCollapsed && <span className="text-base text-[var(--text-primary)] whitespace-nowrap">{item.name}</span>}
                                </Link>
                            ) : (
                                <button
                                    onClick={item.action}
                                    title={isCollapsed ? item.name : ""}
                                    className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group hover:bg-[var(--text-primary)]/10 ${isCollapsed ? "justify-center gap-0" : "gap-4"
                                        }`}
                                >
                                    <div className="relative group-hover:scale-110 transition-transform duration-200">
                                        <item.icon className="text-2xl text-[var(--text-primary)]" />
                                    </div>
                                    {!isCollapsed && <span className="text-base text-[var(--text-primary)] font-normal whitespace-nowrap">{item.name}</span>}
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Report a Bug Button */}
                <div className="relative">
                    <button
                        onClick={handleReportBug}
                        title={isCollapsed ? "Report a Bug" : ""}
                        className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group hover:bg-[var(--warning)]/10 text-[var(--warning)] mb-1 ${isCollapsed ? "justify-center gap-0" : "gap-4"}`}
                    >
                        <div className="relative group-hover:scale-110 transition-transform duration-200">
                            <BugIcon />
                        </div>
                        {!isCollapsed && <span className="text-base font-normal whitespace-nowrap">Report a Bug</span>}
                    </button>
                    {!isCollapsed && <BugReportTooltip position="right" />}
                </div>

                {/* Theme Toggle Button */}
                <button
                    onClick={cycleTheme}
                    title={isCollapsed ? "Change Theme" : "Cycle Theme"}
                    className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group hover:bg-[var(--text-primary)]/10 text-[var(--text-primary)] mb-2 ${isCollapsed ? "justify-center gap-0" : "gap-4"}`}
                >
                    <div className="relative group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 group-hover:text-[var(--accent)]">
                        <SparkleIcon />
                    </div>
                    {!isCollapsed && <span className="text-base font-normal whitespace-nowrap">Change Theme</span>}
                </button>

                {/* Logout - Only show if Auth */}
                {isAuth && (
                    <button
                        onClick={() => logoutUser(navigate)}
                        title={isCollapsed ? "Log out" : ""}
                        className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group hover:bg-[var(--danger)]/10 text-[var(--danger)] ${isCollapsed ? "justify-center gap-0" : "gap-4"}`}
                    >
                        <div className="relative group-hover:scale-110 transition-transform duration-200">
                            <LogoutIcon />
                        </div>
                        {!isCollapsed && <span className="text-base font-medium whitespace-nowrap">Log out</span>}
                    </button>
                )}
            </div>
        </>
    );
};

export default Sidebar;
