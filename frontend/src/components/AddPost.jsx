import React, { useState, useRef } from "react";
import { PostData } from "../context/PostContext";
import { LoadingAnimation } from "./Loading";

const AddPost = ({ type }) => {
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

  const submitHandler = (e) => {
    e.preventDefault();

    // Basic Validation
    if (file && file.size > 50 * 1024 * 1024) { // 50MB limit
      return toast.error("File is too large (max 50MB)");
    }

    const formdata = new FormData();
    formdata.append("caption", caption);
    formdata.append("file", file);

    // Fixed argument order: (formdata, setFile, setFilePrev, setCaption, type)
    addPost(formdata, setFile, setFilePrev, setCaption, type);
  };

  return (
    <div className="w-full bg-[#111827]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg p-4">
      <form
        onSubmit={submitHandler}
        className="flex flex-col gap-4"
      >
        {/* Caption */}
        <input
          type="text"
          placeholder="What's on your mind?"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-[#0B0F14] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 transition"
        />

        {/* Media Upload */}
        <div
          onClick={() => fileInputRef.current.click()}
          className="cursor-pointer rounded-xl border border-dashed border-white/20 bg-[#0B0F14] text-gray-400 flex items-center justify-center min-h-[90px] hover:border-indigo-400/50 transition"
        >

          {filePrev ? (
            <>
              {type === "post" ? (
                <img
                  src={filePrev}
                  alt="preview"
                  className="max-h-[300px] rounded-xl object-cover"
                />
              ) : (
                <video
                  src={filePrev}
                  controls
                  controlsList="nodownload"
                  className="max-h-[300px] rounded-xl"
                />
              )}
            </>
          ) : (
            <span className="text-xs text-gray-500">
              Add photo
            </span>

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

        {/* Privacy Indicator */}
        <div className="flex items-center gap-1.5 px-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80"></div>
          <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">
            Shared with: Public
          </p>
        </div>

        {/* Submit Button */}
        <button
          disabled={addLoading}
          className="w-full py-3 rounded-xl text-white font-medium bg-indigo-600/90 hover:bg-indigo-600 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {addLoading ? <LoadingAnimation /> : "Share"}
        </button>
      </form>
    </div>
  );
};

export default AddPost;
