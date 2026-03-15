import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UserData } from "../context/UserContext";
import { isSameId, includesId } from "../utils/idUtils";
import { PostData } from "../context/PostContext";
import PostCard from "../components/PostCard";
import { FaArrowDownLong, FaArrowUp, FaArrowLeft } from "react-icons/fa6";
import { IoMenu, IoClose, IoSparklesOutline, IoLockClosedOutline, IoVolumeOffOutline, IoBanOutline, IoShieldCheckmarkOutline } from "react-icons/io5";
import { BsGrid3X3, BsShare, BsBookmark } from "react-icons/bs";
import ReelsIcon from "../components/ReelsIcon";
import Modal from "../components/Modal";
import axios from "axios";

import { SkeletonProfile, SkeletonPost } from "../components/Skeleton";
import { CiEdit } from "react-icons/ci";
import toast from "react-hot-toast";
import { FiEdit2 } from "react-icons/fi";
import { StoriesData } from "../context/StoriesContext";
import StoryViewer from "../components/StoryViewer";
import CreatePostModal from "../components/CreatePostModal";

import StoryAvatar from "../components/StoryAvatar";
import { AiOutlinePlus } from "react-icons/ai";
import ShareModal from "../components/ShareModal";
import ThemeModal from "../components/ThemeModal";
import { getOptimizedImg } from "../utils/imagekit";
import { RiRecordCircleFill } from "react-icons/ri";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { useTheme } from "../context/ThemeContext";

