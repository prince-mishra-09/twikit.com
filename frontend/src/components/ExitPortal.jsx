import { motion } from 'framer-motion';

const ExitPortal = ({ onExit }) => {
    return (
        <motion.button
            className="exit-portal"
            onClick={onExit}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
        >
            <span className="exit-portal-text">Exit Aura X</span>
            <span className="exit-portal-glow"></span>
        </motion.button>
    );
};

export default ExitPortal;
