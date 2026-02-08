import React from 'react';
import { StoriesData } from '../context/StoriesContext';
import { UserData } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

const StoryAvatar = ({ user: targetUser, size = "w-10 h-10", border = true, onClick, className }) => {
    const { stories } = StoriesData();
    const { user: currentUser } = UserData();
    const navigate = useNavigate();

    // Find story group for this user
    const storyGroup = stories.find(s => s.user._id === targetUser?._id);

    // Check status
    let hasStory = false;
    let allSeen = false;

    if (storyGroup && storyGroup.stories.length > 0) {
        hasStory = true;
        allSeen = storyGroup.stories.every(s => s.viewers.some(v => v._id === currentUser?._id));
    }

    // Dynamic Classes
    const ringClass = hasStory
        ? allSeen
            ? "bg-gray-700" // Seen
            : "bg-gradient-to-tr from-[var(--accent)] via-purple-500 to-orange-500" // Unseen
        : border ? "border border-white/10" : ""; // No story

    return (
        <div
            onClick={onClick}
            className={`rounded-full p-[2px] ${ringClass} flex items-center justify-center shrink-0 transition-transform duration-300 ${className || ""} ${hasStory ? "cursor-pointer" : ""}`}
        >
            <img
                src={targetUser?.profilePic?.url || "https://placehold.co/400"}
                alt={targetUser?.name}
                loading="lazy"
                decoding="async"
                className={`${size} rounded-full object-cover border-2 border-[#0B0F14]`}
            />
        </div>
    );
};

export default StoryAvatar;
