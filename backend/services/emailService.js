const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Email configuration
const emailConfig = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Email templates
const emailTemplates = {
  forgotPassword: (resetToken) => ({
    subject: 'Password Reset Request - Budget Tracker',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366F1;">Budget Tracker - Password Reset</h2>
        <p>Hi there,</p>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}" 
           style="background-color: #6366F1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
        <p>Or copy and paste this link in your browser:</p>
        <p>${process.env.FRONTEND_URL}/reset-password?token=${resetToken}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          Budget Tracker App<br>
          This is an automated message, please do not reply.
        </p>
      </div>
    `
  }),

  otpVerification: (otp, userName = '') => ({
    subject: 'Password Change OTP - Budget Tracker',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #6366F1; margin: 0; font-size: 28px;">Budget Tracker</h1>
          <p style="color: #6b7280; margin: 5px 0;">Secure Password Management</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0;">
          <h2 style="color: white; margin: 0 0 15px 0; font-size: 20px;">Your OTP Code</h2>
          <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 8px; backdrop-filter: blur(10px);">
            <span style="font-size: 36px; font-weight: bold; color: white; letter-spacing: 6px; font-family: 'Courier New', monospace;">${otp}</span>
          </div>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #6366F1;">
          <p style="margin: 0; color: #374151; font-size: 16px;">
            ${userName ? `Hi ${userName},` : 'Hi there,'}
          </p>
          <p style="margin: 10px 0; color: #6b7280; line-height: 1.6;">
            You requested to change your password. Use the OTP code above to verify your identity. This code will expire in <strong>10 minutes</strong> for your security.
          </p>
          <div style="margin: 15px 0;">
            <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
              <li>Never share this code with anyone</li>
              <li>We'll never ask for this code via phone</li>
              <li>This code can only be used once</li>
            </ul>
          </div>
        </div>
        
        <div style="margin: 25px 0; text-align: center;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            If you didn't request this password change, please secure your account immediately.
          </p>
          <a href="${process.env.FRONTEND_URL}/support" style="color: #6366F1; text-decoration: none; font-weight: 600;">
            Contact Support →
          </a>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            This is an automated message from Budget Tracker.<br>
            Please do not reply to this email.
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
            © 2024 Budget Tracker. All rights reserved.
          </p>
        </div>
      </div>
    `
  }),
  
  passwordChanged: () => ({
    subject: 'Password Changed Successfully - Budget Tracker',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">Password Changed Successfully</h2>
        <p>Hi there,</p>
        <p>Your password has been successfully changed for your Budget Tracker account.</p>
        <p>If you didn't make this change, please contact support immediately.</p>
        <p>For security reasons, all active sessions have been logged out. You'll need to log in again with your new password.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          Budget Tracker App<br>
          This is an automated message, please do not reply.
        </p>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (to, template) => {
  try {
    const mailOptions = {
      from: `"Budget Tracker" <${process.env.EMAIL_USER}>`,
      to,
      ...template
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  const template = emailTemplates.forgotPassword(resetToken);
  return await sendEmail(email, template);
};

// Send OTP email
const sendOTPEmail = async (email, otp, userName = '') => {
  const template = emailTemplates.otpVerification(otp, userName);
  return await sendEmail(email, template);
};

// Send password change notification
const sendPasswordChangeNotification = async (email) => {
  const template = emailTemplates.passwordChanged();
  return await sendEmail(email, template);
};

// Verify email configuration
const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('Email service is ready to send emails');
    return true;
  } catch (error) {
    console.error('Email service configuration error:', error);
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendOTPEmail,
  sendPasswordChangeNotification,
  verifyEmailConfig,
  transporter,
  generateOTP
};
