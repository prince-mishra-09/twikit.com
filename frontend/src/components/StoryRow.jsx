import React, { useState } from "react";
import { StoriesData } from "../context/StoriesContext";
import { UserData } from "../context/UserContext";
import StoryViewer from "./StoryViewer";
import { AiOutlinePlus } from "react-icons/ai";
import CreatePostModal from "./CreatePostModal";
import { useNavigate } from "react-router-dom";

const StoryRow = () => {
    const { stories, loading } = StoriesData();
    const { user } = UserData();
    const navigate = useNavigate();

    const [selectedStoryIndex, setSelectedStoryIndex] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Check if I have a story
    const myStoryGroup = user ? stories.find(s => s.user._id === user._id) : null;
    // Filter out myself from the main list to avoid duplication if I'm there
    const otherStories = user ? stories.filter(s => s.user._id !== user._id) : stories;

    const openStory = (index, isMyStory = false) => {
        if (isMyStory) {
            // If I'm opening my own story, find its index in the full list
            // Or handle it separately. For simplicity, let's just use the full list logic.
            // We'll reconstruct the list passed to viewer: [MyStory, ...OtherStories]
            setSelectedStoryIndex(0);
        } else {
            // If opening others, index + 1 (because my story is at 0)
            setSelectedStoryIndex(index + (myStoryGroup ? 1 : 0));
        }
    };

    // combined list for the viewer
    const viewerStories = myStoryGroup ? [myStoryGroup, ...otherStories] : otherStories;

    return (
        <>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide select-none">

                {/* MY STORY ITEM */}
                <div className="flex flex-col items-center gap-1.5 min-w-[70px] cursor-pointer group">
                    <div className="relative">
                        <div
                            onClick={() => myStoryGroup ? openStory(0, true) : navigate("/account")}
                            className={`w-[66px] h-[66px] rounded-full p-[2px] ${myStoryGroup
                                ? "bg-gradient-to-tr from-indigo-500 via-purple-500 to-orange-500" // Active Story Ring
                                : "border-2 border-white/10 border-dashed" // Empty State
                                }`}
                        >
                            <img
                                src={user?.profilePic?.url || "https://placehold.co/400"}
                                alt={user?.name}
                                className="w-full h-full rounded-full object-cover border-2 border-[#0B0F14]"
                            />
                        </div>

                        {!myStoryGroup && (
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowCreateModal(true);
                                }}
                                className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-0.5 border-2 border-[#0B0F14] hover:scale-110 transition cursor-pointer"
                            >
                                <AiOutlinePlus size={14} />
                            </div>
                        )}
                    </div>
                    <span className="text-xs text-center text-white truncate w-[70px]">
                        Your Story
                    </span>
                </div>

                {/* OTHER USERS STORIES */}
                {otherStories
                    .sort((a, b) => {
                        if (!user) return 0;
                        // helper to check if all stories viewed
                        const aSeen = a.stories.every(s => s.viewers.some(v => v._id === user._id || v === user._id));
                        const bSeen = b.stories.every(s => s.viewers.some(v => v._id === user._id || v === user._id));
                        // if a is seen and b is not, a goes last (1)
                        if (aSeen && !bSeen) return 1;
                        if (!aSeen && bSeen) return -1;
                        return 0;
                    })
                    .map((group, idx) => {
                        const isAllSeen = user ? group.stories.every(s => s.viewers.some(v => v._id === user._id || v === user._id)) : false;
                        return (
                            <div
                                key={group.user._id}
                                className="flex flex-col items-center gap-1.5 min-w-[70px] cursor-pointer"
                                onClick={() => setSelectedStoryIndex(myStoryGroup ? idx + 1 : idx)}
                            >
                                <div className={`w-[66px] h-[66px] rounded-full p-[2px] transition-transform duration-300 hover:scale-105 ${isAllSeen
                                    ? "bg-gray-700" // Gray Ring for Viewed
                                    : "bg-gradient-to-tr from-indigo-500 via-purple-500 to-orange-500"
                                    }`}>
                                    <img
                                        src={group.user.profilePic?.url || "https://placehold.co/400"}
                                        alt={group.user.name}
                                        className={`w-full h-full rounded-full object-cover border-2 ${isAllSeen ? "border-gray-800 opacity-80" : "border-[#0B0F14]"}`}
                                    />
                                </div>
                                <span className={`text-xs text-center truncate w-[70px] ${isAllSeen ? "text-gray-500" : "text-white"}`}>
                                    {group.user.name.split(" ")[0]}
                                </span>
                            </div>
                        );
                    })}

                {loading && stories.length === 0 && (
                    // Skeleton loader
                    [1, 2, 3].map(i => (
                        <div key={i} className="flex flex-col items-center gap-1.5 min-w-[70px] animate-pulse">
                            <div className="w-[66px] h-[66px] rounded-full bg-white/10" />
                            <div className="w-12 h-3 bg-white/10 rounded" />
                        </div>
                    ))
                )}
            </div>

            {/* STORY VIEWER OVERLAY */}
            {selectedStoryIndex !== null && (
                <StoryViewer
                    stories={viewerStories}
                    initialIndex={selectedStoryIndex}
                    initialStoryIndex={() => {
                        const group = viewerStories[selectedStoryIndex];
                        if (!group || !user) return 0;
                        const firstUnseen = group.stories.findIndex(s => !s.viewers.some(v => v._id === user._id));
                        return firstUnseen !== -1 ? firstUnseen : 0;
                    }}
                    onClose={() => setSelectedStoryIndex(null)}
                />
            )}

            {/* CREATE POST MODAL (Triggered from + button) */}
            {showCreateModal && <CreatePostModal setShow={setShowCreateModal} initialTab="story" />}
        </>
    );
};

export default StoryRow;
