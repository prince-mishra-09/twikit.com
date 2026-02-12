import React from "react";
import { FaTools } from "react-icons/fa";

const Maintenance = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl text-center max-w-md w-full border border-gray-700">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-purple-600/20 rounded-full animate-pulse">
                        <FaTools className="text-6xl text-purple-500" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                    Under Maintenance
                </h1>

                <p className="text-gray-400 mb-8 text-lg">
                    We are currently squashing some bugs to improve your experience. Twikit will be back shortly!
                </p>

                <div className="w-full bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full w-2/3 animate-[loading_2s_ease-in-out_infinite]"></div>
                </div>

                <p className="text-sm text-gray-500">
                    Estimated return: Soon™
                </p>
            </div>

            {/* Animation Keyframes using inline style for simplicity or verify index.css generic classes */}
            <style>{`
        @keyframes loading {
          0% { width: 10%; margin-left: 0; }
          50% { width: 50%; margin-left: 25%; }
          100% { width: 10%; margin-left: 90%; }
        }
      `}</style>
        </div>
    );
};

export default Maintenance;
