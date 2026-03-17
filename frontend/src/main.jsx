import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { UserContextProvider } from './context/UserContext.jsx'
import { PostContextProvider } from './context/PostContext.jsx'
import { ChatContextProvider } from './context/ChatContext.jsx'
import { SocketContextProvider } from './context/SocketContext.jsx'
import axios from "axios";
// Automatically toggle between local proxy (dev) and live backend (prod)
axios.defaults.baseURL = import.meta.env.MODE === "development" ? "" : import.meta.env.VITE_API_URL;
axios.defaults.withCredentials = true;

// Silent Refresh Interceptor
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet and it's not a refresh/login/register request
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/api/auth/login") &&
      !originalRequest.url.includes("/api/auth/register") &&
      !originalRequest.url.includes("/api/auth/refresh-token")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axios(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post("/api/auth/refresh-token");
        processQueue(null);
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // If refresh fails, session is dead — trigger global logout
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <UserContextProvider>
        <SocketContextProvider>
          <PostContextProvider>
            <ChatContextProvider>

              <App />

            </ChatContextProvider>
          </PostContextProvider>
        </SocketContextProvider>
      </UserContextProvider>
    </ThemeProvider>
  </StrictMode >,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
