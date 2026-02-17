import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { Clock, BarChart3 } from 'lucide-react';
import './AuraXCard.css';

const AuraXCard = ({ aura, theme, onBurned }) => {
    const [vibesUp, setVibesUp] = useState(aura.vibesUp?.length || 0);
    const [vibesKilled, setVibesKilled] = useState(aura.vibesKilled?.length || 0);
    const [userVibedUp, setUserVibedUp] = useState(aura.userVibedUp || false);
    const [userVibeKilled, setUserVibeKilled] = useState(aura.userVibeKilled || false);
    const [isBurning, setIsBurning] = useState(false);
    const [showFlicker, setShowFlicker] = useState(false);
    const [paperTexture, setPaperTexture] = useState(1); // Default texture
    const [isExpanded, setIsExpanded] = useState(false); // Text expansion state

    const maxLength = 150; // Character limit threshold for "View More"
    const isLongCaption = aura.caption && aura.caption.length > maxLength;

    // Randomize texture on mount
    useEffect(() => {
        setPaperTexture(Math.floor(Math.random() * 4) + 1);
    }, []);

    // Record view on mount
    useEffect(() => {
        const recordView = async () => {
            try {
                await axios.post(`/api/aurax/view/${aura._id}`);
            } catch (error) {
                console.error('Error recording view:', error);
            }
        };

        recordView();
    }, [aura._id]);

    // Handle vibe action
    const handleVibe = async (type) => {
        try {
            const { data } = await axios.post(`/api/aurax/vibe/${aura._id}`, { type });

            // Update local state
            setVibesUp(data.vibesUp);
            setVibesKilled(data.vibesKilled);
            setUserVibedUp(data.userVibedUp);
            setUserVibeKilled(data.userVibeKilled);

            // Check if burned
            if (data.burned) {
                setIsBurning(true);
                toast.error('Aura Burned! 🔥');

                // Notify parent to remove from list after animation
                setTimeout(() => {
                    onBurned(aura._id);
                }, 1500);
            } else if (type === 'vibeKill') {
                // Show red flicker on vibe kill
                setShowFlicker(true);
                setTimeout(() => setShowFlicker(false), 300);
            }
        } catch (error) {
            console.error('Error handling vibe:', error);
            toast.error(error.response?.data?.message || 'Failed to vibe');
        }
    };

    // Animation variants
    const burnVariants = {
        initial: { scale: 1, opacity: 1, rotate: 0 },
        burning: {
            scale: 0.8,
            opacity: 0,
            rotate: 5,
            boxShadow: '0 0 40px rgba(255,69,0,1)',
            transition: { duration: 1.5, ease: 'easeInOut' }
        }
    };

    const floatVariants = {
        float: {
            y: -20,
            transition: { duration: 0.3 }
        }
    };

    // Dynamic Time Updates (Every Minute)
    const [timeAgo, setTimeAgo] = useState(formatDistanceToNow(new Date(aura.createdAt), { addSuffix: true }));
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const updateTimes = () => {
            const now = new Date();
            const expires = new Date(aura.expiresAt);
            const created = new Date(aura.createdAt);

            // Update Time Ago
            setTimeAgo(formatDistanceToNow(created, { addSuffix: true }));

            // Update Time Left
            const diff = expires - now;
            if (diff <= 0) {
                setTimeLeft('Expiring...');
            } else if (diff < 60 * 60 * 1000) {
                // Less than 1 hour -> Show Minutes
                setTimeLeft(`${Math.ceil(diff / (60 * 1000))}m`);
            } else {
                // More than 1 hour -> Show Hours
                setTimeLeft(`${Math.floor(diff / (60 * 60 * 1000))}h`);
            }
        };

        updateTimes(); // Initial run
        const interval = setInterval(updateTimes, 60000); // Run every minute

        return () => clearInterval(interval);
    }, [aura.createdAt, aura.expiresAt]);

    return (
        <>
            {/* Red Screen Flicker (Vibe Kill Effect) */}
            <AnimatePresence>
                {showFlicker && (
                    <motion.div
                        className="vibe-kill-flicker"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.4, 0, 0.5, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    />
                )}
            </AnimatePresence>

            <motion.div
                className={`aurax-card paper-texture-${paperTexture} ${isBurning ? 'burning' : ''}`}
                variants={burnVariants}
                initial="initial"
                animate={isBurning ? 'burning' : 'initial'}
                layout // For smooth layout changes in masonry
            >
                {/* Header */}
                <div className="aurax-card-header">
                    <div className="aurax-identity">
                        <div
                            className="aurax-avatar"
                            style={{
                                backgroundColor: aura.auraColor
                            }}
                        >
                            <span className="aurax-avatar-icon">{aura.auraAvatar || '👻'}</span>
                        </div>
                        <div className="aurax-info">
                            <h3 className="aurax-name">
                                {aura.auraName}
                            </h3>
                            <p className="aurax-time">
                                {timeAgo}
                            </p>
                        </div>
                    </div>

                    {/* Expiry Timer */}
                    <div className="aurax-expiry">
                        <span className="expiry-icon"><Clock size={14} /></span>
                        <span>
                            {timeLeft}
                        </span>
                    </div>
                </div>

                {/* Caption */}
                <div className="aurax-caption">
                    <p className={`aurax-caption-text ${!isExpanded && isLongCaption ? 'truncated' : ''}`}>
                        {aura.caption}
                    </p>
                    {isLongCaption && (
                        <button
                            className="caption-toggle-btn"
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                        >
                            {isExpanded ? 'Show Less' : 'Show More'}
                        </button>
                    )}
                </div>

                {/* Media (only if exists) */}
                {aura.media && (
                    <div className="aurax-media">
                        {aura.type === 'video' ? (
                            <video src={aura.media.url} controls className="aurax-video" />
                        ) : aura.type === 'image' ? (
                            <img src={aura.media.url} alt="Aura" className="aurax-image" />
                        ) : null}
                    </div>
                )}

                {/* Interaction Bar */}
                <div className="aurax-interactions">
                    {/* Vibe Up */}
                    <motion.button
                        className={`aurax-vibe-btn vibe-up ${userVibedUp ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleVibe('vibeUp'); }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span className="vibe-icon">▲</span>
                        <span className="vibe-count">{vibesUp}</span>
                    </motion.button>

                    {/* Vibe Kill */}
                    <motion.button
                        className={`aurax-vibe-btn vibe-kill ${userVibeKilled ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleVibe('vibeKill'); }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span className="vibe-icon">▼</span>
                        <span className="vibe-count">{vibesKilled}</span>
                    </motion.button>

                    {/* Views */}
                    <div className="aurax-views">
                        <span className="views-icon"><BarChart3 size={16} /></span>
                        <span className="views-count">{aura.views}</span>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

// Memoize to prevent unnecessary re-renders
export default memo(AuraXCard, (prevProps, nextProps) => {
    return prevProps.aura._id === nextProps.aura._id &&
        prevProps.aura.vibesUp?.length === nextProps.aura.vibesUp?.length &&
        prevProps.aura.vibesKilled?.length === nextProps.aura.vibesKilled?.length &&
        prevProps.theme === nextProps.theme;
});
