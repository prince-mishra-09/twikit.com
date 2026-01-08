import React, { useState, useEffect, useRef } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { IoEyeSharp } from "react-icons/io5";
import { MdDelete } from "react-icons/md";
import { StoriesData } from "../context/StoriesContext";
import { UserData } from "../context/UserContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const StoryViewer = ({ stories, initialIndex, onClose }) => {
    const navigate = useNavigate();
    const [userIndex, setUserIndex] = useState(initialIndex);
    const [storyIndex, setStoryIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    const { viewStory, deleteStory } = StoriesData();
    const { user } = UserData();

    const currentUserStories = stories[userIndex];
    const currentStory = currentUserStories?.stories[storyIndex];

    // Determine duration
    const [duration, setDuration] = useState(5000);
    const videoRef = useRef(null);

    // Insights State
    const [showInsights, setShowInsights] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Scroll Lock
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, []);

    // Effect for Image default duration
    useEffect(() => {
        if (!currentStory) return;
        if (!currentStory.mediaUrl?.includes(".mp4") && !currentStory.mediaUrl?.includes(".webm")) {
            setDuration(15000);
        }
    }, [currentStory]);

    const intervalRef = useRef(null);

    // Mark as seen
    useEffect(() => {
        if (currentStory && !showInsights) {
            viewStory(currentStory._id);
        }
    }, [currentStory?._id]);

    // Timer logic
    useEffect(() => {
        if (isPaused || showInsights || isDeleting || showDeleteModal) return;

        setProgress(0);
        const startTime = Date.now() - (progress / 100 * duration);

        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const p = (elapsed / duration) * 100;

            if (p >= 100) {
                nextStory();
            } else {
                setProgress(p);
            }
        }, 50);

        return () => clearInterval(intervalRef.current);
    }, [storyIndex, userIndex, duration, isPaused, showInsights, isDeleting, showDeleteModal]);


    const nextStory = () => {
        if (storyIndex < currentUserStories.stories.length - 1) {
            setStoryIndex(prev => prev + 1);
        } else {
            if (userIndex < stories.length - 1) {
                setUserIndex(prev => prev + 1);
                setStoryIndex(0);
            } else {
                onClose();
            }
        }
    };

    const prevStory = () => {
        if (storyIndex > 0) {
            setStoryIndex(prev => prev - 1);
        } else {
            if (userIndex > 0) {
                const prevUserIdx = userIndex - 1;
                setUserIndex(prevUserIdx);
                setStoryIndex(stories[prevUserIdx].stories.length - 1);
            } else {
                setStoryIndex(0);
                setProgress(0);
            }
        }
    };

    // --- SWIPE LOGIC ---
    const touchStartY = useRef(null);
    const touchEndY = useRef(null);

    const onTouchStart = (e) => {
        touchStartY.current = e.targetTouches[0].clientY;
        touchEndY.current = null;
    };

    const onTouchMove = (e) => {
        touchEndY.current = e.targetTouches[0].clientY;
    };

    const onTouchEnd = () => {
        if (!touchStartY.current || !touchEndY.current) return;

        const distance = touchStartY.current - touchEndY.current;
        const isMinSwipe = distance > 50;

        if (isMinSwipe) {
            if (currentUserStories.user._id === user._id) {
                setShowInsights(true);
            }
        } else if (distance < -50) {
            if (showInsights) setShowInsights(false);
            else onClose();
        }
    };

    const handleDelete = () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        const success = await deleteStory(currentStory._id);
        setIsDeleting(false);
        if (success) {
            toast.success("Story deleted");
            setShowDeleteModal(false);
            onClose();
        } else {
            toast.success("Story deleted (Refreshed)"); // Fallback if API returns void but success
            setShowDeleteModal(false);
            onClose();
        }
    };


    if (!currentStory) return null;

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={onClose}
        >

            {/* Container */}
            <div
                className="relative w-full h-full md:w-[400px] md:h-[90vh] md:rounded-2xl overflow-hidden bg-[#1a1a1a]"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Progress Bars */}
                <div className="absolute top-4 left-0 w-full px-2 flex gap-1 z-20">
                    {currentUserStories.stories.map((s, i) => (
                        <div key={s._id} className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-75 ease-linear"
                                style={{
                                    width: i < storyIndex ? "100%" : i === storyIndex ? `${progress}%` : "0%"
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header (User Info) - Glass Effect */}
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                        navigate(`/user/${currentUserStories.user._id}`);
                    }}
                    className="absolute top-8 left-4 z-20 flex items-center gap-3 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg cursor-pointer hover:bg-black/30 transition">
                    <img
                        src={currentUserStories.user.profilePic?.url || "https://placehold.co/400"}
                        className="w-8 h-8 rounded-full border border-white/20"
                    />
                    <div className="flex flex-col">
                        <span className="text-white font-bold text-sm leading-none drop-shadow-md">
                            {currentUserStories.user.name.length > 20 ? currentUserStories.user.name.slice(0, 20) + "..." : currentUserStories.user.name}
                        </span>
                        <span className="text-white/80 text-[10px] leading-none">
                            {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>

                {/* Close Button - Glass Effect */}
                <button
                    onClick={onClose}
                    className="absolute top-8 right-4 z-20 text-white/90 hover:text-white bg-black/20 backdrop-blur-md p-2 rounded-full border border-white/10 transition"
                >
                    <AiOutlineClose size={20} />
                </button>

                {/* Content */}
                <div className="w-full h-full flex items-center justify-center bg-gray-900" onClick={() => !showInsights && setIsPaused(prev => !prev)}>
                    {currentStory.mediaUrl ? (
                        currentStory.mediaUrl.includes(".mp4") || currentStory.mediaUrl.includes(".webm") ? (
                            <video
                                ref={videoRef}
                                src={currentStory.mediaUrl}
                                className="w-full h-full object-cover"
                                autoPlay={!showInsights && !isPaused && !showDeleteModal}
                                playsInline
                                onLoadedMetadata={(e) => {
                                    const vidDuration = e.target.duration * 1000;
                                    setDuration(Math.min(vidDuration, 30000));
                                }}
                                onEnded={nextStory}
                            />
                        ) : (
                            <img
                                src={currentStory.mediaUrl}
                                className="w-full h-full object-cover"
                            />
                        )
                    ) : (
                        <div className="w-full h-full flex items-center justify-center px-8 text-center bg-gradient-to-br from-indigo-900 to-purple-900">
                            <p className="text-white text-2xl font-serif leading-relaxed">
                                {currentStory.text}
                            </p>
                        </div>
                    )}
                </div>

                {/* Navigation Taps */}
                {!showInsights && (
                    <>
                        <div
                            onClick={(e) => { e.stopPropagation(); prevStory(); }}
                            className="absolute top-0 left-0 w-1/3 h-full z-10"
                        />
                        <div
                            onClick={(e) => { e.stopPropagation(); nextStory(); }}
                            className="absolute top-0 right-0 w-1/3 h-full z-10"
                        />
                    </>
                )}

                {/* --- SWIPE UP HINT --- */}
                {currentUserStories.user._id === user._id && !showInsights && (
                    <div className="absolute bottom-4 left-0 w-full flex flex-col items-center z-20 animate-bounce pointer-events-none opacity-70">
                        <div className="w-6 h-1 bg-white/50 rounded-full mb-1"></div>
                        <span className="text-[10px] text-white/50 font-medium uppercase tracking-widest">Swipe Up</span>
                    </div>
                )}

                {/* --- INSIGHTS PANEL --- */}
                <div
                    className={`absolute bottom-0 left-0 w-full bg-[#111827] rounded-t-3xl transition-transform duration-300 ease-out z-40 flex flex-col ${showInsights ? "translate-y-0" : "translate-y-full"}`}
                    style={{ height: "50%" }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Handle */}
                    <div className="w-full flex justify-center py-3 cursor-pointer" onClick={() => setShowInsights(false)}>
                        <div className="w-12 h-1.5 bg-gray-600 rounded-full"></div>
                    </div>

                    <div className="px-6 flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
                        <div className="flex items-center gap-2 text-white">
                            <IoEyeSharp className="text-xl" />
                            <span className="font-bold text-lg">
                                {currentStory.viewers?.filter(v => v._id !== currentUserStories.user._id).length || 0}
                            </span>
                            <span className="text-gray-400 text-sm">Viewers</span>
                        </div>
                        <button
                            onClick={handleDelete}
                            className="p-2 hover:bg-red-500/10 rounded-full transition text-gray-400 hover:text-red-500"
                        >
                            <MdDelete size={24} />
                        </button>
                    </div>

                    {/* Viewers List */}
                    <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-hide">
                        {currentStory.viewers?.filter(v => v._id !== currentUserStories.user._id).length > 0 ? (
                            currentStory.viewers
                                .filter(v => v._id !== currentUserStories.user._id)
                                .map((viewer, idx) => (
                                    <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                                        <img src={viewer.profilePic?.url || "https://placehold.co/100"} className="w-10 h-10 rounded-full bg-gray-700" />
                                        <span className="text-white font-medium">{viewer.name || "Unknown User"}</span>
                                    </div>
                                ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                <IoEyeSharp className="text-4xl mb-2 opacity-20" />
                                <p className="text-sm">No viewers yet</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* --- DELETE CONFIRMATION MODAL --- */}
            {showDeleteModal && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-[#1F2937] w-full max-w-xs rounded-2xl p-6 shadow-2xl border border-gray-700 text-center ring-1 ring-white/10 animate-in zoom-in-95 duration-200">
                        <h3 className="text-white font-bold text-lg mb-2">Delete Story?</h3>
                        <p className="text-gray-400 text-sm mb-6">This action cannot be undone.</p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-2 rounded-xl bg-gray-800 text-white font-semibold hover:bg-gray-700 border border-gray-600 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/50 font-semibold hover:bg-red-500 hover:text-white transition"
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoryViewer;
