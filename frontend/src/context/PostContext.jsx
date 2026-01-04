import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { SocketData } from "./SocketContext";

const PostContext = createContext();

export const PostContextProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ HOOK YAHAN – TOP LEVEL
  const { socket } = SocketData();

  async function fetchPosts() {
    try {
      const { data } = await axios.get("/api/post/all");
      setPosts(data.posts);
      setReels(data.reels);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  }

  async function likePost(id) {
    try {
      await axios.post("/api/post/like/" + id);

      // optimistic update (instant UI)
      setPosts(prev =>
        prev.map(p =>
          p._id === id
            ? {
                ...p,
                likes: p.likes.includes("me")
                  ? p.likes
                  : [...p.likes, "me"],
              }
            : p
        )
      );
    } catch (error) {
      toast.error("Like failed");
    }
  }

  // ✅ socket listener
  useEffect(() => {
    if (!socket) return;

    socket.on("postLiked", ({ postId, likes }) => {
      setPosts(prev =>
        prev.map(p =>
          p._id === postId ? { ...p, likes } : p
        )
      );
    });

    return () => socket.off("postLiked");
  }, [socket]);

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <PostContext.Provider
      value={{
        posts,
        reels,
        loading,
        likePost,
        fetchPosts,
      }}
    >
      {children}
    </PostContext.Provider>
  );
};

export const PostData = () => useContext(PostContext);
