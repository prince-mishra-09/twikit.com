import React, { useState, useRef } from "react";
import { PostData } from "../context/PostContext";
import { LoadingAnimation } from "./Loading";
import { AiOutlineClose } from "react-icons/ai";

const CreatePostModal = ({ setShow }) => {
    const [type, setType] = useState("post"); // "post" or "reel"
    const [caption, setCaption] = useState("");
    const [file, setFile] = useState("");
    const [filePrev, setFilePrev] = useState("");

    const { addPost, addLoading } = PostData();
    const fileInputRef = useRef(null);

    const changeFileHandler = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onloadend = () => {
            setFilePrev(reader.result);
            setFile(file);
        };
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        const formdata = new FormData();

        formdata.append("caption", caption);
        formdata.append("file", file);

        // We pass a custom setFile/setCaption to clear the form, 
        // but we also want to close the modal on success.
        // The original addPost takes setters. We can wrap them.

        await addPost(formdata, setFile, setFilePrev, setCaption, type);
        setShow(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#111827] border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-white font-semibold text-lg">Create New</h2>
                    <button
                        onClick={() => setShow(false)}
                        className="text-gray-400 hover:text-white transition"
                    >
                        <AiOutlineClose size={24} />
                    </button>
                </div>

                {/* content */}
                <div className="p-4">
                    {/* Type Switcher */}
                    <div className="flex bg-[#0B0F14] rounded-lg p-1 mb-4 border border-white/5">
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
                    </div>

                    <form onSubmit={submitHandler} className="flex flex-col gap-4">
                        {/* File Input Area */}
                        <div
                            onClick={() => fileInputRef.current.click()}
                            className="cursor-pointer rounded-xl border-2 border-dashed border-white/10 bg-[#0B0F14] text-gray-400 flex items-center justify-center min-h-[200px] hover:border-indigo-500/50 hover:bg-[#0B0F14]/50 transition group"
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
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition">
                                    <span className="text-4xl">
                                        {type === "post" ? "📷" : "🎥"}
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
                            accept={type === "post" ? "image/*" : "video/*"}
                            onChange={changeFileHandler}
                            required
                        />

                        {/* Caption */}
                        <input
                            type="text"
                            placeholder={`Write a caption for your ${type}...`}
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-[#0B0F14] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition"
                        />

                        {/* Submit */}
                        <button
                            disabled={addLoading}
                            className="w-full py-3 rounded-xl text-white font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                        >
                            {addLoading ? <LoadingAnimation /> : "Share"}
                        </button>

                    </form>
                </div>

            </div>
        </div>
    );
};

export default CreatePostModal;
