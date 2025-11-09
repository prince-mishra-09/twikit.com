import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { UserContextProvider } from './context/UserContext.jsx'
import { PostContextProvider } from './context/PostContext.jsx'
import { ChatContextProvider } from './context/ChatContext.jsx'
import { SocketContextProvider } from './context/SocketContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserContextProvider>
      <PostContextProvider>
       <ChatContextProvider>
        <SocketContextProvider>
           <App />
        </SocketContextProvider>
       </ChatContextProvider>
      </PostContextProvider>
    </UserContextProvider>
  </StrictMode>,
)
