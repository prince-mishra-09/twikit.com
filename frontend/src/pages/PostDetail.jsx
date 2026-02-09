import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Post from "../components/PostCard";

import { SkeletonPost } from "../components/Skeleton";

const PostDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const commentId = searchParams.get("commentId");
  const openComments = searchParams.get("openComments") === "true";

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        // Fetch the specific post
        const { data: mainPost } = await axios.get(`/api/post/${id}`);

        // Fetch more posts for the feed
        const { data: randomPosts } = await axios.get("/api/post/random");

        // Combine: main post first, then unique random posts
        const filteredRandom = randomPosts.filter(p => p._id !== id && p.type !== 'reel');
        setPosts([mainPost, ...filteredRandom]);

        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.log(error);
      }
    }
    fetchPosts();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex justify-center px-4 py-8">
      <div className="w-full max-w-xl">
        <SkeletonPost />
      </div>
    </div>
  );

  if (posts.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex justify-center items-center text-[var(--text-primary)]">
        <h1>Post Not Found</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex justify-center px-4 py-2">
      <div className="w-full max-w-xl flex flex-col gap-6">
        <Link to="/" className="inline-flex items-center gap-2 text-[var(--text-primary)] self-start hover:bg-[var(--text-primary)]/10 px-3 py-1.5 rounded-full transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Feed
        </Link>

        <div className="flex flex-col gap-4">
          {posts.map((post, index) => (
            <div key={post._id}>
              {/* Only pass comment params to the first post (the one requested) */}
              <Post
                value={post}
                commentId={index === 0 ? commentId : null}
                openComments={index === 0 ? openComments : false}
              />
              {/* Add a divider between posts except the last one if needed, but flex gap handles spacing */}
            </div>
          ))}
        </div>

        <div className="text-center py-8">
          <p className="text-[var(--text-secondary)] text-sm">You've reached the end</p>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
