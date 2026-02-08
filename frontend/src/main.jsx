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
