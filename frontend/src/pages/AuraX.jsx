import { useState, useEffect, useCallback } from 'react';
import '../pages/AuraX.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuraXCard from '../components/AuraXCard';
import AuraXCreateModal from '../components/AuraXCreateModal';
import Loading from '../components/Loading';
import { UserData } from '../context/UserContext';
import AuraXOnboarding from './AuraXOnboarding';
import AuraXIcon from '../components/AuraXIcon';
import { Search, List, Volume2, Camera, LogOut, Edit3, MessageSquare, TrendingUp, TrendingDown, BarChart3, ShieldCheck } from 'lucide-react';
import GalaxyBackground from '../components/GalaxyBackground';

const AuraX = () => {
    const navigate = useNavigate();
    const { user, isAuth, loading: userLoading } = UserData();

    const [auras, setAuras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Sidebar Data State
    const [stats, setStats] = useState(null);
    const [personalities, setPersonalities] = useState([]);
    const [trending, setTrending] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

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

    // Fetch Sidebar Data
    const fetchSidebarData = useCallback(async () => {
        try {
            if (isAuth) {
                const { data: statsData } = await axios.get('/api/aurax/stats');
                setStats(statsData);
            }
            const { data: personalitiesData } = await axios.get('/api/aurax/personalities');
            const { data: trendingData } = await axios.get('/api/aurax/trending');

            setPersonalities(personalitiesData.personalities || []);
            setTrending(trendingData.trending || []);
        } catch (error) {
            console.error('Error fetching sidebar data:', error);
        }
    }, [isAuth]);

    useEffect(() => {
        fetchAuras(1);
        fetchSidebarData();
    }, [fetchAuras, fetchSidebarData]);

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
        if (newPost) {
            newPost.userVibedUp = false;
            newPost.userVibeKilled = false;
            setAuras(prev => [newPost, ...prev]);
            fetchSidebarData(); // Refresh stats
        } else {
            fetchAuras(1);
            setPage(1);
        }
    };

    return (
        <GalaxyBackground>
            <div className="aurax-page-container">
                {/* Edit Identity Modal */}
                {isEditModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2000 }}>
                        <AuraXOnboarding onClose={() => setIsEditModalOpen(false)} />
                    </div>
                )}

                {/* Left Sidebar - Profile & Stats */}
                <div className={`aurax-column-sidebar aurax-desktop-only ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
                    <div className="aurax-glass-card aurax-profile-card">
                        <div className="profile-avatar-wrapper">
                            <div className="profile-avatar-circle">
                                {user?.auraAvatarType === 'custom' ? (
                                    <img src={user?.auraAvatar} alt="Identity" />
                                ) : (
                                    <div style={{ fontSize: '2.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                        {user?.auraAvatar || '👻'}
                                    </div>
                                )}
                            </div>
                            <div className="profile-handle-row">
                                <span className="profile-handle">@{user?.lastAuraIdentity?.auraName || 'Shadow'}</span>
                                <button className="edit-identity-trigger" onClick={() => setIsEditModalOpen(true)} title="Edit Identity">
                                    <Edit3 size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="profile-stats-grid">
                            <div className="stat-item">
                                <div className="stat-info">
                                    <span className="stat-icon"><MessageSquare size={16} /></span>
                                    <span className="stat-label">AuraX Posts</span>
                                </div>
                                <span className="stat-value">{stats?.postsCount || 0}</span>
                            </div>
                            <div className="stat-item">
                                <div className="stat-info">
                                    <span className="stat-icon"><TrendingUp size={16} /></span>
                                    <span className="stat-label">Vibe Up</span>
                                </div>
                                <span className="stat-value">{stats?.vibesUp >= 1000 ? `${(stats.vibesUp / 1000).toFixed(1)}k` : stats?.vibesUp || 0}</span>
                            </div>
                            <div className="stat-item">
                                <div className="stat-info">
                                    <span className="stat-icon"><TrendingDown size={16} /></span>
                                    <span className="stat-label">Vibe Kills</span>
                                </div>
                                <span className="stat-value">{stats?.vibesKilled || 0}</span>
                            </div>
                            <div className="stat-item">
                                <div className="stat-info">
                                    <span className="stat-icon"><BarChart3 size={16} /></span>
                                    <span className="stat-label">Total Reach</span>
                                </div>
                                <span className="stat-value">{stats?.totalReach >= 1000 ? `${(stats.totalReach / 1000).toFixed(0)}k` : stats?.totalReach || 0}</span>
                            </div>
                        </div>

                        <div className="sidebar-footer">
                            <div className="aurax-privacy-disclaimer">
                                <ShieldCheck size={14} className="disclaimer-icon" />
                                <p>AuraX does not store your content permanently. We only maintain post stats. All posts are purged after 24 hours.</p>
                            </div>

                            <div className="exit-btn-wrapper">
                                <div className="aurax-exit-button" onClick={() => navigate('/')}>
                                    <LogOut size={18} />
                                    <span>Exit</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Feed */}
                <div className="aurax-main-feed">
                    {/* Sidebar Overlay (Mobile) */}
                    {isMobileSidebarOpen && (
                        <div className="sidebar-overlay" onClick={() => setIsMobileSidebarOpen(false)} />
                    )}

                    {/* Search Bar Container */}
                    <div className="aurax-search-container">
                        <div className="mobile-profile-trigger" onClick={() => setIsMobileSidebarOpen(true)}>
                            {user?.auraAvatarType === 'custom' ? (
                                <img src={user?.auraAvatar} alt="Profile" />
                            ) : (
                                <span>{user?.auraAvatar || '👻'}</span>
                            )}
                        </div>
                        <div className="aurax-search-bar">
                            <Search size={18} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search top trendy auras..."
                                className="search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="search-actions">
                            <List size={22} className="search-action-icon" />
                            <Volume2 size={22} className="search-action-icon" />
                            <Camera size={22} className="search-action-icon" onClick={() => setIsModalOpen(true)} />
                        </div>
                    </div>

                    {/* Feed List */}
                    <div className="aurax-feed-list">
                        {loading && auras.length === 0 ? (
                            <Loading />
                        ) : auras.length === 0 ? (
                            <div className="aurax-empty-state">
                                <h2 className="empty-title">Void is Empty</h2>
                                <p className="empty-subtitle">Be the first to share your secret</p>
                            </div>
                        ) : (
                            auras.map((aura) => (
                                <AuraXCard
                                    key={aura._id}
                                    aura={aura}
                                    onBurned={handleAuraBurned}
                                />
                            ))
                        )}
                        {loading && auras.length > 0 && (
                            <div className="aurax-loading-more">Loading more Auras...</div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar - Ranking & Trends */}
                <div className="aurax-column-sidebar aurax-desktop-only">
                    <div className="aurax-glass-card aurax-ranking-card">
                        <h3>Top AuraX Personalities</h3>
                        <div className="personality-list">
                            {personalities.length > 0 ? personalities.map((p, i) => (
                                <div className="personality-item" key={p._id || i}>
                                    <div className="personality-avatar">
                                        {p.auraAvatar || '👤'}
                                    </div>
                                    <div className="personality-info">
                                        <span className="personality-name">{p.auraName || 'Anonymous'}</span>
                                        <span className="personality-level">Aura Level</span>
                                    </div>
                                    <span className="personality-score">{p.totalVibesUp || 0}</span>
                                </div>
                            )) : (
                                <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>Gathering legends...</p>
                            )}
                        </div>

                        <div className="trending-section">
                            <h3>Trending Auras</h3>
                            <div className="trending-list">
                                {trending.map((tag, i) => (
                                    <span className="trending-tag" key={i}>{tag}</span>
                                ))}
                                {trending.length === 0 && <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>No trends yet</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Create Modal */}
                <AuraXCreateModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onPostCreated={handlePostCreated}
                />
            </div>
        </GalaxyBackground>
    );
};

export default AuraX;
