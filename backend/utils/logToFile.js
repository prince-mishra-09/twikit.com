import fs from 'fs';
import path from 'path';

/**
 * Logs a message to a debug.log file in the root directory.
 * @param {string} message - The message to log.
 */
export const logToFile = (message) => {
    try {
        const timestamp = new Date().toISOString();
        const logMsg = `[${timestamp}] ${message}\n`;
        // Append to debug.log in the current working directory
        fs.appendFileSync(path.join(process.cwd(), 'debug.log'), logMsg);
    } catch (err) {
        console.error('Failed to log to file:', err);
    }
};
