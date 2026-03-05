// Email Service - Sends alert emails using Nodemailer (SMTP)
import nodemailerService from '../utils/nodemailerService.js';

class EmailService {
  // Send alert email
  async sendAlert(data) {
    const subject = `⚠️ xwaked Warning: ${data.name} at ${data.percentage}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ff6b6b; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
          .metric { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #ff6b6b; }
          .actions { background: #fff3cd; padding: 15px; margin: 15px 0; border-left: 4px solid #ffc107; }
          .footer { background: #e9ecef; padding: 15px; text-align: center; font-size: 12px; color: #6c757d; }
          ul { margin: 10px 0; padding-left: 20px; }
          li { margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">⚠️ xwaked Alert</h2>
            <p style="margin: 5px 0 0 0;">Threshold Breach Detected</p>
          </div>
          
          <div class="content">
            <div class="metric">
              <h3 style="margin-top: 0; color: #ff6b6b;">${data.name}</h3>
              <p><strong>Current Value:</strong> ${data.current}</p>
              <p><strong>Threshold:</strong> ${data.threshold}</p>
              <p><strong>Percentage:</strong> ${data.percentage}</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            </div>

            <div class="actions">
              <h4 style="margin-top: 0;">🔧 Suggested Actions:</h4>
              <ul>
                ${data.actions.map(action => `<li>${action}</li>`).join('')}
              </ul>
            </div>

            <p style="margin-top: 20px; padding: 10px; background: #d1ecf1; border-left: 4px solid #0c5460;">
              <strong>Note:</strong> This alert will not repeat for 30 minutes (cooldown period).
            </p>
          </div>

          <div class="footer">
            <p>This is an automated alert from xwaked Monitoring System.</p>
            <p>Server: ${process.env.NODE_ENV || 'development'} | Time: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const info = await nodemailerService.sendAlertEmail({
        to: process.env.ADMIN_EMAIL || 'mrprimi91@gmail.com',
        subject: subject,
        html: html
      });
      console.log('✅ Alert email sent via SMTP:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Failed to send alert email:', error);
      throw error;
    }
  }

  // Test SMTP connection
  async testConnection() {
    return nodemailerService.testConnection();
  }
}

export default new EmailService();
