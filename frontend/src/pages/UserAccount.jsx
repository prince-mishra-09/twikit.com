import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PostData } from "../context/PostContext";
import PostCard from "../components/PostCard";
import { FaArrowDownLong, FaArrowUp, FaEllipsisVertical } from "react-icons/fa6"; // Updated Import
import axios from "axios";
import { Loading } from "../components/Loading";
import { UserData } from "../context/UserContext";
import Modal from "../components/Modal";
import { SocketData } from "../context/SocketContext";
import { useNavigate } from "react-router-dom"; // Added for redirect
import { StoriesData } from "../context/StoriesContext";
import StoryViewer from "../components/StoryViewer";
import StoryAvatar from "../components/StoryAvatar";
import ShareModal from "../components/ShareModal";
import { BsShare } from "react-icons/bs";

const UserAccount = ({ user: loggedInUser }) => {
  const { } = PostData();
  const { stories, fetchUserStories, fetchStories } = StoriesData();
  const { followUser, setShowLoginPrompt } = UserData();
  const { onlineUsers } = SocketData();
  const params = useParams();
  const navigate = useNavigate();



  // Redirect to account if checking own profile
  useEffect(() => {
    if (loggedInUser && params.id === loggedInUser._id) {
      navigate("/account");
    }
  }, [params.id, loggedInUser, navigate]);

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

  const [userPosts, setUserPosts] = useState([]);
  const [userReels, setUserReels] = useState([]);

  // Fetch User's Posts directly (Privacy Aware)
  async function fetchUserPosts() {
    if (!user) return;
    try {
      const { data } = await axios.get("/api/post/user/" + user._id);
      setUserPosts(data.posts);
      setUserReels(data.reels);
    } catch (error) {
      // If 403/401 (Private), simply clear the list
      setUserPosts([]);
      setUserReels([]);
    }
  }

  const [followed, setFollowed] = useState(false);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    fetchUserPosts();
  }, [user, followed, requested]); // Refetch if access changes

  // Use local state instead of global context filtering
  const myPosts = userPosts;
  const myReels = userReels;

  const [type, setType] = useState("post");
  const [index, setIndex] = useState(0);

  const prevReel = () => index !== 0 && setIndex(index - 1);
  const nextReel = () =>
    index !== myReels.length - 1 && setIndex(index + 1);

  useEffect(() => {
    if (!loggedInUser) {
      setFollowed(false);
      setRequested(false);
      return;
    }
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
  }, [user, loggedInUser?._id]);

  // Real-time update for profile stats
  const { socket } = SocketData();

  useEffect(() => {
    if (!socket || !user?._id) return;

    const handleFollow = (data) => {
      if (data.followingId === user._id) {
        setUser((prev) => {
          if (!prev) return prev; // Safety check
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
  }, [socket, user?._id]);

  const followHandler = async () => {
    if (!loggedInUser) {
      setShowLoginPrompt(true);
      return;
    }
    // 1. STORE PREVIOUS STATE
    const prevFollowed = followed;
    const prevRequested = requested;

    // 2. OPTIMISTIC UPDATE
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

    try {
      const message = await followUser(user?._id);

      // 3. FINAL SYNC FROM BACKEND MESSAGE
      if (message === "Follow Request Sent") {
        setRequested(true);
        setFollowed(false);
      } else if (message === "User Followed") {
        setFollowed(true);
        setRequested(false);
        fetchStories();
        loadSpecificStory();
      } else if (message === "User Unfollowed") {
        setFollowed(false);
        setRequested(false);
      } else if (!message) {
        // Revert on failure
        setFollowed(prevFollowed);
        setRequested(prevRequested);
      }
    } catch (error) {
      console.error("Follow error:", error);
      setFollowed(prevFollowed);
      setRequested(prevRequested);
      toast.error("An error occurred. Please try again.");
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

  // BLOCKING LOGIC
  const [showMenu, setShowMenu] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const { blockUser } = UserData();
  const [shareModal, setShareModal] = useState(false);

  const handleBlock = () => {
    if (confirm("Are you sure? This user will not be able to find your profile, posts, or story.")) {
      blockUser(user._id, navigate);
    }
    setShowBlock(false);
    setShowMenu(false);
  };

  // Close menu on click outside
  useEffect(() => {
    const closeMenu = () => setShowMenu(false);
    if (showMenu) window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [showMenu]);

  // Story Logic
  // Check main feed first
  let userStoryGroup = stories.find(s => s.user._id === user?._id);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [localStory, setLocalStory] = useState(null);

  // Feature 2: If not in feed, fetch directly (for public access)
  const loadSpecificStory = async () => {
    if (user && !userStoryGroup) {
      const data = await fetchUserStories(user._id);
      if (data) setLocalStory(data);
    }
  };

  useEffect(() => {
    loadSpecificStory();
  }, [user?._id, followed]); // Refetch on follow change too

  const activeStory = userStoryGroup || localStory;

  if (loading) return <Loading />;

  if (!user) return (
    <div className="min-h-screen bg-[#0B0F14] flex flex-col items-center justify-center p-6 text-center">
      <p className="text-gray-400 text-lg mb-4">User not found</p>
      <button onClick={() => navigate(-1)} className="text-indigo-400 font-semibold hover:underline">Go Back</button>
    </div>
  );

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
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-col">
            <p className="text-white font-semibold text-lg flex items-center gap-2">
              {user.name}
              <span className="text-gray-400 text-sm font-normal">
                • {user.gender}
              </span>
              {onlineUsers.includes(user._id) && (
                <span className="text-green-400 text-xs">●</span>
              )}
            </p>
            <p className="text-gray-500 text-sm">@{user.username}</p>
          </div>

          {/* MENU BUTTON - Hide if own profile */}
          {user._id !== loggedInUser?._id && (
            <div className="relative z-10">
              <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="text-white p-2 rounded-full hover:bg-white/10">
                <FaEllipsisVertical />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-[#1F2937] rounded-xl shadow-2xl border border-white/10 overflow-hidden z-[50]">
                  <button onClick={handleBlock} className="w-full text-left px-4 py-3 text-red-500 hover:bg-white/5 font-medium text-sm">
                    Block User
                  </button>
                  <button className="w-full text-left px-4 py-3 text-gray-300 hover:bg-white/5 text-sm">
                    Report
                  </button>
                  <button
                    onClick={() => {
                      setShareModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 text-gray-300 hover:bg-white/5 text-sm flex items-center gap-2 border-t border-white/5"
                  >
                    <BsShare /> Share Profile
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* IMAGE + STATS */}
        <div className="flex items-center gap-6">

          {/* PROFILE IMAGE */}
          <div className="relative">
            <StoryAvatar
              user={user}
              size="w-20 h-20"
              onClick={() => activeStory && setShowStoryViewer(true)}
            />
          </div>

          {/* STATS */}
          <div className="flex flex-1 justify-around text-center">

            {/* POSTS COUNT */}
            <div className="cursor-pointer">
              <p className="text-white font-semibold">
                {myPosts?.length || 0}
              </p>
              <p className="text-gray-400 text-xs">posts</p>
            </div>

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
        {(!loggedInUser || user._id !== loggedInUser._id) && (
          <button
            onClick={() => {
              if (!loggedInUser) {
                // We need setShowLoginPrompt from context
                // But for now, let's just use the prop if we can or get from hook
                followHandler(); // This will eventually need the guard
              } else {
                followHandler();
              }
            }}
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
                <PostCard type="reel" value={reel} isGrid={true} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No reels yet</p>
        ))}

      {/* Story Viewer Overlay */}
      {showStoryViewer && activeStory && (
        <StoryViewer
          stories={[activeStory]}
          initialIndex={0}
          onClose={() => setShowStoryViewer(false)}
        />
      )}
      {/* Share Modal */}
      {user && (
        <ShareModal
          isOpen={shareModal}
          onClose={() => setShareModal(false)}
          content={{
            type: "profile",
            contentId: user._id,
            preview: {
              title: user.name,
              image: user.profilePic?.url,
              username: user.username || user.name
            }
          }}
        />
      )}
    </div>
  );
};

export default UserAccount;
