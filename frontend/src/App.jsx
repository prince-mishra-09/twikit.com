import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { isSameId, includesId } from "./utils/idUtils";
import { UserData } from "./context/UserContext";
import { SocketData } from "./context/SocketContext";
import { NotificationProvider } from "./context/NotificationContext";
import { StoriesProvider } from "./context/StoriesContext";
import { PostData } from "./context/PostContext";
import { useEffect, Suspense, lazy } from "react";
import LoginPromptModal from "./components/LoginPromptModal";
import ScrollToTop from "./components/ScrollToTop";
import Layout from "./components/Layout";
import PWAUpdateModal from "./components/PWAUpdateModal";
import NotFound from "./components/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";
import { SkeletonPost } from "./components/Skeleton";
import RouteAwareSkeleton, { SkeletonFullPage } from "./components/Loading";
// Lazy Imports
const Home = lazy(() => import("./pages/Home"));
const Register = lazy(() => import("./pages/Register"));
const Login = lazy(() => import("./pages/Login"));
const Account = lazy(() => import("./pages/Account"));
const Reels = lazy(() => import("./pages/Reels"));
const UserAccount = lazy(() => import("./pages/UserAccount"));
const Search = lazy(() => import("./pages/Search"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const XwakedLanding = lazy(() => import("./pages/xwakedLanding"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const Notifications = lazy(() => import("./pages/Notifications"));
const AuraX = lazy(() => import("./pages/AuraX"));
const AuraXOnboarding = lazy(() => import("./pages/AuraXOnboarding"));
const Maintenance = lazy(() => import("./pages/Maintenance"));

function App() {
  const { loading, isAuth, user, setUser, showUpdateModal, setShowUpdateModal, applyUpdate } = UserData();
  const { addLoading, uploadProgress, uploadPreview, uploadType } = PostData();
  const { socket } = SocketData();

  // Maintenance Mode (Toggle this to true to enable)
  const isMaintenanceMode = false; // Set to true when needed

  // Only allow bypass if user is already logged in as admin
  const isBypass = user?.email === "admin@prince";



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

  if (isMaintenanceMode && !isBypass) {
    return (
      <BrowserRouter>
        <Suspense fallback={<div className="h-screen w-screen bg-black" />}>
          <Maintenance />
        </Suspense>
      </BrowserRouter>
    );
  }

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

            {/* Global Upload Progress */}
            {addLoading && (
              <div className="fixed bottom-20 md:bottom-6 left-0 w-full px-4 z-[2000] animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="max-w-[400px] mx-auto bg-[var(--card-bg)]/80 backdrop-blur-2xl border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden">
                  <div className="flex items-center gap-3 p-2">
                    {uploadPreview && (
                      <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)]">
                        {uploadType === "reel" ? (
                          <video src={uploadPreview} muted autoPlay loop className="w-full h-full object-cover" />
                        ) : (
                          <img src={uploadPreview} alt="uploading" className="w-full h-full object-cover" />
                        )}
                      </div>
                    )}

                    <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-[var(--text-primary)] truncate">
                          {uploadProgress >= 100 
                            ? "Finishing up..." 
                            : uploadProgress >= 90 
                              ? "Processing on server..." 
                              : `Uploading ${uploadType}`}
                        </span>
                        <span className="text-[var(--accent)]">{uploadProgress}%</span>
                      </div>
                      <div className="h-1 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--accent)] transition-all duration-300 ease-out relative"
                          style={{ width: `${uploadProgress}%` }}
                        >
                          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite] bg-[length:200%_100%]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Layout>
              <Suspense fallback={<RouteAwareSkeleton />}>
                <Routes>
                  <Route path="/landing" element={isAuth ? <Home /> : <XwakedLanding />} />
                  <Route path="/" element={isAuth ? <Home /> : <XwakedLanding />} />
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
