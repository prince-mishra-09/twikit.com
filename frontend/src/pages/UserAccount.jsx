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

  useEffect(() => {
    if (user?.followers?.includes(loggedInUser._id)) {
      setFollowed(true);
    }
  }, [user, loggedInUser._id]);

  const followHandler = () => {
    setFollowed(!followed);
    followUser(user._id, fetchUser);
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
<div className="w-full max-w-md bg-[#111827]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6 mt-4">

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
      className={`mt-4 w-full py-2 rounded-lg text-white ${
        followed ? "bg-red-500" : "bg-indigo-500"
      }`}
    >
      {followed ? "Unfollow" : "Follow"}
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
      {type === "post" &&
        (myPosts?.length ? (
          myPosts.map((e) => (
            <PostCard type="post" value={e} key={e._id} />
          ))
        ) : (
          <p className="text-gray-500">No posts yet</p>
        ))}

      {/* REELS */}
      {type === "reel" &&
        (myReels?.length ? (
          <div className="flex gap-4 items-center">
            <PostCard type="reel" value={myReels[index]} />
            <div className="flex flex-col gap-4">
              {index !== 0 && (
                <button
                  onClick={prevReel}
                  className="p-3 bg-[#111827] rounded-full text-white"
                >
                  <FaArrowUp />
                </button>
              )}
              {index !== myReels.length - 1 && (
                <button
                  onClick={nextReel}
                  className="p-3 bg-[#111827] rounded-full text-white"
                >
                  <FaArrowDownLong />
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No reels yet</p>
        ))}
    </div>
  );
};

export default UserAccount;
