import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import fs from "fs";
import path from "path";

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
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

// Type for OTP store
interface OTPData {
  otp: string;
  timestamp: number;
  attempts: number;
  verified?: boolean;
}

// Global OTP store type declaration
declare global {
  var otpStore: Map<string, OTPData> | undefined;
}

// WebSocket connections by user ID
const userConnections = new Map<number, WebSocket[]>();

// Stats cache for instant loading like chat
let statsCache: any = null;
let statsCacheTime = 0;
const STATS_CACHE_DURATION = 1000; // 1 second cache like chat updates

// Function to invalidate stats cache for instant updates
function invalidateStatsCache() {
  statsCache = null;
  statsCacheTime = 0;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get complaint statistics - optimized for instant loading like chat
  app.get("/api/complaints/stats", async (req, res) => {
    try {
      const now = Date.now();
      
      // Use cache for instant response if fresh
      if (statsCache && (now - statsCacheTime) < STATS_CACHE_DURATION) {
        res.setHeader('X-Stats-Source', 'cache');
        return res.json(statsCache);
      }
      
      // Fetch fresh stats and update cache
      const stats = await storage.getComplaintStats();
      statsCache = stats;
      statsCacheTime = now;
      
      // Set aggressive no-cache headers for instant updates like chat
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      res.setHeader('X-Stats-Source', 'fresh');
      
      res.json(stats);
    } catch (error) {
      console.error('Get stats error:', error);
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

  // Clear all complaints endpoint
  app.delete("/api/complaints/clear-all", async (req, res) => {
    try {
      await storage.clearDemoComplaints();
      console.log('🗑️  Cleared all complaints from database');
      res.json({ success: true, message: 'All complaints cleared' });
    } catch (error) {
      console.error('❌ Error clearing complaints:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to clear complaints', 
        error: (error as Error).message 
      });
    }
  });

  // Import Excel data endpoint
  app.post("/api/complaints/import-excel", async (req, res) => {
    try {
      const result = await storage.importActualExcelData();
      res.json({
        success: true,
        imported: result.imported,
        message: result.message
      });
    } catch (error) {
      console.error('❌ Error importing Excel data:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to import Excel data', 
        error: (error as Error).message 
      });
    }
  });

  // Export complaints using Excel template with xlsx-populate to preserve all formatting
  app.get("/api/complaints/export", async (req, res) => {
    try {
      const { year, startDate, endDate } = req.query;
      const complaints = await storage.getComplaints();
      
      // Filter complaints by date range if specified, otherwise filter by year
      let filteredComplaints = complaints;
      
      if (startDate && endDate) {
        // Filter by specific date range
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        
        filteredComplaints = complaints.filter(c => {
          const creationDate = c.complaintCreation 
            ? new Date(c.complaintCreation) 
            : new Date(c.createdAt);
          
          return creationDate >= start && creationDate <= end;
        });
      } else if (year) {
        // Filter by year only if no date range specified
        filteredComplaints = complaints.filter(c => {
          if (!c.date) return false;
          const complaintYear = new Date(c.date).getFullYear();
          return complaintYear.toString() === year;
        });
      }

      // Use xlsx-populate to preserve original Excel formatting completely
      // @ts-ignore
const XlsxPopulate = await import('xlsx-populate');
      const fs = await import('fs');
      const path = await import('path');
      const templatePath = path.join('./attached_assets', '2025final_1753735024170.xlsx');
      
      if (!fs.existsSync(templatePath)) {
        return res.status(404).json({ message: "Template file not found" });
      }

      // Load the original template - xlsx-populate preserves ALL formatting
      const workbook = await XlsxPopulate.default.fromFileAsync(templatePath);
      const sheet = workbook.sheet(0);

      // Clear existing data rows but preserve headers and ALL formatting
      const maxRow = sheet.usedRange()?.endCell()?.rowNumber() || 1;
      if (maxRow > 1) {
        // Clear data from row 2 onwards but keep all formatting
        for (let row = 2; row <= maxRow; row++) {
          for (let col = 1; col <= 30; col++) { // 30 columns A-AD
            const cell = sheet.cell(row, col);
            cell.value(undefined); // Clear value but keep formatting
          }
        }
      }

      // Add filtered complaint data starting from row 2
      filteredComplaints.forEach((complaint, index) => {
        const row = index + 2;
        
        // Fill data while preserving all cell formatting
        sheet.cell(row, 1).value(complaint.yearlySequenceNumber || index + 1);
        sheet.cell(row, 2).value(complaint.complaintSource || '-');
        sheet.cell(row, 3).value(complaint.placeOfSupply || '-');
        sheet.cell(row, 4).value(complaint.complaintReceivingLocation || '-'); // Complaint Receiving Location
        sheet.cell(row, 5).value(complaint.date ? new Date(complaint.date).toLocaleDateString('en-GB') : '-');
        sheet.cell(row, 6).value(complaint.depoPartyName || '-');
        sheet.cell(row, 7).value(complaint.email || '-');
        sheet.cell(row, 8).value(complaint.contactNumber || '-');
        sheet.cell(row, 9).value(complaint.invoiceNo || '-');
        sheet.cell(row, 10).value(complaint.invoiceDate ? new Date(complaint.invoiceDate).toLocaleDateString('en-GB') : '-');
        sheet.cell(row, 11).value(complaint.lrNumber || '-');
        sheet.cell(row, 12).value(complaint.transporterName || '-');
        sheet.cell(row, 13).value(complaint.transporterNumber || '-');
        sheet.cell(row, 14).value(complaint.complaintType || '-');
        sheet.cell(row, 15).value(complaint.voc || '-');
        sheet.cell(row, 16).value(complaint.salePersonName || '-');
        sheet.cell(row, 17).value(complaint.productName || '-');
        sheet.cell(row, 18).value(complaint.areaOfConcern || '-');
        sheet.cell(row, 19).value(complaint.subCategory || '-');
        sheet.cell(row, 20).value(complaint.actionTaken || '-'); // Action Taken
        sheet.cell(row, 21).value(complaint.creditDate ? new Date(complaint.creditDate).toLocaleDateString('en-GB') : '-'); // Credit Date
        sheet.cell(row, 22).value(complaint.creditNoteNumber || '-'); // Credit Note Number
        sheet.cell(row, 23).value(complaint.creditAmount || '-'); // Credit Amount
        sheet.cell(row, 24).value(complaint.personResponsible || '-'); // Person Responsible
        sheet.cell(row, 25).value(complaint.rootCauseActionPlan || '-'); // Root Cause/Action Plan
        sheet.cell(row, 26).value(complaint.complaintCreation ? new Date(complaint.complaintCreation).toLocaleDateString('en-GB') : 
          (complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString('en-GB') : '-'));
        sheet.cell(row, 27).value(complaint.dateOfResolution ? new Date(complaint.dateOfResolution).toLocaleDateString('en-GB') : '-'); // Date of Resolution
        sheet.cell(row, 28).value(complaint.dateOfClosure ? new Date(complaint.dateOfClosure).toLocaleDateString('en-GB') : '-'); // Date of Closure
        sheet.cell(row, 29).value(complaint.status || '-');
        sheet.cell(row, 30).value((complaint as any).daysRequiredForClosure || '-'); // Days Required for Closure
      });

      // Generate Excel buffer with ALL original formatting preserved
      const excelBuffer = await workbook.outputAsync();
      
      // Set headers for download
      const yearSuffix = year ? `-${year}` : '';
      const filename = `all-complaints-report${yearSuffix}-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(excelBuffer);

    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ message: "Failed to export complaints with template" });
    }
  });

  // Export complaints using Excel template with date filtering for Reports page
  app.post("/api/complaints/export-template", async (req, res) => {
    try {
      const { startDate, endDate, year, complaints: filteredComplaints } = req.body;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      // Sort complaints by sequence number and assign sequential S.no.
      const sortedComplaints = filteredComplaints
        .sort((a: any, b: any) => (a.yearlySequenceNumber || 0) - (b.yearlySequenceNumber || 0))
        .map((complaint: any, index: number) => ({
          ...complaint,
          sequentialNumber: index + 1 // Assign sequential S.no. starting from 1
        }));

      // Use xlsx-populate to preserve original Excel formatting completely
      const XlsxPopulate = await import('xlsx-populate');
      const fs = await import('fs');
      const path = await import('path');
      const templatePath = path.join('./attached_assets', '2025final_1753735024170.xlsx');
      
      if (!fs.existsSync(templatePath)) {
        return res.status(404).json({ message: "Template file not found" });
      }

      // Load the original template - xlsx-populate preserves ALL formatting
      const workbook = await XlsxPopulate.default.fromFileAsync(templatePath);
      const sheet = workbook.sheet(0);

      // Clear existing data rows but preserve headers and ALL formatting
      const maxRow = sheet.usedRange()?.endCell()?.rowNumber() || 1;
      if (maxRow > 1) {
        // Clear data from row 2 onwards but keep all formatting
        for (let row = 2; row <= maxRow; row++) {
          for (let col = 1; col <= 30; col++) { // 30 columns A-AD
            const cell = sheet.cell(row, col);
            cell.value(undefined); // Clear value but keep formatting
          }
        }
      }

      // Add filtered complaint data starting from row 2 with sequential S.no.
      sortedComplaints.forEach((complaint: any, index: number) => {
        const row = index + 2;
        
        // Fill data while preserving all cell formatting
        sheet.cell(row, 1).value(complaint.sequentialNumber); // Sequential S.no.
        sheet.cell(row, 2).value(complaint.complaintSource || '-');
        sheet.cell(row, 3).value(complaint.placeOfSupply || '-');
        sheet.cell(row, 4).value(complaint.complaintReceivingLocation || '-'); // Complaint Receiving Location
        sheet.cell(row, 5).value(complaint.date ? new Date(complaint.date).toLocaleDateString('en-GB') : '-');
        sheet.cell(row, 6).value(complaint.depoPartyName || '-');
        sheet.cell(row, 7).value(complaint.email || '-');
        sheet.cell(row, 8).value(complaint.contactNumber || '-');
        sheet.cell(row, 9).value(complaint.invoiceNo || '-');
        sheet.cell(row, 10).value(complaint.invoiceDate ? new Date(complaint.invoiceDate).toLocaleDateString('en-GB') : '-');
        sheet.cell(row, 11).value(complaint.lrNumber || '-');
        sheet.cell(row, 12).value(complaint.transporterName || '-');
        sheet.cell(row, 13).value(complaint.transporterNumber || '-');
        sheet.cell(row, 14).value(complaint.complaintType || '-');
        sheet.cell(row, 15).value(complaint.voc || '-');
        sheet.cell(row, 16).value(complaint.salePersonName || '-');
        sheet.cell(row, 17).value(complaint.productName || '-');
        sheet.cell(row, 18).value(complaint.areaOfConcern || '-');
        sheet.cell(row, 19).value(complaint.subCategory || '-');
        sheet.cell(row, 20).value(complaint.actionTaken || '-'); // Action Taken
        sheet.cell(row, 21).value(complaint.creditDate ? new Date(complaint.creditDate).toLocaleDateString('en-GB') : '-'); // Credit Date
        sheet.cell(row, 22).value(complaint.creditNoteNumber || '-'); // Credit Note Number
        sheet.cell(row, 23).value(complaint.creditAmount || '-'); // Credit Amount
        sheet.cell(row, 24).value(complaint.personResponsible || '-'); // Person Responsible
        sheet.cell(row, 25).value(complaint.rootCauseActionPlan || '-'); // Root Cause/Action Plan
        sheet.cell(row, 26).value(complaint.complaintCreation ? new Date(complaint.complaintCreation).toLocaleDateString('en-GB') : 
          (complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString('en-GB') : '-'));
        sheet.cell(row, 27).value(complaint.dateOfResolution ? new Date(complaint.dateOfResolution).toLocaleDateString('en-GB') : '-'); // Date of Resolution
        sheet.cell(row, 28).value(complaint.dateOfClosure ? new Date(complaint.dateOfClosure).toLocaleDateString('en-GB') : '-'); // Date of Closure
        sheet.cell(row, 29).value(complaint.status || '-');
        sheet.cell(row, 30).value((complaint as any).daysRequiredForClosure || '-'); // Days Required for Closure
      });

      // Generate Excel buffer with ALL original formatting preserved
      const excelBuffer = await workbook.outputAsync();
      
      // Set headers for download
      const filename = `all-complaints-report-${year}-${new Date(startDate).toLocaleDateString('en-GB').replace(/\//g, '-')}-to-${new Date(endDate).toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(excelBuffer);

    } catch (error) {
      console.error('Template export error:', error);
      res.status(500).json({ message: "Failed to export complaints with template" });
    }
  });

  // Get all complaints - optimized for instant loading
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
        complaints = await storage.getComplaintsWithUserInfo();
      }
      
      // Set headers for faster responses
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      res.json(complaints);
    } catch (error) {
      console.error('Get complaints error:', error);
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
        open: userComplaints.filter(c => c.status === "open").length,
        resolved: userComplaints.filter(c => c.status === "resolved").length,
        closed: userComplaints.filter(c => c.status === "closed").length
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

  // Get complaint comments
  app.get("/api/complaints/:id/comments", async (req, res) => {
    try {
      const complaintId = parseInt(req.params.id);
      const comments = await storage.getComplaintComments(complaintId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Create complaint comment
  app.post("/api/complaints/:id/comments", async (req, res) => {
    try {
      const complaintId = parseInt(req.params.id);
      const { message, userRole, userId, parentCommentId } = req.body;

      // Check if complaint exists
      const complaint = await storage.getComplaint(complaintId);
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }

      // Check if ASM can comment (not allowed if complaint is closed)
      if (userRole === 'customer' && complaint.status === 'closed') {
        return res.status(403).json({ message: "Cannot comment on closed complaints" });
      }

      const comment = await storage.createComplaintComment({
        complaintId,
        userId,
        userRole,
        message,
        parentCommentId: parentCommentId || null,
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Create new complaint (admin endpoint)
  app.post("/api/complaints", async (req, res) => {
    try {
      // Convert empty fields to "-" before processing
      const processedData = Object.keys(req.body).reduce((acc: any, key) => {
        acc[key] = req.body[key] === '' || req.body[key] === null || req.body[key] === undefined ? '-' : req.body[key];
        return acc;
      }, {});
      
      // Ensure date field is set to current date if not provided
      if (!processedData.date || processedData.date === '-') {
        processedData.date = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
      }
      
      const validatedData = insertComplaintSchema.parse(processedData);
      const complaint = await storage.createComplaint(validatedData, 'admin');
      
      // Invalidate stats cache for instant updates like chat
      invalidateStatsCache();
      
      // Return complaint with complaintCode as yearlySequenceNumber for consistency
      res.status(201).json({
        ...complaint,
        complaintCode: complaint.yearlySequenceNumber
      });
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
      
      // Determine if this is admin or ASM user making the update
      const adminToken = req.headers['admin-authorization'];
      const asmToken = req.headers.authorization?.split(' ')[1];
      
      let updatedBy: 'admin' | 'asm' | undefined;
      let updatingUserId: number | undefined;
      
      if (adminToken) {
        try {
          const decoded = jwt.verify(adminToken as string, JWT_SECRET) as any;
          updatedBy = 'admin';
          updatingUserId = decoded.userId;
        } catch {
          updatedBy = 'admin'; // Default to admin for main dashboard updates
        }
      } else if (asmToken) {
        try {
          const decoded = jwt.verify(asmToken, JWT_SECRET) as any;
          updatedBy = 'asm';
          updatingUserId = decoded.userId;
        } catch {
          updatedBy = 'asm';
        }
      } else {
        // Default to admin if no specific token (for main dashboard)
        updatedBy = 'admin';
      }
      
      const complaint = await storage.updateComplaint(id, validatedData, updatedBy, updatingUserId);
      
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }
      
      // Invalidate stats cache for instant updates like chat
      invalidateStatsCache();
      
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
      
      // Get complaint details before deleting to check if it was created by ASM
      const complaint = await storage.getComplaint(id);
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }
      
      const deleted = await storage.deleteComplaint(id);
      if (!deleted) {
        return res.status(404).json({ message: "Complaint not found" });
      }
      
      // Invalidate stats cache for instant updates like chat
      invalidateStatsCache();
      
      // Send notification to ASM if complaint was created by ASM user
      if (complaint.userId && complaint.userId !== 1) { // Assuming admin user ID is 1
        const asmUser = await storage.getUserById(complaint.userId);
        if (asmUser) {
          // Create notification for ASM user about complaint deletion
          await storage.createNotification({
            userId: complaint.userId,
            title: "Complaint Deleted",
            message: `Your complaint #${complaint.yearlySequenceNumber || complaint.id} regarding "${complaint.areaOfConcern || complaint.complaintType}" has been deleted by admin.`,
            type: "warning",
            complaintId: complaint.id,
            isRead: false
          });
          
          // Broadcast notification via WebSocket if connected
          try {
            if (typeof global !== 'undefined' && (global as any).broadcastToUser) {
              (global as any).broadcastToUser(complaint.userId, {
                type: 'complaint_deleted',
                data: {
                  complaintId: complaint.id,
                  title: "Complaint Deleted",
                  message: `Your complaint #${complaint.yearlySequenceNumber || complaint.id} has been deleted by admin.`
                }
              });
            }
          } catch (wsError) {
            console.log('WebSocket broadcast failed:', wsError);
          }
        }
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Delete complaint error:', error);
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
      
      // Define the exact headers from your 2024final Excel template (30 columns)
      const headers = [
        'S.no.',
        'Complaint Source',
        'Place of Supply', 
        'Complaint Receiving location',
        'Month',
        'Depo/ Party Name',
        'Email',
        'Contact Number',
        'Invoice No.',
        'Invoice Date (dd/mm/yyyy)',
        'LR Number',
        'Transporter Name',
        'Transporter Number',
        'Complaint Type',
        'Voc',
        'Sale Person Name',
        'Product Name',
        'Area of Concern',
        'Sub Category',
        'Action Taken',
        'Credit Date',
        'Credit Note Number',
        'Credit Amount',
        'Person Responsible for Complaint',
        'Root Cause / Action Plan',
        'Complaint Creation',
        'Date of Resolution',
        'Date of Closure',
        'Final Status',
        'No. of days taken to resolve'
      ];
      
      // Map complaint data to match the exact 30-column template structure
      const excelData = (complaints as any[]).map((complaint: any, index: number) => [
        index + 1, // S.no.
        complaint.complaintSource || '-',
        complaint.placeOfSupply || '-',
        complaint.complaintReceivingLocation || '-',
        complaint.date || '-', // Month field
        complaint.depoPartyName || '-',
        complaint.email || '-',
        complaint.contactNumber || '-',
        complaint.invoiceNo || '-',
        complaint.invoiceDate || '-',
        complaint.lrNumber || '-',
        complaint.transporterName || '-',
        complaint.transporterNumber || '-',
        complaint.complaintType || '-',
        complaint.voc || '-', // Voice of Customer
        complaint.salePersonName || '-',
        complaint.productName || '-',
        complaint.areaOfConcern || '-',
        complaint.subCategory || '-',
        complaint.actionTaken || '-',
        complaint.creditDate || '-',
        complaint.creditNoteNumber || '-',
        complaint.creditAmount || '-',
        complaint.personResponsible || '-',
        complaint.rootCauseActionPlan || '-',
        complaint.complaintCreation ? new Date(complaint.complaintCreation).toLocaleDateString('en-GB') : (complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString('en-GB') : '-'),
        complaint.dateOfResolution ? new Date(complaint.dateOfResolution).toLocaleDateString('en-GB') : '-',
        complaint.dateOfClosure ? new Date(complaint.dateOfClosure).toLocaleDateString('en-GB') : '-',
        complaint.finalStatus || complaint.status || '-',
        complaint.daysToResolve?.toString() || '-'
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
- Open: ${stats.new + stats.inProgress}
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

  // Function to broadcast complaint updates to all connected users
  const broadcastComplaintUpdate = (type: 'created' | 'updated' | 'deleted', complaint: any) => {
    userConnections.forEach((connections, userId) => {
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'complaint_update',
            action: type,
            data: complaint
          }));
        }
      });
    });
  };

  // Make broadcast functions available globally for storage class
  (global as any).broadcastToUser = broadcastToUser;
  (global as any).broadcastComplaintUpdate = broadcastComplaintUpdate;





  // User profile endpoints
  app.get("/api/profile", async (req, res) => {
    try {
      // Get the master admin user by role (there should only be one admin)
      const users = await storage.getUsers();
      const user = users.find(u => u.role === 'admin');
      
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
      
      // Validate that first name, last name, and email are provided and not empty
      if (!firstName || !firstName.trim()) {
        return res.status(400).json({ message: "First name is required" });
      }
      
      if (!lastName || !lastName.trim()) {
        return res.status(400).json({ message: "Last name is required" });
      }

      if (!email || !email.trim()) {
        return res.status(400).json({ message: "Email address is required" });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ message: "Please enter a valid email address" });
      }
      
      // Always update the master admin user by role - never create new users
      const users = await storage.getUsers();
      const user = users.find(u => u.role === 'admin');
      
      if (!user) {
        return res.status(404).json({ message: "Master admin user not found" });
      }
      
      // Check if email is already used by another user (different role)
      const existingUserWithEmail = users.find(u => u.email === email.trim() && u.id !== user.id);
      if (existingUserWithEmail) {
        return res.status(400).json({ 
          message: `Email conflict detected: This email "${email.trim()}" is already registered to ${existingUserWithEmail.firstName || 'Unknown'} ${existingUserWithEmail.lastName || 'User'} with ${existingUserWithEmail.role.toUpperCase()} role. Each email address can only be associated with one user account in the system.` 
        });
      }
      
      // Update only the provided fields, keep existing values for others
      const updatedUser = await storage.updateUser(user.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email,
        phone: phone
      });

      res.json({
        message: "Profile updated successfully",
        user: {
          firstName: updatedUser?.firstName || firstName.trim(),
          lastName: updatedUser?.lastName || lastName.trim(),
          email: updatedUser?.email || email,
          phone: updatedUser?.phone || phone
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Admin change password endpoint with security key
  app.post("/api/admin/change-password-with-key", async (req, res) => {
    try {
      const { currentPassword, newPassword, securityKey } = req.body;
      
      if (!currentPassword || !newPassword || !securityKey) {
        return res.status(400).json({ message: "Current password, new password, and security key are required" });
      }

      // Get the master admin user by role
      const users = await storage.getUsers();
      const user = users.find(u => u.role === 'admin');
      
      if (!user) {
        return res.status(404).json({ message: "Master admin user not found" });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Verify security key
      const isValidKey = await storage.validateSecurityKey(securityKey);
      if (!isValidKey) {
        return res.status(400).json({ message: "Invalid security key" });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      await storage.updateUser(user.id, {
        password: hashedNewPassword
      });
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });



  // Authentication Routes
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

  // Admin Login endpoint
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Get the master admin user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.role !== "admin") {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: 'admin'
        }
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // ASM Registration
  app.post("/api/asm/register", async (req, res) => {
    try {
      const { username, email, password, firstName, lastName, phone } = req.body;

      // Check if user already exists by username
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Username already exists" });
      }
      
      // Check if email is already used by another user
      const existingEmailUser = await storage.getUserByEmail(email);
      if (existingEmailUser) {
        return res.status(400).json({ 
          success: false, 
          message: `This email is already used by another user with ${existingEmailUser.role} role. Each email can only be associated with one user account.` 
        });
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
          phone: user.phone,
          profilePicture: user.profilePicture
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
      if (!globalThis.otpStore) {
        globalThis.otpStore = new Map();
      }
      globalThis.otpStore.set(email, {
        otp,
        timestamp: Date.now(),
        attempts: 0
      });

      // For security purposes, email functionality has been disabled
      // The OTP is generated but not sent - system administrator will need to provide OTP manually
      console.log(`📱 OTP generated for ${email}: ${otp}`);
      
      res.json({ 
        success: true, 
        message: "OTP generated. Please contact system administrator for the verification code.",
        otp: otp // Temporarily include OTP in response for testing - remove in production
      });
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

      const storedOtpData = globalThis.otpStore?.get(email);
      if (!storedOtpData) {
        return res.status(400).json({ success: false, message: "OTP not found or expired" });
      }

      // Check if OTP is expired (5 minutes)
      if (Date.now() - storedOtpData.timestamp > 5 * 60 * 1000) {
        globalThis.otpStore?.delete(email);
        return res.status(400).json({ success: false, message: "OTP has expired" });
      }

      // Check if too many attempts
      if (storedOtpData.attempts >= 3) {
        globalThis.otpStore?.delete(email);
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

      const storedOtpData = globalThis.otpStore?.get(email);
      if (!storedOtpData || !storedOtpData.verified) {
        return res.status(400).json({ success: false, message: "OTP not verified" });
      }

      // Update user password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(email, hashedPassword);

      // Clear OTP data
      globalThis.otpStore?.delete(email);

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

      // Remove the old 4-digit complaint code generation
      // We'll use the yearlySequenceNumber from storage.createComplaint instead

      // Convert empty fields to "-" before processing, handle all date fields as varchar
      const processedBody = Object.keys(req.body).reduce((acc: any, key) => {
        if (key === 'date') {
          // Handle main date field - use provided value or current date
          const dateValue = req.body[key];
          if (dateValue && dateValue !== '' && dateValue !== null && dateValue !== undefined && dateValue !== '-') {
            acc[key] = dateValue;
          } else {
            acc[key] = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
          }
        } else if (key === 'invoiceDate' || key === 'creditDate') {
          // Handle other date fields as strings - empty becomes "-"
          acc[key] = req.body[key] && req.body[key] !== '' && req.body[key] !== null && req.body[key] !== undefined 
            ? req.body[key] 
            : '-';
        } else {
          // Handle all other fields - empty becomes "-"
          acc[key] = req.body[key] === '' || req.body[key] === null || req.body[key] === undefined ? '-' : req.body[key];
        }
        return acc;
      }, {});

      const complaintData = {
        ...processedBody,
        userId: asmId,
        status: 'open',
        priority: processedBody.priority || 'medium',
        complaintReceivingLocation: processedBody.complaintReceivingLocation || processedBody.placeOfSupply || 'Customer Portal'
      };

      const validatedData = insertComplaintSchema.parse(complaintData);
      const newComplaint = await storage.createComplaint(validatedData, 'asm');
      
      // Invalidate stats cache for instant updates like chat
      invalidateStatsCache();

      // Add history entry
      await storage.addComplaintHistory({
        complaintId: newComplaint.id,
        toStatus: 'open',
        changedBy: 'Customer'
      });

      res.json({
        success: true,
        message: "Complaint submitted successfully",
        complaint: newComplaint,
        complaintCode: newComplaint.yearlySequenceNumber,
        id: newComplaint.yearlySequenceNumber
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

  // Update ASM Complaint (PATCH)
  app.patch("/api/asm/complaints/:id", async (req, res) => {
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

      const complaintId = parseInt(req.params.id);
      const existingComplaint = await storage.getComplaint(complaintId);
      if (!existingComplaint || existingComplaint.userId !== asmId) {
        return res.status(404).json({ success: false, message: "Complaint not found or not authorized" });
      }

      // Validate and parse the request body
      const validatedData = updateComplaintSchema.parse(req.body);
      
      // Update the complaint
      const updatedComplaint = await storage.updateComplaint(complaintId, validatedData);
      
      // Invalidate stats cache for instant updates
      invalidateStatsCache();
      
      // Notify connected websocket clients of the update
      const notification = {
        type: 'complaint_updated',
        complaintId: complaintId,
        message: `Complaint #${existingComplaint.yearlySequenceNumber || complaintId} has been updated by ASM user`,
        timestamp: new Date().toISOString()
      };
      
      // Broadcast to admin users
      userConnections.forEach((connections, userId) => {
        connections.forEach(ws => {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify(notification));
          }
        });
      });
      
      res.json({ 
        success: true, 
        complaint: updatedComplaint,
        message: "Complaint updated successfully" 
      });
    } catch (error) {
      console.error('Error updating ASM complaint:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, message: "Invalid data provided", errors: error.errors });
      } else {
        res.status(500).json({ success: false, message: "Failed to update complaint" });
      }
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
        phone: user.phone,
        profilePicture: user.profilePicture
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

      const { firstName, lastName, email, phone, profilePicture } = req.body;
      
      // Check if email is already used by another user (if email is being updated)
      if (email) {
        const users = await storage.getUsers();
        const existingUserWithEmail = users.find(u => u.email === email.trim() && u.id !== asmId);
        if (existingUserWithEmail) {
          return res.status(400).json({ 
            success: false,
            message: `This email is already used by another user with ${existingUserWithEmail.role} role. Each email can only be associated with one user account.` 
          });
        }
      }
      
      const updatedUser = await storage.updateUser(asmId, {
        firstName,
        lastName,
        email,
        phone,
        profilePicture
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
          phone: updatedUser.phone,
          profilePicture: updatedUser.profilePicture
        }
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ success: false, message: "Failed to update profile" });
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
      const filePath = `${timestamp}_${randomId}_${fileName}`;
      const fullPath = path.join(process.cwd(), 'uploads', filePath);
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Convert base64 to buffer and save file
      let buffer: Buffer;
      if (fileData.startsWith('data:')) {
        // Handle data URLs (data:image/png;base64,...)
        const base64Data = fileData.split(',')[1];
        buffer = Buffer.from(base64Data, 'base64');
      } else {
        // Handle raw base64
        buffer = Buffer.from(fileData, 'base64');
      }
      
      fs.writeFileSync(fullPath, buffer);
      console.log(`File saved: ${fullPath}, Size: ${buffer.length} bytes`);

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
      const fullPath = path.join(process.cwd(), 'uploads', filePath);
      
      console.log(`File access requested: ${filePath}`);
      
      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ 
          success: false, 
          message: "File not found" 
        });
      }

      // Get file stats
      const stats = fs.statSync(fullPath);
      const ext = path.extname(filePath).toLowerCase();
      
      // Set appropriate content type
      let contentType = 'application/octet-stream';
      if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.pdf') contentType = 'application/pdf';
      else if (ext === '.txt') contentType = 'text/plain';
      else if (['.doc', '.docx'].includes(ext)) contentType = 'application/msword';
      else if (['.xls', '.xlsx'].includes(ext)) contentType = 'application/vnd.ms-excel';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);
      
      // Stream the file
      const fileStream = fs.createReadStream(fullPath);
      fileStream.pipe(res);
      
    } catch (error) {
      console.error('File serving error:', error);
      res.status(500).json({ success: false, message: "Failed to access file" });
    }
  });

  // File download endpoint
  app.get("/api/download/:filePath", async (req, res) => {
    try {
      const filePath = decodeURIComponent(req.params.filePath);
      const fullPath = path.join(process.cwd(), 'uploads', filePath);
      
      console.log(`File download requested: ${filePath}`);
      
      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ 
          success: false, 
          message: "File not found" 
        });
      }

      // Get file stats
      const stats = fs.statSync(fullPath);
      const originalFileName = path.basename(filePath).split('_').slice(2).join('_'); // Remove timestamp and randomId
      
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Disposition', `attachment; filename="${originalFileName}"`);
      
      // Stream the file for download
      const fileStream = fs.createReadStream(fullPath);
      fileStream.pipe(res);
      
    } catch (error) {
      console.error('File download error:', error);
      res.status(500).json({ success: false, message: "Failed to download file" });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Make broadcast function globally available (defined below with WebSocket setup)
  
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

  // Object storage endpoints for file uploads
  const objectStorageService = new ObjectStorageService();

  // Serve private objects (for complaint attachments)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Get upload URL for file attachments
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Update complaint attachment after upload
  app.put("/api/attachments", async (req, res) => {
    try {
      const { attachmentURL } = req.body;
      
      if (!attachmentURL) {
        return res.status(400).json({ error: "attachmentURL is required" });
      }

      const objectPath = objectStorageService.normalizeObjectEntityPath(attachmentURL);
      
      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error processing attachment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  return httpServer;
}
