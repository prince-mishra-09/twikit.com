import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AiOutlineClose, AiOutlinePlus } from 'react-icons/ai';
import './AuraXCreateModal.css';

const AuraXCreateModal = ({ isOpen, onClose, onPostCreated }) => {
    const [activeTab, setActiveTab] = useState('text'); // 'text' or 'photo'
    const [caption, setCaption] = useState('');
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleMediaChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            toast.error('Please select an image or video file');
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            toast.error('File size must be less than 50MB');
            return;
        }

        setMediaFile(file);
        const preview = URL.createObjectURL(file);
        setMediaPreview(preview);
    };

    const handleSubmit = async () => {
        if (!caption.trim()) {
            toast.error('Please enter a caption');
            return;
        }

        if (activeTab === 'photo' && !mediaFile) {
            toast.error('Please select a photo');
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('caption', caption.trim());
            formData.append('usePreviousIdentity', 'true');

            if (mediaFile) {
                formData.append('media', mediaFile);
            }

            const response = await axios.post('/api/aurax/new', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast.success('Aura transmitted to the Void!');

            // Reset form
            setCaption('');
            setMediaFile(null);
            setMediaPreview(null);
            setActiveTab('text');

            // Close modal and pass new post to parent
            onClose();
            if (onPostCreated) onPostCreated(response.data.auraX);
        } catch (error) {
            console.error('Post creation error:', error);
            const message = error.response?.data?.message || 'Failed to create post';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setCaption('');
            setMediaFile(null);
            setMediaPreview(null);
            setActiveTab('text');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="aurax-modal-backdrop" onClick={handleClose}>
                <motion.div
                    className="aurax-modal-content"
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="modal-header">
                        <h2 className="modal-title">Create Aura</h2>
                        <button className="modal-close-btn" onClick={handleClose}>
                            <AiOutlineClose />
                        </button>
                    </div>

                    {/* Tab Switcher */}
                    <div className="tab-switcher">
                        <button
                            className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
                            onClick={() => setActiveTab('text')}
                        >
                            📝 Text Only
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'photo' ? 'active' : ''}`}
                            onClick={() => setActiveTab('photo')}
                        >
                            📷 Text + Photo
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="modal-body">
                        {/* Caption Input */}
                        <textarea
                            className="modal-caption-input"
                            placeholder="What vibe do you want to cast into the Void?"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            maxLength={500}
                            rows={6}
                        />
                        <div className="char-counter">
                            {caption.length}/500
                        </div>

                        {/* Photo Upload (only shown in photo tab) */}
                        {activeTab === 'photo' && (
                            <div className="photo-upload-section">
                                {mediaPreview ? (
                                    <div className="media-preview-container">
                                        {mediaFile?.type.startsWith('video') ? (
                                            <video src={mediaPreview} controls className="media-preview" />
                                        ) : (
                                            <img src={mediaPreview} alt="Preview" className="media-preview" />
                                        )}
                                        <button
                                            className="remove-media-btn"
                                            onClick={() => {
                                                setMediaFile(null);
                                                setMediaPreview(null);
                                            }}
                                        >
                                            <AiOutlineClose />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="photo-upload-btn">
                                        <input
                                            type="file"
                                            accept="image/*,video/*"
                                            onChange={handleMediaChange}
                                            style={{ display: 'none' }}
                                        />
                                        <AiOutlinePlus className="upload-plus-icon" />
                                        <span>Upload Photo/Video</span>
                                        <p className="upload-hint">3:4 aspect ratio recommended</p>
                                    </label>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <motion.button
                        className="modal-submit-btn"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !caption.trim() || (activeTab === 'photo' && !mediaFile)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="loading-spinner"></span>
                                Transmitting...
                            </>
                        ) : (
                            'Share Aura'
                        )}
                    </motion.button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AuraXCreateModal;
