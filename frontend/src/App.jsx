import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
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

function App() {
  const {loading,isAuth,user} = UserData();
  // 
  // console.log(onlineUsers);
  
  return (
    <>
      <Toaster position="top-center" />
      {loading?<Loading/>:<BrowserRouter>
        <Routes>
          <Route path="/landing" element={<TwikitLanding/>} />
          <Route path="/" element={isAuth?<Home />:<Login/>} />
          <Route path="/reels" element={isAuth?<Reels />:<Login/>} />
          <Route path="/user/:id" element={isAuth?<UserAccount user={user} />:<Login/>} />
          <Route path="/account" element={isAuth?<Account user={user} />:<Login/>} />
          <Route path="/register" element={!isAuth?<Register />:<Home/>} />
          <Route path="/search" element={isAuth?<Search />:<Login/>} />
          <Route path="/chat" element={isAuth?<ChatPage user={user} />:<Login/>} />
          <Route path="/login" element={!isAuth?<Login/>:<Home/>} />
          <Route path="*" element={<NotFound/>} />
        </Routes>
        {isAuth && <NavigationBar/>}
      </BrowserRouter>}
    </>
  );
}

export default App;
