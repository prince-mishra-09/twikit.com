// Email Service for OTP - Uses nodemailer wrapper for ES6 compatibility
import nodemailer from './nodemailerWrapper.js';

class OTPEmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
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
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ OTP sent to ${email}:`, info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`❌ Failed to send OTP to ${email}:`, error);
      throw error;
    }
  }

  // Test email connection
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log("✅ OTP Email service is ready");
      return true;
    } catch (error) {
      console.error("❌ OTP Email service error:", error);
      return false;
    }
  }
}

export default new OTPEmailService();
