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

function App() {
  const {loading,isAuth,user} = UserData()
  return (
    <>
      <Toaster position="top-center" />
      {loading?<h1>loading....</h1>:<BrowserRouter>
        <Routes>
          <Route path="/" element={isAuth?<Home />:<Login/>} />
          <Route path="/reels" element={isAuth?<Reels />:<Login/>} />
          <Route path="/account" element={isAuth?<Account />:<Login/>} />
          <Route path="/register" element={!isAuth?<Register />:<Home/>} />
          <Route path="/login" element={!isAuth?<Login/>:<Home/>} />
          <Route path="*" element={<NotFound/>} />
        </Routes>
        {isAuth && <NavigationBar/>}
      </BrowserRouter>}
    </>
  );
}

export default App;
