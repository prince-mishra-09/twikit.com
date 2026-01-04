import React from "react";
import { UserData } from "../../context/UserContext";
import { BsSendCheck } from "react-icons/bs";

const Chat = ({ chat, setSelectedChat, isOnline }) => {
  const { user: loggedInUser } = UserData();
  let user;
  if (chat) user = chat.users[0];

  return (
    <>
      {user && (
        <div
          onClick={() => setSelectedChat(chat)}
          className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer
          bg-[#0B0F14]/60 hover:bg-[#0B0F14] transition border border-white/5"
        >
          {/* Avatar */}
          <div className="relative">
            <img
              src={user.profilePic.url}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />

            {/* Online Dot */}
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#0B0F14]" />
            )}
          </div>

          {/* Name + Last Message */}
          <div className="flex-1 overflow-hidden">
            <p className="text-white font-medium text-sm truncate">
              {user.name}
            </p>

            <div className="flex items-center gap-1 text-gray-400 text-xs truncate">
              {loggedInUser._id === chat.latestMessage.sender && (
                <BsSendCheck className="text-indigo-400 text-sm" />
              )}
              <span>
                {chat.latestMessage.text.length > 22
                  ? chat.latestMessage.text.slice(0, 22) + "…"
                  : chat.latestMessage.text}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chat;
