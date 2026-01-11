import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UserData } from "../context/UserContext";
import { PostData } from "../context/PostContext";
import PostCard from "../components/PostCard";
import { FaArrowDownLong, FaArrowUp, FaArrowLeft } from "react-icons/fa6";
import { IoMenu } from "react-icons/io5";
import Modal from "../components/Modal";
import axios from "axios";
import { Loading } from "../components/Loading";
import { CiEdit } from "react-icons/ci";
import toast from "react-hot-toast";
import { FiEdit2 } from "react-icons/fi";
import { StoriesData } from "../context/StoriesContext";
import StoryViewer from "../components/StoryViewer";
import CreatePostModal from "../components/CreatePostModal";
import StoryAvatar from "../components/StoryAvatar";
import { AiOutlinePlus } from "react-icons/ai";

const Account = ({ user }) => {
  const navigate = useNavigate();
  const { logoutUser, updateProfilePic, updateProfileName, unmuteUser, togglePrivacy, removeFollower, unblockUser, user: loggedInUser } = UserData();
  const { posts, reels, loading } = PostData();
  const { stories } = StoriesData();

  // Story Logic
  const myStoryGroup = stories.find(s => s.user._id === user._id);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [showCreateStory, setShowCreateStory] = useState(false);

  const myPosts = posts?.filter((p) => p.owner._id === user._id);
  const myReels = reels?.filter((r) => r.owner._id === user._id);

  const [type, setType] = useState("post");
  const [activeReelId, setActiveReelId] = useState(null);

  useEffect(() => {
    if (type !== "reel") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveReelId(entry.target.id);
          }
        });
      },
      { threshold: 0.6 }
    );

    // Wait for DOM
    setTimeout(() => {
      const elements = document.querySelectorAll(".account-reel");
      elements.forEach((el) => observer.observe(el));
    }, 100);

    return () => {
      const elements = document.querySelectorAll(".account-reel");
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [type, myReels]);

  const [show, setShow] = useState(false);
  const [show1, setShow1] = useState(false);
  const [showMuted, setShowMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);

  const [followersData, setFollowersData] = useState([]);
  const [followingsData, setFollowingsData] = useState([]);

  async function followData() {
    const { data } = await axios.get("/api/user/followdata/" + user._id);
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

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-[#0B0F14] flex flex-col items-center gap-6 pb-24 px-3">
      {/* Pass remove handler only if it's my own profile */}
      {show && <Modal value={followersData} title="Followers" setShow={setShow} onRemove={user._id === loggedInUser._id ? removeHandler : null} />}
      {show1 && <Modal value={followingsData} title="Following" setShow={setShow1} />}
      {showMuted && (
        <div className="fixed inset-0 z-[50] w-full h-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[#111827] w-full max-w-sm rounded-2xl border border-white/10 p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h2 className="text-xl font-bold text-white">Muted Users</h2>
              <button onClick={() => setShowMuted(false)} className="text-gray-400 hover:text-white text-2xl">
                &times;
              </button>
            </div>
            <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {user.mutedUsers && user.mutedUsers.length > 0 ? (
                user.mutedUsers.map((u) => (
                  <div key={u._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={u.profilePic.url} alt="" className="w-10 h-10 rounded-full border border-white/10 object-cover" />
                      <p className="text-white font-medium">{u.name}</p>
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
                <p className="text-gray-500 text-center py-4">No muted users</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showBlocked && (
        <Modal value={user.blockedUsers} title="Blocked Users" setShow={setShowBlocked} onRemove={unblockUser} />
      )}

      {/* ================= PROFILE CARD ================= */}
      <div className="w-full max-w-xl p-4 mt-4 relative z-30">

        {/* Settings Menu Button */}


        {/* Settings Dropdown */}
        {showSettings && (
          <>
            <div
              className="fixed inset-0 z-[25] cursor-default"
              onClick={() => setShowSettings(false)}
            />
            <div className="absolute top-14 right-4 w-52 bg-[#1F2937] rounded-xl shadow-2xl border border-white/10 overflow-hidden z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
              <button
                onClick={() => {
                  togglePrivacy();
                  setShowSettings(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2 justify-between"
              >
                <div className="flex items-center gap-2">
                  <span>Private Account</span>
                </div>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${user.isPrivate ? "bg-indigo-500" : "bg-gray-600"}`}>
                  <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${user.isPrivate ? "left-4.5" : "left-0.5"}`} style={{ left: user.isPrivate ? '18px' : '2px' }} />
                </div>
              </button>

              <button
                onClick={() => {
                  setShowEdit(true);
                  setShowSettings(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2"
              >
                Edit Profile
              </button>

              <button
                onClick={() => {
                  setShowUpdatePass(!showUpdatePass);
                  setShowSettings(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2"
              >
                Change Password
              </button>
              <button
                onClick={() => {
                  setShowMuted(true);
                  setShowSettings(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2"
              >
                Muted Users
              </button>
              <button
                onClick={() => {
                  setShowBlocked(true);
                  setShowSettings(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2"
              >
                Blocked Users
              </button>
              <button
                onClick={() => {
                  setType("saved");
                  setShowSettings(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2"
              >
                Saved Posts
              </button>
              <button
                onClick={() => logoutUser(navigate)}
                className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2 border-t border-white/5"
              >
                Logout
              </button>

              <div className="px-4 py-3 border-t border-white/5 bg-[#111827]/50">
                <p className="text-gray-400 text-xs truncate">{user.email}</p>
                <p className="text-gray-500 text-[10px] mt-0.5 uppercase tracking-wider">{user.gender}</p>
              </div>
            </div>
          </>
        )}

        {/* HEADER ROW: Name & Menu */}
        {/* HEADER ROW: Name & Menu */}
        {/* HEADER ROW: Name & Menu */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white tracking-wide">{user.name}</h2>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-white text-2xl p-2 hover:bg-white/10 rounded-full transition-colors shrink-0"
          >
            <IoMenu />
          </button>
        </div>

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
                className="absolute bottom-1 right-1 bg-blue-500 text-white rounded-full p-1 border-2 border-[#111827] cursor-pointer pointer-events-none"
              >
                <AiOutlinePlus size={14} />
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-1 justify-around text-center">
            {/* POSTS COUNT */}
            <div className="cursor-pointer">
              <p className="text-white font-bold text-lg">{myPosts?.length || 0}</p>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Posts</p>
            </div>

            <div onClick={() => setShow(true)} className="cursor-pointer">
              <p className="text-white font-semibold">{user.followers.length}</p>
              <p className="text-gray-400 text-xs">followers</p>
            </div>
            <div onClick={() => setShow1(true)} className="cursor-pointer">
              <p className="text-white font-semibold">{user.followings.length}</p>
              <p className="text-gray-400 text-xs">following</p>
            </div>
          </div>
        </div>

        {/* Bio & Link Section (Below Profile Pic/Stats) */}
        <div className="mt-6">
          {user.bio ? (
            <BioDisplay bio={user.bio} />
          ) : (
            user._id === loggedInUser._id && (
              <p className="text-gray-500 text-sm italic">Tell people a little about you</p>
            )
          )}

          {user.link && (
            <a
              href={user.link.startsWith("http") ? user.link : `https://${user.link}`}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 text-sm mt-2 hover:underline truncate max-w-xs block flex items-center gap-1"
            >
              🔗 {user.link.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
      </div>
      {/* ================= END PROFILE CARD ================= */}



      {
        showUpdatePass && (
          <form
            onSubmit={updatePassword}
            className="bg-[#111827]/90 border border-white/10 rounded-xl p-4 w-full max-w-md space-y-3"
          >
            <input
              type="password"
              className="w-full px-3 py-2 rounded-lg bg-[#0B0F14] border border-white/10 text-white"
              placeholder="Old password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <input
              type="password"
              className="w-full px-3 py-2 rounded-lg bg-[#0B0F14] border border-white/10 text-white"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button className="w-full bg-indigo-500 text-white py-2 rounded-lg">
              Update
            </button>
          </form>
        )
      }

      {/* Toggle */}
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

      {/* Content */}
      {/* Content */}
      {
        type === "post" && (
          <div className="w-full max-w-xl space-y-4">
            {myPosts?.length
              ? myPosts.map((e) => (
                <PostCard type="post" value={e} key={e._id} />
              ))
              : <p className="text-gray-500 text-center py-4">No posts yet</p>}
          </div>
        )
      }

      {
        type === "reel" &&
        (myReels?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mx-auto pb-4">
            {myReels.map((reel) => (
              <div key={reel._id} id={reel._id} className="account-reel flex justify-center w-full aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden relative group">
                <PostCard type="reel" value={reel} isActive={activeReelId === reel._id} />
              </div>
            ))}
          </div>
        ) : <p className="text-gray-500 text-center py-4">No reels yet</p>)
      }

      {type === "saved" && <SavedPosts onBack={() => setType("post")} />}
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
    </div >
  );
};

const EditProfile = ({ user, onBack }) => {
  const { updateProfileInfo, updateProfilePic } = UserData();
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [link, setLink] = useState(user.link || "");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(user.profilePic.url);
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

      // Update Info (Name, Bio, Link - passed object)
      // Only call if changed? Generic Update handles it.
      await updateProfileInfo(user._id, { name, bio, link }, () => { });

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
    <div className="fixed inset-0 z-[60] bg-[#0B0F14] overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="sticky top-0 z-10 bg-[#0B0F14]/90 backdrop-blur-md p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-white text-xl p-2 rounded-full hover:bg-white/10 transition-colors">
            <FaArrowLeft />
          </button>
          <h2 className="text-xl font-bold text-white">Edit Profile</h2>
        </div>
        <button
          onClick={saveHandler}
          disabled={loading || name.trim().length > 20 || name.trim().length === 0 || bio.length > 120}
          className="text-indigo-400 font-semibold text-lg hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="p-8 flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
        {/* Image Upload */}
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
          <img src={preview} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-[#1F2937] shadow-xl group-hover:opacity-80 transition-opacity" />
          <div className="absolute bottom-1 right-1 bg-indigo-500 p-2 rounded-full shadow-lg border-2 border-[#0B0F14]">
            <FiEdit2 className="text-white text-md" />
          </div>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
        </div>

        {/* Name Input */}
        <div className="w-full space-y-1">
          <div className="flex justify-between items-center ml-1">
            <label className="text-gray-400 text-sm">Name</label>
            <span className={`text-xs font-medium transition-colors ${name.length > 20 ? "text-red-500" : "text-gray-500"}`}>
              {name.length}/20
            </span>
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full bg-[#1F2937] border rounded-xl px-4 py-3 text-white focus:outline-none transition-colors ${name.length > 20 ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-indigo-500"}`}
            placeholder="Enter your name"
          />
        </div>

        {/* Bio Input */}
        <div className="w-full space-y-1">
          <div className="flex justify-between items-center ml-1">
            <label className="text-gray-400 text-sm">Bio</label>
            <span className={`text-xs font-medium transition-colors ${bio.length > 120 ? "text-red-500" : "text-gray-500"}`}>
              {bio.length}/120
            </span>
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className={`w-full bg-[#1F2937] border rounded-xl px-4 py-3 text-white focus:outline-none transition-colors resize-none h-24 text-sm ${bio.length > 120 ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-indigo-500"}`}
            placeholder="Tell people a little about you..."
          />
        </div>

        {/* Link Input */}
        <div className="w-full space-y-1">
          <label className="text-gray-400 text-sm ml-1">External Link</label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full bg-[#1F2937] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            placeholder="Add a link (e.g. portfolio)"
          />
        </div>
      </div>
    </div>
  )
}

const SavedPosts = ({ onBack }) => {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activePostId, setActivePostId] = useState(null);

  useEffect(() => {
    async function fetchSaved() {
      setLoading(true);
      try {
        const { data } = await axios.get("/api/user/saved");
        setSavedPosts(data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    }
    fetchSaved();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActivePostId(entry.target.id);
          }
        });
      },
      { threshold: 0.6 }
    );

    const elements = document.querySelectorAll(".saved-post-container");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [savedPosts]);

  return (
    <div className="fixed inset-0 z-[60] bg-[#0B0F14] overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="sticky top-0 z-10 bg-[#0B0F14]/90 backdrop-blur-md p-4 border-b border-white/10 flex items-center gap-4">
        <button onClick={onBack} className="text-white text-xl p-2 rounded-full hover:bg-white/10 transition-colors">
          <FaArrowLeft />
        </button>
        <h2 className="text-xl font-bold text-white">Saved Posts</h2>
      </div>

      <div className="p-4 grid grid-cols-1 gap-6 w-full max-w-xl mx-auto pb-20">
        {loading ? (
          <Loading />
        ) : savedPosts && savedPosts.length > 0 ? (
          savedPosts.map((e) => (
            <div key={e._id} id={e._id} className="saved-post-container">
              <PostCard type={e.type} value={e} isActive={activePostId === e._id} />
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center mt-20">No saved posts yet</p>
        )}
      </div>
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
      <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed inline">
        {displayText}
        {!expanded && showToggle && "..."}
        {showToggle && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-500 text-xs ml-1 hover:text-gray-300 font-medium inline-block"
          >
            {expanded ? "less" : "more"}
          </button>
        )}
      </p>
    </div>
  );
};

export default Account;
