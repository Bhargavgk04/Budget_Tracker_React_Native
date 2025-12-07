const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.isVerified = false;
  }

  // Initialize email transporter with connection pooling for speed
  initialize() {
    try {
      if (this.initialized) return;

      // Create transporter with optimized settings for speed
      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        // Connection pooling for faster subsequent emails
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        // Reduced timeouts for faster failure detection
        connectionTimeout: 5000, // 5 seconds
        greetingTimeout: 5000,
        socketTimeout: 10000,
        // Keep connection alive for faster subsequent sends
        tls: {
          rejectUnauthorized: false // For development
        }
      });

      this.initialized = true;
      console.log('✓ Email service initialized with connection pooling');
      
      // Skip verification on startup - it will be done on first email send
      // This prevents blocking the server startup
      if (process.env.NODE_ENV !== 'production') {
        // Only verify in development, and don't wait for it
        setTimeout(() => {
          this.verifyConnection().catch(() => {
            console.log('⚠️  Email verification failed - emails will still be attempted');
          });
        }, 5000); // Verify after 5 seconds, not immediately
      }
    } catch (error) {
      console.error('✗ Email service initialization failed:', error.message);
      this.initialized = false;
    }
  }

  // Verify email configuration (with caching and timeout)
  async verifyConnection() {
    try {
      if (!this.transporter) {
        this.initialize();
      }

      // Return cached result if already verified
      if (this.isVerified) {
        return true;
      }

      // Add timeout to prevent hanging
      const verifyPromise = this.transporter.verify();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 3000)
      );

      await Promise.race([verifyPromise, timeoutPromise]);
      this.isVerified = true;
      console.log('✓ Email service connection verified');
      return true;
    } catch (error) {
      console.error('✗ Email service verification failed:', error.message);
      this.isVerified = false;
      return false;
    }
  }

  // Send password reset OTP email (optimized for speed)
  async sendPasswordResetOTP(email, otp, userName) {
    const startTime = Date.now();
    
    try {
      if (!this.transporter) {
        this.initialize();
      }

      if (!this.initialized) {
        throw new Error('Email service not initialized');
      }

      const mailOptions = {
        from: `"Budget Tracker" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset OTP - Budget Tracker',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background-color: #f9f9f9;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .header h1 {
                color: #6366F1;
                margin: 0;
              }
              .otp-box {
                background-color: #fff;
                border: 2px dashed #6366F1;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                margin: 30px 0;
              }
              .otp-code {
                font-size: 36px;
                font-weight: bold;
                color: #6366F1;
                letter-spacing: 8px;
                margin: 10px 0;
              }
              .warning {
                background-color: #FEF3C7;
                border-left: 4px solid #F59E0B;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                font-size: 12px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Password Reset Request</h1>
              </div>
              
              <p>Hello ${userName || 'User'},</p>
              
              <p>We received a request to reset your password for your Budget Tracker account. Use the OTP below to proceed:</p>
              
              <div class="otp-box">
                <p style="margin: 0; font-size: 14px; color: #666;">Your OTP Code</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 0; font-size: 12px; color: #999;">Valid for 10 minutes</p>
              </div>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>This OTP is valid for 10 minutes only</li>
                  <li>Never share this OTP with anyone</li>
                  <li>If you didn't request this, please ignore this email</li>
                </ul>
              </div>
              
              <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              
              <div class="footer">
                <p>This is an automated email from Budget Tracker. Please do not reply.</p>
                <p>&copy; ${new Date().getFullYear()} Budget Tracker. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Password Reset OTP - Budget Tracker
          
          Hello ${userName || 'User'},
          
          We received a request to reset your password for your Budget Tracker account.
          
          Your OTP Code: ${otp}
          
          This OTP is valid for 10 minutes only.
          
          Security Notice:
          - Never share this OTP with anyone
          - If you didn't request this, please ignore this email
          
          If you didn't request a password reset, you can safely ignore this email.
          
          © ${new Date().getFullYear()} Budget Tracker. All rights reserved.
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      const duration = Date.now() - startTime;
      console.log(`✓ Password reset OTP email sent in ${duration}ms:`, info.messageId);
      return { success: true, messageId: info.messageId, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`✗ Failed to send password reset OTP email after ${duration}ms:`, error.message);
      throw new Error('Failed to send email. Please try again later.');
    }
  }

  // Send password change confirmation email (optimized for speed)
  async sendPasswordChangeConfirmation(email, userName) {
    const startTime = Date.now();
    
    try {
      if (!this.transporter) {
        this.initialize();
      }

      if (!this.initialized) {
        throw new Error('Email service not initialized');
      }

      const mailOptions = {
        from: `"Budget Tracker" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Changed Successfully - Budget Tracker',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background-color: #f9f9f9;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .header h1 {
                color: #10B981;
                margin: 0;
              }
              .success-box {
                background-color: #D1FAE5;
                border-left: 4px solid #10B981;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .warning {
                background-color: #FEF3C7;
                border-left: 4px solid #F59E0B;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                font-size: 12px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Password Changed Successfully</h1>
              </div>
              
              <p>Hello ${userName || 'User'},</p>
              
              <div class="success-box">
                <strong>Your password has been changed successfully!</strong>
                <p style="margin: 10px 0 0 0;">Date: ${new Date().toLocaleString()}</p>
              </div>
              
              <p>You can now log in to your Budget Tracker account using your new password.</p>
              
              <div class="warning">
                <strong>⚠️ Didn't make this change?</strong>
                <p style="margin: 10px 0 0 0;">If you didn't change your password, please contact our support team immediately to secure your account.</p>
              </div>
              
              <div class="footer">
                <p>This is an automated email from Budget Tracker. Please do not reply.</p>
                <p>&copy; ${new Date().getFullYear()} Budget Tracker. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Password Changed Successfully - Budget Tracker
          
          Hello ${userName || 'User'},
          
          Your password has been changed successfully!
          Date: ${new Date().toLocaleString()}
          
          You can now log in to your Budget Tracker account using your new password.
          
          Didn't make this change?
          If you didn't change your password, please contact our support team immediately.
          
          © ${new Date().getFullYear()} Budget Tracker. All rights reserved.
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      const duration = Date.now() - startTime;
      console.log(`✓ Password change confirmation email sent in ${duration}ms:`, info.messageId);
      return { success: true, messageId: info.messageId, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`✗ Failed to send password change confirmation email after ${duration}ms:`, error.message);
      // Don't throw error for confirmation emails
      return { success: false, error: error.message };
    }
  }

  // Close connection pool (call on server shutdown)
  async close() {
    if (this.transporter && this.transporter.close) {
      await this.transporter.close();
      console.log('✓ Email service connection pool closed');
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

// Initialize on module load
emailService.initialize();

module.exports = emailService;
