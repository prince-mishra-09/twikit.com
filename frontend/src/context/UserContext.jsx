import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";


const UserContext = createContext();

export const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState([]);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  const getErrorMessage = (error) =>
    error.response?.data?.message || error.message || "Something went wrong";

  async function registerUser(formdata, navigate, fetchPosts) {
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/register", formdata, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(data.message);
      setIsAuth(true);
      setUser(data.user);
      fetchPosts();
      navigate("/");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function loginUser(email, password, navigate, fetchPosts) {
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/login", {
        email,
        password,
      });

      toast.success(data.message);
      setIsAuth(true);
      setUser(data.user);
      fetchPosts();
      navigate("/");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function fetchUser() {
    try {
      const { data } = await axios.get("/api/user/me");
      setUser(data);
      setIsAuth(true);
    } catch (error) {
      setIsAuth(false);
    } finally {
      setLoading(false);
    }
  }

  async function logoutUser(navigate) {
    try {
      const { data } = await axios.get("/api/auth/logout");
      toast.success(data.message);
      setUser([]);
      setIsAuth(false);
      navigate("/login");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function followUser(id) {
    try {
      const { data } = await axios.post("/api/user/follow/" + id);
      toast.success(data.message);
      return data.message;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return null;
    }
  }

  async function updateProfilePic(id, formdata, setFile) {
    try {
      const { data } = await axios.put("/api/user/" + id, formdata, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(data.message);
      fetchUser();
      setFile(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function updateProfileName(id, name, setShowInput) {
    try {
      const { data } = await axios.put("/api/user/" + id, { name });
      toast.success(data.message);
      fetchUser();
      setShowInput(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function savePost(postId) {
    try {
      const { data } = await axios.post("/api/post/save/" + postId);
      toast.success(data.message);
      fetchUser(); // Refresh user to update savedPosts
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  // --- Feed Controls ---
  async function hidePost(postId) {
    try {
      const { data } = await axios.post("/api/feed/hide-post/" + postId);
      toast.success(data.message);
      // We don't necessarily need to re-fetch user immediately as the UI will hide it optimistically
      // But keeping state consistent is good.
      fetchUser();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function muteUser(userId) {
    try {
      const { data } = await axios.post("/api/feed/mute-user/" + userId);
      toast.success(data.message);
      fetchUser();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function unmuteUser(userId) {
    try {
      const { data } = await axios.delete("/api/feed/unmute-user/" + userId);
      toast.success(data.message);
      fetchUser();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function togglePrivacy() {
    try {
      const { data } = await axios.put("/api/user/privacy");
      toast.success(data.message);
      fetchUser();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function removeFollower(userId) {
    try {
      const { data } = await axios.delete("/api/user/follower/" + userId);
      toast.success(data.message);
      // We need to fetchUser to update the followers list
      // Or we can return true/false to let the component update its local state to avoid full re-fetch
      // But fetchUser is safer to sync everything
      // Actually, Modal uses 'followersData' state in Account.jsx which comes from 'followData' API
      // So fetchUser() updates 'user' context, but Account.jsx state needs specific update.
      fetchUser();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider
      value={{
        loginUser,
        isAuth,
        setIsAuth,
        user,
        setUser,
        loading,
        logoutUser,
        registerUser,
        followUser,
        updateProfilePic,
        updateProfileName,
        savePost,
        hidePost,
        hidePost,
        muteUser,
        muteUser,
        unmuteUser,
        togglePrivacy,
        removeFollower,
      }}
    >
      {children}
      <Toaster />
    </UserContext.Provider>
  );
};

export const UserData = () => useContext(UserContext);
