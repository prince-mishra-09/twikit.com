import axios from "axios";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LoadingAnimation } from "../components/Loading";
import { FaSearch } from "react-icons/fa";
import PostCard from "../components/PostCard";

const Search = () => {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchUsers() {
    if (!search.trim()) {
      setUsers([]);
      setPosts([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get(
        "/api/user/all?search=" + search.trim()
      );
      // data = { users: [], posts: [] }
      setUsers(data.users || []);
      setPosts(data.posts || []);
    } catch (error) {
      console.log(error);
      setUsers([]);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  // Split users into top 10 and remaining
  const topUsers = users.slice(0, 10);
  const remainingUsers = users.slice(10);

  return (
    <div className="min-h-screen bg-[#0B0F14] flex justify-center px-0 pt-2 pb-20">
      <div className="w-full max-w-xl px-4">

        {/* SEARCH BAR (Fixed at top or just normal flow) */}
        <div className="sticky top-2 z-20 flex items-center gap-3 bg-[#111827]/90 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 mb-6 shadow-lg shadow-indigo-500/10">
          <FaSearch className="text-gray-400" />
          <input
            type="text"
            className="flex-1 bg-transparent outline-none text-white placeholder-gray-400"
            placeholder="Search @username or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
            autoFocus
          />
          <button
            onClick={fetchUsers}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
          >
            Search
          </button>
        </div>

        {/* RESULTS */}
        <div>
          {loading ? (
            <div className="flex justify-center mt-10">
              <LoadingAnimation />
            </div>
          ) : (users.length > 0 || posts.length > 0) ? (
            <div className="space-y-4">

              {/* 1. Top 10 Users */}
              {topUsers.map((u) => (
                <Link
                  key={u._id}
                  to={`/user/${u._id}`}
                  className="flex items-start gap-4 px-4 py-4 rounded-xl bg-[#1F2937]/50 border border-white/5 hover:bg-[#1F2937] transition-all"
                >
                  <img
                    src={u?.profilePic?.url || "/default-avatar.png"}
                    alt="profile"
                    className="w-12 h-12 rounded-full object-cover border border-white/10 shrink-0"
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <p className="text-white font-bold text-base truncate">{u.name}</p>
                    <p className="text-gray-500 text-sm truncate">@{u.username}</p>
                    {u.bio && (
                      <p className="text-gray-400 text-xs mt-1.5 line-clamp-2 break-words leading-relaxed">
                        {u.bio}
                      </p>
                    )}
                  </div>
                </Link>
              ))}

              {/* 2. Posts from these users */}
              {posts.length > 0 && (
                <div className="pt-4 pb-2">
                  <h3 className="text-indigo-400 font-semibold text-sm mb-3 px-2 uppercase tracking-wider">Posts from results</h3>
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <PostCard key={post._id} value={post} type="post" />
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Remaining Users */}
              {remainingUsers.length > 0 && (
                <div className="pt-2">
                  {posts.length > 0 && <h3 className="text-gray-400 font-semibold text-sm mb-3 px-2 uppercase tracking-wider">More Profiles</h3>}
                  {remainingUsers.map((u) => (
                    <Link
                      key={u._id}
                      to={`/user/${u._id}`}
                      className="flex items-start gap-4 px-4 py-4 rounded-xl bg-[#1F2937]/50 border border-white/5 hover:bg-[#1F2937] transition-all mb-4"
                    >
                      <img
                        src={u?.profilePic?.url || "/default-avatar.png"}
                        alt="profile"
                        className="w-12 h-12 rounded-full object-cover border border-white/10 shrink-0"
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <p className="text-white font-bold text-base truncate">{u.name}</p>
                        <p className="text-gray-500 text-sm truncate">@{u.username}</p>
                        {u.bio && (
                          <p className="text-gray-400 text-xs mt-1.5 line-clamp-2 break-words leading-relaxed">
                            {u.bio}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

            </div>
          ) : search.trim() ? (
            <div className="text-center mt-10">
              <p className="text-gray-400 text-lg font-medium">No results found for "{search}"</p>
              <p className="text-gray-600 text-sm mt-2">Try searching for a specific username or name.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center mt-20 opacity-50">
              <FaSearch className="text-6xl text-gray-700 mb-4" />
              <p className="text-gray-500">Search for people, posts, and more</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
