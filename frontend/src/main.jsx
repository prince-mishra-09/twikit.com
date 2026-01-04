import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { UserContextProvider } from './context/UserContext.jsx'
import { PostContextProvider } from './context/PostContext.jsx'
import { ChatContextProvider } from './context/ChatContext.jsx'
import { SocketContextProvider } from './context/SocketContext.jsx'
import axios from "axios";

axios.defaults.baseURL = "http://localhost:5000";
axios.defaults.withCredentials = true;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserContextProvider>
      <SocketContextProvider>
      <PostContextProvider>
        <ChatContextProvider>

          <App />

        </ChatContextProvider>
      </PostContextProvider>
    </SocketContextProvider>
  </UserContextProvider>
  </StrictMode >,
)
