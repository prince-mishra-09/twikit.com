import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import { UserData } from "./context/UserContext";
import Account from "./pages/Account";
import NavigationBar from "./components/NavigationBar";
import NotFound from "./components/NotFound";
import Reels from "./pages/Reels";
import { Loading } from "./components/Loading";
import UserAccount from "./pages/UserAccount";
import Search from "./pages/Search";
import ChatPage from "./pages/ChatPage";
import TwikitLanding from "./pages/TwikitLanding";
import PostDetail from "./pages/PostDetail";
import { SocketData } from "./context/SocketContext";
import { NotificationProvider } from "./context/NotificationContext";
import { StoriesProvider } from "./context/StoriesContext";
import Notifications from "./pages/Notifications";
import { useEffect } from "react";
import LoginPromptModal from "./components/LoginPromptModal";

function App() {
  const { loading, isAuth, user, setUser } = UserData();
  const { socket } = SocketData();

  useEffect(() => {
    if (socket && user) {
      socket.on("userFollowed", (data) => {
        if (data.followerId === user._id) {
          // I followed someone, update my following list
          setUser((prev) => ({
            ...prev,
            followings: prev.followings?.includes(data.followingId)
              ? prev.followings.filter(id => id !== data.followingId)
              : [...(prev.followings || []), data.followingId]
          }));
        } else if (data.followingId === user._id) {
          // Someone followed me, update my followers list
          setUser((prev) => ({
            ...prev,
            followers: prev.followers?.includes(data.followerId)
              ? prev.followers.filter(id => id !== data.followerId)
              : [...(prev.followers || []), data.followerId]
          }));
        }
      });
      return () => socket.off("userFollowed");
    }
  }, [socket, user, setUser]);

  return (
    <>
      <Toaster position="top-center" />
      <Toaster position="top-center" />
      <LoginPromptModal />
      {loading ? <Loading /> : <BrowserRouter><NotificationProvider><StoriesProvider>
        <Routes>
          <Route path="/landing" element={<TwikitLanding />} />
          <Route path="/" element={<Home />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/user/:id" element={<UserAccount user={user} />} />
          <Route path="/account" element={isAuth ? <Account user={user} /> : <Login />} />
          <Route path="/register" element={!isAuth ? <Register /> : <Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/chat" element={isAuth ? <ChatPage user={user} /> : <Login />} />
          <Route path="/notifications" element={isAuth ? <Notifications /> : <Login />} />
          <Route path="/login" element={!isAuth ? <Login /> : <Home />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/post/:id" element={<PostDetail />} />

        </Routes>
        <NavigationBar />
      </StoriesProvider></NotificationProvider></BrowserRouter>}
    </>
  );
}

export default App;
