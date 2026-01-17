import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
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
  const { socket } = SocketData();


  async function fetchPosts(page = 1) {
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
  }

  async function fetchNextPage() {
    if (!pagination.hasMorePosts || loadingMore) return;
    setLoadingMore(true);
    await fetchPosts(pagination.page + 1);
  }

  const [addLoading, setAddLoading] = useState(false);



  async function addPost(formdata, setFile, setFilePrev, setCaption, type) {
    setAddLoading(true);
    try {
      const { data } = await axios.post("/api/post/new?type=" + type, formdata);

      toast.success(data.message);
      fetchPosts();
      setFile("");
      setFilePrev("");
      setCaption("");
      setAddLoading(false);
    } catch (error) {
      toast.error(error.response.data.message);
      setAddLoading(false);
    }
  }

  async function sendFeedback(id, feedbackType) {
    try {
      const { data } = await axios.post("/api/post/feedback/" + id, { feedbackType });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  }

  async function addComment(id, comment, setComment, setShow, parentComment = null) {
    try {
      const { data } = await axios.post("/api/comment/" + id, {
        comment,
        parentComment,
      });
      toast.success(data.message);
      fetchPosts();
      setComment("");
      setShow(false);
      return data.comment; // Return the new comment to update UI
    } catch (error) {
      toast.error(error.response.data.message);
    }
  }

  async function deletePost(id) {
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
  }

  async function deleteComment(id, commentId) {
    try {
      const { data } = await axios.delete(`/api/comment/${commentId}`);

      toast.success(data.message);
      fetchPosts();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("postRealUpdated", (data) => {
      const updateFn = (prev) =>
        prev.map((p) =>
          p._id === data.postId
            ? {
              ...p,
              reals: data.reals,
              // If real was added, and it's mutually exclusive, we should ideally 
              // remove user from reflections too if we have that data. 
              // But the backend only emits reals here. 
              // For perfection, we'd need to emit both if both changed.
              // However, the backend logic handles this on the Next turn or within the same turn.
              // If the user is the owner, they get a separate reflection update.
            }
            : p
        );

      setPosts(updateFn);
      setReels(updateFn);
    });

    socket.on("postReflectionUpdated", (data) => {
      // This is ONLY received by the owner
      const updateFn = (prev) =>
        prev.map((p) =>
          p._id === data.postId
            ? { ...p, reflections: data.reflections }
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

    return () => {
      socket.off("postRealUpdated");
      socket.off("postReflectionUpdated");
      socket.off("postCommentUpdated");
    };
  }, [socket]);





  return (
    <PostContext.Provider
      value={{
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
        pagination
      }}
    >
      {children}
    </PostContext.Provider>
  );
};

export const PostData = () => useContext(PostContext);