import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AiOutlineHome, AiFillHome, AiOutlinePlus } from "react-icons/ai";
import { BsCameraReelsFill, BsCameraReels } from "react-icons/bs";
import { IoSearchCircleOutline, IoSearchCircle } from "react-icons/io5";
import { RiAccountCircleFill, RiAccountCircleLine } from "react-icons/ri";
import CreatePostModal from "./CreatePostModal";

const NavigationBar = () => {
  const [tab, setTab] = useState(window.location.pathname);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const activeStyle = "text-indigo-400 scale-110";
  const inactiveStyle = "text-gray-400 hover:text-white transition";

  return (
    <>
      {showCreateModal && <CreatePostModal setShow={setShowCreateModal} />}

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md">
        {/* Glass Bar */}
        <div className="flex justify-between items-center bg-[#111827]/80 backdrop-blur-xl border border-white/10 rounded-2xl py-3 px-6 shadow-2xl">

          {/* Home */}
          <Link
            to="/"
            onClick={() => setTab("/")}
            className={`text-2xl transition-all duration-200 ${tab === "/" ? activeStyle : inactiveStyle
              }`}
          >
            {tab === "/" ? <AiFillHome /> : <AiOutlineHome />}
          </Link>

          {/* Search */}
          <Link
            to="/search"
            onClick={() => setTab("/search")}
            className={`text-2xl transition-all duration-200 ${tab === "/search" ? activeStyle : inactiveStyle
              }`}
          >
            {tab === "/search" ? <IoSearchCircle className="text-3xl" /> : <IoSearchCircleOutline className="text-3xl" />}
          </Link>

          {/* ADD POST BUTTON (CENTER) */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 hover:scale-105 transition-all -mt-8 border-4 border-[#0B0F14]"
          >
            <AiOutlinePlus className="text-2xl font-bold" />
          </button>

          {/* Reels */}
          <Link
            to="/reels"
            onClick={() => setTab("/reels")}
            className={`text-2xl transition-all duration-200 ${tab === "/reels" ? activeStyle : inactiveStyle
              }`}
          >
            {tab === "/reels" ? <BsCameraReelsFill /> : <BsCameraReels />}
          </Link>

          {/* Account */}
          <Link
            to="/account"
            onClick={() => setTab("/account")}
            className={`text-2xl transition-all duration-200 ${tab === "/account" ? activeStyle : inactiveStyle
              }`}
          >
            {tab === "/account" ? <RiAccountCircleFill /> : <RiAccountCircleLine />}
          </Link>
        </div>
      </div>
    </>
  );
};

export default NavigationBar;
