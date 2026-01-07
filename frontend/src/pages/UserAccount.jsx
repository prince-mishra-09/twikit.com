import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PostData } from "../context/PostContext";
import PostCard from "../components/PostCard";
import { FaArrowDownLong, FaArrowUp } from "react-icons/fa6";
import axios from "axios";
import { Loading } from "../components/Loading";
import { UserData } from "../context/UserContext";
import Modal from "../components/Modal";
import { SocketData } from "../context/SocketContext";

const UserAccount = ({ user: loggedInUser }) => {
  const { posts, reels } = PostData();
  const { followUser } = UserData();
  const { onlineUsers } = SocketData();
  const params = useParams();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchUser() {
    try {
      const { data } = await axios.get("/api/user/" + params.id);
      setUser(data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
  }, [params.id]);

  const myPosts = posts?.filter((p) => p.owner._id === user?._id);
  const myReels = reels?.filter((r) => r.owner._id === user?._id);

  const [type, setType] = useState("post");
  const [index, setIndex] = useState(0);

  const prevReel = () => index !== 0 && setIndex(index - 1);
  const nextReel = () =>
    index !== myReels.length - 1 && setIndex(index + 1);

  const [followed, setFollowed] = useState(false);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    if (user?.followers?.includes(loggedInUser._id)) {
      setFollowed(true);
      setRequested(false);
    } else if (user?.followRequests?.includes(loggedInUser._id)) {
      setRequested(true);
      setFollowed(false);
    } else {
      setFollowed(false);
      setRequested(false);
    }
  }, [user, loggedInUser._id]);

  // Real-time update for profile stats
  const { socket } = SocketData();
  useEffect(() => {
    if (socket && user && user._id) {
      const handleFollow = (data) => {
        if (data.followingId === user._id) {
          // Optimistically update the followers list to reflect change instantly
          setUser((prev) => {
            const isFollower = prev.followers.includes(data.followerId);
            return {
              ...prev,
              followers: isFollower
                ? prev.followers.filter(id => id !== data.followerId)
                : [...prev.followers, data.followerId]
            };
          });
        }
      };
      socket.on("userFollowed", handleFollow);
      return () => socket.off("userFollowed", handleFollow);
    }
  }, [socket, user?._id]); // improved dependency to user._id

  const followHandler = async () => {
    // Optimistic Logic
    if (followed) {
      setFollowed(false);
      setRequested(false);
    } else if (requested) {
      setRequested(false);
      setFollowed(false);
    } else {
      if (user.isPrivate) {
        setRequested(true);
      } else {
        setFollowed(true);
      }
    }

    const message = await followUser(user._id);

    // Status Logic based on backend message
    if (message === "Follow Request Sent") {
      setRequested(true);
      setFollowed(false);
    } else if (message === "User Followed") {
      setFollowed(true);
      setRequested(false);
    } else if (message === "User Unfollowed") {
      setFollowed(false);
      setRequested(false);
    }
  };

  const [show, setShow] = useState(false);
  const [show1, setShow1] = useState(false);
  const [followersData, setFollowersData] = useState([]);
  const [followingsData, setFollowingsData] = useState([]);

  async function followData() {
    try {
      const { data } = await axios.get("/api/user/followdata/" + user._id);
      setFollowersData(data.followers);
      setFollowingsData(data.followings);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (user) followData();
  }, [user]);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-[#0B0F14] flex flex-col items-center gap-6 pb-24 px-3">

      {show && (
        <Modal value={followersData} title="Followers" setShow={setShow} />
      )}
      {show1 && (
        <Modal value={followingsData} title="Following" setShow={setShow1} />
      )}

      {/* PROFILE CARD */}
      <div className="w-full max-w-xl bg-[#111827]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6 mt-4">

        {/* NAME + GENDER (TOP LEFT, LIKE INSTAGRAM) */}
        <p className="text-white font-semibold text-lg flex items-center gap-2 mb-3">
          {user.name}
          <span className="text-gray-400 text-sm font-normal">
            • {user.gender}
          </span>
          {onlineUsers.includes(user._id) && (
            <span className="text-green-400 text-xs">●</span>
          )}
        </p>

        {/* IMAGE + STATS */}
        <div className="flex items-center gap-6">

          {/* PROFILE IMAGE */}
          <img
            src={user.profilePic.url}
            alt="profile"
            className="w-24 h-24 rounded-full object-cover border border-white/20"
          />

          {/* STATS */}
          <div className="flex flex-1 justify-around text-center">
            <div
              className="cursor-pointer"
              onClick={() => setShow(true)}
            >
              <p className="text-white font-semibold">
                {user.followers.length}
              </p>
              <p className="text-gray-400 text-xs">followers</p>
            </div>

            <div
              className="cursor-pointer"
              onClick={() => setShow1(true)}
            >
              <p className="text-white font-semibold">
                {user.followings.length}
              </p>
              <p className="text-gray-400 text-xs">following</p>
            </div>
          </div>
        </div>

        {/* FOLLOW BUTTON */}
        {user._id !== loggedInUser._id && (
          <button
            onClick={followHandler}
            className={`mt-4 w-full py-2 rounded-lg text-white ${followed ? "bg-red-500" : requested ? "bg-gray-600" : "bg-indigo-500"
              }`}
          >
            {followed ? "Unfollow" : requested ? "Requested" : "Follow"}
          </button>
        )}
      </div>


      {/* TOGGLE */}
      <div className="flex gap-6 bg-[#111827]/90 border border-white/10 rounded-xl px-6 py-2 max-w-xs w-full justify-center">
        <button
          onClick={() => setType("post")}
          className={type === "post" ? "text-indigo-400" : "text-gray-400"}
        >
          Posts
        </button>
        <button
          onClick={() => setType("reel")}
          className={type === "reel" ? "text-indigo-400" : "text-gray-400"}
        >
          Reels
        </button>
      </div>

      {/* POSTS */}
      {type === "post" && (
        <div className="w-full max-w-xl space-y-4">
          {myPosts?.length ? (
            myPosts.map((e) => (
              <PostCard type="post" value={e} key={e._id} />
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No posts yet</p>
          )}
        </div>
      )}

      {/* REELS */}
      {type === "reel" &&
        (myReels?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mx-auto pb-4">
            {myReels.map((reel, i) => (
              <div key={reel._id} className="relative aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden">
                <PostCard type="reel" value={reel} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No reels yet</p>
        ))}
    </div>
  );
};

export default UserAccount;
