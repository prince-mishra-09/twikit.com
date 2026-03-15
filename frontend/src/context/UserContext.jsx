import axios from "axios";
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import { isSameId, includesId } from "../utils/idUtils";


const UserContext = createContext();

export const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const getErrorMessage = (error) =>
    error.response?.data?.message || error.message || "Something went wrong";

  const registerUser = useCallback(async (formdata, navigate, fetchPosts) => {
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
  }, []);

  const loginUser = useCallback(async (identifier, password, navigate, fetchPosts) => {
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/login", {
        identifier,
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
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/user/me?t=" + new Date().getTime());
      setUser(data);
      setIsAuth(true);
      registerPush(); // Trigger notification permission request
    } catch (error) {
      setIsAuth(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const logoutUser = useCallback(async (navigate) => {
    try {
      const { data } = await axios.get("/api/auth/logout");
      toast.success(data.message);
      setUser(null);
      setIsAuth(false);
      navigate("/login");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, []);

  const followUser = useCallback(async (id) => {
    // Optimistic Update
    setUser((prev) => {
      if (!prev) return prev;
      const isFollowing = includesId(prev.followings, id);

      return {
        ...prev,
        followings: isFollowing
          ? prev.followings.filter((f) => !isSameId(f, id))
          : [...(prev.followings || []), id],
      };
    });

    try {
      const { data } = await axios.post("/api/user/follow/" + id);
      toast.success(data.message);

      // Update state with server-returned truthful data
      if (data.followings) {
        setUser((prev) => ({ ...prev, followings: data.followings }));
      } else {
        // Fallback for requests/errors
        fetchUser();
      }
      return data.message;
    } catch (error) {
      toast.error(getErrorMessage(error));
      // Revert on failure
      fetchUser();
      return null;
    }
  }, [fetchUser]);

  const updateProfilePic = useCallback(async (id, formdata, setFile) => {
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
  }, [fetchUser]);

  const updateProfileInfo = useCallback(async (id, { name, username, bio, link }, setShowInput) => {
    try {
      const { data } = await axios.put("/api/user/" + id, { name, username, bio, link });
      toast.success(data.message);
      fetchUser();
      if (setShowInput) setShowInput(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [fetchUser]);

  const savePost = useCallback(async (postId) => {
    try {
      const { data } = await axios.post("/api/post/save/" + postId);
      toast.success(data.message);
      fetchUser(); // Refresh user to update savedPosts list
      return data; // Return data so PostCard can sync counts
    } catch (error) {
      toast.error(getErrorMessage(error));
      return null;
    }
  }, [fetchUser]);

  // --- Feed Controls ---
  const hidePost = useCallback(async (postId) => {
    try {
      const { data } = await axios.post("/api/feed/hide-post/" + postId);
      toast.success(data.message);
      // We don't necessarily need to re-fetch user immediately as the UI will hide it optimistically
      // But keeping state consistent is good.
      fetchUser();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [fetchUser]);

  const muteUser = useCallback(async (userId) => {
    try {
      const { data } = await axios.post("/api/feed/mute-user/" + userId);
      toast.success(data.message);
      fetchUser();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [fetchUser]);

  const unmuteUser = useCallback(async (userId) => {
    try {
      const { data } = await axios.delete("/api/feed/unmute-user/" + userId);
      toast.success(data.message);
      fetchUser();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [fetchUser]);

  const togglePrivacy = useCallback(async () => {
    try {
      const { data } = await axios.put("/api/user/privacy");
      toast.success(data.message);
      fetchUser();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [fetchUser]);

  const removeFollower = useCallback(async (userId) => {
    try {
      const { data } = await axios.delete("/api/user/follower/" + userId);
      toast.success(data.message);
      fetchUser();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  }, [fetchUser]);

  const blockUser = useCallback(async (id, navigate) => {
    try {
      const { data } = await axios.post("/api/user/block/" + id);
      toast.success(data.message);
      if (navigate) navigate("/", { replace: true });
      fetchUser();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [fetchUser]);

  const unblockUser = useCallback(async (id) => {
    try {
      const { data } = await axios.delete("/api/user/unblock/" + id);
      toast.success(data.message);
      fetchUser();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [fetchUser]);

  const toggleOnlineStatus = useCallback(async () => {
    // Optimistic Update: Toggle immediately
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, showOnlineStatus: !prev.showOnlineStatus };
    });

    try {
      const { data } = await axios.put("/api/user/status");
      // toast.success(data.message); // Optional: Success toast might be annoying for instant toggle

      // Sync with server response to be sure
      setUser((prev) => prev ? { ...prev, showOnlineStatus: data.showOnlineStatus } : prev);

    } catch (error) {
      toast.error(getErrorMessage(error));
      // Revert on failure
      setUser((prev) => {
        if (!prev) return prev;
        return { ...prev, showOnlineStatus: !prev.showOnlineStatus };
      });
    }
  }, []);

  const toggleLastSeen = useCallback(async () => {
    // Optimistic Update
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, showLastSeen: !prev.showLastSeen };
    });

    try {
      const { data } = await axios.put("/api/user/last-seen");
      // Sync
      setUser((prev) => prev ? { ...prev, showLastSeen: data.showLastSeen } : prev);
    } catch (error) {
      toast.error(getErrorMessage(error));
      // Revert
      setUser((prev) => {
        if (!prev) return prev;
        return { ...prev, showLastSeen: !prev.showLastSeen };
      });
    }
  }, []);

  const registerPush = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;

    try {
      const register = await navigator.serviceWorker.register("/sw.js");

      // Handle Service Worker Updates
      register.addEventListener("updatefound", () => {
        const newWorker = register.installing;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // New update available!
            setWaitingWorker(newWorker);
            setShowUpdateModal(true);
          }
        });
      });

      // If there's already a waiting worker on load
      if (register.waiting && navigator.serviceWorker.controller) {
        setWaitingWorker(register.waiting);
        setShowUpdateModal(true);
      }

      // Listen for controllerchange to reload
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });

      const publicVapidKey = "BDEaakozjRUhtyPzgDajIBVFpiXIQBi36jcO3rmiyRXEIDk8DmRxRrUi7VNI0mi9NQ6r_i_Hq_K5rJD0HlNQhl8"; // Generated Key

      let subscription = await register.pushManager.getSubscription();

      if (!subscription) {
        subscription = await register.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
        });
      }

      await axios.post("/api/notifications/subscribe", subscription);
      // toast.success("Notifications Enabled!");
    } catch (error) {
      if (error.name === 'AbortError') {
        process.env.NODE_ENV === 'development' && console.warn("Push subscription skipped (AbortError).");
      } else {
        console.error("Push Error:", error);
      }
    }
  }, []);

  const searchUser = useCallback(async (query) => {
    try {
      const { data } = await axios.get(`/api/user/all?search=${query}`);
      return data.users;
    } catch (error) {
      // toast.error(getErrorMessage(error)); // Don't toast for search/suggestions
      return [];
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const value = useMemo(() => ({
    loginUser, isAuth, setIsAuth, user, setUser, loading,
    logoutUser, registerUser, followUser, updateProfilePic,
    updateProfileInfo, savePost, hidePost, muteUser, unmuteUser,
    togglePrivacy, removeFollower, blockUser, unblockUser,
    registerPush, showLoginPrompt, setShowLoginPrompt, searchUser, toggleOnlineStatus, toggleLastSeen,
    showUpdateModal, setShowUpdateModal, waitingWorker,
    applyUpdate: () => waitingWorker?.postMessage({ type: "SKIP_WAITING" })
  }), [loginUser, isAuth, user, loading, logoutUser, registerUser, followUser, updateProfilePic, updateProfileInfo, savePost, hidePost, muteUser, unmuteUser, togglePrivacy, removeFollower, blockUser, unblockUser, registerPush, showLoginPrompt, searchUser, toggleOnlineStatus, toggleLastSeen]);

  return (
    <UserContext.Provider value={value}>
      {children}
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
