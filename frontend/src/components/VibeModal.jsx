import axios from "axios";
import React, { useEffect, useState } from "react";
import { LoadingAnimation } from "./Loading";
import { Link } from "react-router-dom";
import { getOptimizedImage } from "../utils/imagekitUtils";

const VibeModal = ({ isOpen, onClose, id }) => {
  if (!isOpen) return null;

  const [value, setValue] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchPost() {
    try {
      const { data } = await axios.get("/api/post/" + id);
      setValue(data);
    } catch (error) {
      // console.log(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPost();
  }, [id]);

  const vibesUp = value?.vibesUp || [];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[var(--overlay)] backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[var(--card-bg)]/90 backdrop-blur-xl border border-[var(--border)]/20 rounded-2xl shadow-2xl p-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[var(--text-primary)] font-medium">✨ Vibed up by</h2>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xl"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-6">
            <LoadingAnimation />
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto space-y-3 custom-scrollbar">
            {vibesUp.length > 0 ? (
              vibesUp.map((e, i) => (
                <Link
                  key={i}
                  to={`/user/${e?._id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--text-primary)]/5 transition"
                >
                  <img
                    src={getOptimizedImage(e?.profilePic?.url, { isProfilePic: true, updatedAt: e?.updatedAt, width: 100 }) || "https://placehold.co/400"}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <span className="text-[var(--text-primary)] text-sm font-medium">
                    {e?.name || "Unknown User"}
                  </span>
                </Link>
              ))
            ) : (
               <p className="text-[var(--text-secondary)] text-sm text-center py-6">
                No vibes yet
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VibeModal;
