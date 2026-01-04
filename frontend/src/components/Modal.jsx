import React from "react";
import { Link } from "react-router-dom";

const Modal = ({ value, title, setShow }) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      
      {/* Card */}
      <div className="w-full max-w-sm bg-[#111827]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5 mx-4">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white font-medium text-lg">
            {title}
          </h1>
          <button
            onClick={() => setShow(false)}
            className="text-gray-400 hover:text-white text-xl transition"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[300px] overflow-y-auto space-y-3">
          {value && value.length > 0 ? (
            value.map((e, i) => (
              <Link
                to={`/user/${e._id}`}
                key={i}
                onClick={() => setShow(false)}
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
              No {title} yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
