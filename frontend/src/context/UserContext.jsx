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
      registerPush(); // Trigger notification permission request
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
      fetchUser();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  }

  async function blockUser(id, navigate) {
    try {
      const { data } = await axios.post("/api/user/block/" + id);
      toast.success(data.message);
      if (navigate) navigate("/", { replace: true });
      fetchUser();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function unblockUser(id) {
    try {
      const { data } = await axios.delete("/api/user/unblock/" + id);
      toast.success(data.message);
      fetchUser();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function registerPush() {
    if (!("serviceWorker" in navigator)) return;

    try {
      const register = await navigator.serviceWorker.register("/sw.js");

      const publicVapidKey = "BDEaakozjRUhtyPzgDajIBVFpiXIQBi36jcO3rmiyRXEIDk8DmRxRrUi7VNI0mi9NQ6r_i_Hq_K5rJD0HlNQhl8"; // Generated Key

      const subscription = await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });

      await axios.post("/api/notifications/subscribe", subscription);
      // toast.success("Notifications Enabled!");
    } catch (error) {
      console.error("Push Error:", error);
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
        muteUser,
        unmuteUser,
        togglePrivacy,
        removeFollower,
        blockUser,
        blockUser,
        unblockUser,
        registerPush,
      }}
    >
      {children}
      <Toaster />
    </UserContext.Provider>
  );
};

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const UserData = () => useContext(UserContext);