const Account = ({ user }) => {
  const navigate = useNavigate();
  const { logoutUser, updateProfilePic, updateProfileName, unmuteUser, togglePrivacy, removeFollower, unblockUser, user: loggedInUser, followUser, toggleOnlineStatus, toggleLastSeen } = UserData();
  const { posts, reels, loading } = PostData();
  const { stories } = StoriesData();
  const { cycleTheme } = useTheme();

  // Story Logic
  const myStoryGroup = stories.find(s => isSameId(s.user?._id, user._id));
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [showCreateStory, setShowCreateStory] = useState(false);

  // Independent Posts State
  const [myPosts, setMyPosts] = useState([]);
  const [myReels, setMyReels] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [postPage, setPostPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [hasMoreReels, setHasMoreReels] = useState(true);

  const fetchMyPosts = async (page = 1) => {
    if (page === 1) setLoadingPosts(true);
    else setLoadingMorePosts(true);
    
    try {
      // Fetch both post and reel types combined for this page, using limit=21 for 3x7 grids
      const { data } = await axios.get(`/api/post/user/${user._id}?page=${page}&limit=21`);
      
      if (page === 1) {
        setMyPosts(data.posts);
      } else {
        setMyPosts(prev => {
          const newPosts = data.posts.filter(p => !prev.some(old => old._id === p._id));
          return [...prev, ...newPosts];
        });
      }

      setHasMorePosts(data.pagination.hasMore);
      setPostPage(page);
    } catch (error) {
      console.error("Failed to fetch user posts:", error);
    } finally {
      setLoadingPosts(false);
      setLoadingMorePosts(false);
    }
  };

  const fetchMyReels = async () => {
    try {
      const { data } = await axios.get(`/api/post/user/${user._id}?type=reel`);
      setMyReels(data.posts); // Unified API returns 'posts' array
    } catch (error) {
      console.error("Failed to fetch reels:", error);
    }
  };

  const [type, setType] = useState("post");

  useEffect(() => {
    if (user && user._id) {
      fetchMyPosts(1);
    }
  }, [user?._id]);

  useEffect(() => {
    if (type === "reel") {
      fetchMyReels();
    }
  }, [type]);
  const [feedModal, setFeedModal] = useState(null); // { type: 'post' | 'reel' | 'saved', index: 0 }

  const [savedPosts, setSavedPosts] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const fetchSaved = async () => {
    setLoadingSaved(true);
    try {
      const { data } = await axios.get("/api/user/saved");
      setSavedPosts(data);
    } catch (error) {
      // console.log(error);
    } finally {
      setLoadingSaved(false);
    }
  };

  useEffect(() => {
    if (type === "saved") fetchSaved();
  }, [type]);

  const [show, setShow] = useState(false);
  const [show1, setShow1] = useState(false);
  const [showMuted, setShowMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [showBlocked, setShowBlocked] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  const [followersData, setFollowersData] = useState([]);
  const [followingsData, setFollowingsData] = useState([]);

  async function followData() {
    const { data } = await axios.get("/api/user/followdata/" + user._id + "?t=" + Date.now());
    setFollowersData(data.followers);
    setFollowingsData(data.followings);
  }

  const removeHandler = async (id) => {
    // Optimistic Update
    setFollowersData(prev => prev.filter(p => p._id !== id));

    // API Call
    const success = await removeFollower(id);

    // Revert if failed (optional, but good UX)
    if (!success) followData();
  };

  const unfollowHandler = async (id) => {
    // Optimistic Update
    setFollowingsData(prev => prev.filter(p => p._id !== id));

    // API Call
    await followUser(id);

    // We assume success for now as followUser handles toast errors. 
    // A more robust implementation would check the return message.
  };

  useEffect(() => {
    followData();
  }, [user]);

  const [showUpdatePass, setShowUpdatePass] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  async function updatePassword(e) {
    e.preventDefault();
    const { data } = await axios.post("/api/user/" + user._id, {
      oldPassword,
      newPassword,
    });
    toast.success(data.message);
    setOldPassword("");
    setNewPassword("");
    setShowUpdatePass(false);
  }

  if (loading) return <SkeletonProfile />;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center gap-2 pb-24 px-1">
      {/* Pass remove handler only if it's my own profile */}
      {show && <Modal value={followersData} title="Followers" setShow={setShow} onRemove={user._id === loggedInUser._id ? removeHandler : null} />}
      {show1 && <Modal value={followingsData} title="Following" setShow={setShow1} onRemove={user._id === loggedInUser._id ? unfollowHandler : null} />}
      {showMuted && (
        <div className="fixed inset-0 z-[50] w-full h-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[var(--card-bg)] w-full max-w-sm rounded-2xl border border-[var(--border)] p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Muted Users</h2>
              <button onClick={() => setShowMuted(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl">
                &times;
              </button>
            </div>
            <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {user.mutedUsers && user.mutedUsers.length > 0 ? (
                user.mutedUsers.map((u) => (
                  <div key={u._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        loading="lazy"
                        decoding="async"
                        src={u.profilePic?.url ? getOptimizedImg(u.profilePic.url) : "https://placehold.co/400"}
                        alt=""
                        className="w-10 h-10 rounded-full border border-[var(--border)] object-cover"
                      />
                      <p className="text-[var(--text-primary)] font-medium">{u.name || "Unknown"}</p>
                    </div>
                    <button
                      onClick={() => unmuteUser(u._id)}
                      className="px-3 py-1 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-full text-xs transition-colors border border-red-500/50"
                    >
                      Unmute
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-[var(--text-secondary)] text-center py-4">No muted users</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showBlocked && (
        <Modal value={user.blockedUsers} title="Blocked Users" setShow={setShowBlocked} onRemove={unblockUser} />
      )}

      {showThemeModal && <ThemeModal onClose={() => setShowThemeModal(false)} />}

      {/* ================= FULL WIDTH HEADER ================= */}
      {/* ================= FULL WIDTH HEADER ================= */}
      <div className="sticky top-0 z-40 w-full bg-[var(--bg-primary)]/95 backdrop-blur-md border-b border-[var(--border)] shadow-sm">
        <div className="max-w-[630px] mx-auto flex justify-between items-center py-3 px-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-wide">{user.name}</h2>
            <p className="text-[var(--text-secondary)] text-sm">@{user.username}</p>
          </div>

          <div className="flex items-center gap-1 relative">
            <button
              onClick={cycleTheme}
              className="text-[var(--text-primary)] text-xl p-2 hover:bg-[var(--bg-primary)]/50 rounded-full transition-colors shrink-0 group"
              title="Change Theme"
            >
              <IoSparklesOutline className="group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 group-hover:text-[var(--accent)]" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-[var(--text-primary)] text-2xl p-2 hover:bg-[var(--bg-primary)]/50 rounded-full transition-colors shrink-0"
            >
              <IoMenu />
            </button>

            {/* Settings Dropdown */}
            {showSettings && (
              <>
                <div
                  className="fixed inset-0 z-[25] cursor-default"
                  onClick={() => setShowSettings(false)}
                />
                <div className="absolute top-full right-0 mt-2 w-52 bg-[var(--card-bg)] rounded-xl shadow-2xl border border-[var(--border)] overflow-hidden z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
                  <button
                    onClick={() => {
                      togglePrivacy();
                      setShowSettings(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]/10 flex items-center gap-2 justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <IoShieldCheckmarkOutline className="text-lg" />
                      <span>Private Account</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${user.isPrivate ? "bg-[var(--accent)]" : "bg-gray-600"}`}>
                      <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${user.isPrivate ? "left-4.5" : "left-0.5"}`} style={{ left: user.isPrivate ? '18px' : '2px' }} />
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShareModal(true);
                      setShowSettings(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]/10 flex items-center gap-2"
                  >
                    <BsShare className="text-lg" /> Share Profile
                  </button>

                  <button
                    onClick={() => {
                      setShowEdit(true);
                      setShowSettings(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]/10 flex items-center gap-2"
                  >
                    <FiEdit2 className="text-lg" /> Edit Profile
                  </button>

                  <button
                    onClick={() => {
                      setShowUpdatePass(!showUpdatePass);
                      setShowSettings(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]/10 flex items-center gap-2"
                  >
                    <IoLockClosedOutline className="text-lg" /> Change Password
                  </button>
                  <button
                    onClick={() => {
                      setShowMuted(true);
                      setShowSettings(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]/10 flex items-center gap-2"
                  >
                    <IoVolumeOffOutline className="text-xl" /> Muted Users
                  </button>
                  <button
                    onClick={() => {
                      setShowBlocked(true);
                      setShowSettings(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]/10 flex items-center gap-2"
                  >
                    <IoBanOutline className="text-lg" /> Blocked Users
                  </button>
                  <button
                    onClick={() => {
                      user.toggleOnlineStatus ? user.toggleOnlineStatus() : toggleOnlineStatus();
                      // Status changes are optimistic, but we might want to keep menu open or show toast. 
                      // For now, let's close it to match other actions or keep it open? 
                      // User might want to toggle and see result. Let's keep it open or close it?
                      // The sidebar toggle kept it. Here it's a menu. Better to close or give feedback.
                      // Let's close it for now as per other items.
                      setShowSettings(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]/10 flex items-center gap-2 justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <RiRecordCircleFill className="text-lg" />
                      <span>Online Status</span>
                    </div>
                    <span className="text-xs font-medium bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">
                      {user.showOnlineStatus ? "On" : "Off"}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      user.toggleLastSeen ? user.toggleLastSeen() : toggleLastSeen();
                      setShowSettings(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]/10 flex items-center gap-2 justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <IoEye className="text-lg" />
                      <span>Last Seen Status</span>
                    </div>
                    <span className="text-xs font-medium bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">
                      {user.showLastSeen ? "On" : "Off"}
                    </span>
                  </button>

                  <div className="border-t border-[var(--border)]">
                    <button
                      onClick={() => {
                        setShowThemeModal(true);
                        setShowSettings(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]/10 flex items-center gap-2"
                    >
                      <IoSparklesOutline className="text-xl" /> Display & Accessibility
                    </button>
                  </div>

                  <button
                    onClick={() => logoutUser(navigate)}
                    className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2 border-t border-[var(--border)]"
                  >
                    Logout
                  </button>

                  <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-secondary)]/50">
                    <p className="text-[var(--text-secondary)] text-xs truncate">{user.email}</p>
                    <p className="text-[var(--text-secondary)] text-[10px] mt-0.5 uppercase tracking-wider">{user.gender}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ================= PROFILE CARD ================= */}
      {/* Reduced padding-top and removed padding-bottom to bring content closer */}
      <div className="w-full max-w-[630px] px-4 pt-4 relative z-30">

        {/* Top Row: Picture + Stats */}
        <div className="flex flex-row items-center gap-4 w-full">

          {/* Profile Image with Story Ring */}
          <div className="relative shrink-0">
            <StoryAvatar
              user={user}
              size="w-20 h-20 md:w-24 md:h-24"
              onClick={() => myStoryGroup ? setShowStoryViewer(true) : setShowCreateStory(true)}
            />
            {!myStoryGroup && (
              <div
                className="absolute bottom-1 right-1 bg-blue-500 text-white rounded-full p-1 border-2 border-[var(--bg-primary)] cursor-pointer pointer-events-none"
              >
                <AiOutlinePlus size={14} />
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-1 justify-around text-center">
            {/* POSTS COUNT */}
            <div className="cursor-pointer">
              <p className="text-[var(--text-primary)] font-semibold">
                {myPosts?.length || 0}
              </p>
              <p className="text-[var(--text-secondary)] text-xs">posts</p>
            </div>

            <div onClick={() => setShow(true)} className="cursor-pointer">
              <p className="text-[var(--text-primary)] font-semibold">{user.followers.length}</p>
              <p className="text-[var(--text-secondary)] text-xs">followers</p>
            </div>
            <div onClick={() => setShow1(true)} className="cursor-pointer">
              <p className="text-[var(--text-primary)] font-semibold">{user.followings.length}</p>
              <p className="text-[var(--text-secondary)] text-xs">following</p>
            </div>
          </div>
        </div>

        {/* Bio & Link Section (Below Profile Pic/Stats) */}
        {/* Reduced margin-top */}
        <div className="mt-4">
          {user.bio ? (
            <BioDisplay bio={user.bio} />
          ) : (
            user._id === loggedInUser._id && (
              <p className="text-[var(--text-secondary)] text-sm italic">Tell people a little about you</p>
            )
          )}

          {user.link && (
            <a
              href={user.link.startsWith("http") ? user.link : `https://${user.link}`}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--accent)] text-sm mt-2 hover:underline truncate max-w-xs block flex items-center gap-1"
            >
              🔗 {user.link.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>

        {/* PROFILE ACTIONS */}
        <div className="flex gap-2 mt-5">
          <button
            onClick={() => setShowEdit(true)}
            className="flex-1 py-1.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] opacity-80 text-sm font-semibold hover:bg-[var(--bg-secondary)]/80 hover:text-[var(--text-primary)] hover:opacity-100 transition-colors"
          >
            Edit Profile
          </button>
          <button
            onClick={() => setShareModal(true)}
            className="flex-1 py-1.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] opacity-80 text-sm font-semibold hover:bg-[var(--bg-secondary)]/80 hover:text-[var(--text-primary)] hover:opacity-100 transition-colors"
          >
            Share Profile
          </button>
        </div>
      </div>
      {/* ================= END PROFILE CARD ================= */}



      {
        showUpdatePass && (
          <form
            onSubmit={updatePassword}
            className="bg-[var(--card-bg)]/90 border border-[var(--border)] rounded-xl p-4 w-full max-w-md space-y-3"
          >
            <input
              type="password"
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)]"
              placeholder="Old password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <input
              type="password"
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)]"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button className="w-full bg-[var(--accent)] text-white py-2 rounded-lg hover:opacity-90 transition-opacity">
              Update
            </button>
          </form>
        )
      }

      {/* Toggle */}
      <div className="flex w-full max-w-[630px] border-b border-[var(--border)] mt-2">
        <button
          onClick={() => setType("post")}
          className={`flex-1 flex justify-center py-3 text-xl transition-colors relative ${type === "post" ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
          title="Posts"
        >
          <BsGrid3X3 />
          {type === "post" && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--accent)] rounded-t-full" />}
        </button>
        <button
          onClick={() => setType("reel")}
          className={`flex-1 flex justify-center py-3 text-xl transition-colors relative ${type === "reel" ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
          title="Reels"
        >
          <ReelsIcon size={20} />
          {type === "reel" && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--accent)] rounded-t-full" />}
        </button>
        <button
          onClick={() => setType("saved")}
          className={`flex-1 flex justify-center py-3 text-xl transition-colors relative ${type === "saved" ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
          title="Saved"
        >
          <BsBookmark />
          {type === "saved" && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--accent)] rounded-t-full" />}
        </button>
      </div>

      {/* Content */}
      {
        type === "post" && (
          <div className="w-full max-w-[630px]">
            {loadingPosts ? (
              <div className="grid grid-cols-3 gap-1">
                 <SkeletonPost /><SkeletonPost /><SkeletonPost />
              </div>
            ) : myPosts?.length ? (
              <div className="grid grid-cols-3 gap-1 grid-flow-row auto-rows-[1fr]">
                {myPosts.map((e, i) => (
                  <div key={e._id} className="aspect-square relative w-full h-full">
                    <PostCard
                      type={e.type || "post"}
                      value={e}
                      isGrid={true}
                      onClick={() => setFeedModal({ type: 'post', index: i })}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No posts yet</p>
            )}
          </div>
        )
      }

      {
        type === "reel" &&
        (loadingPosts ? (
          <div className="grid grid-cols-3 gap-1 w-full max-w-[630px] mx-auto pb-4">
            <SkeletonPost /><SkeletonPost /><SkeletonPost />
          </div>
        ) : myReels?.length ? (
          <div className="grid grid-cols-3 gap-1 w-full max-w-[630px] mx-auto pb-4 grid-flow-row auto-rows-[1fr]">
            {myReels.map((reel, i) => (
              <div key={reel._id} id={reel._id} className="account-reel flex justify-center w-full aspect-[9/16] bg-[var(--bg-secondary)] rounded-lg overflow-hidden relative group">
                <PostCard
                  type="reel"
                  value={reel}
                  isGrid={true}
                  onClick={() => setFeedModal({ type: 'reel', index: i })}
                />
              </div>
            ))}
          </div>
        ) : <p className="text-[var(--text-secondary)] text-center py-4">No reels yet</p>)
      }

      {/* Load More Pagination */}
      {hasMorePosts && (type === "post" || type === "reel") && (
        <div className="w-full flex justify-center py-6">
          <button 
            disabled={loadingMorePosts}
            onClick={() => fetchMyPosts(postPage + 1)}
            className="px-6 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-full hover:bg-[var(--accent)] hover:text-white transition-colors text-sm font-semibold disabled:opacity-50"
          >
            {loadingMorePosts ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {/* End of Feed Message for Profile */}
      {!hasMorePosts && (myPosts?.length > 0 || myReels?.length > 0) && (
        <div className="w-full py-12 flex flex-col items-center justify-center opacity-50">
          <div className="h-[1px] w-20 bg-gradient-to-r from-transparent via-[var(--text-secondary)] to-transparent mb-4" />
          <p className="text-[var(--text-secondary)] text-sm font-medium tracking-wide uppercase italic">The End</p>
        </div>
      )}


      {type === "saved" && <SavedPosts savedPosts={savedPosts} loading={loadingSaved} onPostClick={(index) => setFeedModal({ type: 'saved', index })} />}
      {showEdit && <EditProfile user={user} onBack={() => setShowEdit(false)} />}
      {feedModal && (
        <FeedModal
          posts={feedModal.type === 'post' ? myPosts : feedModal.type === 'reel' ? myReels : savedPosts}
          initialIndex={feedModal.index}
          onClose={() => setFeedModal(null)}
        />
      )}
      {showEdit && <EditProfile user={user} onBack={() => setShowEdit(false)} />}

      {/* Story Viewer Overlay */}
      {showStoryViewer && myStoryGroup && (
        <StoryViewer
          stories={[myStoryGroup]}
          initialIndex={0}
          onClose={() => setShowStoryViewer(false)}
        />
      )}

      {/* Story Creation Modal */}
      {showCreateStory && (
        <CreatePostModal setShow={setShowCreateStory} initialTab="story" />
      )}
      {/* Share Modal */}
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
    </div >
  );
};

const EditProfile = ({ user, onBack }) => {
  const { updateProfileInfo, updateProfilePic } = UserData();
  const [name, setName] = useState(user.name || "");
  const [username, setUsername] = useState(user.username || "");
  const [bio, setBio] = useState(user.bio || "");
  const [link, setLink] = useState(user.link || "");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(user.profilePic?.url || "https://placehold.co/400");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const saveHandler = async () => {
    setLoading(true);
    try {
      if (name.trim().length > 20) {
        toast.error("Name must be under 20 chars");
        setLoading(false);
        return;
      }
      if (bio.trim().length > 120) {
        toast.error("Bio must be under 120 chars");
        setLoading(false);
        return;
      }

      // Link Validation
      if (link && link.trim() !== "") {
        const urlPattern = new RegExp('^(https?:\\/\\/)?' + // protocol
          '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
          '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
          '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
          '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
          '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator

        if (!urlPattern.test(link)) {
          toast.error("Please enter a valid URL");
          setLoading(false);
          return;
        }
      }

      // Update Info (Name, Username, Bio, Link - passed object)
      // Only call if changed? Generic Update handles it.
      await updateProfileInfo(user._id, { name, username, bio, link }, () => { });

      if (file) {
        const formdata = new FormData();
        formdata.append("file", file);
        await updateProfilePic(user._id, formdata, () => { });
      }
      onBack();
    } catch (e) {
      console.log(e);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-[var(--bg-primary)] overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="sticky top-0 z-10 bg-[var(--bg-primary)]/90 backdrop-blur-md p-4 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-[var(--text-primary)] text-xl p-2 rounded-full hover:bg-[var(--text-primary)]/10 transition-colors">
            <FaArrowLeft />
          </button>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Edit Profile</h2>
        </div>
        <button
          onClick={saveHandler}
          disabled={loading || name.trim().length > 20 || name.trim().length === 0 || bio.length > 120}
          className="text-[var(--accent)] font-semibold text-lg hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="p-8 flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
        {/* Image Upload */}
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
          <img
            loading="lazy"
            decoding="async"
            src={preview ? getOptimizedImg(preview) : "https://placehold.co/400"}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-[var(--card-bg)] shadow-xl group-hover:opacity-80 transition-opacity"
          />
          <div className="absolute bottom-1 right-1 bg-[var(--accent)] p-2 rounded-full shadow-lg border-2 border-[var(--bg-primary)]">
            <FiEdit2 className="text-white text-md" />
          </div>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
        </div>

        {/* Name Input */}
        <div className="w-full space-y-1">
          <div className="flex justify-between items-center ml-1">
            <label className="text-[var(--text-secondary)] text-sm">Name</label>
            <span className={`text-xs font-medium transition-colors ${name.length > 20 ? "text-red-500" : "text-[var(--text-secondary)]"}`}>
              {name.length}/20
            </span>
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full bg-[var(--card-bg)] border rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none transition-colors ${name.length > 20 ? "border-red-500 focus:border-red-500" : "border-[var(--border)] focus:border-[var(--accent)]"}`}
            placeholder="Enter your name"
          />
        </div>

        {/* Username Input */}
        <div className="w-full space-y-1">
          <label className="text-[var(--text-secondary)] text-sm ml-1">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
            className="w-full bg-[var(--card-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            placeholder="unique_username"
          />
          <p className="text-xs text-[var(--text-secondary)] ml-1">Must be unique, lowercase, no spaces.</p>
        </div>

        {/* Bio Input */}
        <div className="w-full space-y-1">
          <div className="flex justify-between items-center ml-1">
            <label className="text-[var(--text-secondary)] text-sm">Bio</label>
            <span className={`text-xs font-medium transition-colors ${bio.length > 120 ? "text-red-500" : "text-[var(--text-secondary)]"}`}>
              {bio.length}/120
            </span>
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className={`w-full bg-[var(--card-bg)] border rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none transition-colors resize-none h-24 text-sm ${bio.length > 120 ? "border-red-500 focus:border-red-500" : "border-[var(--border)] focus:border-[var(--accent)]"}`}
            placeholder="Tell people a little about you..."
          />
        </div>

        {/* Link Input */}
        <div className="w-full space-y-1">
          <label className="text-[var(--text-secondary)] text-sm ml-1">External Link</label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full bg-[var(--card-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            placeholder="Add a link (e.g. portfolio)"
          />
        </div>
      </div>
    </div>
  )
}

const SavedPosts = ({ savedPosts, loading, onPostClick }) => {

  return (
    <div className="w-full max-w-[630px] pb-20">
      {loading ? (
        <div className="space-y-4">
          <SkeletonPost />
          <SkeletonPost />
          <SkeletonPost />
        </div>
      ) : savedPosts && savedPosts.length > 0 ? (
        <div className="grid grid-cols-3 gap-1">
          {savedPosts.map((e, i) => (
            <PostCard
              key={e._id}
              type={e.type || "post"}
              value={e}
              isGrid={true}
              onClick={() => onPostClick && onPostClick(i)}
            />
          ))}
        </div>
      ) : (
        <p className="text-[var(--text-secondary)] text-center py-4">No saved posts yet</p>
      )}
    </div>
  );
};

const BioDisplay = ({ bio }) => {
  const [expanded, setExpanded] = useState(false);

  const lines = bio.split('\n');
  const isMultiLine = lines.length > 3;
  const isLongText = bio.length > 80;
  const showToggle = isMultiLine || isLongText;

  let displayText = bio;
  if (!expanded && showToggle) {
    if (isMultiLine) {
      displayText = lines.slice(0, 3).join('\n').slice(0, 80); // Cap at 3 lines, max 80 chars fallback
    } else {
      displayText = bio.slice(0, 80);
    }
  }

  return (
    <div className="relative">
      <p className="text-[var(--text-secondary)] text-sm whitespace-pre-wrap leading-relaxed inline">
        {displayText}
        {!expanded && showToggle && "..."}
        {showToggle && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[var(--text-secondary)] text-xs ml-1 hover:text-[var(--text-primary)] font-medium inline-block"
          >
            {expanded ? "less" : "more"}
          </button>
        )}
      </p>
    </div>
  );
};


// Feed Modal - shows posts in a feed view starting from a specific index
const FeedModal = ({ posts, initialIndex, onClose }) => {
  const modalRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    // Scroll to the initial post on mount
    if (modalRef.current) {
      const element = document.getElementById(`feed-post-${initialIndex}`);
      if (element) {
        element.scrollIntoView({ behavior: "auto" });
      }
    }
  }, []); // Run once on mount

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md overflow-y-auto custom-scrollbar flex justify-center">
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


export default Account;

