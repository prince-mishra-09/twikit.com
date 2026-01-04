import axios from "axios";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LoadingAnimation } from "../components/Loading";
import { FaSearch } from "react-icons/fa";

const Search = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchUsers() {
    if (!search.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get(
        "/api/user/all?search=" + search.trim()
      );
      setUsers(data || []);
    } catch (error) {
      console.log(error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] flex justify-center px-3 pt-10">
      <div className="w-full max-w-md">

        {/* SEARCH BAR */}
        <div className="flex items-center gap-3 bg-[#111827]/80 border border-white/10 rounded-xl px-4 py-3">
          <FaSearch className="text-gray-400" />
          <input
            type="text"
            className="flex-1 bg-transparent outline-none text-white placeholder-gray-400"
            placeholder="Search people..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
          />
          <button
            onClick={fetchUsers}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm"
          >
            Search
          </button>
        </div>

        {/* RESULTS */}
        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="flex justify-center mt-6">
              <LoadingAnimation />
            </div>
          ) : users.length > 0 ? (
            users.map((u) => (
              <Link
                key={u._id}
                to={`/user/${u._id}`}
                className="flex items-center gap-4 px-4 py-3 rounded-xl bg-[#111827]/70 border border-white/10 hover:bg-[#111827]"
              >
                <img
                  src={
                    u?.profilePic?.url ||
                    "/default-avatar.png"   // ✅ public folder image
                  }
                  alt="profile"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <p className="text-white font-medium">{u.name}</p>
              </Link>
            ))
          ) : search.trim() ? (
            <p className="text-center text-gray-400 text-sm mt-6">
              No users found
            </p>
          ) : (
            <p className="text-center text-gray-500 text-sm mt-8">
              Search users to discover profiles 👀
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
