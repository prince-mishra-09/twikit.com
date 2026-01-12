import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USAGE_FILE = path.join(__dirname, '../data/email_usage.json');
const DAILY_LIMIT = 100;
const ALERT_THRESHOLD = 0.8; // 80%

class EmailMonitor {
    constructor() {
        this.ensureUsageFile();
    }

    ensureUsageFile() {
        const dataDir = path.dirname(USAGE_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        if (!fs.existsSync(USAGE_FILE)) {
            fs.writeFileSync(USAGE_FILE, JSON.stringify({ date: this.getToday(), count: 0, alertSent: false }));
        }
    }

    getToday() {
        return new Date().toISOString().split('T')[0];
    }

    getUsage() {
        const data = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
        const today = this.getToday();

        if (data.date !== today) {
            // Reset for new day
            const newData = { date: today, count: 0, alertSent: false };
            fs.writeFileSync(USAGE_FILE, JSON.stringify(newData));
            return newData;
        }
        return data;
    }

    incrementAndCheck() {
        const data = this.getUsage();
        data.count += 1;

        let shouldAlert = false;
        if (data.count >= (DAILY_LIMIT * ALERT_THRESHOLD) && !data.alertSent) {
            shouldAlert = true;
            data.alertSent = true;
        }

        fs.writeFileSync(USAGE_FILE, JSON.stringify(data));
        return { count: data.count, shouldAlert };
    }

    async sendAlert(service, currentCount) {
        console.log(`⚠️ EMAIL LIMIT ALERT: Usage at ${currentCount}/${DAILY_LIMIT}`);
        try {
            await service.sendEmail({
                to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
                subject: "⚠️ Twikit Email Limit Alert",
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #ff0000; border-radius: 10px;">
                        <h2 style="color: #ff0000;">Email Limit Alert</h2>
                        <p>Bhai, aapke Resend.com ki daily limit (100 emails) khatam hone wali h.</p>
                        <p><strong>Current Usage:</strong> ${currentCount} / ${DAILY_LIMIT}</p>
                        <p>Jab limit 100 ho jayegi, toh OTP aana band ho jayenge. Kal firse reset ho jayega.</p>
                    </div>
                `
            });
        } catch (err) {
            console.error("Failed to send limit alert:", err);
        }
    }
}

export default new EmailMonitor();
