import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiResponse.js';

export class EmailService {
  static transporter = null;

  /**
   * Get or initialize the nodemailer transporter.
   * If SMTP host/user is not configured, fallback to JSON/Stream transport for safe local execution and testing.
   */
  static getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    const service = process.env.SMTP_SERVICE || process.env.EMAIL_SERVICE;
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (service && user && pass) {
      // Shorthand service provider (e.g., service: 'gmail')
      this.transporter = nodemailer.createTransport({
        service,
        auth: {
          user,
          pass,
        },
      });
    } else if (host && user && pass) {
      // Standard custom SMTP host
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });
    } else {
      // In development or test environments without SMTP credentials, use jsonTransport/stream fallback
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }

    return this.transporter;
  }

  /**
   * Set custom transporter (useful for mocking during automated tests)
   */
  static setTransporter(customTransporter) {
    this.transporter = customTransporter;
  }

  /**
   * Base email sender method.
   * Reusable for any communication across the entire Dayflow HRMS application.
   */
  static async sendMail({ to, subject, html, text, from, attachments = [], cc, bcc, replyTo }) {
    if (!to) {
      throw new ApiError('Recipient email (to) is required', 400);
    }
    if (!subject) {
      throw new ApiError('Email subject is required', 400);
    }

    const defaultFrom = process.env.SMTP_FROM || process.env.EMAIL_FROM || '"Dayflow HRMS" <noreply@dayflow.com>';
    const transporter = this.getTransporter();

    const mailOptions = {
      from: from || defaultFrom,
      to,
      subject,
      text: text || (html ? html.replace(/<[^>]*>?/gm, '') : ''),
      html: html || `<p>${text}</p>`,
      attachments,
      cc,
      bcc,
      replyTo,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      
      // If using jsonTransport, parse the message JSON
      let messageId = info.messageId;
      if (info.message) {
        try {
          const parsed = JSON.parse(info.message);
          messageId = parsed.messageId || 'local-json-id';
        } catch {
          // ignore
        }
      }

      return {
        success: true,
        messageId: messageId || 'msg_' + Date.now(),
        previewUrl: nodemailer.getTestMessageUrl(info) || null,
        envelope: info.envelope,
      };
    } catch (err) {
      console.error('Failed to send email:', err);
      throw new ApiError(`Failed to send email: ${err.message}`, 500);
    }
  }

  /**
   * Generate signed JWT email verification token
   */
  static generateVerificationToken({ userId, email, expiresIn = '24h' }) {
    const secret = process.env.JWT_SECRET || 'dayflow_hrms_super_secret_jwt_key_2026';
    return jwt.sign(
      {
        userId,
        email,
        purpose: 'EMAIL_VERIFICATION',
      },
      secret,
      { expiresIn }
    );
  }

  /**
   * Verify and decode email verification token
   */
  static verifyVerificationToken(token) {
    if (!token) {
      throw new ApiError('Verification token is required', 400);
    }

    const secret = process.env.JWT_SECRET || 'dayflow_hrms_super_secret_jwt_key_2026';
    try {
      const decoded = jwt.verify(token, secret);
      if (decoded.purpose !== 'EMAIL_VERIFICATION') {
        throw new ApiError('Invalid token purpose for email verification', 400);
      }
      return decoded;
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new ApiError('Verification token has expired. Please request a new verification email.', 400);
      }
      throw new ApiError('Invalid or corrupted verification token', 400);
    }
  }

  /**
   * Send Email Verification Link
   */
  static async sendVerificationEmail({ to, name = 'User', token, verificationUrl }) {
    const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const finalUrl = verificationUrl || `${appUrl}/verify-email?token=${token}`;

    const subject = 'Verify your Dayflow HRMS Email Address';
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #0f172a; padding: 28px 32px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .content { padding: 32px; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 600; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin: 24px 0; }
    .token-box { background: #f1f5f9; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; word-break: break-all; color: #475569; margin-top: 16px; }
    .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Dayflow HRMS</h1>
    </div>
    <div class="content">
      <h2>Welcome, ${name}!</h2>
      <p>Thank you for registering with Dayflow. Please verify your email address to confirm your account and access all workspace features.</p>
      <div style="text-align: center;">
        <a href="${finalUrl}" class="btn" target="_blank">Verify Email Address</a>
      </div>
      <p style="font-size: 13px; color: #64748b;">This verification link will expire in 24 hours. If you did not create this account, no action is needed.</p>
      <p style="font-size: 13px; color: #64748b;">Or paste this link into your browser:</p>
      <div class="token-box">${finalUrl}</div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Dayflow HRMS. All rights reserved.
    </div>
  </div>
</body>
</html>
    `;

    const text = `Welcome ${name}!\n\nPlease verify your email address for Dayflow HRMS by visiting this link:\n${finalUrl}\n\nThis link expires in 24 hours.`;

    return this.sendMail({ to, subject, html, text });
  }

  /**
   * Send Password Reset Link
   */
  static async sendPasswordResetEmail({ to, name = 'User', token, resetUrl }) {
    const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const finalUrl = resetUrl || `${appUrl}/reset-password?token=${token}`;

    const subject = 'Reset your Dayflow HRMS Password';
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #0f172a; padding: 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 20px; }
    .content { padding: 32px; }
    .btn { display: inline-block; background-color: #dc2626; color: #ffffff !important; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0; }
    .footer { padding: 16px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Dayflow HRMS</h1>
    </div>
    <div class="content">
      <h2>Password Reset Request</h2>
      <p>Hello ${name},</p>
      <p>We received a request to reset your password. Click the button below to proceed:</p>
      <div style="text-align: center;">
        <a href="${finalUrl}" class="btn" target="_blank">Reset Password</a>
      </div>
      <p style="font-size: 13px; color: #64748b;">If you did not request this password reset, please ignore this email.</p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Dayflow HRMS.
    </div>
  </div>
</body>
</html>
    `;

    return this.sendMail({ to, subject, html });
  }

  /**
   * Send Initial Welcome Credentials to newly onboarded employee
   */
  static async sendWelcomeCredentialsEmail({ to, name = 'Employee', loginId, temporaryPassword, loginUrl }) {
    const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const finalUrl = loginUrl || `${appUrl}/login`;

    const subject = 'Welcome to Dayflow HRMS - Your Login Credentials';
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #0f172a; padding: 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 20px; }
    .content { padding: 32px; }
    .creds-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .cred-row { display: flex; margin-bottom: 8px; font-size: 14px; }
    .cred-label { font-weight: 600; width: 140px; color: #475569; }
    .cred-val { font-family: monospace; font-weight: 700; color: #0f172a; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 10px; }
    .footer { padding: 16px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Dayflow HRMS</h1>
    </div>
    <div class="content">
      <h2>Welcome aboard, ${name}!</h2>
      <p>Your employee profile and user account have been provisioned in Dayflow HRMS. Below are your initial login credentials:</p>
      <div class="creds-box">
        <div class="cred-row"><span class="cred-label">Login ID:</span> <span class="cred-val">${loginId}</span></div>
        <div class="cred-row"><span class="cred-label">Work Email:</span> <span class="cred-val">${to}</span></div>
        <div class="cred-row"><span class="cred-label">Temporary Password:</span> <span class="cred-val">${temporaryPassword}</span></div>
      </div>
      <p style="font-size: 13px; color: #e11d48; font-weight: 600;">You will be prompted to change your temporary password upon initial login.</p>
      <div style="text-align: center;">
        <a href="${finalUrl}" class="btn" target="_blank">Login to Dayflow</a>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Dayflow HRMS.
    </div>
  </div>
</body>
</html>
    `;

    return this.sendMail({ to, subject, html });
  }

  /**
   * Generic HRMS Notification Email
   */
  static async sendNotificationEmail({ to, name = 'Colleague', title, message, actionUrl, actionText }) {
    const subject = title || 'Notification from Dayflow HRMS';
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #0f172a; padding: 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 20px; }
    .content { padding: 32px; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0; }
    .footer { padding: 16px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Dayflow HRMS</h1>
    </div>
    <div class="content">
      <h2>${title}</h2>
      <p>Hello ${name},</p>
      <p>${message}</p>
      ${actionUrl && actionText ? `<div style="text-align: center;"><a href="${actionUrl}" class="btn" target="_blank">${actionText}</a></div>` : ''}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Dayflow HRMS.
    </div>
  </div>
</body>
</html>
    `;

    return this.sendMail({ to, subject, html });
  }
}
