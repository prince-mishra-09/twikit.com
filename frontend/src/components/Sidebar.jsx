
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AiFillHome, AiOutlineHome, AiOutlinePlusSquare, AiFillPlusSquare } from "react-icons/ai";
import { IoSearch, IoSearchOutline, IoChatbubbleEllipses, IoChatbubbleEllipsesOutline, IoNotifications, IoNotificationsOutline, IoLogOutOutline } from "react-icons/io5";
import { BsCameraReels, BsCameraReelsFill } from "react-icons/bs";
import { RiAccountCircleFill, RiAccountCircleLine } from "react-icons/ri";
import { UserData } from "../context/UserContext";
import CreatePostModal from "./CreatePostModal";
import { ChatData } from "../context/ChatContext";
import { NotificationData } from "../context/NotificationContext";


const Sidebar = () => {
    const { user, isAuth, logoutUser } = UserData();
    const { unreadCount } = NotificationData();
    const { totalUnreadMessages } = ChatData();
    const location = useLocation();
    const navigate = useNavigate();
    const [showCreateModal, setShowCreateModal] = useState(false);

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
            icon: BsCameraReels,
            activeIcon: BsCameraReelsFill,
        },
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
            action: () => setShowCreateModal(true),
            icon: AiOutlinePlusSquare,
            activeIcon: AiFillPlusSquare,
        },
        {
            name: "Profile",
            path: `/user/${user?._id}`,
            icon: RiAccountCircleLine,
            activeIcon: RiAccountCircleFill,
            isProfile: true, // Special handling for avatar
        },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <>
            {showCreateModal && <CreatePostModal setShow={setShowCreateModal} />}

            <div className="hidden md:flex flex-col w-[244px] h-screen fixed left-0 top-0 border-r border-[var(--border)] bg-[var(--bg-primary)] z-50 px-3 pt-8 pb-5 justify-between">

                {/* Logo */}
                <div className="px-3 mb-8">
                    <Link to="/" className="block">
                        <div className="flex items-center gap-2">
                            <img
                                src="/images/viby-removed-bg.png"
                                alt="Twikit Logo"
                                className="w-14 h-auto hover:opacity-80 transition-opacity"
                            />
                            <span className="text-2xl font-bold text-[var(--text-primary)] tracking-wide">
                                viby
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Nav Links */}
                <div className="flex-1 flex flex-col gap-2">
                    {navItems.map((item) => (
                        <div key={item.name}>
                            {item.path ? (
                                <Link
                                    to={item.path}
                                    className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group hover:bg-[var(--text-primary)]/10 ${isActive(item.path) ? "font-bold" : "font-normal"
                                        }`}
                                >
                                    <div className="relative group-hover:scale-110 transition-transform duration-200">
                                        {isActive(item.path)
                                            ? <item.activeIcon className="text-2xl text-[var(--text-primary)]" />
                                            : <item.icon className="text-2xl text-[var(--text-primary)]" />
                                        }
                                        {item.badge > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white overflow-hidden border border-[var(--bg-primary)] animate-pulse">
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-base text-[var(--text-primary)]">{item.name}</span>
                                </Link>
                            ) : (
                                <button
                                    onClick={item.action}
                                    className="w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group hover:bg-[var(--text-primary)]/10"
                                >
                                    <div className="relative group-hover:scale-110 transition-transform duration-200">
                                        <item.icon className="text-2xl text-[var(--text-primary)]" />
                                    </div>
                                    <span className="text-base text-[var(--text-primary)] font-normal">{item.name}</span>
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Logout */}
                <button
                    onClick={() => logoutUser(navigate)}
                    className="w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group hover:bg-red-500/10 text-red-500"
                >
                    <div className="relative group-hover:scale-110 transition-transform duration-200">
                        <IoLogOutOutline className="text-2xl" />
                    </div>
                    <span className="text-base font-medium">Log out</span>
                </button>
            </div>
        </>
    );
};

export default Sidebar;
