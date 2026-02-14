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

      // console.log(`📤 Sending email to ${to} (Daily count: ${count})...`);

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

      // 2. If threshold reached, send alert
      if (shouldAlert) {
        await this.sendAlertEmail(count);
      }

      return { success: true, messageId: data.id };
    } catch (error) {
      console.error(`❌ Failed to send email to ${to}:`, error.message);
      throw error;
    }
  }

  async sendAlertEmail(count) {
    // console.log(`⚠️ Sending limit alert to admin...`);
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
      // console.log("🧪 Testing Resend API connection...");
      // We'll just try to list domains or something simple to verify API key
      const { data, error } = await this.getResend().domains.list();
      if (error) throw error;
      // console.log("✅ Resend API is ready");
      return true;
    } catch (error) {
      console.error("❌ Resend API connection error:", error.message);
      return false;
    }
  }

  async sendWelcomeEmail(email, name, username) {
    const subject = "Welcome to Twikit — A quiet place to be real";
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body {
                  background-color: #0B0F14;
                  color: #E2E8F0;
                  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                  -webkit-font-smoothing: antialiased;
              }
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 48px 24px;
              }
              .logo {
                  font-size: 20px;
                  font-weight: 800;
                  letter-spacing: -0.04em;
                  color: #FFFFFF;
                  margin-bottom: 48px;
                  display: block;
                  text-decoration: none;
              }
              .logo-gradient {
                  background: linear-gradient(135deg, #6366F1 0%, #A855F7 100%);
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
              }
              .greeting {
                  font-size: 32px;
                  font-weight: 700;
                  color: #FFFFFF;
                  margin-bottom: 24px;
                  letter-spacing: -0.03em;
                  line-height: 1.1;
              }
              .hero-text {
                  font-size: 17px;
                  line-height: 1.7;
                  color: #94A3B8;
                  margin-bottom: 40px;
              }
              .card {
                  background: rgba(255, 255, 255, 0.03);
                  border: 1px solid rgba(255, 255, 255, 0.08);
                  border-radius: 24px;
                  padding: 32px;
                  margin-bottom: 40px;
              }
              .feature-label {
                  display: inline-block;
                  padding: 6px 14px;
                  border-radius: 100px;
                  font-size: 11px;
                  font-weight: 700;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                  margin-bottom: 12px;
              }
              .label-real { background: rgba(99, 102, 241, 0.15); color: #818CF8; }
              .label-reflect { background: rgba(168, 85, 247, 0.15); color: #C084FC; }
              
              .feature-text {
                  font-size: 14px;
                  color: #64748B;
                  margin: 0 0 24px 0;
                  line-height: 1.6;
              }
              .manifesto {
                  border-left: 3px solid #6366F1;
                  padding: 4px 0 4px 24px;
                  margin: 48px 0;
                  font-size: 18px;
                  font-weight: 500;
                  color: #F1F5F9;
                  line-height: 1.5;
              }
              .footer {
                  margin-top: 80px;
                  padding-top: 40px;
                  border-top: 1px solid rgba(255, 255, 255, 0.05);
                  color: #475569;
                  font-size: 12px;
                  line-height: 1.8;
              }
              .footer a {
                  color: #94A3B8;
                  text-decoration: none;
                  font-weight: 500;
              }
              .footer-links {
                  margin-bottom: 16px;
              }
              .footer-links span { margin: 0 8px; color: #334155; }
              
              .signature {
                  margin-top: 48px;
              }
              .signature-name {
                  font-weight: 700;
                  color: #FFFFFF;
                  font-size: 18px;
                  margin: 0;
              }
              .signature-sub {
                  color: #64748B;
                  font-size: 14px;
                  margin: 4px 0 0 0;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="logo">
                  <span class="logo-gradient">TWIKIT</span>
              </div>
              
              <h1 class="greeting">Hi ${name},</h1>
              
              <p class="hero-text">
                  Welcome to <strong>Twikit</strong>. <br><br>
                  You didn’t just sign up for another social app. You stepped into a quieter place on the internet.
              </p>
              
              <div class="card">
                  <p style="margin-top: 0; color: #CBD5E1; font-size: 15px; margin-bottom: 24px;">Twikit was built for people who are tired of performing. Tired of pretending. Tired of measuring themselves with likes.</p>
                  
                  <div class="feature-label label-real">✨ Vibe Up</div>
                  <p class="feature-text">When someone genuinely vibes with what you shared. It’s a signal of appreciation, not a performance metric.</p>
                  
                  <div class="feature-label label-reflect" style="margin-top: 8px;">💭 Vibe Down</div>
                  <p class="feature-text" style="margin-bottom: 0;">A private signal that something felt off. Visible only to the author to help them reflect without public shame.</p>
              </div>
              
              <p class="hero-text">
                  Here, your posts aren’t pushed by loud algorithms. There’s no “For You” page trying to keep you scrolling. What you see is chronological, intentional, and in your control.
              </p>
              
              <div class="manifesto">
                  “You don’t need to post perfectly here. You don’t need to post often. Twikit works best when you use it slowly and honestly.”
              </div>
              
              <p class="hero-text" style="margin-bottom: 0;">
                  Take your time. Explore gently. Share when it feels right. <br><br>
                  Welcome to a calmer kind of social media.
              </p>
              
              <div class="signature">
                  <p class="signature-name">— Twikit</p>
                  <p class="signature-sub">A quiet place to be real</p>
              </div>
              
              <div class="footer">
                  <div class="footer-links">
                      <a href="https://twikit.online/privacy">Privacy</a>
                      <span>&bull;</span>
                      <a href="https://twikit.online/terms">Terms</a>
                      <span>&bull;</span>
                      <a href="https://twikit.online/help">Help</a>
                  </div>
                  <p>&copy; 2026 Twikit. All rights reserved. <br>
                  This is a transactional email for your account @${username}. <br>
                  Twikit HQ — A calmer corner of the web.</p>
              </div>
          </div>
      </body>
      </html>
    `;
    return this.sendEmail({ to: email, subject, html });
  }

  // Diagnostic: Send a real test email
  async sendTestEmail() {
    const email = process.env.ADMIN_EMAIL;
    if (!email) throw new Error("ADMIN_EMAIL env var is missing");
    const subject = "Twikit - Resend Diagnostic Test";
    const html = `<h1>Resend Success!</h1><p>Your API integration is working perfectly.</p><p>Timestamp: ${new Date().toISOString()}</p>`;
    return this.sendEmail({ to: email, subject, html });
  }
}

export default new OTPEmailService();
