import { useState, useEffect, useCallback } from 'react';
import '../pages/AuraX.css';
// import '../pages/AuraXPaperTheme.css'; // REMOVED: Paper Theme
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuraXCard from '../components/AuraXCard';
import AuraXCreateModal from '../components/AuraXCreateModal';
import Loading from '../components/Loading';
import { UserData } from '../context/UserContext';
import AuraXOnboarding from './AuraXOnboarding'; // Import Onboarding
import AuraXIcon from '../components/AuraXIcon'; // Import Icon
import { AiOutlinePlus } from 'react-icons/ai';
import { FaUserEdit } from 'react-icons/fa';
import { IoMdExit } from 'react-icons/io';
import GalaxyBackground from '../components/GalaxyBackground'; // Import Galaxy Background

const AuraX = () => {
    const navigate = useNavigate();
    const { user, isAuth, loading: userLoading } = UserData();

    const [auras, setAuras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Edit Modal State

    // REMOVED: Theme State

    // Check if user has set up their aura avatar (onboarding)
    useEffect(() => {
        const checkOnboarding = async () => {
            if (isAuth && user) {
                // If user doesn't have aura avatar, redirect to onboarding
                if (!user.auraAvatar) {
                    navigate('/aurax/onboarding');
                }
            }
        };

        if (!userLoading) {
            checkOnboarding();
        }
    }, [isAuth, user, userLoading, navigate]);

    // Fetch auras
    const fetchAuras = useCallback(async (pageNum = 1) => {
        try {
            setLoading(true);
            const { data } = await axios.get(`/api/aurax/all?page=${pageNum}&limit=10`);

            if (pageNum === 1) {
                setAuras(data.auras || []);
            } else {
                setAuras(prev => [...prev, ...(data.auras || [])]);
            }

            setHasMore(data.hasMore || false);
        } catch (error) {
            console.error('Error fetching auras:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAuras(1);
    }, [fetchAuras]);

    // Infinite scroll
    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500 &&
                !loading &&
                hasMore
            ) {
                setPage(prev => prev + 1);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loading, hasMore]);

    useEffect(() => {
        if (page > 1) {
            fetchAuras(page);
        }
    }, [page, fetchAuras]);

    const handleAuraBurned = (id) => {
        setAuras(prev => prev.filter(aura => aura._id !== id));
    };

    const handlePostCreated = (newPost) => {
        // Prepend new post to the list (so it appears at top immediately)
        if (newPost) {
            // Ensure userVibedUp/userVibeKilled are initialized (though likely false for new post)
            newPost.userVibedUp = false;
            newPost.userVibeKilled = false;
            setAuras(prev => [newPost, ...prev]);
        } else {
            // Fallback to refresh if no post data returned
            fetchAuras(1);
            setPage(1);
        }
    };

    return (
        <GalaxyBackground>
            <div className={`aurax-page-container`}>
                {/* Edit Identity Modal */}
                {isEditModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2000 }}>
                        <AuraXOnboarding onClose={() => setIsEditModalOpen(false)} />
                    </div>
                )}

                {/* Main Content (Blurred when modal is open) */}
                <div style={{ filter: isEditModalOpen ? 'blur(5px)' : 'none', transition: 'filter 0.3s ease' }}>
                    {/* Desktop Sidebar (Left) */}
                    <div className="aurax-sidebar">
                        <div className="sidebar-top">
                            <div className="sidebar-logo">
                                <AuraXIcon size={40} />
                                <h1 className="sidebar-title">AuraX</h1>
                            </div>

                            <nav className="sidebar-nav">
                                {isAuth && (
                                    <button
                                        className="sidebar-btn create-btn"
                                        onClick={() => setIsModalOpen(true)}
                                    >
                                        <AiOutlinePlus className="sidebar-icon" />
                                        <span>Create Aura</span>
                                    </button>
                                )}

                                <button
                                    className="sidebar-btn"
                                    onClick={() => setIsEditModalOpen(true)}
                                >
                                    <FaUserEdit className="sidebar-icon" />
                                    <span>Rename Identity</span>
                                </button>
                            </nav>
                        </div>

                        <div className="sidebar-bottom">
                            <button
                                className="sidebar-btn exit-btn"
                                onClick={() => navigate('/')}
                            >
                                <IoMdExit className="sidebar-icon" />
                                <span>Exit </span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Top Navbar (Hidden on Desktop) */}
                    <motion.div
                        className="aurax-top-navbar"
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <AuraXIcon size={32} />
                            <h1 className="aurax-navbar-title">AuraX</h1>
                        </div>

                        <div className="navbar-actions">
                            {/* Create Button (Mobile) */}
                            {isAuth && (
                                <button
                                    className="aurax-nav-btn create-btn"
                                    onClick={() => setIsModalOpen(true)}
                                    title="Create Aura"
                                >
                                    <AiOutlinePlus className="nav-icon" />
                                </button>
                            )}

                            <button
                                className="aurax-nav-btn rename-btn"
                                onClick={() => setIsEditModalOpen(true)}
                                title="Change Avatar & Name"
                            >
                                <FaUserEdit className="nav-icon" />
                            </button>
                            <button
                                className="aurax-nav-btn exit-btn"
                                onClick={() => navigate('/')}
                                title="Exit to Viby"
                            >
                                <IoMdExit className="nav-icon" />
                            </button>
                        </div>
                    </motion.div>

                    {/* Feed Content */}
                    <div className="aurax-feed-content">
                        {loading && auras.length === 0 ? (
                            <Loading />
                        ) : auras.length === 0 ? (
                            <motion.div
                                className="aurax-empty-state"
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                            >
                                <motion.div
                                    className="empty-ghost-animation"
                                    animate={{
                                        y: [-10, 10, -10],
                                        opacity: [0.5, 1, 0.5]
                                    }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                >
                                    <span className="empty-ghost">👻</span>
                                </motion.div>
                                <h2 className="empty-title">Void is Empty</h2>
                                <p className="empty-subtitle">be the first to share your secret</p>
                                {isAuth && (
                                    <button
                                        className="empty-create-btn"
                                        onClick={() => setIsModalOpen(true)}
                                    >
                                        Create First Aura
                                    </button>
                                )}
                            </motion.div>
                        ) : (
                            <div className="aurax-feed-grid">
                                {auras.map((aura) => (
                                    <AuraXCard
                                        key={aura._id}
                                        aura={aura}
                                        // theme={theme} // REMOVED
                                        onBurned={handleAuraBurned}
                                    />
                                ))}
                            </div>
                        )}

                        {loading && auras.length > 0 && (
                            <div className="aurax-loading-more">Loading more Auras...</div>
                        )}
                    </div>

                    {/* Create Modal */}
                    <AuraXCreateModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onPostCreated={handlePostCreated}
                    />
                </div>
            </div>
        </GalaxyBackground>
    );
};

export default AuraX;
