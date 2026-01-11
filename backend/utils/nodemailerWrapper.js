// ES6 wrapper for CommonJS nodemailer
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Import nodemailer as CommonJS - it exports the main object as module.exports
const nodemailerModule = require('nodemailer');

// Export the entire nodemailer object as default
export default nodemailerModule;
