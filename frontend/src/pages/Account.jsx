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

const Account = ({ user }) => {
  const navigate = useNavigate();
  const { logoutUser, updateProfilePic, updateProfileName, unmuteUser, togglePrivacy, removeFollower, unblockUser, user: loggedInUser } = UserData();
  const { posts, reels, loading } = PostData();

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
      <div className="w-full max-w-xl bg-[#111827]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6 mt-4 relative">

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
            </div>
          </div>
      </>
        )}

      {/* HEADER ROW: Name & Menu */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white tracking-wide">{user.name}</h2>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-white text-2xl p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <IoMenu />
        </button>
      </div>

      {/* Top Row: Picture + Stats */}
      <div className="flex flex-col md:flex-row items-center gap-6">

        {/* Profile Image */}
        <div className="relative">
          <img
            src={user.profilePic.url}
            alt="profile"
            className="w-24 h-24 rounded-full object-cover border border-white/20"
          />
        </div>

        {/* Stats */}
        <div className="flex flex-1 justify-around text-center w-full md:w-auto mt-4 md:mt-0">
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

      {/* Info (Email/Gender) */}
      <div className="mt-6 border-t border-white/5 pt-4">
        {/* Name moved to top */}

        <p className="text-gray-400 text-sm">{user.email}</p>
        <p className="text-gray-400 text-sm">{user.gender}</p>
      </div>
    </div>
      {/* ================= END PROFILE CARD ================= */ }



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

  {/* Toggle */ }
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

  {/* Content */ }
  {/* Content */ }
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

  { type === "saved" && <SavedPosts onBack={() => setType("post")} /> }
  { showEdit && <EditProfile user={user} onBack={() => setShowEdit(false)} /> }
    </div >
  );
};

const EditProfile = ({ user, onBack }) => {
  const { updateProfileName, updateProfilePic } = UserData();
  const [name, setName] = useState(user.name || "");
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
      if (name !== user.name) {
        await updateProfileName(user._id, name, () => { });
      }
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
        <button onClick={saveHandler} disabled={loading} className="text-indigo-400 font-semibold text-lg hover:text-indigo-300 disabled:opacity-50">
          {loading ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="p-8 flex flex-col items-center gap-8 w-full max-w-sm mx-auto">
        {/* Image Upload */}
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
          <img src={preview} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-[#1F2937] shadow-xl group-hover:opacity-80 transition-opacity" />
          <div className="absolute bottom-1 right-1 bg-indigo-500 p-2 rounded-full shadow-lg border-2 border-[#0B0F14]">
            <FiEdit2 className="text-white text-md" />
          </div>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
        </div>

        {/* Name Input */}
        <div className="w-full space-y-2">
          <label className="text-gray-400 text-sm ml-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#1F2937] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            placeholder="Enter your name"
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

export default Account;
