import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserData } from "../context/UserContext";
import { isSameId, includesId } from "../utils/idUtils";
import { getOptimizedImage } from "../utils/imagekitUtils";

const RightBar = () => {
    const { user, isAuth, searchUser, followUser } = UserData();
    const [hasFetched, setHasFetched] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

    // Track window resize to update isDesktop
    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 1024);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const fetchSuggestions = async () => {
            // Only fetch if:
            // 1. Authenticated
            // 2. Desktop view
            // 3. Haven't fetched yet in this session
            if (!isAuth || !user || !isDesktop || hasFetched) return;

            // console.log("RightBar: Fetching suggestions (Desktop Only, Once per session)...");
            try {
                // Fetch all/top users using search with empty query
                const users = await searchUser("");

                // Filter: Exclude me, and people I already follow
                const filtered = users.filter(u =>
                    !isSameId(u._id, user._id) &&
                    !includesId(user.followings, u._id)
                ).slice(0, 10); // Take top 10

                setSuggestions(filtered);
                setHasFetched(true);
            } catch (error) {
                console.error("RightBar Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, [user?._id, isAuth, isDesktop, hasFetched, searchUser]); // Depend on user._id instead of whole object to avoid refetch on follow count change


    if (!isAuth || !user) return null;

    return (
        <div className="hidden lg:block w-[320px] fixed right-0 top-0 h-screen py-8 pr-8 pl-4 z-50 overflow-y-auto custom-scrollbar">
            {/* User Switcher */}
            <div className="flex items-center justify-between mb-6">
                <Link to={`/user/${user._id}`} className="flex items-center gap-3 group">
                    <div className="w-11 h-11 rounded-full overflow-hidden border border-[var(--border)] group-hover:border-[var(--accent)] transition-colors bg-[var(--bg-secondary)]">
                        {user.profilePic?.url ? (
                            <img src={getOptimizedImage(user.profilePic.url, { isProfilePic: true, updatedAt: user.updatedAt, width: 100 })} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)] font-bold text-lg">
                                {user.name?.[0]}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-[var(--text-primary)]">{user.username}</span>
                        <span className="text-sm text-[var(--text-secondary)]">{user.name}</span>
                    </div>
                </Link>
                {/* <button className="text-xs font-bold text-[var(--accent)] hover:text-white transition-colors">
                    Switch
                </button> */}
            </div>

            {/* Suggestions Header */}
            <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-[var(--text-secondary)]">Suggested for you</span>
                <Link to="/search" className="text-xs font-bold text-[var(--text-primary)] hover:opacity-70">See All</Link>
            </div>

            {/* Suggestions List */}
            <div className="flex flex-col gap-4">
                {loading ? (
                    // Simple Skeleton
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)]"></div>
                                <div className="flex flex-col gap-1">
                                    <div className="h-2 w-20 bg-[var(--bg-secondary)] rounded"></div>
                                    <div className="h-2 w-12 bg-[var(--bg-secondary)] rounded"></div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : suggestions.length > 0 ? (
                    suggestions.map((s) => (
                        <div key={s._id} className="flex items-center justify-between">
                            <Link to={`/user/${s._id}`} className="flex items-center gap-3 group">
                                <div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] overflow-hidden border border-[var(--border)] group-hover:border-[var(--text-primary)] transition-colors">
                                    {s.profilePic?.url ? (
                                        <img src={getOptimizedImage(s.profilePic.url, { isProfilePic: true, updatedAt: s.updatedAt, width: 100 })} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)] text-xs font-bold">
                                            {s.name?.[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-[var(--text-primary)] hover:underline truncate max-w-[120px]">{s.username}</span>
                                    <span className="text-[10px] text-[var(--text-secondary)]">Suggested for you</span>
                                </div>
                            </Link>
                            <button
                                onClick={() => followUser(s._id)}
                                className="text-xs font-bold text-[var(--accent)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                Follow
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-xs text-[var(--text-secondary)]">No new suggestions</div>
                )}
            </div>

            {/* Footer Links - Fixed to bottom */}
            <div className="fixed bottom-0 right-0 w-[320px] pr-8 pl-4 pb-4 bg-[var(--bg-primary)]">
                <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-[var(--text-secondary)]/50">
                    <a href="#" className="hover:underline">About</a>
                    <span>•</span>
                    <a href="#" className="hover:underline">Help</a>
                    <span>•</span>
                    <a href="#" className="hover:underline">API</a>
                    <span>•</span>
                    <a href="#" className="hover:underline">Privacy</a>
                    <span>•</span>
                    <a href="#" className="hover:underline">Terms</a>
                </div>

                <div className="mt-2 text-xs text-[var(--text-secondary)]/50 uppercase">
                    © 2026 xwaked from INDIA
                </div>
            </div>

        </div>
    );
};

export default RightBar;
