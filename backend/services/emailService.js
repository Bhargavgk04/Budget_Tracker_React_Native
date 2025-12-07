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
  sendPasswordChangeNotification,
  verifyEmailConfig,
  transporter
};
