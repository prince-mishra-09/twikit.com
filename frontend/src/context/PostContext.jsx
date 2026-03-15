import axios from "axios";
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import { SocketData } from "./SocketContext";

const PostContext = createContext();

export const PostContextProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReels, setLoadingReels] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMoreReels, setLoadingMoreReels] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    hasMorePosts: true,
  });
  const [reelsPagination, setReelsPagination] = useState({
    page: 1,
    hasMoreReels: true,
  });
  const [uploadProgress, setUploadProgress] = useState(0); // Add upload progress state
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadType, setUploadType] = useState('post');
  const { socket } = SocketData();


  const fetchPosts = useCallback(async (page = 1) => {
    try {
      const { data } = await axios.get(`/api/post/all?page=${page}&limit=20`);

      if (page === 1) {
        setPosts(data.posts);
      } else {
        setPosts(prev => {
          const newPosts = data.posts.filter(post => !prev.some(p => p._id === post._id));
          return [...prev, ...newPosts];
        });
      }

      setPagination({
        page: data.pagination.page,
        hasMorePosts: data.pagination.hasMorePosts,
      });

      setLoading(false);
      setLoadingMore(false);
    } catch (error) {
      // console.log(error);
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const fetchNextPage = useCallback(async () => {
    if (!pagination.hasMorePosts || loadingMore) return;
    setLoadingMore(true);
    await fetchPosts(pagination.page + 1);
  }, [pagination.hasMorePosts, pagination.page, loadingMore, fetchPosts]);

  const fetchReels = useCallback(async (page = 1) => {
    try {
      const { data } = await axios.get(`/api/post/reels?page=${page}&limit=20`);

      if (page === 1) {
        setReels(data.reels);
      } else {
        setReels(prev => {
          const newReels = data.reels.filter(reel => !prev.some(r => r._id === reel._id));
          return [...prev, ...newReels];
        });
      }

      setReelsPagination({
        page: data.pagination.page,
        hasMoreReels: data.pagination.hasMoreReels,
      });

      setLoadingReels(false);
      setLoadingMoreReels(false);
    } catch (error) {
      setLoadingReels(false);
      setLoadingMoreReels(false);
    }
  }, []);

  const fetchNextReelsPage = useCallback(async () => {
    if (!reelsPagination.hasMoreReels || loadingMoreReels) return;
    setLoadingMoreReels(true);
    await fetchReels(reelsPagination.page + 1);
  }, [reelsPagination.hasMoreReels, reelsPagination.page, loadingMoreReels, fetchReels]);

  const [addLoading, setAddLoading] = useState(false);



  const addPost = useCallback(async (formdata, setFile, setFilePrev, setCaption, type) => {
    setAddLoading(true);
    setUploadProgress(0);
    setUploadType(type);

    const fileBlob = formdata.get("file");
    if (fileBlob instanceof Blob) {
      setUploadPreview(URL.createObjectURL(fileBlob));
    } else {
      setUploadPreview(null);
    }

    try {
      const { data } = await axios.post("/api/post/new?type=" + type, formdata, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // Scale client upload progress to 90% to leave room for background ImageKit processing
          setUploadProgress(Math.floor(percentCompleted * 0.9));
        }
      });

      toast.success(data.message); // Should say "Post upload started"

      setFile("");
      setFilePrev("");
      setCaption("");
      // Don't setAddLoading(false) here — wait for socket `post:ready` or `post:failed`.
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
      setAddLoading(false);
      setUploadProgress(0);
    }
  }, []);

  // Centralized helper to update a post in all relevant global lists
  const syncPostUpdate = useCallback((updatedPost) => {
    if (!updatedPost?._id) return;
    const updateFn = (prev) => prev.map((p) => (p._id === updatedPost._id ? { ...p, ...updatedPost } : p));
    setPosts(updateFn);
    setReels(updateFn);
  }, []);

  const sendFeedback = useCallback(async (id, feedbackType) => {
    try {
      const { data } = await axios.post("/api/post/feedback/" + id, { feedbackType });
      // Update state immediately if data.post exists to ensure UI consistency
      if (data.post) {
        syncPostUpdate(data.post);
      }
      return data.post;
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
      throw error;
    }
  }, [syncPostUpdate]);

  const addComment = useCallback(async (id, comment, setComment, setShow, parentComment = null) => {
    try {
      const { data } = await axios.post("/api/comment/" + id, {
        comment,
        parentComment,
      });
      toast.success(data.message);

      // Optimistic Update: Increment comment count immediately
      syncPostUpdate({ _id: id, commentsCount: (posts.find(p => p._id === id)?.commentsCount || reels.find(r => r._id === id)?.commentsCount || 0) + 1 });

      setComment("");
      setShow(false);
      return data.comment; // Return the new comment to update UI
    } catch (error) {
      toast.error(error.response.data.message);
    }
  }, []);

  const deletePost = useCallback(async (id) => {
    setLoading(true);
    try {
      const { data } = await axios.delete("/api/post/" + id);

      toast.success(data.message);
      fetchPosts();
      setLoading(false);
    } catch (error) {
      toast.error(error.response.data.message);
      setLoading(false);
    }
  }, [fetchPosts]);

  const updatePost = useCallback(async (id, caption) => {
    try {
      const { data } = await axios.put("/api/post/caption/" + id, { caption });
      toast.success(data.message);

      // Optimistic Update
      const updateFn = (prev) => prev.map((p) => (p._id === id ? { ...p, caption } : p));
      setPosts(updateFn);
      setReels(updateFn);
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  }, []);

  const trackShare = useCallback(async (id, count = 1) => {
    try {
      // Optimistic Update
      const post = posts.find((p) => p._id === id) || reels.find((r) => r._id === id);
      syncPostUpdate({ _id: id, sharesCount: (post?.sharesCount || 0) + count });

      const { data } = await axios.post(`/api/post/${id}/share`, { count });

      // Sync with final backend data
      if (data.post) {
        syncPostUpdate(data.post);
        return data.post; // Return the updated post for component-level sync
      }
      return null;
    } catch (error) {
      console.error("Share tracking failed:", error);
      return null;
    }
  }, [posts, reels, syncPostUpdate]);

  const deleteComment = useCallback(async (id, commentId) => {
    try {
      const { data } = await axios.delete(`/api/comment/${commentId}`);

      toast.success(data.message);

      // Optimistic Update: Decrement comment count immediately
      const updateFn = (prev) =>
        prev.map((p) => {
          if (p._id === id) {
            return {
              ...p,
              commentsCount: Math.max((p.commentsCount || 0) - 1, 0)
            };
          }
          return p;
        });
      setPosts(updateFn);
      setReels(updateFn);

    } catch (error) {
      toast.error(error.response.data.message);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (!socket) return;

    socket.on("postVibeUpdated", (data) => {
      const updateFn = (prev) =>
        prev.map((p) =>
          p._id === data.postId
            ? {
              ...p,
              vibesUp: data.vibesUp,
            }
            : p
        );

      setPosts(updateFn);
      setReels(updateFn);
    });

    socket.on("postVibeDownUpdated", (data) => {
      // This is ONLY received by the owner
      const updateFn = (prev) =>
        prev.map((p) =>
          p._id === data.postId
            ? { ...p, vibesDown: data.vibesDown }
            : p
        );

      setPosts(updateFn);
      setReels(updateFn);
    });

    socket.on("postCommentUpdated", (data) => {
      setPosts((prev) =>
        prev.map((p) =>
          p._id === data.postId
            ? { ...p, comments: data.comments }
            : p
        )
      );

      setReels((prev) =>
        prev.map((r) =>
          r._id === data.postId
            ? { ...r, comments: data.comments }
            : r
        )
      );
    });

    socket.on("post:ready", (newPost) => {
      console.log("[SOCKET EVENT RECEIVED] post:ready ->", newPost);
      toast.success("Your post is ready!");
      // Always add to main feed (posts) regardless of type
      setPosts((prev) => [newPost, ...prev]);
      // If it's a reel, also add to reels specifically if UI sections need it
      if (newPost.type === "reel") {
        setReels((prev) => [newPost, ...prev]);
      }
      setUploadProgress(100);
      setTimeout(() => {
        setAddLoading(false);
        setUploadProgress(0);
        setUploadPreview((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
      }, 500);
    });

    socket.on("post:failed", (data) => {
      toast.error(data.message || "Post processing failed");
      setAddLoading(false);
      setUploadProgress(0);
      setUploadPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    });

    socket.on("postShareUpdated", (data) => {
      syncPostUpdate({ _id: data.postId, sharesCount: data.sharesCount });
    });

    socket.on("postSaveUpdated", (data) => {
      syncPostUpdate({ _id: data.postId, savesCount: data.savesCount });
    });

    return () => {
      socket.off("postVibeUpdated");
      socket.off("postVibeDownUpdated");
      socket.off("postCommentUpdated");
      socket.off("postShareUpdated");
      socket.off("postSaveUpdated");
      socket.off("post:ready");
      socket.off("post:failed");
    };
  }, [socket]);





  const value = useMemo(() => ({
    reels,
    posts,
    addPost,
    sendFeedback,
    addComment,
    loading,
    addLoading,
    fetchPosts,
    deletePost,
    deleteComment,
    fetchNextPage,
    loadingMore,
    pagination,
    uploadPreview,
    uploadType,
    updatePost,
    fetchReels,
    fetchNextReelsPage,
    loadingReels,
    loadingMoreReels,
    reelsPagination,
    trackShare,
    syncPostUpdate
  }), [reels, posts, addPost, sendFeedback, addComment, loading, addLoading, fetchPosts, deletePost, deleteComment, fetchNextPage, loadingMore, pagination, uploadPreview, uploadType, updatePost, fetchReels, fetchNextReelsPage, loadingReels, loadingMoreReels, reelsPagination, trackShare, syncPostUpdate]);

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  );
};

export const PostData = () => useContext(PostContext);