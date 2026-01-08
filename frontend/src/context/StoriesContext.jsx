import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { UserData } from "./UserContext";
import { SocketData } from "./SocketContext";

const StoriesContext = createContext();

export const StoriesProvider = ({ children }) => {
    const [stories, setStories] = useState([]); // Array of grouped stories
    const [loading, setLoading] = useState(false);
    const { isAuth, user } = UserData();
    const { socket } = SocketData(); // Import Socket

    // Real-time Listeners
    useEffect(() => {
        if (!socket || !isAuth) return;

        // 1. New Story Posted by followed user
        const handleNewStory = (story) => {
            console.log("Socket: New Story Received:", story);
            setStories(prev => {
                const existingUserGroup = prev.find(g => String(g.user._id) === String(story.user._id));

                if (existingUserGroup) {
                    console.log("Updating existing group");
                    // Update existing group: append story and move user to front? 
                    // Usually new stories push user to front of feed.
                    const updatedGroup = {
                        ...existingUserGroup,
                        stories: [...existingUserGroup.stories, story]
                    };
                    // Move to front
                    return [updatedGroup, ...prev.filter(g => String(g.user._id) !== String(story.user._id))];
                } else {
                    console.log("Creating new group");
                    // New user appearing in feed (rare but possible if sync issue or first story)
                    const newGroup = { user: story.user, stories: [story] };
                    return [newGroup, ...prev];
                }
            });
        };

        // 2. Someone viewed my story
        const handleStoryView = ({ storyId, viewer }) => {
            console.log("Socket: Story View Received:", storyId, viewer);
            setStories(prev => prev.map(group => {
                // Debug: Log comparison
                // console.log("Comparing", group.user._id, user._id);
                if (String(group.user._id) !== String(user._id)) return group; // Not my stories

                console.log("Updating my story view stats");
                return {
                    ...group,
                    stories: group.stories.map(s =>
                        s._id === storyId
                            ? { ...s, viewers: [...(s.viewers || []), viewer] }
                            : s
                    )
                };
            }));
        };

        socket.on("story:new", handleNewStory);
        socket.on("story:view", handleStoryView);

        return () => {
            socket.off("story:new", handleNewStory);
            socket.off("story:view", handleStoryView);
        };
    }, [socket, isAuth, user?._id]);

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
