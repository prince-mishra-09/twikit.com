import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Post from "../components/PostCard";
import { Loading } from "../components/Loading";

const PostDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const commentId = searchParams.get("commentId");

  const [post, setPost] = useState(null);
  const [morePosts, setMorePosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      try {
        const { data } = await axios.get(`/api/post/${id}`);
        setPost(data);
        const { data: randomPosts } = await axios.get("/api/post/random");
        setMorePosts(randomPosts.filter(p => p._id !== id));
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.log(error);
      }
    }
    fetchPost();
  }, [id]);

  if (loading) return <Loading />;

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0B0F14] flex justify-center items-center text-white">
        <h1>Post Not Found</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] px-4 py-6">
      <div className="max-w-xl mx-auto">
        <Post post={post} commentId={commentId} />

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
