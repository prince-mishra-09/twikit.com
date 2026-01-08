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
        <Link to="/" className="inline-flex items-center gap-2 text-white mb-4 hover:bg-white/10 px-3 py-1.5 rounded-full transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Home
        </Link>

        <Post value={post} commentId={commentId} />

        <h3 className="text-white mt-8 mb-4 font-semibold text-lg">More posts</h3>

        <div className="grid grid-cols-3 gap-2 mb-8">
          {morePosts.map(p => (
            <Link key={p._id} to={`/post/${p._id}`}>
              <img
                src={p.image.url}
                className="aspect-square object-cover rounded-lg hover:opacity-80 transition-opacity"
              />
            </Link>
          ))}
        </div>

        <Link to="/" className="block w-full text-center py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all">
          Go to Home
        </Link>
      </div>
    </div>
  );
};

export default PostDetail;
