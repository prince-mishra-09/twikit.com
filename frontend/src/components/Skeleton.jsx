import React from "react";

// Primitives
const SkeletonPulse = ({ className }) => (
    <div className={`animate-pulse bg-[#2a2a2e] ${className}`} />
);

// 1. Post/Feed Skeleton
export const SkeletonPost = () => {
    return (
        <div className="w-full bg-[#252529] rounded-2xl p-4 mb-4 border border-white/5">
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
                    <SkeletonPulse key={i} className="aspect-square bg-[#2a2a2e]" />
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
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-white/5">
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
