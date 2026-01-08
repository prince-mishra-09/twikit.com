import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { UserData } from "./UserContext";

const StoriesContext = createContext();

export const StoriesProvider = ({ children }) => {
    const [stories, setStories] = useState([]); // Array of grouped stories
    const [loading, setLoading] = useState(false);
    const { isAuth, user } = UserData();

    async function fetchStories() {
        if (!isAuth) return;
        try {
            setLoading(true);
            const { data } = await axios.get("/api/story/feed");
            setStories(data);
        } catch (error) {
            console.error("Error fetching stories:", error);
        } finally {
            setLoading(false);
        }
    }

    async function addStory(formData, setFile, setText, setType) {
        try {
            setLoading(true);
            const { data } = await axios.post("/api/story/create", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            // Optimistic update or refetch
            fetchStories();

            // Reset form
            setFile("");
            setText("");
            if (setType) setType("post"); // Go back to default

            return true;
        } catch (error) {
            console.error("Error creating story:", error);
            alert(error.response?.data?.message || "Something went wrong");
            return false;
        } finally {
            setLoading(false);
        }
    }

    async function fetchUserStories(userId) {
        try {
            const { data } = await axios.get(`/api/story/user/${userId}`);
            return data;
        } catch (error) {
            console.error("Error fetching user stories:", error);
            return null;
        }
    }

    async function viewStory(storyId) {
        try {
            await axios.post(`/api/story/view/${storyId}`);

            // Feature 1 & 4 Optimistic Update: Mark as viewed locally
            // We assume backend adds our ID to 'views'. We do the same.
            setStories(prev => prev.map(group => ({
                ...group,
                stories: group.stories.map(s => {
                    if (s.user._id === user._id) return s; // Don't count self views

                    return s._id === storyId
                        ? { ...s, viewers: [...(s.viewers || []), { _id: user._id }] }
                        : s
                })
            })));

        } catch (error) {
            console.error("Error viewing story:", error);
        }
    }

    async function deleteStory(storyId) {
        try {
            const { data } = await axios.delete(`/api/story/${storyId}`);
            if (data.message === "Story deleted successfully") {
                // Remove from state
                setStories(prev => prev.map(userStore => ({
                    ...userStore,
                    stories: userStore.stories.filter(s => s._id !== storyId)
                })).filter(userStore => userStore.stories.length > 0)); // Remove user if no stories left
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error deleting story:", error);
            return false;
        }
    }

    useEffect(() => {
        if (isAuth) {
            fetchStories();
        }
    }, [isAuth]);

    return (
        <StoriesContext.Provider
            value={{
                stories,
                loading,
                fetchStories,
                addStory,
                addStory,
                viewStory,
                deleteStory,
                fetchUserStories,
            }}
        >
            {children}
        </StoriesContext.Provider>
    );
};

export const StoriesData = () => useContext(StoriesContext);
