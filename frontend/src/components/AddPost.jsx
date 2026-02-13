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
    <div className="w-full bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-lg p-4">
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
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent)] transition"
        />

        {/* Media Upload */}
        <div
          onClick={() => fileInputRef.current.click()}
          className="cursor-pointer rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] flex items-center justify-center aspect-[3/4] hover:border-[var(--accent)]/50 transition overflow-hidden"
        >

          {filePrev ? (
            <>
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
                  controlsList="nodownload"
                  className="w-full h-full object-cover"
                />
              )}
            </>
          ) : (
            <span className="text-xs text-[var(--text-secondary)]">
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
          <p className="text-[11px] text-[var(--text-secondary)] font-medium uppercase tracking-wider">
            Shared with: Public
          </p>
        </div>

        {/* Submit Button */}
        <button
          disabled={addLoading}
          className="w-full py-3 rounded-xl text-[var(--text-on-accent)] font-medium bg-[var(--accent)] hover:opacity-90 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {addLoading ? <LoadingAnimation /> : "Share"}
        </button>
      </form>
    </div>
  );
};

export default AddPost;
