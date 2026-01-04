import React from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center overflow-hidden relative">
      
      {/* Background glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>

      {/* Card */}
      <div className="relative z-10 bg-[#111827]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-10 text-center max-w-md w-full mx-4">
        
        <p className="text-sm uppercase tracking-widest text-gray-400">
          Twikit
        </p>

        <h1 className="text-7xl font-bold text-white mt-4">
          404
        </h1>

        <h2 className="text-xl font-medium text-gray-200 mt-2">
          Page not found
        </h2>

        <p className="text-gray-400 mt-3">
          Sorry, the page you’re looking for doesn’t exist or was moved.
        </p>

        <button
          onClick={() => navigate("/")}
          className="mt-6 w-full py-3 rounded-xl text-white font-medium bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-90 active:scale-[0.98] transition"
        >
          Go back home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
