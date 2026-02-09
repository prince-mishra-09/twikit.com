import React, { useState, useRef } from "react";
import { PostData } from "../context/PostContext";
import { StoriesData } from "../context/StoriesContext"; // Import StoriesData
import { LoadingAnimation } from "./Loading";
import { AiOutlineClose } from "react-icons/ai";
import StoryEditor from "./StoryEditor";

const CreatePostModal = ({ setShow, initialTab = "post" }) => { // Accept initialTab
    const [type, setType] = useState(initialTab); // "post" or "reel" or "story"
    const [caption, setCaption] = useState("");
    const [file, setFile] = useState("");
    const [filePrev, setFilePrev] = useState("");

    const { addPost, addLoading, uploadProgress } = PostData();
    const { addStory, loading: storyLoading } = StoriesData(); // Get addStory
    const fileInputRef = useRef(null);
    const [showStoryEditor, setShowStoryEditor] = useState(initialTab === "story"); // Start true if initial is story

    const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
    const [error, setError] = useState("");

    // Lock Body Scroll
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    const changeFileHandler = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation
        setError("");
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (type === "post" && !isImage) {
            return setError("Please select an image for your post");
        }
        if (type === "reel" && !isVideo) {
            return setError("Please select a video for your reel");
        }
        if (file.size > 50 * 1024 * 1024) {
            return setError("File size too large (max 50MB)");
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onloadend = () => {
            setFilePrev(reader.result);
            setFile(file);
            if (type === "story") {
                setShowStoryEditor(true);
            }
        };
    };

    const handleClose = () => {
        if (file || caption.trim() !== "") {
            setShowConfirmDiscard(true);
        } else {
            setShow(false);
        }
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        const formdata = new FormData();

        formdata.append("caption", caption);
        formdata.append("file", file);
        if (type === "story") {
            // This part is now handled by StoryEditor save
            return;
        }

        // We pass a custom setFile/setCaption to clear the form, 
        // but we also want to close the modal on success.
        // The original addPost takes setters. We can wrap them.

        // Fire and forget - let Context handle the upload in background
        addPost(formdata, () => { }, () => { }, () => { }, type);
        setShow(false);
    };

    return (
        <>
            {showStoryEditor && type === "story" ? (
                <StoryEditor
                    file={file}
                    type={type}
                    onCancel={() => {
                        // User wants to go back to "Home Screen" (Close Modal)
                        setShowStoryEditor(false);
                        setShow(false); // CLOSE MODAL
                        setType("post");
                        setFile("");
                        setFilePrev("");
                    }}
                    onSave={async (processedFile) => {
                        const formdata = new FormData();
                        formdata.append("file", processedFile);
                        // If processedFile is the BAKED image, we don't need text caption separately?
                        // The text is IN the image.
                        // But if video, we might have text separate?
                        // For now, simplify: Baked image contains everything.

                        await addStory(formdata, setFile, setCaption, setType);
                        setShowStoryEditor(false);
                        setShow(false);
                    }}
                />
            ) : (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)] p-4">
                    <div className="w-full max-w-[630px] bg-[#111827] border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">

                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                            <h2 className="text-white font-semibold text-lg">Create New</h2>
                            <button
                                onClick={handleClose}
                                className="text-gray-400 hover:text-white transition p-1 hover:bg-white/10 rounded-full"
                            >
                                <AiOutlineClose size={24} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">

                            {/* Type Switcher */}
                            <div className="flex bg-[#0B0F14] rounded-lg p-1 mb-4 border border-white/5 shrink-0">
                                <button
                                    onClick={() => { setType("post"); setFile(""); setFilePrev(""); }}
                                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === "post" ? "bg-[#1f2937] text-white shadow" : "text-gray-400 hover:text-gray-200"}`}
                                >
                                    Post
                                </button>
                                <button
                                    onClick={() => { setType("reel"); setFile(""); setFilePrev(""); }}
                                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === "reel" ? "bg-[#1f2937] text-white shadow" : "text-gray-400 hover:text-gray-200"}`}
                                >
                                    Reel
                                </button>
                                <button
                                    onClick={() => { setType("story"); setShowStoryEditor(true); setFile(""); setFilePrev(""); }}
                                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === "story" ? "bg-[#1f2937] text-white shadow" : "text-gray-400 hover:text-gray-200"}`}
                                >
                                    Story
                                </button>
                            </div>

                            <form onSubmit={submitHandler} className="flex flex-col gap-4">
                                {/* File Input Area */}
                                <div
                                    onClick={() => fileInputRef.current.click()}
                                    className="cursor-pointer rounded-xl border-2 border-dashed border-white/10 bg-[#0B0F14] text-gray-400 flex items-center justify-center min-h-[250px] hover:border-indigo-500/50 hover:bg-[#0B0F14]/50 transition group overflow-hidden"
                                >
                                    {filePrev ? (
                                        <div className="relative w-full h-[300px] bg-black rounded-lg overflow-hidden flex items-center justify-center">
                                            {type === "post" ? (
                                                <img
                                                    src={filePrev}
                                                    alt="preview"
                                                    className="max-h-full max-w-full object-contain"
                                                />
                                            ) : (
                                                <video
                                                    src={filePrev}
                                                    controls
                                                    className="max-h-full max-w-full"
                                                />
                                            )}
                                            {/* Change Image Overlay */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                <span className="text-white font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Click to change</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition">
                                            <span className="text-4xl">
                                                {type === "post" ? "📷" : type === "reel" ? "🎥" : "⏱️"}
                                            </span>
                                            <span className="text-sm font-medium text-gray-400">
                                                Click to upload {type}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept={type === "post" ? "image/*" : type === "reel" ? "video/*" : "image/*,video/*"}
                                    onChange={changeFileHandler}
                                    required={!file}
                                />

                                {/* Caption */}
                                <textarea
                                    rows={3}
                                    placeholder={`Write a caption for your ${type}...`}
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-[#0B0F14] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition resize-none custom-scrollbar"
                                />

                                {/* Error Message */}
                                {error && (
                                    <p className="text-xs text-red-500/90 text-center font-medium bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                                        {error}
                                    </p>
                                )}

                                {/* Privacy Indicator */}
                                <div className="flex items-center gap-1.5 px-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80"></div>
                                    <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                                        Shared with: Public
                                    </p>
                                </div>

                                {/* Submit */}
                                <button
                                    disabled={addLoading || error || !file}
                                    className="w-full py-3 rounded-xl text-white font-medium bg-indigo-600/90 hover:bg-indigo-600 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/10"
                                >
                                    Share
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Discard Confirmation Modal */}
                    {showConfirmDiscard && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                            <div className="w-full max-w-[280px] bg-[#1F2937] rounded-3xl p-6 shadow-2xl border border-white/10 text-center animate-in zoom-in-95 duration-200">
                                <h3 className="text-white font-bold text-lg mb-2">Discard draft?</h3>
                                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                    Your reflection will be lost.
                                </p>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => setShow(false)}
                                        className="w-full py-3 rounded-xl bg-red-500/10 text-red-500 font-semibold hover:bg-red-500/20 transition active:scale-95"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        onClick={() => setShowConfirmDiscard(false)}
                                        className="w-full py-3 rounded-xl text-white font-medium hover:bg-white/5 transition"
                                    >
                                        Keep writing
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default CreatePostModal;
