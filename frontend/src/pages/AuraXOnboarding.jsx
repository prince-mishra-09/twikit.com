import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import './AuraXOnboarding.css';
import { AiOutlineUpload } from 'react-icons/ai';

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
    const [selectedAvatar, setSelectedAvatar] = useState('👻');
    const [avatarType, setAvatarType] = useState('emoji');
    const [auraName, setAuraName] = useState('');
    const [auraColor, setAuraColor] = useState(AURA_COLORS[Math.floor(Math.random() * AURA_COLORS.length)]);

    const [customFile, setCustomFile] = useState(null);
    const [showAllEmojis, setShowAllEmojis] = useState(false);
    const [customPreview, setCustomPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCustomUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }
            setCustomFile(file);
            const preview = URL.createObjectURL(file);
            setCustomPreview(preview);
            setSelectedAvatar(preview);
            setAvatarType('custom');
        }
    };

    const handleEmojiSelect = (emoji) => {
        setSelectedAvatar(emoji);
        setAvatarType('emoji');
        setCustomPreview(null);
    };

    const generateRandomName = () => {
        const randomName = NAME_SUGGESTIONS[Math.floor(Math.random() * NAME_SUGGESTIONS.length)];
        setAuraName(randomName);
        // Also shuffle color when name is shuffled
        setAuraColor(AURA_COLORS[Math.floor(Math.random() * AURA_COLORS.length)]);
    };

    const handleEnterAuraX = async () => {
        if (!selectedAvatar) {
            toast.error('Please select an avatar');
            return;
        }

        if (!auraName.trim()) {
            toast.error('Please enter or select a name');
            return;
        }

        setIsSubmitting(true);

        try {
            // For custom images, we would upload to cloudinary first
            // For now, we'll just save emoji avatars
            if (avatarType === 'custom') {
                toast.error('Custom avatars coming soon! Please select an emoji for now.');
                setIsSubmitting(false);
                return;
            }

            await axios.post('/api/aurax/avatar', {
                avatar: selectedAvatar,
                avatarType: avatarType,
                auraName: auraName.trim(),
                auraColor: auraColor
            });

            toast.success('Identity Updated!');

            if (onClose) {
                onClose(); // Close modal if in modal mode
            } else {
                navigate('/aurax'); // Navigate if in full page mode
            }
        } catch (error) {
            console.error('Onboarding error:', error);
            toast.error(error.response?.data?.message || 'Failed to save avatar');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Conditional styles for Modal vs Full Page
    const containerClass = onClose ? "aurax-onboarding-modal" : "aurax-onboarding-container";

    return (
        <div className={containerClass}>
            {/* Background Effect (Only for full page) */}
            {!onClose && <div className="onboarding-void-bg"></div>}

            <motion.div
                className="onboarding-content"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                {/* Close Button for Modal */}
                {onClose && (
                    <button
                        className="modal-close-btn"
                        onClick={onClose}
                        title="Close"
                    >
                        ✕
                    </button>
                )}
                {/* Header */}
                <motion.div
                    className="onboarding-header"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <h1 className="onboarding-title">Enter the Void</h1>
                    <p className="onboarding-tagline">No Face, No Case. Just Vibe</p>
                </motion.div>

                {/* Avatar Selection */}
                <motion.div
                    className="avatar-section"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                >
                    <h2 className="section-title">Choose Your Avatar</h2>

                    <div className="emoji-grid">
                        {/* First 11 emojis always shown */}
                        {GENZ_EMOJIS.slice(0, 11).map((emoji, index) => (
                            <motion.button
                                key={index}
                                className={`emoji-item ${selectedAvatar === emoji && avatarType === 'emoji' ? 'selected' : ''}`}
                                onClick={() => handleEmojiSelect(emoji)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <span className="emoji-icon">{emoji}</span>
                            </motion.button>
                        ))}

                        {/* View More as Grid Item (when collapsed) */}
                        {!showAllEmojis && (
                            <motion.button
                                className="emoji-item view-more-grid-btn"
                                onClick={() => setShowAllEmojis(true)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <span className="view-more-icon">⋯</span>
                            </motion.button>
                        )}

                        {/* Remaining emojis (when expanded) */}
                        {showAllEmojis && GENZ_EMOJIS.slice(11).map((emoji, index) => (
                            <motion.button
                                key={index + 11}
                                className={`emoji-item ${selectedAvatar === emoji && avatarType === 'emoji' ? 'selected' : ''}`}
                                onClick={() => handleEmojiSelect(emoji)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <span className="emoji-icon">{emoji}</span>
                            </motion.button>
                        ))}
                    </div>

                    {/* Show Less Button (only when expanded) */}
                    {showAllEmojis && (
                        <motion.button
                            className="show-less-btn"
                            onClick={() => setShowAllEmojis(false)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            ▲ Show Less
                        </motion.button>
                    )}

                    {/* Custom Upload (Disabled for now) */}
                    <motion.label
                        className="custom-upload-btn disabled"
                        whileHover={{ scale: 1.02 }}
                        title="Coming soon!"
                    >
                        <AiOutlineUpload className="upload-icon" />
                        <span>Upload Custom (Coming Soon)</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleCustomUpload}
                            style={{ display: 'none' }}
                            disabled
                        />
                    </motion.label>
                </motion.div>

                {/* Name Input */}
                <motion.div
                    className="name-section"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                >
                    <h2 className="section-title">Choose Your Aura Name</h2>

                    <input
                        type="text"
                        className="aura-name-input"
                        placeholder="Enter your shadow name..."
                        value={auraName}
                        onChange={(e) => setAuraName(e.target.value)}
                        maxLength={20}
                    />

                    {/* Name Suggestions */}
                    <div className="name-suggestions">
                        {NAME_SUGGESTIONS.slice(0, 6).map((suggestion, index) => (
                            <motion.button
                                key={index}
                                className="suggestion-chip"
                                onClick={() => setAuraName(suggestion)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {suggestion}
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* Enter Button */}
                <motion.button
                    className="enter-aurax-btn"
                    onClick={handleEnterAuraX}
                    disabled={isSubmitting || !selectedAvatar || !auraName.trim()}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {isSubmitting ? (
                        <>
                            <span className="loading-spinner"></span>
                            Entering...
                        </>
                    ) : (
                        <>
                            <span>Enter in AuraX</span>
                            <span className="enter-icon">🚀</span>
                        </>
                    )}
                </motion.button>
            </motion.div>
        </div>
    );
};

export default AuraXOnboarding;
