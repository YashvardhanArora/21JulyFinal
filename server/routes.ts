import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { sendDailyReport, sendTestEmail } from "./email-service";
import * as XLSX from 'xlsx';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { 
  insertComplaintSchema, 
  updateComplaintSchema,
  insertNotificationSchema,
  COMPLAINT_STATUSES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_SOURCES,
  COMPLAINT_TYPES,
  AREA_OF_CONCERNS,
  SUB_CATEGORIES
} from "@shared/schema";
import { z } from "zod";

// WebSocket connections by user ID
const userConnections = new Map<number, WebSocket[]>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Get complaint statistics (must come before single complaint route)
  app.get("/api/complaints/stats", async (req, res) => {
    try {
      const stats = await storage.getComplaintStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch complaint statistics" });
    }
  });

  // Get complaint trends (must come before single complaint route)
  app.get("/api/complaints/trends/:days", async (req, res) => {
    try {
      const days = parseInt(req.params.days) || 7;
      const trends = await storage.getComplaintTrends(days);
      res.json(trends);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch complaint trends" });
    }
  });

  // Get complaint options (must come before single complaint route)
  app.get("/api/complaints/options", async (req, res) => {
    try {
      res.json({
        statuses: COMPLAINT_STATUSES,
        priorities: COMPLAINT_PRIORITIES,
        sources: COMPLAINT_SOURCES,
        types: COMPLAINT_TYPES,
        areaOfConcerns: AREA_OF_CONCERNS,
        subCategories: SUB_CATEGORIES,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch complaint options" });
    }
  });

  // Export complaints (must come before single complaint route)
  app.get("/api/complaints/export", async (req, res) => {
    try {
      const complaints = await storage.getComplaints();
      const stats = await storage.getComplaintStats();
      
      // Prepare data for Excel export with actual complaint fields
      const worksheetData = complaints.map(complaint => ({
        'S.no.': complaint.id,
        'Complaint Source': complaint.complaintSource,
        'Place of Supply': complaint.placeOfSupply,
        'Complaint Receiving Location': complaint.complaintReceivingLocation,
        'Month': complaint.date,
        'Depo/Party Name': complaint.depoPartyName,
        'Email': complaint.email,
        'Contact Number': complaint.contactNumber,
        'Invoice No.': complaint.invoiceNo,
        'Invoice Date': complaint.invoiceDate,
        'LR Number': complaint.lrNumber,
        'Transporter Name': complaint.transporterName,
        'Transporter Number': complaint.transporterNumber,
        'Complaint Type': complaint.complaintType,
        'VOC': complaint.voc,
        'Sale Person Name': complaint.salePersonName,
        'Product Name': complaint.productName,
        'Area of Concern': complaint.areaOfConcern,
        'Sub Category': complaint.subCategory,
        'Action Taken': complaint.actionTaken,
        'Credit Date': complaint.creditDate,
        'Credit Note Number': complaint.creditNoteNumber,
        'Credit Amount': complaint.creditAmount,
        'Person Responsible': complaint.personResponsible,
        'Root Cause/Action Plan': complaint.rootCauseActionPlan,
        'Status': complaint.status,
        'Priority': complaint.priority,
        'Final Status': complaint.finalStatus,
        'Complaint Creation': complaint.complaintCreation ? new Date(complaint.complaintCreation).toLocaleDateString() : '',
        'Date of Resolution': complaint.dateOfResolution ? new Date(complaint.dateOfResolution).toLocaleDateString() : '',
        'Date of Closure': complaint.dateOfClosure ? new Date(complaint.dateOfClosure).toLocaleDateString() : '',
        'Days to Resolve': complaint.daysToResolve
      }));
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      
      // Add summary stats as a second sheet
      const statsData = [
        ['Metric', 'Count'],
        ['Total Complaints', stats.total],
        ['New', stats.new],
        ['In Progress', stats.inProgress],
        ['Resolved', stats.resolved],
        ['Closed', stats.closed],
        ['Resolved Today', stats.resolvedToday]
      ];
      const statsWorksheet = XLSX.utils.aoa_to_sheet(statsData);
      
      // Add worksheets to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Complaints');
      XLSX.utils.book_append_sheet(workbook, statsWorksheet, 'Statistics');
      
      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      // Set headers for Excel download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=complaints-export-${new Date().toISOString().split('T')[0]}.xlsx`);
      res.send(excelBuffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to export complaints" });
    }
  });

  // Get all complaints
  app.get("/api/complaints", async (req, res) => {
    try {
      const { status, priority, search } = req.query;
      
      let complaints;
      
      if (search) {
        complaints = await storage.searchComplaints(search as string);
      } else if (status) {
        complaints = await storage.getComplaintsByStatus(status as any);
      } else if (priority) {
        complaints = await storage.getComplaintsByPriority(priority as string);
      } else {
        complaints = await storage.getComplaints();
      }
      
      res.json(complaints);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch complaints" });
    }
  });





  // Get user-specific complaints (for My Complaints section)
  app.get("/api/asm/my-complaints", async (req, res) => {
    try {
      const asmToken = req.headers.authorization?.split(' ')[1];
      
      if (!asmToken) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }

      let asmId;
      try {
        const decoded = jwt.verify(asmToken, JWT_SECRET) as any;
        asmId = decoded.userId;
      } catch {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }

      const complaints = await storage.getComplaints();
      const userComplaints = complaints.filter(c => c.userId === asmId);
      
      res.json(userComplaints);
    } catch (error) {
      console.error("Error fetching user complaints:", error);
      res.status(500).json({ error: "Failed to fetch user complaints" });
    }
  });

  // Get user-specific complaint statistics (for dashboard)
  app.get("/api/asm/my-stats", async (req, res) => {
    try {
      const asmToken = req.headers.authorization?.split(' ')[1];
      
      if (!asmToken) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }

      let asmId;
      try {
        const decoded = jwt.verify(asmToken, JWT_SECRET) as any;
        asmId = decoded.userId;
      } catch {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }

      const complaints = await storage.getComplaints();
      const userComplaints = complaints.filter(c => c.userId === asmId);
      
      const stats = {
        total: userComplaints.length,
        open: userComplaints.filter(c => c.finalStatus === "Open").length,
        resolved: userComplaints.filter(c => c.status === "resolved").length,
        closed: userComplaints.filter(c => c.finalStatus === "Closed").length,
        new: userComplaints.filter(c => c.status === "new").length,
        inProgress: userComplaints.filter(c => c.status === "in-progress").length
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch user statistics" });
    }
  });

  // Get single complaint
  app.get("/api/complaints/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const complaint = await storage.getComplaint(id);
      
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }
      
      res.json(complaint);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch complaint" });
    }
  });

  // Create new complaint
  app.post("/api/complaints", async (req, res) => {
    try {
      const validatedData = insertComplaintSchema.parse(req.body);
      const complaint = await storage.createComplaint(validatedData);
      res.status(201).json(complaint);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid complaint data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create complaint" });
    }
  });

  // Update complaint
  app.patch("/api/complaints/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateComplaintSchema.parse(req.body);
      
      const complaint = await storage.updateComplaint(id, validatedData);
      
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }
      
      res.json(complaint);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid complaint data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update complaint" });
    }
  });

  // Delete complaint
  app.delete("/api/complaints/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteComplaint(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Complaint not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete complaint" });
    }
  });

  // Get complaint history
  app.get("/api/complaints/:id/history", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const history = await storage.getComplaintHistory(id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch complaint history" });
    }
  });

  // Get security keys for password change
  app.get("/api/security-keys", async (req, res) => {
    try {
      const keys = await storage.getSecurityKeys();
      const keyValues = keys.map(k => k.keyValue);
      res.json(keyValues);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch security keys" });
    }
  });

  // Change password
  app.post("/api/change-password", async (req, res) => {
    try {
      const { currentPassword, newPassword, securityKey } = req.body;
      const asmToken = req.headers.authorization?.split(' ')[1];
      
      if (!asmToken) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }

      let userId;
      try {
        const decoded = jwt.verify(asmToken, JWT_SECRET) as any;
        userId = decoded.userId;
      } catch {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }
      
      // Get user
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      
      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ success: false, message: "Current password is incorrect" });
      }
      
      // Verify security key
      const securityKeys = await storage.getSecurityKeys();
      const validKey = securityKeys.find(k => k.keyValue === securityKey);
      if (!validKey) {
        return res.status(400).json({ success: false, message: "Invalid security key" });
      }
      
      // Hash new password and update
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(userId, { password: hashedPassword });
      
      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to change password" });
    }
  });

  // Export Analytics Report
  app.post("/api/complaints/export-analytics", async (req, res) => {
    try {
      const { startDate, endDate, complaints } = req.body;
      
      // Create analytics data with monthly breakdown
      const monthlyData = new Map<string, { total: number; resolved: number; }>();
      
      // Process complaints to calculate monthly statistics
      (complaints as any[]).forEach((complaint: any) => {
        const month = complaint.month || new Date(complaint.complaintCreation || complaint.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', month: 'long' 
        });
        
        if (!monthlyData.has(month)) {
          monthlyData.set(month, { total: 0, resolved: 0 });
        }
        
        const data = monthlyData.get(month)!;
        data.total++;
        
        if (complaint.status === 'resolved' || complaint.status === 'closed') {
          data.resolved++;
        }
      });
      
      // Create analytics summary data
      const analyticsData = [];
      analyticsData.push(['Month', 'Total Complaints', 'Resolved Complaints', 'Resolution Percentage', 'Pending Complaints']);
      
      let totalComplaints = 0;
      let totalResolved = 0;
      
      monthlyData.forEach((data, month) => {
        const resolutionPercentage = data.total > 0 ? ((data.resolved / data.total) * 100).toFixed(1) : '0.0';
        const pending = data.total - data.resolved;
        
        analyticsData.push([
          month,
          data.total.toString(),
          data.resolved.toString(),
          resolutionPercentage + '%',
          pending.toString()
        ]);
        
        totalComplaints += data.total;
        totalResolved += data.resolved;
      });
      
      // Add summary row
      const overallPercentage = totalComplaints > 0 ? ((totalResolved / totalComplaints) * 100).toFixed(1) : '0.0';
      analyticsData.push([
        'TOTAL',
        totalComplaints.toString(),
        totalResolved.toString(),
        overallPercentage + '%',
        (totalComplaints - totalResolved).toString()
      ]);
      
      // Create workbook with analytics data
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(analyticsData);
      
      // Auto-size columns
      const colWidths = [
        { wch: 20 }, // Month
        { wch: 15 }, // Total Complaints
        { wch: 18 }, // Resolved Complaints
        { wch: 18 }, // Resolution Percentage
        { wch: 18 }  // Pending Complaints
      ];
      worksheet['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Analytics Report');

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="analytics-report.xlsx"');
      res.send(buffer);
    } catch (error) {
      console.error('Export analytics error:', error);
      res.status(500).json({ message: "Failed to export analytics report" });
    }
  });

  // Export All Complaints Report
  app.post("/api/complaints/export-all", async (req, res) => {
    try {
      const { startDate, endDate, complaints } = req.body;
      
      // Define the exact headers from your All Complaints template  
      const headers = [
        'Complaint Source', 'Place of Supply', 'Complaint Receiving Location', 'Month', 
        'Depo/Party Name', 'Email', 'Contact Number', 'Complaint Type', 'Area of Concern', 
        'Sub Category', 'Description', 'Quantity', 'Type of Quantity', 'Rate', 
        'Type of Rate', 'Amount', 'Complaint Creation', 'Complaint received by', 
        'Action taken by', 'Assigned to', 'Resolution Date', 'Resolution Description', 
        'Rating Given', 'Feedback', 'Priority', 'Status', 'Reference Number', 
        'Invoice Number', 'Invoice Date', 'Final Status', 'Days to Resolve'
      ];
      
      // Map complaint data to match the exact template structure
      const excelData = (complaints as any[]).map((complaint: any) => [
        complaint.complaintSource || '',
        complaint.placeOfSupply || '',
        complaint.complaintReceivingLocation || '',
        complaint.month || '',
        complaint.depoPartyName || '',
        complaint.email || '',
        complaint.contactNumber || '',
        complaint.invoiceNo || '',
        complaint.invoiceDate || '',
        complaint.lrNumber || '',
        complaint.transporterName || '',
        complaint.transporterNumber || '',
        complaint.complaintType || '',
        complaint.voc || '', // Voice of Customer
        complaint.salePersonName || '',
        complaint.productName || '',
        complaint.areaOfConcern || '',
        complaint.subCategory || '',
        complaint.actionTaken || '',
        complaint.creditDate || '',
        complaint.creditNoteNumber || '',
        complaint.creditAmount || '',
        complaint.personResponsible || '',
        complaint.rootCauseActionPlan || '',
        complaint.complaintCreation ? new Date(complaint.complaintCreation).toLocaleDateString('en-GB') : new Date(complaint.createdAt).toLocaleDateString('en-GB'),
        complaint.dateOfResolution ? new Date(complaint.dateOfResolution).toLocaleDateString('en-GB') : '',
        complaint.dateOfClosure ? new Date(complaint.dateOfClosure).toLocaleDateString('en-GB') : '',
        complaint.finalStatus || complaint.status || '',
        complaint.daysToResolve?.toString() || ''
      ]);

      // Create new workbook with template headers and new data
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([headers as any[], ...excelData]);
      
      // Auto-size columns
      const colWidths = (headers as any[]).map(() => ({ wch: 15 }));
      worksheet['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'All Complaints');

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="all-complaints.xlsx"');
      res.send(buffer);
    } catch (error) {
      console.error('Export all complaints error:', error);
      res.status(500).json({ message: "Failed to export all complaints report" });
    }
  });

  // Generate comprehensive email report
  const generateEmailReport = async () => {
    const stats = await storage.getComplaintStats();
    const complaints = await storage.getComplaints();

    const reportContent = `
Daily Complaint Management Report - ${new Date().toLocaleDateString()}
======================================================================

📊 STATUS SUMMARY:
- Total Complaints: ${stats.total}
- New: ${stats.new}
- In Progress: ${stats.inProgress}  
- Resolved: ${stats.resolved}
- Closed: ${stats.closed}

📈 PERFORMANCE METRICS:
- Resolution Rate: ${stats.total > 0 ? ((stats.resolved + stats.closed) / stats.total * 100).toFixed(1) : 0}%
- Open Cases: ${stats.new + stats.inProgress}

🔍 RECENT COMPLAINTS:
${complaints.slice(0, 10).map(c => `• ${c.complaintType}: ${c.voc || c.productName || 'N/A'} (${c.status})`).join('\n')}

📋 REGIONAL BREAKDOWN:
${Object.entries(complaints.reduce((acc: Record<string, number>, c) => {
  const region = c.placeOfSupply || 'Unknown';
  acc[region] = (acc[region] || 0) + 1;
  return acc;
}, {})).map(([region, count]) => `• ${region}: ${count} complaints`).join('\n')}

This automated report includes Excel exports and analytics visualizations.
Generated at: ${new Date().toISOString()}
    `;

    return reportContent;
  };

  // Send Email with Visual Reports
  app.post("/api/complaints/send-email-report", async (req, res) => {
    try {
      const { emailAddress } = req.body;
      
      if (!emailAddress) {
        return res.status(400).json({ message: "Email address is required" });
      }

      console.log(`📧 Sending visual report to: ${emailAddress}`);
      const success = await sendDailyReport(emailAddress);

      if (success) {
        res.json({ 
          message: "Visual report sent successfully via Brevo SMTP",
          emailAddress,
          reportSent: true
        });
      } else {
        res.status(500).json({ message: "Failed to send email report" });
      }
    } catch (error) {
      console.error('Send email error:', error);
      res.status(500).json({ message: "Failed to send email report" });
    }
  });

  // Test Email Endpoint
  app.post("/api/email/test", async (req, res) => {
    try {
      const { emailAddress } = req.body;
      
      if (!emailAddress) {
        return res.status(400).json({ message: "Email address is required" });
      }

      console.log(`📧 Sending test email to: ${emailAddress}`);
      const success = await sendTestEmail(emailAddress);

      if (success) {
        res.json({ 
          message: "Test email sent successfully",
          emailAddress
        });
      } else {
        res.status(500).json({ message: "Failed to send test email" });
      }
    } catch (error) {
      console.error('Test email error:', error);
      res.status(500).json({ message: "Failed to send test email" });
    }
  });

  // Notification API endpoints
  app.get("/api/notifications", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const notifications = await storage.getUnreadNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error('Get unread notifications error:', error);
      res.status(500).json({ message: "Failed to fetch unread notifications" });
    }
  });

  app.post("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.markNotificationAsRead(id);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Notification not found" });
      }
    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/mark-all-read", async (req, res) => {
    try {
      const userId = parseInt(req.body.userId);
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const success = await storage.markAllNotificationsAsRead(userId);
      res.json({ success });
    } catch (error) {
      console.error('Mark all notifications read error:', error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Function to broadcast notification to user's WebSocket connections
  const broadcastToUser = (userId: number, notification: any) => {
    const connections = userConnections.get(userId);
    if (connections) {
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'new_notification',
            data: notification
          }));
        }
      });
    }
  };

  // Make broadcast function available globally for storage class
  (global as any).broadcastToUser = broadcastToUser;

  // Setup automatic daily emails at 9 AM
  const scheduleDaily = () => {
    const checkTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      // Log current time every hour for debugging
      if (minutes === 0) {
        console.log(`⏰ Scheduler check: ${hours}:${minutes.toString().padStart(2, '0')} - Target: 9:00 AM`);
      }
      
      // Send at 9:00 AM every day
      if (hours === 9 && minutes === 0) {
        console.log('🎯 Triggering daily report at 9:00 AM');
        sendDailyReportScheduled();
      }
    };

    // Check every minute for 9 AM
    setInterval(checkTime, 60000);
    console.log('📅 Daily email scheduler started - reports will be sent at 9:00 AM');
  };

  const sendDailyReportScheduled = async () => {
    try {
      console.log(`📧 Sending scheduled daily report to: ${currentReportEmail}`);
      const success = await sendDailyReport(currentReportEmail);
      
      if (success) {
        console.log('✅ Daily report sent successfully via Brevo SMTP');
      } else {
        console.log('❌ Failed to send daily report');
      }
    } catch (error) {
      console.error('❌ Daily email report failed:', error);
    }
  };

  // Settings endpoints
  let currentReportEmail = "yashvardhanarorayt@gmail.com";

  // User profile endpoints
  app.get("/api/profile", async (req, res) => {
    try {
      // Get the master admin user "temp"
      const user = await storage.getUserByUsername("temp");
      
      if (!user) {
        return res.status(404).json({ message: "Master admin user not found" });
      }

      res.json({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || ""
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: "Failed to get profile" });
    }
  });

  app.post("/api/profile", async (req, res) => {
    try {
      const { firstName, lastName, email, phone } = req.body;
      
      // Always update the master admin user "temp" - never create new users
      const user = await storage.getUserByUsername("temp");
      
      if (!user) {
        return res.status(404).json({ message: "Master admin user not found" });
      }
      
      // Update only the provided fields, keep existing values for others
      const updatedUser = await storage.updateUser(user.id, {
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone
      });

      res.json({
        message: "Profile updated successfully",
        user: {
          firstName: updatedUser?.firstName || firstName,
          lastName: updatedUser?.lastName || lastName,
          email: updatedUser?.email || email,
          phone: updatedUser?.phone || phone
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Handle both POST and PUT methods for email settings
  const updateEmailSettings = async (req: any, res: any) => {
    try {
      const { reportEmail } = req.body;
      
      if (!reportEmail) {
        return res.status(400).json({ message: "Report email is required" });
      }

      currentReportEmail = reportEmail;
      console.log(`📧 Updated report email to: ${currentReportEmail}`);

      res.json({ 
        message: "Email settings updated successfully",
        reportEmail: currentReportEmail
      });
    } catch (error) {
      console.error('Update email settings error:', error);
      res.status(500).json({ message: "Failed to update email settings" });
    }
  };

  app.post("/api/settings/email", updateEmailSettings);
  app.put("/api/settings/email", updateEmailSettings);

  app.get("/api/settings/email", async (req, res) => {
    try {
      res.json({ reportEmail: currentReportEmail });
    } catch (error) {
      console.error('Get email settings error:', error);
      res.status(500).json({ message: "Failed to get email settings" });
    }
  });

  // Start the daily email scheduler
  scheduleDaily();

  // ASM Authentication Routes
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

  // ASM Registration
  app.post("/api/asm/register", async (req, res) => {
    try {
      const { username, email, password, firstName, lastName, phone } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create ASM user
      const newUser = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: 'asm'
      });

      res.json({ 
        success: true, 
        message: "Account created successfully",
        user: { 
          id: newUser.id, 
          username: newUser.username, 
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          phone: newUser.phone
        }
      });
    } catch (error) {
      console.error('ASM registration error:', error);
      res.status(500).json({ success: false, message: "Registration failed" });
    }
  });

  // ASM Login
  app.post("/api/asm/login", async (req, res) => {
    try {
      const { identifier, password } = req.body;

      // Find user by username
      const user = await storage.getUserByUsername(identifier);
      if (!user || user.role !== 'asm') {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone
        }
      });
    } catch (error) {
      console.error('ASM login error:', error);
      res.status(500).json({ success: false, message: "Login failed" });
    }
  });

  // Forgot Password - Send OTP
  app.post("/api/forgot-password/send-otp", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP in memory (in production, use Redis or database)
      if (!global.otpStore) {
        global.otpStore = new Map();
      }
      global.otpStore.set(email, {
        otp,
        timestamp: Date.now(),
        attempts: 0
      });

      // Send OTP email
      const emailService = require('./email-service');
      const emailSent = await emailService.sendOtpEmail(email, otp);
      
      if (emailSent) {
        res.json({ success: true, message: "OTP sent to your email" });
      } else {
        res.status(500).json({ success: false, message: "Failed to send OTP email" });
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({ success: false, message: "Failed to send OTP" });
    }
  });

  // Forgot Password - Verify OTP
  app.post("/api/forgot-password/verify-otp", async (req, res) => {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({ success: false, message: "Email and OTP are required" });
      }

      const storedOtpData = global.otpStore?.get(email);
      if (!storedOtpData) {
        return res.status(400).json({ success: false, message: "OTP not found or expired" });
      }

      // Check if OTP is expired (5 minutes)
      if (Date.now() - storedOtpData.timestamp > 5 * 60 * 1000) {
        global.otpStore.delete(email);
        return res.status(400).json({ success: false, message: "OTP has expired" });
      }

      // Check if too many attempts
      if (storedOtpData.attempts >= 3) {
        global.otpStore.delete(email);
        return res.status(400).json({ success: false, message: "Too many failed attempts" });
      }

      if (storedOtpData.otp !== otp) {
        storedOtpData.attempts++;
        return res.status(400).json({ success: false, message: "Invalid OTP" });
      }

      // Mark OTP as verified
      storedOtpData.verified = true;
      res.json({ success: true, message: "OTP verified successfully" });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ success: false, message: "Failed to verify OTP" });
    }
  });

  // Forgot Password - Reset Password
  app.post("/api/forgot-password/reset-password", async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;
      
      if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: "All fields are required" });
      }

      const storedOtpData = global.otpStore?.get(email);
      if (!storedOtpData || !storedOtpData.verified) {
        return res.status(400).json({ success: false, message: "OTP not verified" });
      }

      // Update user password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(email, hashedPassword);

      // Clear OTP data
      global.otpStore.delete(email);

      res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ success: false, message: "Failed to reset password" });
    }
  });

  // Get ASM Complaints
  app.get("/api/asm/complaints", async (req, res) => {
    try {
      const asmToken = req.headers.authorization?.split(' ')[1];
      
      if (!asmToken) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }

      let asmId;
      try {
        const decoded = jwt.verify(asmToken, JWT_SECRET) as any;
        asmId = decoded.userId;
      } catch {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }

      // Get all complaints for this ASM
      const allComplaints = await storage.getComplaints();
      const asmComplaints = allComplaints.filter(complaint => complaint.userId === asmId);

      res.json(asmComplaints);
    } catch (error) {
      console.error('Error fetching ASM complaints:', error);
      res.status(500).json({ success: false, message: "Failed to fetch complaints" });
    }
  });

  // Submit ASM Complaint
  app.post("/api/asm/complaints", async (req, res) => {
    try {
      const asmToken = req.headers.authorization?.split(' ')[1];
      
      if (!asmToken) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }

      let asmId;
      try {
        const decoded = jwt.verify(asmToken, JWT_SECRET) as any;
        asmId = decoded.userId;
      } catch {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }

      // Generate complaint code in yymmsno format
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
      const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month with leading zero
      
      // Get count of complaints for this month to generate serial number
      const allComplaints = await storage.getComplaints();
      const currentYearMonth = `${year}${month}`;
      const monthlyComplaints = allComplaints.filter(c => 
        c.yearlySequenceNumber && c.createdAt && 
        c.createdAt.getFullYear().toString().slice(-2) === year &&
        (c.createdAt.getMonth() + 1).toString().padStart(2, '0') === month.toString().padStart(2, '0')
      );
      const serialNumber = (monthlyComplaints.length + 1).toString().padStart(2, '0');
      
      const complaintCode = `${currentYearMonth}${serialNumber}`;

      const complaintData = {
        ...req.body,
        userId: asmId,
        complaintCode,
        status: 'new',
        priority: 'medium',
        complaintReceivingLocation: req.body.complaintReceivingLocation || req.body.placeOfSupply || 'Customer Portal'
      };

      const validatedData = insertComplaintSchema.parse(complaintData);
      const newComplaint = await storage.createComplaint(validatedData);

      // Add history entry
      await storage.addComplaintHistory({
        complaintId: newComplaint.id,
        toStatus: 'new',
        changedBy: 'Customer'
      });

      res.json({
        success: true,
        message: "Complaint submitted successfully",
        complaint: newComplaint,
        complaintCode: complaintCode,
        id: newComplaint.id
      });
    } catch (error) {
      console.error('Error submitting complaint:', error);
      res.status(500).json({ success: false, message: "Failed to submit complaint" });
    }
  });

  // Get single complaint detail for ASM
  app.get("/api/asm/complaints/:id", async (req, res) => {
    try {
      const asmToken = req.headers.authorization?.split(' ')[1];
      
      if (!asmToken) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }

      let asmId;
      try {
        const decoded = jwt.verify(asmToken, JWT_SECRET) as any;
        asmId = decoded.userId;
      } catch {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }

      const complaint = await storage.getComplaint(parseInt(req.params.id));
      if (!complaint || complaint.userId !== asmId) {
        return res.status(404).json({ success: false, message: "Complaint not found" });
      }

      res.json(complaint);
    } catch (error) {
      console.error('Error fetching complaint:', error);
      res.status(500).json({ success: false, message: "Failed to fetch complaint" });
    }
  });





  // ASM profile management
  app.get("/api/asm/profile", async (req, res) => {
    try {
      const asmToken = req.headers.authorization?.split(' ')[1];
      
      if (!asmToken) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }

      let asmId;
      try {
        const decoded = jwt.verify(asmToken, JWT_SECRET) as any;
        asmId = decoded.userId;
      } catch {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }

      const user = await storage.getUser(asmId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ success: false, message: "Failed to fetch profile" });
    }
  });

  app.put("/api/asm/profile", async (req, res) => {
    try {
      const asmToken = req.headers.authorization?.split(' ')[1];
      
      if (!asmToken) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }

      let asmId;
      try {
        const decoded = jwt.verify(asmToken, JWT_SECRET) as any;
        asmId = decoded.userId;
      } catch {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }

      const { firstName, lastName, email, phone } = req.body;
      
      const updatedUser = await storage.updateUser(asmId, {
        firstName,
        lastName,
        email,
        phone
      });

      if (!updatedUser) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      res.json({
        success: true,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          phone: updatedUser.phone
        }
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ success: false, message: "Failed to update profile" });
    }
  });

  // Change password with security key verification
  app.post("/api/asm/change-password-with-key", async (req, res) => {
    try {
      const asmToken = req.headers.authorization?.split(' ')[1];
      
      if (!asmToken) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }

      let asmId;
      try {
        const decoded = jwt.verify(asmToken, JWT_SECRET) as any;
        asmId = decoded.userId;
      } catch {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }

      const { securityKey, newPassword } = req.body;
      
      if (!securityKey || !newPassword) {
        return res.status(400).json({ success: false, message: 'Security key and new password are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
      }

      // Validate security key
      const isValidKey = await storage.validateSecurityKey(securityKey);
      if (!isValidKey) {
        return res.status(400).json({ success: false, message: 'Invalid security key' });
      }

      // Hash new password and update
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(asmId, { password: hashedNewPassword });

      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      console.error('Error changing password with security key:', error);
      res.status(500).json({ success: false, message: "Failed to change password" });
    }
  });

  // Get available security keys (for display purposes - without actual values)
  app.get("/api/asm/security-keys", async (req, res) => {
    try {
      const asmToken = req.headers.authorization?.split(' ')[1];
      
      if (!asmToken) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }

      try {
        jwt.verify(asmToken, JWT_SECRET);
      } catch {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }

      const keys = await storage.getSecurityKeys();
      const keyNames = keys.map(key => ({
        id: key.id,
        name: key.keyName,
        hint: key.keyValue.substring(0, 2) + '***' + key.keyValue.slice(-2)
      }));

      res.json({ success: true, keys: keyNames });
    } catch (error) {
      console.error('Error getting security keys:', error);
      res.status(500).json({ success: false, message: "Failed to get security keys" });
    }
  });

  // Change password (legacy endpoint - now requires current password)
  app.post("/api/asm/change-password", async (req, res) => {
    try {
      const asmToken = req.headers.authorization?.split(' ')[1];
      
      if (!asmToken) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }

      let asmId;
      try {
        const decoded = jwt.verify(asmToken, JWT_SECRET) as any;
        asmId = decoded.userId;
      } catch {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }

      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
      }

      const user = await storage.getUser(asmId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }

      // Hash new password and update
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(asmId, { password: hashedNewPassword });

      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ success: false, message: "Failed to change password" });
    }
  });

  // Profile picture upload
  app.post("/api/asm/profile-picture", async (req, res) => {
    try {
      const asmToken = req.headers.authorization?.split(' ')[1];
      
      if (!asmToken) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }

      let asmId;
      try {
        const decoded = jwt.verify(asmToken, JWT_SECRET) as any;
        asmId = decoded.userId;
      } catch {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }

      // For demo, return success - in real app, handle file upload to storage
      res.json({
        success: true,
        message: 'Profile picture uploaded successfully',
        profilePictureUrl: `/api/uploads/profile-pictures/user_${asmId}_${Date.now()}.jpg`
      });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      res.status(500).json({ success: false, message: "Failed to upload profile picture" });
    }
  });

  // File upload endpoint
  app.post("/api/upload", async (req, res) => {
    try {
      const { fileName, fileData, contentType } = req.body;
      
      if (!fileName || !fileData) {
        return res.status(400).json({ 
          success: false, 
          message: "File name and data are required" 
        });
      }

      // Generate unique file path
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const filePath = `uploads/${timestamp}_${randomId}_${fileName}`;
      
      // Store file metadata for demo purposes
      // In production, you would save files to disk or cloud storage
      console.log(`File uploaded: ${filePath}, Size: ${fileData.length} characters, Type: ${contentType}`);

      res.json({
        success: true,
        filePath: filePath,
        fileName: fileName,
        contentType: contentType,
        uploadedAt: new Date().toISOString(),
        viewUrl: `/api/files/${encodeURIComponent(filePath)}`
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ success: false, message: "File upload failed" });
    }
  });

  // File serving endpoint for viewing uploaded files
  app.get("/api/files/:filePath", async (req, res) => {
    try {
      const filePath = decodeURIComponent(req.params.filePath);
      
      console.log(`File access requested: ${filePath}`);
      
      // In production, this would serve the actual file from storage
      // For demo purposes, return file information
      res.json({
        success: true,
        message: "File access endpoint ready",
        filePath: filePath,
        note: "File uploaded successfully - in production this would serve the actual file content",
        downloadUrl: `/api/download/${encodeURIComponent(filePath)}`,
        accessTime: new Date().toISOString()
      });
    } catch (error) {
      console.error('File serving error:', error);
      res.status(500).json({ success: false, message: "Failed to access file" });
    }
  });

  // File download endpoint
  app.get("/api/download/:filePath", async (req, res) => {
    try {
      const filePath = decodeURIComponent(req.params.filePath);
      
      console.log(`File download requested: ${filePath}`);
      
      // In production, this would serve the actual file for download
      res.json({
        success: true,
        message: "File download ready",
        filePath: filePath,
        note: "File available for download - production implementation would stream file content"
      });
    } catch (error) {
      console.error('File download error:', error);
      res.status(500).json({ success: false, message: "Failed to download file" });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'auth' && data.userId) {
          const userId = parseInt(data.userId);
          
          // Add connection to user's connection list
          if (!userConnections.has(userId)) {
            userConnections.set(userId, []);
          }
          userConnections.get(userId)!.push(ws);
          
          console.log(`User ${userId} connected via WebSocket`);
          
          // Send initial unread notifications
          storage.getUnreadNotifications(userId).then(notifications => {
            ws.send(JSON.stringify({
              type: 'notifications',
              data: notifications
            }));
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      // Remove connection from all user lists
      userConnections.forEach((connections, userId) => {
        const index = connections.indexOf(ws);
        if (index !== -1) {
          connections.splice(index, 1);
          if (connections.length === 0) {
            userConnections.delete(userId);
          }
        }
      });
    });
  });
  
  return httpServer;
}
