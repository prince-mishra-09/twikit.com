import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AiOutlineHome, AiFillHome } from "react-icons/ai";
import { BsCameraReelsFill, BsCameraReels } from "react-icons/bs";
import { IoSearchCircleOutline, IoSearchCircle } from "react-icons/io5";
import {
  IoChatbubbleEllipses,
  IoChatbubbleEllipsesOutline,
} from "react-icons/io5";
import { RiAccountCircleFill, RiAccountCircleLine } from "react-icons/ri";

const NavigationBar = () => {
  const [tab, setTab] = useState(window.location.pathname);

  const activeStyle =
    "text-indigo-400 scale-110";
  const inactiveStyle =
    "text-gray-400 hover:text-gray-200";

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md">
      
      {/* Glass Bar */}
      <div className="flex justify-around items-center bg-[#111827]/80 backdrop-blur-xl border border-white/10 rounded-2xl py-3 shadow-2xl">
        
        {/* Home */}
        <Link
          to="/"
          onClick={() => setTab("/")}
          className={`text-2xl transition-all duration-200 ${
            tab === "/" ? activeStyle : inactiveStyle
          }`}
        >
          {tab === "/" ? <AiFillHome /> : <AiOutlineHome />}
        </Link>

        {/* Reels */}
        <Link
          to="/reels"
          onClick={() => setTab("/reels")}
          className={`text-2xl transition-all duration-200 ${
            tab === "/reels" ? activeStyle : inactiveStyle
          }`}
        >
          {tab === "/reels" ? <BsCameraReelsFill /> : <BsCameraReels />}
        </Link>

        {/* Search (highlighted center feel) */}
        <Link
          to="/search"
          onClick={() => setTab("/search")}
          className={`text-3xl transition-all duration-200 ${
            tab === "/search"
              ? "text-cyan-400 scale-125"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          {tab === "/search" ? (
            <IoSearchCircle />
          ) : (
            <IoSearchCircleOutline />
          )}
        </Link>

        {/* Chat */}
        <Link
          to="/chat"
          onClick={() => setTab("/chat")}
          className={`text-2xl transition-all duration-200 ${
            tab === "/chat" ? activeStyle : inactiveStyle
          }`}
        >
          {tab === "/chat" ? (
            <IoChatbubbleEllipses />
          ) : (
            <IoChatbubbleEllipsesOutline />
          )}
        </Link>

        {/* Account */}
        <Link
          to="/account"
          onClick={() => setTab("/account")}
          className={`text-2xl transition-all duration-200 ${
            tab === "/account" ? activeStyle : inactiveStyle
          }`}
        >
          {tab === "/account" ? (
            <RiAccountCircleFill />
          ) : (
            <RiAccountCircleLine />
          )}
        </Link>
      </div>
    </div>
  );
};

export default NavigationBar;
