import axios from "axios";
import React, { useEffect, useState } from "react";
import { LoadingAnimation } from "./Loading";
import { Link } from "react-router-dom";

const LikeModal = ({ isOpen, onClose, id }) => {
  if (!isOpen) return null;

  const [value, setValue] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchLikes() {
    try {
      const { data } = await axios.get("/api/post/" + id);
      setValue(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLikes();
  }, [id]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#111827]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-medium">Liked by</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
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
          <div className="max-h-[300px] overflow-y-auto space-y-3">
            {value && value.length > 0 ? (
              value.map((e, i) => (
                <Link
                  key={i}
                  to={`/user/${e._id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition"
                >
                  <img
                    src={e.profilePic.url}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <span className="text-gray-200 text-sm font-medium">
                    {e.name}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-gray-400 text-sm text-center py-6">
                No likes yet
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LikeModal;
