import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { getOptimizedImage } from "../utils/imagekitUtils";

const Modal = ({ value, title, setShow, onRemove }) => {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--overlay)] backdrop-blur-sm">
        {/* Backdrop for exit click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 cursor-default"
          onClick={() => setShow(false)}
        />

        {/* Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-sm bg-[var(--card-bg)]/90 backdrop-blur-xl border border-[var(--border)]/20 rounded-2xl shadow-2xl p-5 mx-4 relative z-10"
        >

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-[var(--text-primary)] font-medium text-lg">
              {title}
            </h1>
            <button
              onClick={() => setShow(false)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xl transition"
            >
              &times;
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[300px] overflow-y-auto space-y-3 custom-scrollbar">
            {value && value.length > 0 ? (
              value.map((e, i) => (
                <Link
                  key={i}
                  to={`/user/${e?._id}`}
                  onClick={() => setShow(false)}
                   className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-[var(--text-primary)]/5 transition group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      loading="lazy"
                      decoding="async"
                      src={getOptimizedImage(e?.profilePic?.url, { isProfilePic: true, updatedAt: e?.updatedAt, width: 100 }) || "https://placehold.co/400"}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover border border-white/10"
                    />
                    <span className="text-gray-200 text-sm font-medium">
                      {e?.name || "Unknown User"}
                    </span>
                  </div>
                  {onRemove && e?._id && (
                    <button
                      onClick={(ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        onRemove(e._id);
                      }}
                      className="text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white text-xs px-3 py-1.5 rounded-full transition-all font-medium border border-red-500/50"
                    >
                      Remove
                    </button>
                  )}
                </Link>
              ))
            ) : (
              <p className="text-[var(--text-secondary)] text-sm text-center py-6">
                No {title.toLowerCase()} yet
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default Modal;
