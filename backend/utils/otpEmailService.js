import { Resend } from 'resend';
import emailMonitor from './emailMonitor.js';

class OTPEmailService {
  constructor() {
    this.resend = null;
    this.fromEmail = 'no-reply@twikit.online'; // Verified domain email
  }

  getResend() {
    if (!this.resend) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
    return this.resend;
  }

  // Generate 4-digit OTP
  generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  async sendEmail({ to, subject, html }) {
    try {
      // 1. Check/Increment usage
      const { count, shouldAlert } = emailMonitor.incrementAndCheck();

      console.log(`📤 Sending email to ${to} (Daily count: ${count})...`);

      const { data, error } = await this.getResend().emails.send({
        from: `Twikit <${this.fromEmail}>`,
        to: to,
        subject: subject,
        html: html,
      });

      if (error) {
        console.error("❌ Resend API Error:", error);
        throw error;
      }

      // 2. If threshold reached, send alert (async, don't block)
      if (shouldAlert) {
        this.sendAlertEmail(count);
      }

      return { success: true, messageId: data.id };
    } catch (error) {
      console.error(`❌ Failed to send email to ${to}:`, error.message);
      throw error;
    }
  }

  async sendAlertEmail(count) {
    console.log(`⚠️ Sending limit alert to admin...`);
    await emailMonitor.sendAlert(this, count);
  }

  // Send OTP email
  async sendOTP(email, otp) {
    const subject = "Twikit - Your Verification Code";
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 15px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #667eea; margin: 0; font-size: 28px;">Twikit</h1>
          <p style="color: #6c757d; margin: 5px 0 0 0;">Secure Registration</p>
        </div>
        <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; text-align: center;">
          <p style="color: #333; margin-bottom: 25px; font-size: 16px;">Namaste! Use the code below to verify your email address.</p>
          <div style="background: white; border: 2px solid #667eea; color: #667eea; font-size: 40px; font-weight: bold; letter-spacing: 12px; padding: 15px; border-radius: 10px; display: inline-block;">
            ${otp}
          </div>
          <p style="color: #dc3545; font-size: 13px; margin-top: 25px;">This code will expire in 10 minutes.</p>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f1f1; text-align: center;">
          <p style="color: #6c757d; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
        </div>
      </div>
    `;
    return this.sendEmail({ to: email, subject, html });
  }

  // Test email connection (For diagnostics)
  async testConnection() {
    try {
      console.log("🧪 Testing Resend API connection...");
      // We'll just try to list domains or something simple to verify API key
      const { data, error } = await this.getResend().domains.list();
      if (error) throw error;
      console.log("✅ Resend API is ready");
      return true;
    } catch (error) {
      console.error("❌ Resend API connection error:", error.message);
      return false;
    }
  }

  // Send welcome email after successful registration
  async sendWelcomeEmail(email, name, username) {
    const subject = "Welcome to Twikit! 🎉";
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Hi ${name}! 👋</h2>
        <p>Welcome to Twikit! Your account has been created with username <strong>@${username}</strong>.</p>
        <p>Start sharing and connecting with others!</p>
      </div>
    `;
    return this.sendEmail({ to: email, subject, html });
  }

  // Diagnostic: Send a real test email
  async sendTestEmail() {
    const email = process.env.ADMIN_EMAIL || 'mrprimi09@gmail.com';
    const subject = "Twikit - Resend Diagnostic Test";
    const html = `<h1>Resend Success!</h1><p>Your API integration is working perfectly.</p><p>Timestamp: ${new Date().toISOString()}</p>`;
    return this.sendEmail({ to: email, subject, html });
  }
}

export default new OTPEmailService();
