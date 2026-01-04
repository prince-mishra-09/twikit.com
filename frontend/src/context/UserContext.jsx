import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";


const UserContext = createContext();

export const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState([]);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  const getErrorMessage = (error) =>
    error.response?.data?.message || error.message || "Something went wrong";

  async function registerUser(formdata, navigate, fetchPosts) {
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/register", formdata, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(data.message);
      setIsAuth(true);
      setUser(data.user);
      fetchPosts();
      navigate("/");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function loginUser(email, password, navigate, fetchPosts) {
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/login", {
        email,
        password,
      });

      toast.success(data.message);
      setIsAuth(true);
      setUser(data.user);
      fetchPosts();
      navigate("/");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function fetchUser() {
    try {
      const { data } = await axios.get("/api/user/me");
      setUser(data);
      setIsAuth(true);
    } catch (error) {
      setIsAuth(false);
    } finally {
      setLoading(false);
    }
  }

  async function logoutUser(navigate) {
    try {
      const { data } = await axios.get("/api/auth/logout");
      toast.success(data.message);
      setUser([]);
      setIsAuth(false);
      navigate("/login");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function followUser(id) {
    try {
      const { data } = await axios.post("/api/user/follow/" + id);
      toast.success(data.message);
      // Socket handles update, no need to refetch
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function updateProfilePic(id, formdata, setFile) {
    try {
      const { data } = await axios.put("/api/user/" + id, formdata, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(data.message);
      fetchUser();
      setFile(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function updateProfileName(id, name, setShowInput) {
    try {
      const { data } = await axios.put("/api/user/" + id, { name });
      toast.success(data.message);
      fetchUser();
      setShowInput(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider
      value={{
        loginUser,
        isAuth,
        setIsAuth,
        user,
        setUser,
        loading,
        logoutUser,
        registerUser,
        followUser,
        updateProfilePic,
        updateProfileName,
      }}
    >
      {children}
      <Toaster />
    </UserContext.Provider>
  );
};

export const UserData = () => useContext(UserContext);
