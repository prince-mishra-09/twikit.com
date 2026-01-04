import React from "react";

const SimpleModal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      
      {/* Modal Card */}
      <div className="w-full max-w-sm mx-4 bg-[#111827]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5 animate-fadeIn">
        
        {/* Close Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl transition"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3 mt-2">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SimpleModal;
