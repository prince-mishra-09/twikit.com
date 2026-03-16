import React, { useState, useRef } from "react";
import { PostData } from "../context/PostContext";
import { StoriesData } from "../context/StoriesContext"; // Import StoriesData
import { LoadingAnimation } from "./Loading";
import { AiOutlineClose } from "react-icons/ai";
import ReelsIcon from "./ReelsIcon";
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

    const [blinkCaption, setBlinkCaption] = useState(false);
    const [blinkFile, setBlinkFile] = useState(false);

    const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
    const [error, setError] = useState("");

    const triggerBlink = (setter) => {
        setter(true);
        setTimeout(() => setter(false), 2000);
    };

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

        // VALIDATION
        if (!file) {
            triggerBlink(setBlinkFile);
            return setError("Please select a file to share.");
        }

        if (type !== 'story' && !caption.trim()) {
            triggerBlink(setBlinkCaption);
            return setError("Please write a caption.");
        }

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
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[var(--overlay)] backdrop-blur-md p-4">
                    <div className="w-full max-w-[630px] bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">

                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] shrink-0">
                            <h2 className="text-[var(--text-primary)] font-semibold text-lg">Create New</h2>
                            <button
                                onClick={handleClose}
                                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition p-1 hover:bg-[var(--bg-secondary)] rounded-full"
                            >
                                <AiOutlineClose size={24} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">

                            {/* Type Switcher */}
                            <div className="flex bg-[var(--bg-primary)] rounded-lg p-1 mb-4 border border-[var(--border)] shrink-0">
                                <button
                                    onClick={() => { setType("post"); setFile(""); setFilePrev(""); }}
                                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === "post" ? "bg-[var(--accent)] text-[var(--text-on-accent)] shadow" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                                >
                                    Post
                                </button>
                                <button
                                    onClick={() => { setType("reel"); setFile(""); setFilePrev(""); }}
                                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === "reel" ? "bg-[var(--accent)] text-[var(--text-on-accent)] shadow" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                                >
                                    Reel
                                </button>
                                <button
                                    onClick={() => { setType("story"); setShowStoryEditor(true); setFile(""); setFilePrev(""); }}
                                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === "story" ? "bg-[var(--accent)] text-[var(--text-on-accent)] shadow" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                                >
                                    Story
                                </button>
                            </div>

                            <form onSubmit={submitHandler} className="flex flex-col gap-4 z-[1000]">
                                {/* File Input Area */}
                                <div
                                    onClick={() => { setBlinkFile(false); fileInputRef.current.click(); }}
                                    className={`cursor-pointer rounded-xl border-2 border-dashed ${blinkFile ? "border-[var(--danger)] animate-pulse bg-[var(--danger)]/5 shadow-[0_0_15px_var(--danger)]" : "border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-primary)]/50"} text-[var(--text-secondary)] flex items-center justify-center min-h-[250px] transition-all group overflow-hidden duration-300`}
                                >
                                    {filePrev ? (
                                        <div className="relative w-full aspect-[3/4] bg-black rounded-lg overflow-hidden flex items-center justify-center">
                                            {type === "post" ? (
                                                <img
                                                    src={filePrev}
                                                    alt="preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <video
                                                    src={filePrev}
                                                    controls
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                            {/* Change Image Overlay */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                <span className="text-white font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Click to change</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition">
                                            <span className="text-4xl text-[var(--text-primary)] opacity-80">
                                                {type === "post" ? "📷" : type === "reel" ? <ReelsIcon size={40} /> : "⏱️"}
                                            </span>
                                            <span className="text-sm font-medium text-[var(--text-secondary)]">
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
                                // required={!file} // Manual validation now
                                />

                                {/* Caption */}
                                <textarea
                                    rows={3}
                                    placeholder={`Write a caption for your ${type}...`}
                                    value={caption}
                                    onChange={(e) => { setBlinkCaption(false); setCaption(e.target.value); }}
                                    className={`w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border ${blinkCaption ? "border-[var(--danger)] animate-pulse bg-[var(--danger)]/5 shadow-[0_0_15px_var(--danger)]" : "border-[var(--border)] focus:border-[var(--accent)]/50"} text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none transition-all resize-none custom-scrollbar duration-300`}
                                />

                                {/* Error Message */}
                                {error && (
                                    <p className="text-xs text-[var(--danger)]/90 text-center font-medium bg-[var(--danger)]/10 py-2 rounded-lg border border-[var(--danger)]/20 animate-in fade-in slide-in-from-top-2">
                                        {error}
                                    </p>
                                )}

                                {/* Privacy Indicator */}
                                <div className="flex items-center gap-1.5 px-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]"></div>
                                    <p className="text-[11px] text-[var(--text-secondary)] font-medium uppercase tracking-wider">
                                        Shared with: Public
                                    </p>
                                </div>

                                {/* Submit */}
                                <button
                                    disabled={addLoading}
                                    className="w-full py-3 rounded-xl text-[var(--text-on-accent)] font-medium bg-[var(--accent)] hover:opacity-90 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[var(--accent)]/10"
                                >
                                    Share
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Discard Confirmation Modal */}
                    {showConfirmDiscard && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--overlay)] backdrop-blur-md p-4">
                            <div className="w-full max-w-[280px] bg-[var(--card-bg)] rounded-3xl p-6 shadow-2xl border border-[var(--border)] text-center animate-in zoom-in-95 duration-200">
                                <h3 className="text-[var(--text-primary)] font-bold text-lg mb-2">Discard draft?</h3>
                                <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
                                    Your reflection will be lost.
                                </p>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => setShow(false)}
                                        className="w-full py-3 rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] font-semibold hover:bg-[var(--danger)]/20 transition active:scale-95"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        onClick={() => setShowConfirmDiscard(false)}
                                        className="w-full py-3 rounded-xl text-[var(--text-primary)] font-medium hover:bg-[var(--bg-secondary)] transition"
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
