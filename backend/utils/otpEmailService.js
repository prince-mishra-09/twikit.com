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
    const subject = "Verification Code for Twikit";
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 40px auto; padding: 20px; color: #4b5563; line-height: 1.5;">
        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 16px; font-weight: 500; color: #9ca3af; margin: 0;">Twikit</h1>
        </div>
        
        <p style="margin-bottom: 24px;">This code lets you sign in to Twikit.</p>
        
        <div style="font-size: 32px; font-weight: 400; letter-spacing: 0.2em; color: #1f2937; margin: 32px 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">
          ${otp}
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">
          This code expires in 10 minutes.
        </p>
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 48px;">
          If this wasn’t you, you can safely ignore this email.
        </p>
        
        <div style="border-top: 1px solid #f3f4f6; padding-top: 24px; font-size: 12px; color: #9ca3af;">
          This is an automated transactional email from Twikit.
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
    const subject = "Welcome to Twikit";
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 40px auto; padding: 20px; color: #4b5563; line-height: 1.6;">
        <div style="margin-bottom: 40px;">
          <h1 style="font-size: 16px; font-weight: 500; color: #9ca3af; margin: 0;">Twikit</h1>
        </div>
        
        <p style="font-size: 18px; font-weight: 400; color: #1f2937; margin-bottom: 24px;">Welcome to Twikit.</p>
        
        <p style="margin-bottom: 24px;">
          Twikit is a calm place to share and connect. Everything here is simple: a chronological feed, privacy-first by default, and no addictive algorithms to manage your attention.
        </p>
        
        <p style="margin-bottom: 24px;">
          You’re in control of what you see and who sees you. 
        </p>
        
        <p style="font-style: italic; color: #6b7280; margin-bottom: 48px;">
          Take your time. Twikit works best when used intentionally.
        </p>
        
        <div style="border-top: 1px solid #f3f4f6; padding-top: 24px; font-size: 12px; color: #9ca3af;">
          This is a system welcome email for your account @${username}.
        </div>
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
