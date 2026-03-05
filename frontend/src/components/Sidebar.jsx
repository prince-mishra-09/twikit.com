
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AiFillHome, AiOutlineHome, AiOutlinePlusSquare, AiFillPlusSquare } from "react-icons/ai";
import { IoSearch, IoSearchOutline, IoChatbubbleEllipses, IoChatbubbleEllipsesOutline, IoNotifications, IoNotificationsOutline, IoLogOutOutline, IoSparklesOutline, IoBugOutline } from "react-icons/io5";
import { RiAccountCircleFill, RiAccountCircleLine, RiRecordCircleFill } from "react-icons/ri";
import ReelsIcon from "./ReelsIcon";
import { FaBars } from "react-icons/fa"; // Import FaBars
import { UserData } from "../context/UserContext";
import CreatePostModal from "./CreatePostModal";
import { ChatData } from "../context/ChatContext";
import { NotificationData } from "../context/NotificationContext";
import { useTheme } from "../context/ThemeContext";

import AuraXIcon from "./AuraXIcon"; // Import the new icon
import BugReportTooltip from "./BugReportTooltip";


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
            icon: AiOutlineHome,
            activeIcon: AiFillHome,
        },
        {
            name: "Search",
            path: "/search",
            icon: IoSearchOutline,
            activeIcon: IoSearch,
        },
        {
            name: "Reels",
            path: "/reels",
            icon: (props) => <ReelsIcon {...props} />,
            activeIcon: (props) => <ReelsIcon {...props} />,
        },
        // {
        //     name: "Aura X",
        //     path: "/aurax",
        //     icon: () => <AuraXIcon size={24} />,
        //     activeIcon: () => <AuraXIcon size={24} className="active-aura-icon" />,
        //     isAuraX: true, // Special styling
        // },
        {
            name: "Messages",
            path: "/chat",
            icon: IoChatbubbleEllipsesOutline,
            activeIcon: IoChatbubbleEllipses,
            badge: totalUnreadMessages,
        },
        {
            name: "Notifications",
            path: "/notifications",
            icon: IoNotificationsOutline,
            activeIcon: IoNotifications,
            badge: unreadCount,
        },
        {
            name: "Create",
            action: () => handleProtectedAction(() => setShowCreateModal(true)),
            icon: AiOutlinePlusSquare,
            activeIcon: AiFillPlusSquare,
        },
        {
            name: "Profile",
            // If auth, link to profile. If not, act as button to trigger login
            path: isAuth ? `/user/${user?._id}` : null,
            action: !isAuth ? () => setShowLoginPrompt(true) : null,
            icon: RiAccountCircleLine,
            activeIcon: RiAccountCircleFill,
            isProfile: true, // Special handling for avatar
        },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <>
            {showCreateModal && <CreatePostModal setShow={setShowCreateModal} />}

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
                        {!isCollapsed && (
                            <span className="text-3xl font-black text-[var(--text-primary)] tracking-tighter leading-none">
                                {/* //     xwaked */}
                            </span>
                        )}
                    </Link>

                    {!isCollapsed && (
                        <button
                            onClick={toggleSidebar}
                            className="text-[var(--text-primary)] p-2 rounded-full hover:bg-[var(--text-primary)]/10 transition-colors"
                            title="Collapse Sidebar"
                        >
                            <FaBars size={18} />
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
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white overflow-hidden border border-[var(--bg-primary)] animate-pulse">
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
                        className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group hover:bg-orange-500/10 text-orange-500 mb-1 ${isCollapsed ? "justify-center gap-0" : "gap-4"
                            }`}
                    >
                        <div className="relative group-hover:scale-110 transition-transform duration-200">
                            <IoBugOutline className="text-2xl" />
                        </div>
                        {!isCollapsed && <span className="text-base font-normal whitespace-nowrap">Report a Bug</span>}
                    </button>
                    {!isCollapsed && <BugReportTooltip position="right" />}
                </div>

                {/* Theme Toggle Button */}
                <button
                    onClick={cycleTheme}
                    title={isCollapsed ? "Change Theme" : "Cycle Theme"}
                    className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group hover:bg-[var(--text-primary)]/10 text-[var(--text-primary)] mb-2 ${isCollapsed ? "justify-center gap-0" : "gap-4"
                        }`}
                >
                    <div className="relative group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 group-hover:text-[var(--accent)]">
                        <IoSparklesOutline className="text-2xl" />
                    </div>
                    {!isCollapsed && <span className="text-base font-normal whitespace-nowrap">Change Theme</span>}
                </button>

                {/* Logout - Only show if Auth */}
                {isAuth && (
                    <button
                        onClick={() => logoutUser(navigate)}
                        title={isCollapsed ? "Log out" : ""}
                        className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group hover:bg-red-500/10 text-red-500 ${isCollapsed ? "justify-center gap-0" : "gap-4"
                            }`}
                    >
                        <div className="relative group-hover:scale-110 transition-transform duration-200">
                            <IoLogOutOutline className="text-2xl" />
                        </div>
                        {!isCollapsed && <span className="text-base font-medium whitespace-nowrap">Log out</span>}
                    </button>
                )}
            </div>
        </>
    );
};

export default Sidebar;
