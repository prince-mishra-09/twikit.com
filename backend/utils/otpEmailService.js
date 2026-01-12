// Email Service for OTP - Uses nodemailer wrapper for ES6 compatibility
import nodemailer from './nodemailerWrapper.js';

class OTPEmailService {
  constructor() {
    this.transporter = null;
  }

  getTransporter(forceConfig = null) {
    if (!this.transporter || forceConfig) {
      const host = forceConfig?.host || process.env.SMTP_HOST || 'smtp.gmail.com';
      const port = parseInt(forceConfig?.port || process.env.SMTP_PORT) || 465;
      const isSecure = (port === 465);

      console.log(`📡 [SMTP INIT] ${forceConfig ? 'OVERRIDE' : 'DEFAULT'} -> ${host}:${port} (SSL: ${isSecure})`);

      this.transporter = nodemailer.createTransport({
        host: host,
        port: port,
        secure: isSecure,
        auth: {
          user: forceConfig?.user || process.env.SMTP_USER,
          pass: forceConfig?.pass || process.env.SMTP_PASS
        },
        debug: true,
        logger: true,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
        dnsTimeout: 5000,
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2'
        },
        requireTLS: port === 587
      });
    }
    return this.transporter;
  }

  // Generate 4-digit OTP
  generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Send OTP email
  async sendOTP(email, otp) {
    const subject = "Twikit - Your Verification Code";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .otp-box { background: #f8f9fa; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 30px 0; }
          .otp-code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 10px; font-family: monospace; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">✨ Twikit</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Email Verification</p>
          </div>
          
          <div class="content">
            <h2 style="color: #333; margin-top: 0;">Verify Your Email</h2>
            <p>Thank you for signing up with Twikit! Please use the verification code below to complete your registration:</p>

            <div class="otp-box">
              <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">Your Verification Code</p>
              <div class="otp-code">${otp}</div>
            </div>

            <div class="warning">
              <p style="margin: 0;"><strong>⏰ Important:</strong> This code will expire in <strong>10 minutes</strong>.</p>
            </div>

            <p style="color: #6c757d; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
          </div>

          <div class="footer">
            <p>This is an automated email from Twikit.</p>
            <p>© ${new Date().getFullYear()} Twikit. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Twikit" <${process.env.SMTP_USER}>`,
      to: email,
      subject: subject,
      html: html
    };

    try {
      console.log(`📤 Attempting to send OTP to ${email}...`);
      const info = await this.getTransporter().sendMail(mailOptions);
      console.log(`✅ OTP sent to ${email}:`, info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`❌ Failed to send OTP to ${email}:`);
      console.error("Error Details:", {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response
      });
      throw error;
    }
  }

  // Test email connection
  async testConnection() {
    try {
      await this.getTransporter().verify();
      console.log("✅ OTP Email service is ready");
      return true;
    } catch (error) {
      console.error("❌ OTP Email service error:", error);
      return false;
    }
  }

  // Send welcome email after successful registration
  async sendWelcomeEmail(email, name, username) {
    const subject = "Welcome to Twikit! 🎉";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .welcome-box { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0; }
          .username-badge { display: inline-block; background: #667eea; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
          .features { margin: 30px 0; }
          .feature-item { display: flex; align-items: start; margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
          .feature-icon { font-size: 24px; margin-right: 15px; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 32px;">✨ Welcome to Twikit!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Your journey starts here</p>
          </div>
          
          <div class="content">
            <h2 style="color: #333; margin-top: 0;">Hi ${name}! 👋</h2>
            <p>We're thrilled to have you join the Twikit community! Your account has been successfully created.</p>

            <div class="welcome-box">
              <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">Your Username</p>
              <div class="username-badge">@${username}</div>
              <p style="margin: 15px 0 0 0; color: #6c757d; font-size: 14px;">Share your unique username with friends!</p>
            </div>

            <h3 style="color: #667eea;">🚀 Get Started</h3>
            <div class="features">
              <div class="feature-item">
                <div class="feature-icon">📝</div>
                <div>
                  <strong>Create Posts & Reels</strong>
                  <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 14px;">Share your thoughts, photos, and videos with the world</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">👥</div>
                <div>
                  <strong>Connect with Friends</strong>
                  <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 14px;">Follow people, like posts, and build your network</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">💬</div>
                <div>
                  <strong>Real-time Chat</strong>
                  <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 14px;">Send messages and stay connected instantly</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">📖</div>
                <div>
                  <strong>Share Stories</strong>
                  <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 14px;">Post moments that disappear after 24 hours</p>
                </div>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #6c757d; margin-bottom: 15px;">Ready to explore?</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="cta-button" style="color: white;">Start Exploring Twikit</a>
            </div>

            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0;"><strong>💡 Pro Tip:</strong> Complete your profile by adding a bio and profile picture to get more followers!</p>
            </div>

            <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">If you have any questions or need help, feel free to reach out to our support team.</p>
          </div>

          <div class="footer">
            <p>Welcome aboard! We're excited to see what you'll share.</p>
            <p>© ${new Date().getFullYear()} Twikit. All rights reserved.</p>
            <p style="margin-top: 10px;">
              <a href="#" style="color: #667eea; text-decoration: none; margin: 0 10px;">Help Center</a> |
              <a href="#" style="color: #667eea; text-decoration: none; margin: 0 10px;">Privacy Policy</a> |
              <a href="#" style="color: #667eea; text-decoration: none; margin: 0 10px;">Terms of Service</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Twikit" <${process.env.SMTP_USER}>`,
      to: email,
      subject: subject,
      html: html
    };

    try {
      const info = await this.getTransporter().sendMail(mailOptions);
      console.log(`✅ Welcome email sent to ${email}:`, info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`❌ Failed to send welcome email to ${email}:`, error);
      throw error;
    }
  }

  // Diagnostic: Send a real test email to the sender themselves
  async sendTestEmail() {
    const email = process.env.SMTP_USER;
    const subject = "Twikit - System Diagnostic Test";
    const html = `<h1>Diagnostic Success!</h1><p>Your SMTP server is correctly sending emails from Render.</p><p>Timestamp: ${new Date().toISOString()}</p>`;

    const mailOptions = {
      from: `"Twikit Admin" <${process.env.SMTP_USER}>`,
      to: email,
      subject: subject,
      html: html
    };

    try {
      console.log(`🧪 Diagnostic: Attempting to send test email to ${email}...`);
      const info = await this.getTransporter().sendMail(mailOptions);
      console.log(`✅ Diagnostic: Test email sent:`, info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`❌ Diagnostic: Test email failed:`, error);
      return {
        success: false,
        error: error.message,
        code: error.code,
        response: error.response
      };
    }
  }
}

export default new OTPEmailService();
