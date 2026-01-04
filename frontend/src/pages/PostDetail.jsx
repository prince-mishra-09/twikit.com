import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Post from "../components/PostCard";

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [morePosts, setMorePosts] = useState([]);

  useEffect(() => {
    axios.get(`/api/post/${id}`).then(res => setPost(res.data));
    axios.get("/api/post/random").then(res =>
      setMorePosts(res.data.filter(p => p._id !== id))
    );
  }, [id]);

  if (!post) return null;

  return (
    <div className="min-h-screen bg-[#0B0F14] px-4 py-6">
      <div className="max-w-xl mx-auto">
        <Post post={post} />

        <h3 className="text-white mt-8 mb-4">More posts</h3>

        <div className="grid grid-cols-3 gap-2">
          {morePosts.map(p => (
            <Link key={p._id} to={`/post/${p._id}`}>
              <img
                src={p.image.url}
                className="aspect-square object-cover rounded-lg"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
