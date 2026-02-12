// Aura Identity Generator
// Generates random anonymous identities for Aura X posts

const AURA_NAMES = [
    'Cyber-Ghost',
    'Neon-Phantom',
    'Eclipse-Walker',
    'Digital-Wraith',
    'Shadow-Pulse',
    'Void-Echo',
    'Glitch-Spectre',
    'Quantum-Shade',
    'Pixel-Hunter',
    'Binary-Whisper',
    'Static-Drift',
    'Chrome-Reaper',
    'Circuit-Nomad',
    'Data-Phantom',
    'Synth-Wanderer'
];

const AURA_COLORS = [
    '#00F5FF', // Cyan
    '#FF1493', // Deep Pink
    '#39FF14', // Neon Green
    '#FF6EC7', // Hot Pink
    '#8A2BE2', // Blue Violet
    '#FF4500', // Orange Red
    '#7FFF00', // Chartreuse
    '#FF00FF', // Magenta
    '#00FFFF', // Aqua
    '#FFD700', // Gold
    '#FF69B4', // Hot Pink
    '#32CD32', // Lime Green
];

/**
 * Generate a random Aura identity
 * @returns {Object} { auraName: string, auraColor: string }
 */
export const generateAuraIdentity = () => {
    const randomName = AURA_NAMES[Math.floor(Math.random() * AURA_NAMES.length)];
    const randomColor = AURA_COLORS[Math.floor(Math.random() * AURA_COLORS.length)];

    return {
        auraName: randomName,
        auraColor: randomColor,
    };
};

/**
 * Get Aura identity based on user preference
 * @param {Object} user - User document
 * @param {Boolean} usePreviousIdentity - Whether to reuse last identity
 * @returns {Object} { auraName: string, auraColor: string }
 */
export const getAuraIdentity = (user, usePreviousIdentity = false) => {
    // If user wants to reuse identity AND has a previous one
    if (usePreviousIdentity && user.lastAuraIdentity?.auraName && user.lastAuraIdentity?.auraColor) {
        return {
            auraName: user.lastAuraIdentity.auraName,
            auraColor: user.lastAuraIdentity.auraColor,
        };
    }

    // Otherwise generate new identity
    return generateAuraIdentity();
};
