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
    const formdata = new FormData();

    formdata.append("caption", caption);
    formdata.append("file", file);
    addPost(formdata, setFile, setCaption, setFilePrev, type);
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
  className="cursor-pointer rounded-xl border border-dashed border-white/20 bg-[#0B0F14] text-gray-400 flex items-center justify-center min-h-[90px] hover:border-indigo-400 transition"
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

        {/* Submit Button */}
        <button
          disabled={addLoading}
          className="w-full py-3 rounded-xl text-white font-medium bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-90 active:scale-[0.98] transition disabled:opacity-60"
        >
          {addLoading ? <LoadingAnimation /> : "Post"}
        </button>
      </form>
    </div>
  );
};

export default AddPost;
