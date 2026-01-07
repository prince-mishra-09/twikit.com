import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserData } from "../context/UserContext";
import { PostData } from "../context/PostContext";
import PostCard from "../components/PostCard";
import { FaArrowDownLong, FaArrowUp } from "react-icons/fa6";
import Modal from "../components/Modal";
import axios from "axios";
import { Loading } from "../components/Loading";
import { CiEdit } from "react-icons/ci";
import toast from "react-hot-toast";
import { FiEdit2 } from "react-icons/fi";

const Account = ({ user }) => {
  const navigate = useNavigate();
  const { logoutUser, updateProfilePic, updateProfileName } = UserData();
  const { posts, reels, loading } = PostData();

  const myPosts = posts?.filter((p) => p.owner._id === user._id);
  const myReels = reels?.filter((r) => r.owner._id === user._id);

  const [type, setType] = useState("post");
  const [index, setIndex] = useState(0);

  const prevReel = () => index !== 0 && setIndex(index - 1);
  const nextReel = () =>
    index !== myReels.length - 1 && setIndex(index + 1);

  const [show, setShow] = useState(false);
  const [show1, setShow1] = useState(false);

  const [followersData, setFollowersData] = useState([]);
  const [followingsData, setFollowingsData] = useState([]);

  async function followData() {
    const { data } = await axios.get("/api/user/followdata/" + user._id);
    setFollowersData(data.followers);
    setFollowingsData(data.followings);
  }

  const [file, setFile] = useState("");
  const changeFileHandler = (e) => setFile(e.target.files[0]);

  const changleImageHandler = () => {
    const formdata = new FormData();
    formdata.append("file", file);
    updateProfilePic(user._id, formdata, setFile);
  };

  useEffect(() => {
    followData();
  }, [user]);

  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState(user.name || "");

  const UpdateName = () => updateProfileName(user._id, name, setShowInput);

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

      {show && <Modal value={followersData} title="Followers" setShow={setShow} />}
      {show1 && <Modal value={followingsData} title="Following" setShow={setShow1} />}

      {/* ================= PROFILE CARD ================= */}
      <div className="w-full max-w-md bg-[#111827]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6 mt-4">

        {/* Top Row */}
        <div className="flex items-center gap-6">

          {/* Profile Image */}
          <div className="relative">
            <img
              src={user.profilePic.url}
              alt="profile"
              className="w-24 h-24 rounded-full object-cover border border-white/20"
            />

            <label
              htmlFor="profilePicInput"
              className="absolute bottom-0 right-0 bg-indigo-500 p-1.5 rounded-full cursor-pointer"
            >
              <FiEdit2 className="text-white text-xs" />
            </label>

            <input
              id="profilePicInput"
              type="file"
              onChange={changeFileHandler}
              className="hidden"
            />
          </div>

          {/* Stats */}
          <div className="flex flex-1 justify-around text-center">
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

        {/* Name + Info */}
        <div className="mt-4">
          {showInput ? (
            <div className="flex items-center gap-2">
              <input
                className="flex-1 px-3 py-1 rounded-lg bg-[#0B0F14] border border-white/10 text-white"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button onClick={UpdateName} className="text-indigo-400">✔</button>
              <button onClick={() => setShowInput(false)} className="text-red-400">✕</button>
            </div>
          ) : (
            <p className="text-white font-semibold flex items-center gap-2">
              {user.name}
              <button onClick={() => setShowInput(true)} className="text-gray-400">
                <CiEdit />
              </button>
            </p>
          )}

          <p className="text-gray-400 text-sm">{user.email}</p>
          <p className="text-gray-400 text-sm">{user.gender}</p>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-col gap-2">
          {file && (
            <button
              onClick={changleImageHandler}
              className="w-full bg-indigo-500 text-white py-1.5 rounded-lg text-sm"
            >
              Update Profile
            </button>
          )}
          <button
            onClick={() => logoutUser(navigate)}
            className="w-full bg-red-500 text-white py-1.5 rounded-lg text-sm"
          >
            Logout
          </button>
        </div>
      </div>
      {/* ================= END PROFILE CARD ================= */}

      {/* Update Password */}
      <button
        onClick={() => setShowUpdatePass(!showUpdatePass)}
        className="text-sm text-indigo-400"
      >
        {showUpdatePass ? "Cancel" : "Update Password"}
      </button>

      {showUpdatePass && (
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
      )}

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
        <button
          onClick={() => setType("saved")}
          className={type === "saved" ? "text-indigo-400" : "text-gray-400"}
        >
          Saved
        </button>
      </div>

      {/* Content */}
      {type === "post" &&
        (myPosts?.length
          ? myPosts.map((e) => (
            <PostCard type="post" value={e} key={e._id} />
          ))
          : <p className="text-gray-500">No posts yet</p>)}

      {type === "reel" &&
        (myReels?.length ? (
          <div className="flex gap-4 items-center">
            <PostCard type="reel" value={myReels[index]} />
            <div className="flex flex-col gap-4">
              {index !== 0 && (
                <button onClick={prevReel} className="p-3 bg-[#111827] rounded-full text-white">
                  <FaArrowUp />
                </button>
              )}
              {index !== myReels.length - 1 && (
                <button onClick={nextReel} className="p-3 bg-[#111827] rounded-full text-white">
                  <FaArrowDownLong />
                </button>
              )}
            </div>
          </div>
        ) : <p className="text-gray-500">No reels yet</p>)}

      {type === "saved" && <SavedPosts />}
    </div>
  );
};

const SavedPosts = () => {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(false);

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

  if (loading) return <Loading />;

  return (
    <div className="grid grid-cols-1 gap-4 w-full">
      {savedPosts && savedPosts.length > 0 ? (
        savedPosts.map((e) => <PostCard type="post" value={e} key={e._id} />)
      ) : (
        <p className="text-gray-500 text-center mt-4">No saved posts yet</p>
      )}
    </div>
  );
};

export default Account;
