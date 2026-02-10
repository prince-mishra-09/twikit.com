import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { PostData } from "../context/PostContext";
import PostCard from "../components/PostCard";
import { FaArrowDownLong, FaArrowUp, FaEllipsisVertical } from "react-icons/fa6"; // Updated Import
import { IoClose } from "react-icons/io5"; // Added import
import axios from "axios";

import { SkeletonProfile } from "../components/Skeleton";
import { UserData } from "../context/UserContext";
import Modal from "../components/Modal";
import { SocketData } from "../context/SocketContext";
import { useNavigate } from "react-router-dom"; // Added for redirect

import { StoriesData } from "../context/StoriesContext";
import { ChatData } from "../context/ChatContext"; // Added import
import StoryViewer from "../components/StoryViewer";
import StoryAvatar from "../components/StoryAvatar";
import ShareModal from "../components/ShareModal";
import { BsShare } from "react-icons/bs";

const UserAccount = ({ user: loggedInUser }) => {
  const { } = PostData();
  const { stories, fetchUserStories, fetchStories } = StoriesData();
  const { followUser, setShowLoginPrompt } = UserData();
  const { createChat, setSelectedChat } = ChatData(); // Added
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
  const [userPosts, setUserPosts] = useState([]);
  const [userReels, setUserReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedModal, setFeedModal] = useState(null); // Added state

  async function fetchData() {
    setLoading(true);
    console.log(`[Profile Debug] Fetching data for user ID: ${params.id}`);
    const startTime = Date.now();

    try {
      // Parallel fetch for speed (User + Posts only)
      console.log("[Profile Debug] Starting parallel fetch (User + Posts)...");
      const userPromise = axios.get("/api/user/" + params.id);
      const postsPromise = axios.get("/api/post/user/" + params.id + "?type=post");

      const [userRes, postsRes] = await Promise.allSettled([userPromise, postsPromise]);

      const endTime = Date.now();
      console.log(`[Profile Debug] Parallel fetch completed in ${endTime - startTime}ms`);

      if (userRes.status === "fulfilled") {
        console.log("[Profile Debug] User fetch SUCCESS", userRes.value.data);
        setUser(userRes.value.data);
      } else {
        console.error("[Profile Debug] User fetch FAILED", userRes.reason);
        if (userRes.reason.response) {
          console.error("[Profile Debug] Backend Response Status:", userRes.reason.response.status);
          console.error("[Profile Debug] Backend Response Data:", userRes.reason.response.data);
        }
      }

      if (postsRes.status === "fulfilled") {
        console.log(`[Profile Debug] Posts fetch SUCCESS. Count: ${postsRes.value.data.posts?.length}`);
        setUserPosts(postsRes.value.data.posts);
      } else {
        console.error("[Profile Debug] Posts fetch FAILED", postsRes.reason);
        setUserPosts([]);
      }
    } catch (error) {
      console.error("[Profile Debug] Critical Error in fetchData:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [params.id]);

  // Fetch User's Posts directly (Privacy Aware)
  // Fetch User's Posts directly (Privacy Aware)
  // Fetch User's Posts directly (Privacy Aware)
  async function fetchUserPosts(id) {
    const targetId = id || user?._id;
    if (!targetId) return;
    try {
      const { data } = await axios.get("/api/post/user/" + targetId + "?type=post");
      setUserPosts(data.posts);
      // If we are already on reels tab, we might want to refresh reels too?
      // For now, let's just refresh posts as that's the primary view.
      // If we want to refresh everything on Follow, we can do that too.
      if (type === 'reel') fetchUserReels(targetId);
    } catch (error) {
      setUserPosts([]);
    }
  }

  async function fetchUserReels(id) {
    const targetId = id || user?._id || params.id;
    if (!targetId) return;
    try {
      const { data } = await axios.get("/api/post/user/" + targetId + "?type=reel");
      setUserReels(data.reels);
    } catch (error) {
      console.log(error);
    }
  }


  // Restore local state variables


  // Restore local state variables
  // Restore local state variables
  const myPosts = userPosts;
  const myReels = userReels;
  const [type, setType] = useState("post");

  // Fetch Reels when tab changes
  useEffect(() => {
    if (type === "reel" && userReels.length === 0) {
      fetchUserReels();
    }
  }, [type]);

  const [index, setIndex] = useState(0);

  const prevReel = () => index !== 0 && setIndex(index - 1);
  const nextReel = () =>
    index !== myReels.length - 1 && setIndex(index + 1);

  // Initialize state from props/context directly to avoid flicker
  // Use params.id immediately instead of waiting for user object
  const [followed, setFollowed] = useState(() => {
    if (!loggedInUser) return false;
    // Check against params.id since user might be null initially
    return loggedInUser.followings?.includes(params.id);
  });

  const [requested, setRequested] = useState(() => {
    // Note: requests usually need the user object, but we can't do much about that
    // without the user object or a separate requests list in loggedInUser.
    // However, if we visited this page before, user might be in cache.
    if (user) return user.followRequests?.includes(loggedInUser?._id);
    return false;
  });

  // Restore useEffect to fetch posts when user or follow status changes
  // Restore useEffect to fetch posts when user or follow status changes
  useEffect(() => {
    fetchUserPosts(params.id);
  }, [params.id, followed, requested]);

  // Keep state in sync if props change (e.g. navigation to another user)
  useEffect(() => {
    if (!loggedInUser) return;
    // Use params.id for faster check if user object isn't loaded yet
    const targetId = user?._id || params.id;
    setFollowed(loggedInUser.followings?.includes(targetId));

    if (user) {
      setRequested(user.followRequests?.includes(loggedInUser._id));
    }
  }, [loggedInUser, user, params.id]); // Added params.id dependency

  const followHandler = async () => {
    if (!loggedInUser) {
      setShowLoginPrompt(true);
      return;
    }
    // 1. STORE PREVIOUS STATE
    const prevFollowed = followed;
    const prevRequested = requested;
    const prevFollowers = user.followers;

    // 2. OPTIMISTIC UPDATE
    if (followed) {
      setFollowed(false);
      setRequested(false);
      // Optimistic: Remove from followers
      setUser(prev => ({ ...prev, followers: prev.followers.filter(id => id !== loggedInUser._id) }));
    } else if (requested) {
      setRequested(false);
      setFollowed(false);
    } else {
      if (user.isPrivate) {
        setRequested(true);
      } else {
        setFollowed(true);
        // Optimistic: Add to followers
        setUser(prev => ({ ...prev, followers: [...prev.followers, loggedInUser._id] }));
      }
    }

    try {
      const message = await followUser(user?._id);

      // 3. FINAL SYNC FROM BACKEND MESSAGE
      if (message === "Follow Request Sent") {
        setRequested(true);
        setFollowed(false);
        // Revert follower count change if it was private (request sent)
        setUser(prev => ({ ...prev, followers: prevFollowers }));
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
        setUser(prev => ({ ...prev, followers: prevFollowers }));
      }
    } catch (error) {
      console.error("Follow error:", error);
      setFollowed(prevFollowed);
      setRequested(prevRequested);
      setUser(prev => ({ ...prev, followers: prevFollowers }));
      toast.error("An error occurred. Please try again.");
    }
  };

  const messageHandler = async () => {
    if (!loggedInUser) return setShowLoginPrompt(true);
    const chat = await createChat(user._id);
    setSelectedChat(chat);
    navigate("/chat");
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

  if (loading) return <SkeletonProfile />;

  if (!user) return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 text-center">
      <p className="text-[var(--text-secondary)] text-lg mb-4">User not found</p>
      <button onClick={() => navigate(-1)} className="text-[var(--accent)] font-semibold hover:underline">Go Back</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center gap-2 pb-24 px-1">

      {show && (
        <Modal value={followersData} title="Followers" setShow={setShow} />
      )}
      {show1 && (
        <Modal value={followingsData} title="Following" setShow={setShow1} />
      )}

      {/* PROFILE CARD */}
      <div className="w-full max-w-[630px] bg-[var(--bg-primary)] border-b border-[var(--border)] px-4 pb-6 pt-4">

        {/* NAME + GENDER (TOP LEFT, LIKE INSTAGRAM) */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-col">
            <p className="text-[var(--text-primary)] font-semibold text-lg flex items-center gap-2">
              {user.name}
              {/* <span className="text-[var(--text-secondary)] text-sm font-normal">
                • {user.gender}
              </span> */}
              {onlineUsers.includes(user._id) && (
                <span className="text-green-400 text-xs">●</span>
              )}
            </p>
            <p className="text-[var(--text-secondary)] text-sm">@{user.username}</p>
          </div>

          {/* MENU BUTTON - Hide if own profile */}
          {user._id !== loggedInUser?._id && (
            <div className="relative z-10">
              <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="text-[var(--text-primary)] p-2 rounded-full hover:bg-[var(--bg-primary)]/10">
                <FaEllipsisVertical />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-[var(--card-bg)] rounded-xl shadow-2xl border border-[var(--border)] overflow-hidden z-[50]">
                  <button onClick={handleBlock} className="w-full text-left px-4 py-3 text-red-500 hover:bg-[var(--bg-primary)]/10 font-medium text-sm">
                    Block User
                  </button>
                  <button className="w-full text-left px-4 py-3 text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]/10 text-sm">
                    Report
                  </button>
                  <button
                    onClick={() => {
                      setShareModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]/10 text-sm flex items-center gap-2 border-t border-[var(--border)]"
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
              <p className="text-[var(--text-primary)] font-semibold">
                {myPosts?.length || 0}
              </p>
              <p className="text-[var(--text-secondary)] text-xs">posts</p>
            </div>

            <div
              className="cursor-pointer"
              onClick={() => setShow(true)}
            >
              <p className="text-[var(--text-primary)] font-semibold">
                {user.followers.length}
              </p>
              <p className="text-[var(--text-secondary)] text-xs">followers</p>
            </div>

            <div
              className="cursor-pointer"
              onClick={() => setShow1(true)}
            >
              <p className="text-[var(--text-primary)] font-semibold">
                {user.followings.length}
              </p>
              <p className="text-[var(--text-secondary)] text-xs">following</p>
            </div>
          </div>
        </div>

        {/* FOLLOW & MESSAGE BUTTONS */}
        {(!loggedInUser || user._id !== loggedInUser._id) && (
          <div className="flex gap-2 mt-4 w-full">
            <button
              onClick={() => {
                if (!loggedInUser) {
                  followHandler();
                } else {
                  followHandler();
                }
              }}
              className={`flex-1 py-2 rounded-lg transition-colors ${followed ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : requested ? "bg-gray-600 text-white" : "bg-[var(--accent)] text-[var(--text-on-accent)] hover:bg-[var(--accent)]/90"
                }`}
            >
              {followed ? "Unfollow" : requested ? "Requested" : "Follow"}
            </button>
            <button
              onClick={messageHandler}
              className="flex-1 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              Message
            </button>
          </div>
        )}
      </div>


      {/* TOGGLE */}
      <div className="flex w-full max-w-[630px] border-b border-[var(--border)] mt-2">
        <button
          onClick={() => setType("post")}
          className={`flex-1 pb-3 text-sm font-semibold transition-colors relative ${type === "post" ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
        >
          Posts
          {type === "post" && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--accent)] rounded-t-full" />}
        </button>
        <button
          onClick={() => setType("reel")}
          className={`flex-1 pb-3 text-sm font-semibold transition-colors relative ${type === "reel" ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
        >
          Reels
          {type === "reel" && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--accent)] rounded-t-full" />}
        </button>
      </div>

      {/* POSTS */}
      {type === "post" && (
        <div className="w-full max-w-[630px]">
          {myPosts?.length ? (
            <div className="grid grid-cols-3 gap-1">
              {myPosts.map((e, i) => (
                <PostCard
                  type="post"
                  value={e}
                  key={e._id}
                  isGrid={true}
                  onClick={() => setFeedModal({ posts: myPosts, index: i })}
                />
              ))}
            </div>
          ) : (
            <p className="text-[var(--text-secondary)] text-center py-4">No posts yet</p>
          )}
        </div>
      )}

      {/* REELS */}
      {type === "reel" &&
        (myReels?.length ? (
          <div className="grid grid-cols-3 gap-1 w-full max-w-[630px] mx-auto pb-4">
            {myReels.map((reel, i) => (
              <div key={reel._id} className="relative aspect-[9/16] bg-[var(--bg-secondary)] rounded-lg overflow-hidden">
                <PostCard
                  type="reel"
                  value={reel}
                  isGrid={true}
                  onClick={() => setFeedModal({ posts: myReels, index: i })}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--text-secondary)] text-center py-4">No reels yet</p>
        ))}

      {/* Story Viewer Overlay */}
      {showStoryViewer && activeStory && (
        <StoryViewer
          stories={[activeStory]}
          initialIndex={0}
          onClose={() => setShowStoryViewer(false)}
        />
      )}
      {/* Feed Modal */}
      {feedModal && (
        <FeedModal
          posts={feedModal.posts}
          initialIndex={feedModal.index}
          onClose={() => setFeedModal(null)}
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

// Feed Modal - copy from Account.jsx
const FeedModal = ({ posts, initialIndex, onClose }) => {
  const modalRef = React.useRef(null);
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  useEffect(() => {
    // Scroll to the initial post on mount
    if (modalRef.current) {
      setTimeout(() => {
        const element = document.getElementById(`feed-post-${initialIndex}`);
        if (element) {
          element.scrollIntoView({ behavior: "auto" });
        }
      }, 100);
    }
  }, [initialIndex]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md overflow-y-auto custom-scrollbar flex justify-center">
      <button
        onClick={onClose}
        className="fixed top-4 right-4 text-white/70 hover:text-white text-3xl z-[70] p-2 bg-black/20 rounded-full backdrop-blur-sm transition-colors"
      >
        <IoClose />
      </button>

      <div className="w-full max-w-md md:max-w-lg py-10 min-h-screen" ref={modalRef}>
        {posts.map((post, index) => (
          <div
            key={post._id}
            id={`feed-post-${index}`}
            className={`mb-6 last:mb-20 ${post.type === 'reel' ? 'aspect-[9/16] w-full max-w-[350px] mx-auto' : ''}`}
          >
            <PostCard type={post.type || "post"} value={post} />
          </div>
        ))}
        <div className="h-20 text-center text-white/50 text-sm">End of list</div>
      </div>
    </div>
  );
};
