import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import './AuraXOnboarding.css';
import { AiOutlineUpload } from 'react-icons/ai';
import { Timer, RefreshCw, CheckCircle, ShieldAlert } from 'lucide-react';
import { UserData } from '../context/UserContext';

const GENZ_EMOJIS = [
    '🔥', '💀', '😈', '👽', '🤖', '⚡', '🌌', '🎭',
    '👻', '🦄', '🐉', '💎', '🌟', '💫', '🎮', '🎧',
    '🖤', '💜', '💙', '💚', '🌈', '☠️', '🕷️', '🦇'
];

const NAME_SUGGESTIONS = [
    'Cyber-Ghost', 'Neon-Phantom', 'Eclipse-Walker', 'Digital-Wraith',
    'Shadow-Pulse', 'Void-Echo', 'Glitch-Spectre', 'Phantom-Byte',
    'Neon-Vortex', 'Dark-Matter', 'Static-Ninja', 'Quantum-Shadow'
];

const AURA_COLORS = [
    '#00F5FF', '#FF1493', '#39FF14', '#FF6EC7', '#8A2BE2', '#FF4500',
    '#7FFF00', '#FF00FF', '#00FFFF', '#FFD700', '#FF69B4', '#32CD32'
];

const AuraXOnboarding = ({ onClose }) => {
    const navigate = useNavigate();
    const { user, fetchUser } = UserData();

    // Initial state based on existing user data
    const [selectedAvatar, setSelectedAvatar] = useState(user?.auraAvatar || '👻');
    const [avatarType, setAvatarType] = useState(user?.auraAvatarType || 'emoji');
    const [auraName, setAuraName] = useState(user?.lastAuraIdentity?.auraName || '');
    const [auraColor, setAuraColor] = useState(user?.lastAuraIdentity?.auraColor || AURA_COLORS[Math.floor(Math.random() * AURA_COLORS.length)]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAllEmojis, setShowAllEmojis] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);

    // Calculate if user is in cooldown
    const isCooldownActive = useMemo(() => {
        if (!user?.lastAuraIdentityChange) return false;
        const lastChange = new Date(user.lastAuraIdentityChange);
        const now = new Date();
        const diff = now - lastChange;
        const cooldownMs = 24 * 60 * 60 * 1000;
        return diff < cooldownMs;
    }, [user]);

    // Timer effect
    useEffect(() => {
        if (!isCooldownActive) {
            setTimeLeft(null);
            return;
        }

        const tick = () => {
            const lastChange = new Date(user.lastAuraIdentityChange);
            const now = new Date();
            const diff = now - lastChange;
            const cooldownMs = 24 * 60 * 60 * 1000;
            const remaining = cooldownMs - diff;

            if (remaining <= 0) {
                setTimeLeft(null);
            } else {
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            }
        };

        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [isCooldownActive, user]);

    const handleEmojiSelect = (emoji) => {
        if (isCooldownActive) return;
        setSelectedAvatar(emoji);
        setAvatarType('emoji');
    };

    const handleEnterAuraX = async (isReuse = false) => {
        setIsSubmitting(true);
        try {
            const payload = isReuse || isCooldownActive
                ? { reusePrevious: true }
                : {
                    avatar: selectedAvatar,
                    avatarType: avatarType,
                    auraName: auraName.trim(),
                    auraColor: auraColor
                };

            await axios.post('/api/aurax/avatar', payload);
            await fetchUser(); // Refresh global user state to get new cooldown timestamp
            toast.success(isCooldownActive ? 'Identity Confirmed' : 'Identity Locked!');

            if (onClose) onClose();
            else navigate('/aurax');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to enter AuraX');
        } finally {
            setIsSubmitting(false);
        }
    };

    const containerClass = onClose ? "aurax-onboarding-modal" : "aurax-onboarding-container";

    return (
        <div className={containerClass}>
            {!onClose && <div className="onboarding-void-bg"></div>}

            <motion.div
                className="onboarding-content aurax-glass-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                {onClose && (
                    <button className="modal-close-btn" onClick={onClose}>✕</button>
                )}

                <div className="onboarding-header">
                    <h1 className="onboarding-title">AuraX Identity</h1>
                    <p className="onboarding-tagline">
                        {isCooldownActive ? "Your identity is hidden in the void" : "Choose your temporary manifestation"}
                    </p>
                </div>

                {isCooldownActive && (
                    <div className="cooldown-status-banner">
                        <Timer size={20} className="timer-icon" />
                        <span>Identity Change Lock: <strong>{timeLeft}</strong></span>
                    </div>
                )}

                <div className={`selection-wrapper ${isCooldownActive ? 'cooldown-locked' : ''}`}>
                    <div className="avatar-section">
                        <h2 className="section-title">Aura Avatar</h2>
                        <div className="emoji-grid">
                            {GENZ_EMOJIS.slice(0, showAllEmojis ? 24 : 11).map((emoji, index) => (
                                <motion.button
                                    key={index}
                                    className={`emoji-item ${selectedAvatar === emoji ? 'selected' : ''}`}
                                    onClick={() => handleEmojiSelect(emoji)}
                                    whileHover={!isCooldownActive ? { scale: 1.1 } : {}}
                                >
                                    <span className="emoji-icon">{emoji}</span>
                                </motion.button>
                            ))}
                            {!showAllEmojis && (
                                <button className="emoji-item view-more-btn" onClick={() => setShowAllEmojis(true)}>⋯</button>
                            )}
                        </div>
                    </div>

                    <div className="name-section">
                        <h2 className="section-title">Aura Name</h2>
                        <div className="input-group">
                            <input
                                type="text"
                                className="aura-name-input"
                                placeholder="Ghost-Phantom..."
                                value={auraName}
                                onChange={(e) => !isCooldownActive && setAuraName(e.target.value)}
                                disabled={isCooldownActive}
                            />
                            {!isCooldownActive && (
                                <button className="shuffle-btn" onClick={() => setAuraName(NAME_SUGGESTIONS[Math.floor(Math.random() * NAME_SUGGESTIONS.length)])}>
                                    <RefreshCw size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="action-footer">
                    {isCooldownActive ? (
                        <button className="enter-aurax-btn locked" onClick={() => handleEnterAuraX(true)}>
                            <CheckCircle size={20} />
                            <span>Continue as {user?.lastAuraIdentity?.auraName || 'Shadow'}</span>
                        </button>
                    ) : (
                        <div className="dual-action-btns">
                            {user?.lastAuraIdentity?.auraName && (
                                <button className="reuse-btn" onClick={() => handleEnterAuraX(true)} disabled={isSubmitting}>
                                    Reuse Previous
                                </button>
                            )}
                            <button
                                className="enter-aurax-btn"
                                onClick={() => handleEnterAuraX(false)}
                                disabled={isSubmitting || !selectedAvatar || !auraName.trim()}
                            >
                                {isSubmitting ? "Locking..." : "Confirm Identity"}
                            </button>
                        </div>
                    )}
                </div>

                {isCooldownActive && (
                    <p className="cooldown-note">
                        <ShieldAlert size={14} />
                        Identity can be changed again after the timer expires.
                    </p>
                )}
            </motion.div>
        </div>
    );
};

export default AuraXOnboarding;
