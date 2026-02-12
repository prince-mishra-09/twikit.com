import React from 'react';
import './AuraXIcon.css';

const AuraXIcon = ({ className = '', size = 24 }) => {
    return (
        <div className={`aurax-icon-container ${className}`} style={{ width: size, height: size }}>
            <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="aurax-ghost-svg"
                width="100%"
                height="100%"
            >
                <path d="M20 50C20 33.4315 33.4315 20 50 20C66.5685 20 80 33.4315 80 50V80L70 70L60 80L50 70L40 80L30 70L20 80V50Z"
                    stroke="currentColor" strokeWidth="3" className="ghost-main-path" />

                <circle cx="40" cy="45" r="4" fill="currentColor" className="ghost-eye" />
                <circle cx="60" cy="45" r="4" fill="currentColor" className="ghost-eye" />

                <path d="M22 52C22 35.4315 35.4315 22 52 22C68.5685 22 82 35.4315 82 52V82L72 72L62 82L52 72L42 82L32 72L22 82V52Z"
                    stroke="currentColor" strokeWidth="1" className="ghost-glitch-path" opacity="0.5" />
            </svg>
        </div>
    );
};

export default AuraXIcon;
