export const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0F14] gap-6">
      
      {/* Spinner */}
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-cyan-500 animate-spin"></div>
      </div>

      {/* Text */}
      <div className="text-center">
        <p className="text-gray-300 text-sm">
          Twikit is thinking…
        </p>
        <p className="text-gray-500 text-xs mt-1">
          assembling pixels & vibes ✨
        </p>
      </div>
    </div>
  );
};

export const LoadingAnimation = () => {
  return (
    <div className="flex items-center gap-2">
      
      {/* Mini spinner */}
      <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-indigo-400 animate-spin"></div>

      {/* Fun text */}
      <span className="text-xs text-gray-300">
        loading…
      </span>
    </div>
  );
};
