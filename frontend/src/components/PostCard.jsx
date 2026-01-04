import React, { useEffect, useRef, useState } from "react";
import { BsChatFill } from "react-icons/bs";
import { IoHeartOutline, IoHeartSharp } from "react-icons/io5";
import { UserData } from "../context/UserContext";
import { PostData } from "../context/PostContext";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { MdDelete } from "react-icons/md";
import { SocketData } from "../context/SocketContext";

const PostCard = ({ type, value, isActive }) => {
  const { user } = UserData();
  const { likePost, addComment, deletePost } = PostData();

  const [isLike, setIsLike] = useState(false);
  const [show, setShow] = useState(false);
  const [comment, setComment] = useState("");

  /* ===== REEL STATES ===== */
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showHeart, setShowHeart] = useState(false);

  if (!value) return null;

  const formatDate = value.createdAt ? format(new Date(value.createdAt), "MMMM do") : "Unknown Date";

  useEffect(() => {
    if (value.likes) {
      if (value.likes.includes(user._id)) {
        setIsLike(true);
      } else {
        setIsLike(false);
      }
    }
  }, [value, user._id]);

  /* ===== AUTOPLAY REEL ===== */
  useEffect(() => {
    if (type === "reel" && videoRef.current) {
      if (isActive) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => setIsPlaying(true)).catch((e) => console.log("play blocked", e));
        }
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive, type]);

  const likeHandler = () => {
    setIsLike(!isLike);
    likePost(value._id);
  };

  const handleDoubleClick = () => {
    if (!isLike) likeHandler();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 700);
  };

  const addCommentHandler = (e) => {
    e.preventDefault();
    addComment(value._id, comment, setComment, setShow);
  };

  const deleteHandler = () => deletePost(value._id);

  const { onlineUsers } = SocketData();

  // ===================== REEL RENDER =====================
  if (type === "reel") {
    return (
      <div className="w-full h-full relative group">
        {/* PAUSE OVERLAY */}
        {!isPlaying && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="bg-black/40 p-4 rounded-full backdrop-blur-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}

        {/* VIDEO */}
        <div onClick={() => {
          if (isPlaying) { videoRef.current.pause(); setIsPlaying(false); }
          else { videoRef.current.play(); setIsPlaying(true); }
        }} onDoubleClick={handleDoubleClick} className="w-full h-full cursor-pointer">
          <video
            ref={videoRef}
            src={value.post.url}
            className="w-full h-full object-cover"
            loop
            playsInline
            onTimeUpdate={() => {
              if (videoRef.current) {
                const current = videoRef.current.currentTime;
                const duration = videoRef.current.duration;
                if (duration > 0) setProgress((current / duration) * 100);
              }
            }}
          />
        </div>

        {/* BOTTOM PROGRESS BAR */}
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gray-800/40 z-30">
          <div
            className="h-full bg-indigo-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* RIGHT SIDE ACTIONS */}
        <div className="absolute bottom-16 right-4 flex flex-col gap-6 items-center z-30">
          {/* LIKE */}
          <div className="flex flex-col items-center gap-1">
            <button onClick={likeHandler} className="text-3xl drop-shadow-lg transition-transform active:scale-95">
              {isLike ? <IoHeartSharp className="text-red-500" /> : <IoHeartOutline className="text-white" />}
            </button>
            <span className="text-white text-xs font-medium drop-shadow-md">{value.likes.length}</span>
          </div>

          {/* COMMENT */}
          <div className="flex flex-col items-center gap-1">
            <button onClick={() => setShow(!show)} className="text-3xl text-white drop-shadow-lg transition-transform active:scale-95">
              <BsChatFill />
            </button>
            <span className="text-white text-xs font-medium drop-shadow-md">{value.comments.length}</span>
          </div>

          {/* DELETE (if owner) */}
          {value.owner._id === user._id && (
            <button onClick={deleteHandler} className="text-white text-2xl drop-shadow-lg opacity-80 hover:opacity-100">
              <MdDelete />
            </button>
          )}
        </div>

        {/* BOTTOM LEFT INFO */}
        <div className="absolute bottom-6 left-4 right-16 z-30 text-white pointer-events-none">
          <div className="flex items-center gap-3 mb-3 pointer-events-auto">
            <Link to={`/user/${value.owner._id}`} className="flex items-center gap-2">
              <img src={value.owner?.profilePic?.url} className="w-9 h-9 rounded-full border border-white/20" alt="" />
              <span className="font-semibold text-sm shadow-black drop-shadow-md">{value.owner.name}</span>
            </Link>
            <button className="text-xs border border-white/30 px-3 py-1 rounded-lg backdrop-blur-md hover:bg-white/10 transition">Follow</button>
          </div>
          {value.caption && (
            <p className="text-sm text-gray-100 line-clamp-2 drop-shadow-md">{value.caption}</p>
          )}
        </div>

        {/* COMMENTS MODAL / OVERLAY (Simplified for Reel) */}
        {show && (
          <div className="absolute bottom-0 left-0 w-full bg-black/95 backdrop-blur-md p-4 rounded-t-2xl z-40 max-h-[70vh] flex flex-col transition-transform animate-in slide-in-from-bottom border-t border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold">Comments</h3>
              <button onClick={() => setShow(false)} className="text-gray-400 p-1 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar flex flex-col gap-3">
              {value.comments && value.comments.length > 0 ? (
                value.comments.map((c, i) => (
                  <div key={i} className="flex gap-2 items-start text-white">
                    <div className="text-sm bg-white/5 p-2 rounded-lg rounded-tl-none">
                      <span className="font-bold text-gray-300 mr-2 block text-xs mb-1">{c.name}</span>
                      {c.comment}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center">Be the first to comment</p>
              )}
            </div>
            <form onSubmit={addCommentHandler} className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-4 py-2.5 rounded-full bg-white/10 text-white focus:outline-none placeholder:text-gray-500 text-sm border border-transparent focus:border-indigo-500/50"
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button type="submit" className="text-indigo-400 font-semibold text-sm px-2 hover:text-indigo-300">Post</button>
            </form>
          </div>
        )}
      </div>
    );
  }

  // ===================== POST RENDER =====================
  return (
    <div className="bg-[#0B0F14] flex items-center justify-center py-6">
      <div className="bg-[#111827]/90 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-xl w-full max-w-md">

        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between">
          <Link
            to={`/user/${value.owner._id}`}
            className="flex items-center gap-2"
          >
            <img
              src={value.owner?.profilePic?.url}
              className="w-9 h-9 rounded-full"
              alt=""
            />
            <div>
              <p className="text-white font-medium text-sm">
                {value.owner.name}
              </p>
              <p className="text-gray-400 text-xs">{formatDate}</p>
            </div>
            {onlineUsers.includes(value.owner._id) && (
              <span className="ml-1 w-2 h-2 bg-green-400 rounded-full" />
            )}
          </Link>

          {value.owner._id === user._id && (
            <button
              onClick={deleteHandler}
              className="text-red-400 text-lg"
            >
              <MdDelete />
            </button>
          )}
        </div>

        {/* ===== CAPTION ===== */}
        {value.caption && (
          <p className="text-gray-200 text-sm mt-2">{value.caption}</p>
        )}

        {/* ===== POST IMAGE ===== */}
        <div className="relative mt-3">
          <img
            src={value.post.url}
            alt=""
            className="w-full rounded-xl object-cover"
          />
        </div>

        {/* ===== ACTIONS ===== */}
        <div className="flex justify-between items-center mt-3 text-gray-400">
          <div className="flex items-center gap-3">
            <button
              onClick={likeHandler}
              className="text-2xl text-red-500"
            >
              {isLike ? <IoHeartSharp /> : <IoHeartOutline />}
            </button>
            <button>{value.likes.length} likes</button>
          </div>

          <button
            onClick={() => setShow(!show)}
            className="flex items-center gap-1"
          >
            <BsChatFill />
            {value.comments.length}
          </button>
        </div>

        {/* ===== COMMENTS ===== */}
        {show && (
          <div className="mt-3">
            <div className="max-h-52 overflow-y-auto mb-3 custom-scrollbar flex flex-col gap-2">
              {value.comments && value.comments.length > 0 ? (
                value.comments.map((c, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="bg-white/10 p-2 rounded-lg rounded-tl-none text-xs text-gray-200">
                      <span className="font-bold block text-indigo-400 mb-0.5">{c.name}</span>
                      {c.comment}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-2">
                  Be the first one to comment ✨
                </p>
              )}
            </div>

            <form onSubmit={addCommentHandler} className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 rounded-lg bg-[#0B0F14] border border-white/10 text-white focus:outline-none focus:border-indigo-500 transaction"
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-lg transition"
              >
                Post
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard;
