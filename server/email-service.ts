import nodemailer from 'nodemailer';
import { storage } from './storage';

// Brevo Configuration - Try API first, fallback to SMTP
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// SMTP Configuration with exact credentials from Brevo dashboard
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: '91409f002@smtp-brevo.com',
      pass: 'K3FvX6tOpmMbGNhB'
    },
    debug: true, // Enable debug output
    logger: true // Enable logging
  });
};

if (!BREVO_API_KEY) {
  console.log('📧 BREVO_API_KEY not set - email functionality will be disabled');
} else {
  console.log('✅ BREVO_API_KEY is loaded:', BREVO_API_KEY?.substring(0, 10) + '...');
}

// Function to send email via SMTP only
async function sendBrevoEmail(to: string, subject: string, htmlContent: string, fromName: string = 'BN Group Complaint Management'): Promise<boolean> {
  try {
    console.log('📧 Sending email via SMTP to:', to);
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${fromName}" <91409f002@smtp-brevo.com>`,
      to: to,
      subject: subject,
      html: htmlContent,
      text: htmlContent.replace(/<[^>]*>/g, ''), // Add plain text version
      replyTo: 'arorayashvardhan123@gmail.com'
    };

    console.log('📧 Mail options:', JSON.stringify(mailOptions, null, 2));
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent via SMTP:', result.messageId);
    console.log('✅ Full response:', JSON.stringify(result, null, 2));
    return true;
    
  } catch (error) {
    console.error('❌ SMTP failed:', error);
    console.error('❌ Error details:', error.message);
    if (error.code) console.error('❌ Error code:', error.code);
    if (error.response) console.error('❌ Error response:', error.response);
    return false;
  }
}

export interface EmailReportData {
  totalComplaints: number;
  newComplaints: number;
  inProgressComplaints: number;
  resolvedComplaints: number;
  closedComplaints: number;
  resolvedToday: number;
  trends: Array<{
    date: string;
    new: number;
    resolved: number;
  }>;
}

// Function to send OTP email
export async function sendOtpEmail(email: string, otp: string, purpose: string = 'password change'): Promise<boolean> {
  try {
    console.log(`📧 Sending OTP email to: ${email}`);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>OTP Verification - BN Group Support</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #007BFF, #0056b3); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; }
          .otp-box { background: linear-gradient(135deg, #e3f2fd, #bbdefb); border: 2px solid #2196f3; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #1976d2; letter-spacing: 8px; margin: 10px 0; }
          .footer { background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; color: #666; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 OTP Verification</h1>
            <p>BN Group Complaint Management System</p>
          </div>
          
          <div class="content">
            <h2>Your One-Time Password</h2>
            <p>You have requested to change your password in the BN Group Support System. Please use the following OTP to verify your identity:</p>
            
            <div class="otp-box">
              <p style="margin: 0; font-size: 16px; color: #555;">Your OTP Code:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 0; font-size: 14px; color: #777;">Valid for 10 minutes</p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This OTP is valid for 10 minutes only</li>
                <li>Never share this code with anyone</li>
                <li>If you didn't request this, please contact support immediately</li>
              </ul>
            </div>
            
            <p>If you need help, please contact our support team.</p>
          </div>
          
          <div class="footer">
            <p>&copy; 2025 BN Group. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const success = await sendBrevoEmail(
      email, 
      `OTP for ${purpose} - BN Group Support`, 
      htmlContent,
      'BN Group Security Team'
    );
    
    if (success) {
      console.log('✅ OTP email sent successfully');
      return true;
    } else {
      console.error('❌ Failed to send OTP email');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    return false;
  }
}

export async function sendDailyReport(recipientEmail: string): Promise<boolean> {
  try {
    console.log(`📧 Preparing daily report for ${recipientEmail}`);
    
    // Fetch complaint data
    const stats = await storage.getComplaintStats();
    const trends = await storage.getComplaintTrends(7);
    
    const reportData: EmailReportData = {
      totalComplaints: stats.total,
      newComplaints: stats.new,
      inProgressComplaints: stats.inProgress,
      resolvedComplaints: stats.resolved,
      closedComplaints: stats.closed,
      resolvedToday: stats.resolvedToday,
      trends
    };

    // Create HTML email content
    const htmlContent = generateEmailHTML(reportData);
    
    // Send email via Brevo API
    const subject = `Daily Complaint Report - ${new Date().toLocaleDateString()}`;
    const success = await sendBrevoEmail(recipientEmail, subject, htmlContent);
    
    if (success) {
      console.log('✅ Daily report sent successfully via Brevo API');
      return true;
    } else {
      console.error('❌ Failed to send daily report via Brevo API');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Failed to send daily report:', error);
    return false;
  }
}

function generateEmailHTML(data: EmailReportData): string {
  const today = new Date().toLocaleDateString();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Daily Complaint Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
        .date { color: #666; font-size: 16px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin: 30px 0; }
        .stat-card { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-card.new { background: linear-gradient(135deg, #059669 0%, #047857 100%); }
        .stat-card.progress { background: linear-gradient(135deg, #d97706 0%, #b45309 100%); }
        .stat-card.resolved { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); }
        .stat-number { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
        .stat-label { font-size: 14px; opacity: 0.9; }
        .trends-section { margin-top: 40px; }
        .trends-title { font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #1f2937; }
        .trends-table { width: 100%; border-collapse: collapse; }
        .trends-table th, .trends-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .trends-table th { background-color: #f9fafb; font-weight: 600; color: #374151; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">BN Group Complaint Management</div>
          <div class="date">Daily Report - ${today}</div>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${data.totalComplaints}</div>
            <div class="stat-label">Total Complaints</div>
          </div>
          <div class="stat-card new">
            <div class="stat-number">${data.newComplaints}</div>
            <div class="stat-label">New Complaints</div>
          </div>
          <div class="stat-card progress">
            <div class="stat-number">${data.inProgressComplaints}</div>
            <div class="stat-label">In Progress</div>
          </div>
          <div class="stat-card resolved">
            <div class="stat-number">${data.resolvedComplaints}</div>
            <div class="stat-label">Resolved</div>
          </div>
        </div>
        
        <div class="trends-section">
          <div class="trends-title">Weekly Trends</div>
          <table class="trends-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>New Complaints</th>
                <th>Resolved</th>
                <th>Net Change</th>
              </tr>
            </thead>
            <tbody>
              ${data.trends.map(trend => `
                <tr>
                  <td>${trend.date}</td>
                  <td>${trend.new}</td>
                  <td>${trend.resolved}</td>
                  <td>${trend.new - trend.resolved > 0 ? '+' : ''}${trend.new - trend.resolved}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p>This is an automated report from the BN Group Complaint Management System.</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Test email functionality
export async function sendTestEmail(recipientEmail: string): Promise<boolean> {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 24px;">Email Configuration Test</h2>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">BN Group Complaint Management System</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">This is a test email to verify that the Brevo API configuration is working correctly.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #6b7280;"><strong>Email Service:</strong> Brevo API</p>
            <p style="margin: 5px 0 0 0; color: #6b7280;"><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #059669; font-weight: 600;">✅ If you receive this email, the API configuration is successful!</p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 14px;">
          <p>This is an automated test from the BN Group Complaint Management System.</p>
        </div>
      </div>
    `;

    const success = await sendBrevoEmail(recipientEmail, 'Test Email - Complaint Management System', htmlContent);
    
    if (success) {
      console.log('✅ Test email sent successfully via Brevo API');
      return true;
    } else {
      console.error('❌ Failed to send test email via Brevo API');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    return false;
  }
}