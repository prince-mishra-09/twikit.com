import React, { useEffect, useRef, useState } from "react";
import { BsChatFill, BsThreeDotsVertical } from "react-icons/bs";
import { IoHeartOutline, IoHeartSharp } from "react-icons/io5";
import { UserData } from "../context/UserContext";
import { PostData } from "../context/PostContext";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { MdDelete } from "react-icons/md";
import SimpleModal from "./SimpleModal";
import { LoadingAnimation } from "./Loading";
import toast from "react-hot-toast";
import axios from "axios";
import LikeModal from "./LikeModal";
import { SocketData } from "../context/SocketContext";

const PostCard = ({ type, value }) => {
  const { user } = UserData();
  const { likePost, addComment, deletePost, loading, fetchPosts } = PostData();

  const [isLike, setIsLike] = useState(false);
  const [show, setShow] = useState(false);
  const [comment, setComment] = useState("");

  /* ===== REEL STATES ===== */
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showHeart, setShowHeart] = useState(false);

  if (!value) return null;

  const formatDate = value.createdAt ? format(new Date(value.createdAt), "MMMM do") : "Unknown Date";

  useEffect(() => {
    if (value.likes) {
      value.likes.forEach((id) => {
        if (id === user._id) setIsLike(true);
      });
    }
  }, [value, user._id]);

  /* ===== AUTOPLAY REEL ===== */
  useEffect(() => {
    if (type === "reel" && videoRef.current) {
      const playVideo = async () => {
        try {
          await videoRef.current.play();
          setIsPlaying(true);
        } catch (err) {
          console.log("Autoplay blocked:", err);
          setIsPlaying(false);
        }
      };
      playVideo();
    }
  }, [value, type]);

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

        {/* ===== POST / REEL ===== */}
        <div className="relative mt-3">

          {/* ===== REEL VIEW ===== */}
          {type === "reel" && (
            <div
              className="relative"
              onDoubleClick={handleDoubleClick}
            >
              {/* Progress bar */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-black/40 z-10">
                <div
                  className="h-full bg-white"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Heart animation */}
              {showHeart && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <span className="text-red-500 text-7xl animate-ping">❤️</span>
                </div>
              )}

              <video
                ref={videoRef}
                src={value.post.url}
                className="w-full h-[80vh] object-cover rounded-xl"
                loop
                playsInline
                onClick={() => {
                  if (isPlaying) videoRef.current.pause();
                  else videoRef.current.play();
                  setIsPlaying(!isPlaying);
                }}
                onTimeUpdate={() => {
                  const current = videoRef.current.currentTime;
                  const duration = videoRef.current.duration;
                  setProgress((current / duration) * 100);
                }}
              />
            </div>
          )}

          {/* ===== IMAGE POST ===== */}
          {type === "post" && (
            <img
              src={value.post.url}
              alt=""
              className="w-full rounded-xl object-cover"
            />
          )}
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
          <form onSubmit={addCommentHandler} className="mt-3 flex gap-2">
            <input
              type="text"
              className="flex-1 px-3 py-2 rounded-lg bg-[#0B0F14] border border-white/10 text-white"
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button
              type="submit"
              className="bg-indigo-500 text-white px-4 rounded-lg"
            >
              Post
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PostCard;
