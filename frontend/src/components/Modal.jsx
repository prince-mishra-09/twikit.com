import React from "react";
import { Link } from "react-router-dom";

const Modal = ({ value, title, setShow, onRemove }) => {
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
                key={i}
                onClick={() => setShow(false)}
                className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-white/5 transition group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={e.profilePic.url}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <span className="text-gray-200 text-sm font-medium">
                    {e.name}
                  </span>
                </div>
                {onRemove && (
                  <button
                    onClick={(ev) => {
                      ev.preventDefault();
                      ev.stopPropagation();
                      onRemove(e._id);
                    }}
                    className="text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white text-xs px-3 py-1.5 rounded-full transition-all font-medium"
                  >
                    Remove
                  </button>
                )}
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
