import React from "react";
import { UserData } from "../../context/UserContext";
import { BsSendCheck } from "react-icons/bs";

const Chat = ({ chat, setSelectedChat, isOnline, unreadCount }) => {
  const { user: loggedInUser } = UserData();
  let user;
  if (chat) user = chat.users[0];

  return (
    <>
      {user && (
        <div
          onClick={() => setSelectedChat(chat)}
          className="flex items-center gap-3 px-3 py-2 cursor-pointer
          hover:bg-[var(--text-primary)]/5 transition-all"
        >
          {/* Avatar */}
          <div className="relative">
            <img
              src={user.profilePic?.url}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />

            {/* Online Dot */}
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[var(--bg-primary)]" />
            )}
          </div>

          {/* Name + Last Message */}
          <div className="flex-1 overflow-hidden">
            <p className="text-[var(--text-primary)] font-medium text-sm truncate">
              {user.name}
            </p>

            <div className="flex items-center gap-1 text-[var(--text-secondary)] text-xs truncate">
              {loggedInUser && chat?.latestMessage && loggedInUser._id === chat.latestMessage.sender && (
                <BsSendCheck className="text-[var(--accent)] text-sm" />
              )}
              <span>
                {chat?.latestMessage?.text ? (
                  chat.latestMessage.text.length > 22
                    ? chat.latestMessage.text.slice(0, 22) + "…"
                    : chat.latestMessage.text
                ) : (
                  "No messages yet"
                )}
              </span>
            </div>
          </div>

          {(unreadCount > 0) && (
            <div className="flex flex-col items-end gap-1">
              <span className="bg-[#3450bf] text-black text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {unreadCount}
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default React.memo(Chat);
