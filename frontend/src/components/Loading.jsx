import React from "react";
import { useLocation } from "react-router-dom";
import { SkeletonPost, SkeletonReel, SkeletonChatPage, SkeletonUserList } from "./Skeleton";

// 1. Full Page Skeleton (For Initial Browser Load)
// This mimics the entire Layout (Sidebar + Feed + RightBar).
export const SkeletonFullPage = () => {
  return (
    <div className="flex bg-[var(--bg-primary)] h-[100dvh] overflow-hidden">

      {/* Left Sidebar Skeleton (Desktop) */}
      <div className="hidden md:flex flex-col w-[72px] lg:w-[244px] h-full fixed left-0 top-0 border-r border-[#262626] p-4 bg-black z-50 items-center lg:items-start transition-all">
        {/* Logo */}
        <div className="h-8 w-8 lg:w-32 bg-[#262626] rounded mb-8 animate-pulse"></div>
        {/* Nav Items */}
        <div className="flex flex-col gap-6 flex-1 w-full">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center justify-center lg:justify-start gap-4">
              <div className="w-6 h-6 rounded-full bg-[#262626] animate-pulse shrink-0"></div>
              <div className="hidden lg:block h-4 w-24 bg-[#262626] rounded animate-pulse"></div>
            </div>
          ))}
        </div>
        {/* Profile */}
        <div className="w-10 h-10 rounded-full bg-[#262626] animate-pulse mt-auto"></div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col h-full relative md:ml-[72px] lg:ml-[244px] lg:mr-[320px]">
        {/* Mobile Header */}
        <div className="md:hidden h-14 w-full border-b border-[#262626] mb-4 flex items-center px-4">
          <div className="h-6 w-24 bg-[#262626] rounded animate-pulse"></div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pt-4 px-4 flex justify-center">
          <div className="w-full max-w-[600px] space-y-4">
            <SkeletonPost />
            <SkeletonPost />
            <SkeletonPost />
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <div className="md:hidden h-16 w-full border-t border-[#262626] bg-black fixed bottom-0 flex justify-around items-center px-4 z-50">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-6 h-6 rounded bg-[#262626] animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Right Sidebar Skeleton (Desktop) */}
      <div className="hidden lg:flex w-[320px] h-full fixed right-0 top-0 border-l border-[#262626] bg-black p-4 flex-col gap-6 z-50">
        <div className="h-10 w-full bg-[#262626] rounded-full animate-pulse"></div>
        <div className="space-y-4">
          <div className="h-4 w-32 bg-[#262626] rounded animate-pulse"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#262626] animate-pulse"></div>
              <div className="flex flex-col gap-2">
                <div className="h-3 w-24 bg-[#262626] rounded animate-pulse"></div>
                <div className="h-2 w-16 bg-[#262626] rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};


// 2. Route Aware Skeleton (For Page Switching / Suspense Fallback)
// This fits INSIDE the layout (content area usually), or acts as full page for Reels.
export const RouteAwareSkeleton = () => {
  const location = useLocation();
  const path = location.pathname;

  // Full Page Skeleton for Reels (since Reels overrides layout)
  if (path.startsWith("/reels")) {
    return <SkeletonReel />;
  }

  // Chat Skeleton
  if (path.startsWith("/chat")) {
    return <SkeletonChatPage />;
  }

  // Notifications Skeleton
  if (path.startsWith("/notifications")) {
    return <SkeletonUserList />;
  }

  // User Profile / Account Skeleton (Handled by component usually, but good fallback)
  if (path.startsWith("/user/") || path.startsWith("/account")) {
    // We can just return null or a simple spinner here because 
    // the page component itself handles the 'loading' state with SkeletonProfile
    // But for Suspense, we need something.
    // Let's use a generic content loader.
    return (
      <div className="flex justify-center pt-8">
        <div className="w-10 h-10 border-4 border-white/20 border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    );
  }

  // Default Feed Skeleton (Home, Search, Explore)
  return (
    <div className="flex justify-center pt-4 px-4 h-full">
      <div className="w-full max-w-[600px] space-y-4">
        <SkeletonPost />
        <SkeletonPost />
      </div>
    </div>
  );
};

// Default export can match RouteAwareSkeleton for Suspense usage
export default RouteAwareSkeleton;

// Also export generic LoadingAnimation
export const LoadingAnimation = () => {
  return (
    <div className="flex items-center gap-2 animate-pulse">
      <div className="w-4 h-4 rounded-full bg-[var(--border)]"></div>
      <div className="h-4 w-20 bg-[var(--border)] rounded"></div>
    </div>
  );
};
