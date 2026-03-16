import React from "react";

// Primitives
const SkeletonPulse = ({ className }) => (
    <div className={`animate-pulse bg-[var(--border)] ${className}`} />
);

// 1. Post/Feed Skeleton
export const SkeletonPost = () => {
    return (
        <div className="w-full bg-[var(--card-bg)] rounded-2xl p-4 mb-4 border border-[var(--border)]/30">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <SkeletonPulse className="w-10 h-10 rounded-full" />
                <div className="flex flex-col gap-2">
                    <SkeletonPulse className="w-32 h-3 rounded" />
                    <SkeletonPulse className="w-20 h-2 rounded" />
                </div>
            </div>
            {/* Content */}
            <div className="space-y-2 mb-4">
                <SkeletonPulse className="w-full h-4 rounded" />
                <SkeletonPulse className="w-3/4 h-4 rounded" />
            </div>
            <SkeletonPulse className="w-full aspect-square rounded-xl mb-4" />
            {/* Actions */}
            <div className="flex gap-6 mt-4">
                <SkeletonPulse className="w-6 h-6 rounded-full" />
                <SkeletonPulse className="w-6 h-6 rounded-full" />
                <SkeletonPulse className="w-6 h-6 rounded-full" />
            </div>
        </div>
    );
};

// 2. Profile Skeleton (Header)
export const SkeletonProfile = () => {
    return (
        <div className="w-full max-w-xl px-4 py-8">
            {/* Avatar + Info */}
            <div className="flex flex-col items-center gap-4 mb-8">
                <SkeletonPulse className="w-24 h-24 rounded-full" />
                <div className="flex flex-col items-center gap-2 w-full">
                    <SkeletonPulse className="w-48 h-6 rounded" />
                    <SkeletonPulse className="w-32 h-4 rounded" />
                </div>
            </div>
            {/* Bio */}
            <div className="space-y-2 mb-8 flex flex-col items-center">
                <SkeletonPulse className="w-3/4 h-3 rounded" />
                <SkeletonPulse className="w-1/2 h-3 rounded" />
            </div>
            {/* Stats */}
            <div className="flex justify-around mb-8 w-full px-4">
                <SkeletonPulse className="w-16 h-10 rounded" />
                <SkeletonPulse className="w-16 h-10 rounded" />
                <SkeletonPulse className="w-16 h-10 rounded" />
            </div>
            {/* Tabs */}
            <div className="flex gap-4 mb-4">
                <SkeletonPulse className="flex-1 h-10 rounded-full" />
                <SkeletonPulse className="flex-1 h-10 rounded-full" />
            </div>
            {/* Grid */}
            <div className="grid grid-cols-3 gap-1">
                {[...Array(9)].map((_, i) => (
                    <SkeletonPulse key={i} className="aspect-square bg-[var(--border)]/30" />
                ))}
            </div>
        </div>
    );
};

// 3. User List Skeleton (Chat/Notifications)
export const SkeletonUserList = () => {
    return (
        <div className="space-y-4 px-4">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-[var(--border)]/30">
                    <SkeletonPulse className="w-12 h-12 rounded-full shrink-0" />
                    <div className="flex flex-col gap-2 flex-1">
                        <SkeletonPulse className="w-32 h-3 rounded" />
                        <SkeletonPulse className="w-48 h-2.5 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
};

// 4. Comment Skeleton (for comment drawer)
export const SkeletonComment = () => {
    return (
        <div className="space-y-4 px-4 py-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3">
                    <SkeletonPulse className="w-8 h-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                        <SkeletonPulse className="w-24 h-3 rounded" />
                        <SkeletonPulse className="w-full h-4 rounded" />
                        <SkeletonPulse className="w-3/4 h-4 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
};
// 5. Story Skeleton
export const SkeletonStory = () => {
    return (
        <div className="flex gap-4 overflow-x-hidden pb-4">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 min-w-[70px]">
                    <div className="relative">
                        <SkeletonPulse className="w-[66px] h-[66px] rounded-full border-2 border-[var(--bg-primary)]" />
                    </div>
                    <SkeletonPulse className="w-12 h-2.5 rounded" />
                </div>
            ))}
        </div>
    );
};

// 6. Reel Skeleton (Full Page)
export const SkeletonReel = () => {
    return (
        <div className="h-[100dvh] w-full bg-[var(--bg-primary)] flex justify-center items-center">
            <div className="w-full max-w-md h-full relative bg-[var(--card-bg)] animate-pulse">
                {/* Right Actions */}
                <div className="absolute right-4 bottom-20 flex flex-col gap-6">
                    <div className="w-10 h-10 rounded-full bg-[var(--border)]"></div>
                    <div className="w-10 h-10 rounded-full bg-[var(--border)]"></div>
                    <div className="w-10 h-10 rounded-full bg-[var(--border)]"></div>
                </div>
                {/* Bottom Info */}
                <div className="absolute left-4 bottom-10 w-3/4 space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[var(--border)]"></div>
                        <div className="w-24 h-4 bg-[var(--border)] rounded"></div>
                    </div>
                    <div className="w-full h-4 bg-[var(--border)] rounded"></div>
                    <div className="w-2/3 h-4 bg-[var(--border)] rounded"></div>
                </div>
            </div>
        </div>
    );
};

// 7. Chat Page Skeleton (Matches ChatPage.jsx layout)
export const SkeletonChatPage = () => {
    return (
        <div className="h-[100dvh] bg-[var(--bg-primary)] flex justify-center md:px-2 md:py-2">
            <div className="w-full max-w-6xl h-full md:h-[85vh] bg-[var(--card-bg)]/80 backdrop-blur-xl border border-[var(--border)] md:rounded-2xl shadow-xl flex overflow-hidden">

                {/* Left Sidebar Skeleton (30%) */}
                <div className="w-full md:w-[30%] border-r border-[var(--border)] flex flex-col">
                    {/* Header Skeleton */}
                    <div className="flex items-center justify-between p-4 mb-2">
                        <div className="h-6 w-20 bg-[var(--border)] rounded animate-pulse"></div>
                        <div className="h-8 w-8 rounded-full bg-[var(--border)] rounded-full animate-pulse"></div>
                    </div>

                    {/* Search Bar Skeleton */}
                    <div className="px-4 pb-4">
                        <div className="w-full h-10 rounded-lg bg-[var(--border)] animate-pulse"></div>
                    </div>

                    {/* Chat List Skeletons */}
                    <div className="flex-1 overflow-y-auto px-2 space-y-2">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-[var(--card-bg)]/50 border border-[var(--border)]/20">
                                <SkeletonPulse className="w-10 h-10 rounded-full shrink-0" />
                                <div className="flex flex-col gap-2 flex-1">
                                    <SkeletonPulse className="w-32 h-3 rounded" />
                                    <SkeletonPulse className="w-20 h-2 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel Skeleton (70%) - Empty State Placeholder */}
                <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center px-4">
                    <div className="flex flex-col items-center gap-4">
                        <SkeletonPulse className="w-48 h-8 rounded animate-pulse bg-[var(--border)]" />
                        <SkeletonPulse className="w-64 h-4 rounded animate-pulse bg-[var(--border)]" />
                    </div>
                </div>
            </div>
        </div>
    );
};
