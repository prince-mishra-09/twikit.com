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
    const subject = "Verification Code for Twikit ⚡";
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: auto; padding: 40px 20px; background: #ffffff; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #f0f0f0;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 60px; height: 60px; line-height: 60px; border-radius: 18px; display: inline-block; color: white; font-size: 32px; font-weight: bold; box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);">T</div>
          <h1 style="color: #1a202c; margin: 20px 0 5px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Verify your email</h1>
          <p style="color: #718096; margin: 0; font-size: 15px;">Secure login for Twikit</p>
        </div>
        
        <div style="background: #f7fafc; border-radius: 20px; padding: 32px; text-align: center; border: 1px solid #edf2f7;">
          <p style="color: #4a5568; margin-bottom: 24px; font-size: 16px; font-weight: 500;">Your verification code is here:</p>
          <div style="background: white; border: 2px solid #667eea; color: #667eea; font-size: 42px; font-weight: 900; letter-spacing: 8px; padding: 16px 24px; border-radius: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);">
            ${otp}
          </div>
          <p style="color: #e53e3e; font-size: 13px; margin-top: 24px; font-weight: 600;">Valid for 10 mins only. No cap. ⏱️</p>
        </div>
        
        <div style="margin-top: 32px; text-align: center; border-top: 1px solid #edf2f7; padding-top: 24px;">
          <p style="color: #a0aec0; font-size: 12px; margin-bottom: 8px;">If you didn't request this, you can just ignore it.</p>
          <p style="color: #718096; font-size: 13px; font-weight: 600;">Team Twikit</p>
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
    const subject = "Welcome to the Twikit Fam! 🎉";
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: auto; padding: 0; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #f0f0f0;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -1px;">LFG! 🎉</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Welcome to the fam, ${name}!</p>
        </div>
        
        <div style="padding: 40px 30px; text-align: center;">
          <div style="background: #f7fafc; border-radius: 20px; padding: 24px; margin-bottom: 30px; border: 1px solid #edf2f7;">
            <p style="color: #4a5568; margin: 0; font-size: 16px;">Your account is officially live as</p>
            <h2 style="color: #667eea; margin: 10px 0; font-size: 24px; font-weight: 800;">@${username}</h2>
          </div>
          
          <p style="color: #1a202c; font-size: 17px; line-height: 1.6; font-weight: 500;">
            We're hyped to have you here! Twikit is all about sharing your vibe and connecting with your tribe. <br><br>
            Go ahead, post something fire and let the world know you're here. 🚀
          </p>
          
          <div style="margin-top: 40px;">
            <p style="color: #718096; font-size: 14px; font-style: italic;">Stay vibrant, stay you.</p>
            <p style="color: #1a202c; font-size: 15px; font-weight: 800; margin-top: 5px;">Team Twikit ✌️</p>
          </div>
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
