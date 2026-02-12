import axios from "axios";
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import { SocketData } from "./SocketContext";

const PostContext = createContext();

export const PostContextProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    hasMorePosts: true,
    hasMoreReels: true
  });
  const [uploadProgress, setUploadProgress] = useState(0); // Add upload progress state
  const { socket } = SocketData();


  const fetchPosts = useCallback(async (page = 1) => {
    try {
      const { data } = await axios.get(`/api/post/all?page=${page}&limit=20`);

      if (page === 1) {
        setPosts(data.posts);
        setReels(data.reels);
      } else {
        // Append new posts for pagination
        setPosts(prev => [...prev, ...data.posts]);
        setReels(prev => [...prev, ...data.reels]);
      }

      setPagination({
        page: data.pagination.page,
        hasMorePosts: data.pagination.hasMorePosts,
        hasMoreReels: data.pagination.hasMoreReels
      });

      setLoading(false);
      setLoadingMore(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const fetchNextPage = useCallback(async () => {
    if (!pagination.hasMorePosts || loadingMore) return;
    setLoadingMore(true);
    await fetchPosts(pagination.page + 1);
  }, [pagination.hasMorePosts, pagination.page, loadingMore, fetchPosts]);

  const [addLoading, setAddLoading] = useState(false);



  const addPost = useCallback(async (formdata, setFile, setFilePrev, setCaption, type) => {
    setAddLoading(true);
    setUploadProgress(0);
    try {
      const { data } = await axios.post("/api/post/new?type=" + type, formdata, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      toast.success(data.message);
      // fetchPosts(); // Don't fetch immediately, wait for socket or optimistic update? 
      // The server returns 202 Accepted, so the post isn't ready yet.
      // We rely on socket "post:ready" to add it to the feed.

      setFile("");
      setFilePrev("");
      setCaption("");
      setAddLoading(false);
      setUploadProgress(0);
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
      setAddLoading(false);
      setUploadProgress(0);
    }
  }, []);

  const sendFeedback = useCallback(async (id, feedbackType) => {
    try {
      const { data } = await axios.post("/api/post/feedback/" + id, { feedbackType });
      // Update state immediately if data.post exists to ensure UI consistency
      if (data.post) {
        const updateFn = (prev) => prev.map((p) => (p._id === id ? { ...p, ...data.post } : p));
        setPosts(updateFn);
        setReels(updateFn);
      }
      return data.post;
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
      throw error;
    }
  }, []);

  const addComment = useCallback(async (id, comment, setComment, setShow, parentComment = null) => {
    try {
      const { data } = await axios.post("/api/comment/" + id, {
        comment,
        parentComment,
      });
      toast.success(data.message);

      // Optimistic Update: Increment comment count immediately
      const updateFn = (prev) =>
        prev.map((p) => {
          if (p._id === id) {
            return { ...p, commentsCount: (p.commentsCount || 0) + 1 };
          }
          return p;
        });
      setPosts(updateFn);
      setReels(updateFn);

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
      toast.success("Your post is ready!");
      setPosts((prev) => [newPost, ...prev]);
      if (newPost.type === "reel") {
        setReels((prev) => [newPost, ...prev]);
      }
    });

    socket.on("post:failed", (data) => {
      toast.error(data.message || "Post processing failed");
    });

    return () => {
      socket.off("postVibeUpdated");
      socket.off("postVibeDownUpdated");
      socket.off("postCommentUpdated");
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
    uploadProgress,
    updatePost
  }), [reels, posts, addPost, sendFeedback, addComment, loading, addLoading, fetchPosts, deletePost, deleteComment, fetchNextPage, loadingMore, pagination, uploadProgress, updatePost]);

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  );
};

export const PostData = () => useContext(PostContext);