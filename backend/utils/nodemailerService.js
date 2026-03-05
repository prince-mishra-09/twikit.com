// Nodemailer Service - Sends admin alert emails via SMTP (Gmail)
// This is separate from Resend-based otpEmailService to avoid consuming Resend quota for alerts
import nodemailer from 'nodemailer';

class NodemailerService {
    constructor() {
        this.transporter = null;
    }

    getTransporter() {
        if (!this.transporter) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: false, // true for 465, false for other ports (STARTTLS)
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        }
        return this.transporter;
    }

    // Send alert email via SMTP
    async sendAlertEmail({ to, subject, html }) {
        try {
            const info = await this.getTransporter().sendMail({
                from: `"xwaked Alerts" <${process.env.SMTP_USER}>`,
                to: to || process.env.ADMIN_EMAIL,
                subject: subject,
                html: html,
            });

            console.log('✅ Alert email sent via SMTP:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Failed to send alert email via SMTP:', error.message);
            throw error;
        }
    }

    // Test SMTP connection
    async testConnection() {
        try {
            await this.getTransporter().verify();
            console.log('✅ SMTP Email Service ready');
            return true;
        } catch (error) {
            console.error('❌ SMTP connection error:', error.message);
            return false;
        }
    }
}

export default new NodemailerService();
