import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { isSameId, includesId } from "./utils/idUtils";
import { UserData } from "./context/UserContext";
import { SocketData } from "./context/SocketContext";
import { NotificationProvider } from "./context/NotificationContext";
import { StoriesProvider } from "./context/StoriesContext";
import { useEffect, Suspense, lazy } from "react";
import LoginPromptModal from "./components/LoginPromptModal";
import ScrollToTop from "./components/ScrollToTop";
import Layout from "./components/Layout";
import PWAUpdateModal from "./components/PWAUpdateModal";
import NotFound from "./components/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";
import { SkeletonPost } from "./components/Skeleton";
import RouteAwareSkeleton, { SkeletonFullPage } from "./components/Loading";
import Maintenance from "./pages/Maintenance";

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
const AuraX = lazy(() => import("./pages/AuraX"));
const AuraXOnboarding = lazy(() => import("./pages/AuraXOnboarding"));

function App() {
  const { loading, isAuth, user, setUser, showUpdateModal, setShowUpdateModal, applyUpdate } = UserData();
  const { socket } = SocketData();

  // Maintenance Mode (Toggle this to true to enable)
  const isMaintenanceMode = false; // Set to true when needed

  // Only allow bypass if user is already logged in as admin
  const isBypass = user?.email === "admin@prince";

  if (isMaintenanceMode && !isBypass) {
    return <BrowserRouter><Maintenance /></BrowserRouter>;
  }

  useEffect(() => {
    if (socket && user) {
      const handleFollow = (data) => {
        // If I am the follower
        if (isSameId(data.followerId, user._id)) {
          setUser((prev) => {
            if (includesId(prev.followings, data.followingId)) return prev;
            return {
              ...prev,
              followings: [...(prev.followings || []), data.followingId]
            };
          });
        }
        // If someone followed me
        else if (isSameId(data.followingId, user._id)) {
          setUser((prev) => {
            if (includesId(prev.followers, data.followerId)) return prev;
            return {
              ...prev,
              followers: [...(prev.followers || []), data.followerId]
            };
          });
        }
      };

      const handleUnfollow = (data) => {
        // If I unfollowed someone
        if (isSameId(data.followerId, user._id)) {
          setUser((prev) => ({
            ...prev,
            followings: (prev.followings || []).filter(id => !isSameId(id, data.followingId))
          }));
        }
        // If someone unfollowed me
        else if (isSameId(data.followingId, user._id)) {
          setUser((prev) => ({
            ...prev,
            followers: (prev.followers || []).filter(id => !isSameId(id, data.followerId))
          }));
        }
      };

      socket.on("userFollowed", handleFollow);
      socket.on("userUnfollowed", handleUnfollow);

      return () => {
        socket.off("userFollowed", handleFollow);
        socket.off("userUnfollowed", handleUnfollow);
      };
    }
  }, [socket, user, setUser]);

  return (
    <>
      <Toaster
        position="bottom-center"
        containerStyle={{
          bottom: 80,
        }}
        gutter={24}
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(13, 13, 13, 0.6)',
            color: '#fff',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '99px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '90vw',
          },
          success: {
            iconTheme: {
              primary: '#00FFD1',
              secondary: '#000',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF2E63',
              secondary: '#fff',
            },
          },
        }}
      />
      <ErrorBoundary>
        {loading ? (
          <SkeletonFullPage />
        ) : <BrowserRouter>
          <ScrollToTop />
          <NotificationProvider><StoriesProvider>
            <LoginPromptModal />
            <PWAUpdateModal
              show={showUpdateModal}
              onUpdate={applyUpdate}
              onLater={() => setShowUpdateModal(false)}
            />
            <Layout>
              <Suspense fallback={<RouteAwareSkeleton />}>
                <Routes>
                  <Route path="/landing" element={isAuth ? <Home /> : <TwikitLanding />} />
                  <Route path="/" element={isAuth ? <Home /> : <TwikitLanding />} />
                  <Route path="/feed" element={<Home />} />
                  <Route path="/reels" element={<Reels />} />
                  <Route path="/user/:id" element={<UserAccount user={user} />} />
                  <Route path="/account" element={isAuth ? <Account user={user} /> : <Navigate to="/login" />} />
                  <Route path="/register" element={!isAuth ? <Register /> : <Home />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/chat" element={isAuth ? <ChatPage user={user} /> : <Navigate to="/login" />} />
                  <Route path="/aurax/onboarding" element={isAuth ? <AuraXOnboarding /> : <Navigate to="/login" />} />
                  <Route path="/aurax" element={isAuth ? <AuraX /> : <Navigate to="/login" />} />
                  <Route path="/notifications" element={isAuth ? <Notifications /> : <Navigate to="/login" />} />
                  <Route path="/login" element={!isAuth ? <Login /> : <Home />} />
                  <Route path="*" element={<NotFound />} />
                  <Route path="/post/:id" element={<PostDetail />} />
                </Routes>
              </Suspense>
            </Layout>
          </StoriesProvider></NotificationProvider></BrowserRouter>}
      </ErrorBoundary>
    </>
  );
}

export default App;
