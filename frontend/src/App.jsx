import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { UserData } from "./context/UserContext";
import { Loading } from "./components/Loading";
import { SocketData } from "./context/SocketContext";
import { NotificationProvider } from "./context/NotificationContext";
import { StoriesProvider } from "./context/StoriesContext";
import { useEffect, Suspense, lazy } from "react";
import LoginPromptModal from "./components/LoginPromptModal";
import ScrollToTop from "./components/ScrollToTop";
import Layout from "./components/Layout";
import NotFound from "./components/NotFound";

// Lazy Imports
const Home = lazy(() => import("./pages/Home"));
const Register = lazy(() => import("./pages/Register"));
const Login = lazy(() => import("./pages/Login"));
const Account = lazy(() => import("./pages/Account"));
const Reels = lazy(() => import("./pages/Reels"));
const UserAccount = lazy(() => import("./pages/UserAccount"));
const Search = lazy(() => import("./pages/Search"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const TwikitLanding = lazy(() => import("./pages/TwikitLanding"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const Notifications = lazy(() => import("./pages/Notifications"));

function App() {
  const { loading, isAuth, user, setUser } = UserData();
  const { socket } = SocketData();

  useEffect(() => {
    if (socket && user) {
      const handleFollow = (data) => {
        if (data.followerId === user._id) {
          setUser((prev) => ({
            ...prev,
            followings: prev.followings?.includes(data.followingId)
              ? prev.followings.filter(id => id !== data.followingId)
              : [...(prev.followings || []), data.followingId]
          }));
        } else if (data.followingId === user._id) {
          setUser((prev) => ({
            ...prev,
            followers: prev.followers?.includes(data.followerId)
              ? prev.followers.filter(id => id !== data.followerId)
              : [...(prev.followers || []), data.followerId]
          }));
        }
      };
      socket.on("userFollowed", handleFollow);
      return () => socket.off("userFollowed", handleFollow);
    }
  }, [socket, user, setUser]);

  return (
    <>
      <Toaster position="top-center" />
      {loading ? <Loading /> : <BrowserRouter>
        <ScrollToTop />
        <NotificationProvider><StoriesProvider>
          <LoginPromptModal />
          <Layout>
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/landing" element={isAuth ? <Home /> : <TwikitLanding />} />
                <Route path="/" element={isAuth ? <Home /> : <TwikitLanding />} />
                <Route path="/feed" element={<Home />} />
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
            </Suspense>
          </Layout>
        </StoriesProvider></NotificationProvider></BrowserRouter>}
    </>
  );
}

export default App;
