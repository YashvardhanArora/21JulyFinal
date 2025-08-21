import { 
  users, 
  complaints, 
  complaintHistory,
  notifications,
  securityKeys,
  complaintComments,
  type User, 
  type InsertUser, 
  type Complaint, 
  type InsertComplaint,
  type UpdateComplaint,
  type ComplaintHistory,
  type InsertComplaintHistory,
  type Notification,
  type InsertNotification,
  type SecurityKey,
  type InsertSecurityKey,
  type ComplaintComment,
  type InsertComplaintComment,
  type ComplaintStatus 
} from "@shared/schema";
import { eq, desc, like, or, sql, and, ne } from 'drizzle-orm';
import { db } from './db';

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  updateUserPassword(email: string, hashedPassword: string): Promise<boolean>;

  // Complaint methods
  getComplaints(): Promise<Complaint[]>;
  getComplaint(id: number): Promise<Complaint | undefined>;
  getComplaintsByStatus(status: ComplaintStatus): Promise<Complaint[]>;
  createComplaint(complaint: InsertComplaint, createdBy?: 'admin' | 'asm'): Promise<Complaint>;
  updateComplaint(id: number, updates: UpdateComplaint, updatedBy?: 'admin' | 'asm', updatingUserId?: number): Promise<Complaint | undefined>;
  deleteComplaint(id: number): Promise<boolean>;
  searchComplaints(query: string): Promise<Complaint[]>;
  getComplaintsByPriority(priority: string): Promise<Complaint[]>;

  // Complaint history methods
  getComplaintHistory(complaintId: number): Promise<ComplaintHistory[]>;
  addComplaintHistory(history: InsertComplaintHistory): Promise<ComplaintHistory>;

  // Analytics methods
  getComplaintStats(): Promise<{
    total: number;
    new: number;
    inProgress: number;
    resolved: number;
    closed: number;
    resolvedToday: number;
  }>;
  getComplaintTrends(days: number): Promise<Array<{
    date: string;
    new: number;
    resolved: number;
  }>>;

  // Notification methods
  getNotifications(userId: number): Promise<Notification[]>;
  getUnreadNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;

  // Security Key methods
  getSecurityKeys(): Promise<SecurityKey[]>;
  validateSecurityKey(keyValue: string): Promise<boolean>;

  // Comment methods
  getComplaintComments(complaintId: number): Promise<ComplaintComment[]>;
  createComplaintComment(comment: InsertComplaintComment): Promise<ComplaintComment>;
  deleteComplaintComment(id: number): Promise<boolean>;
}

export class PostgresStorage implements IStorage {
  constructor() {
    console.log('📝 PostgreSQL storage initialized');
    this.initializeBasicData();
    this.createCommentsTable();
  }

  // Create complaint_comments table if it doesn't exist
  private async createCommentsTable(): Promise<void> {
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS complaint_comments (
          id SERIAL PRIMARY KEY,
          complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL,
          user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('admin', 'customer')),
          message TEXT NOT NULL,
          parent_comment_id INTEGER REFERENCES complaint_comments(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      
      // Clean up any test data - ensure fresh start
      await db.execute(sql`DELETE FROM complaint_comments WHERE message LIKE '%test%' OR message LIKE '%Test%'`);
      
      console.log('✅ Comments table initialized (clean slate)');
    } catch (error) {
      console.log('📝 Comments table already exists or error:', (error as Error).message);
    }
  }

  private async initializeBasicData() {
    try {
      const bcrypt = await import('bcryptjs');

      // Check if any admin user exists
      const users = await this.getUsers();
      const existingAdmin = users.find(u => u.role === 'admin');
      if (!existingAdmin) {
        // Create master admin user with hardcoded credentials
        await this.createUser({
          username: "jasmine.hazarika",
          password: await bcrypt.hash("ccms@123", 10),
          email: "jasmine.hazarika@bngroupindia.com",
          firstName: "Jasmine",
          lastName: "Hazarika",
          role: "admin"
        });

        // Create ASM users with proper domain emails
        await this.createUser({
          username: "john.doe",
          password: await bcrypt.hash("password123", 10),
          email: "john.doe@bngroupindia.com",
          firstName: "John",
          lastName: "Doe",
          phone: "9876543210",
          role: "asm"
        });

        await this.createUser({
          username: "jane.smith",
          password: await bcrypt.hash("password123", 10), 
          email: "jane.smith@bngroupindia.com",
          firstName: "Jane",
          lastName: "Smith",
          phone: "9876543211",
          role: "asm"
        });

        // Create simple default ASM credentials for easy testing
        await this.createUser({
          username: "asm",
          password: await bcrypt.hash("123", 10),
          email: "asm@bngroupindia.com",
          firstName: "ASM",
          lastName: "User",
          phone: "9876543212",
          role: "asm"
        });

        await this.createUser({
          username: "demo",
          password: await bcrypt.hash("demo", 10),
          email: "demo@bngroupindia.com",
          firstName: "Demo",
          lastName: "User",
          phone: "9876543213",
          role: "asm"
        });

        console.log('✅ Initial users created');
      }

      // Create security_keys table if it doesn't exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS security_keys (
          id SERIAL PRIMARY KEY,
          key_name VARCHAR(50) NOT NULL UNIQUE,
          key_value VARCHAR(255) NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      // Initialize or update security keys for password changes
      const existingKeys = await this.getSecurityKeys();
      const newSecurityKeyValues = [
        { keyName: "SECURITY_KEY_1", keyValue: "K7R9W3M" },
        { keyName: "SECURITY_KEY_2", keyValue: "L8N5F2Q" },
        { keyName: "SECURITY_KEY_3", keyValue: "X4H6J9P" },
        { keyName: "SECURITY_KEY_4", keyValue: "V3B7G1S" },
        { keyName: "SECURITY_KEY_5", keyValue: "D2Y8C5T" }
      ];

      if (existingKeys.length === 0) {
        // Insert new keys
        for (const key of newSecurityKeyValues) {
          await db.insert(securityKeys).values({
            keyName: key.keyName,
            keyValue: key.keyValue,
            isActive: true
          });
        }
        console.log('🔐 Security keys initialized for password changes');
      } else {
        // Update existing keys to new values
        for (const key of newSecurityKeyValues) {
          await db.update(securityKeys)
            .set({ keyValue: key.keyValue })
            .where(eq(securityKeys.keyName, key.keyName));
        }
        console.log('🔐 Security keys updated to new values');
      }
      console.log('🔑 Security Keys: K7R9W3M, L8N5F2Q, X4H6J9P, V3B7G1S, D2Y8C5T');

      // Load existing complaints to check if we need to initialize sample data
      const existingComplaints = await this.getComplaints();
      console.log(`📊 Found ${existingComplaints.length} existing complaints in database`);
      
      // No longer loading automatic 2024 sample data - only authentic Excel data should be loaded
      const existing2024Complaints = existingComplaints.filter(c => 
        c.date && c.date.toString().startsWith('2024')
      );
      
      if (existing2024Complaints.length > 0) {
        console.log(`✅ Found ${existing2024Complaints.length} existing 2024 complaints`);
      } else {
        console.log('📋 2024 complaints will be loaded from authentic Excel data only');
      }

    } catch (error) {
      console.error('Error initializing data:', error);
    }
  }

  private async loadSampleComplaints() {
    console.log('📦 Loading sample complaints...');
    
    // Sample 2024 complaints data - multiple complaints for better testing
    const sample2024Complaints = [];
    
    // Generate 114 sample complaints for 2024
    const sources = ["Customer", "Depot", "Management"];
    const locations = ["Mathura", "Agra", "Bhimasur"];
    const companies = ["Gupta Traders", "Sharma Distributors", "Agarwal Enterprises", "Singh & Co", "Verma Industries"];
    const products = ["Nutrica", "Healthy Value", "Simply Fresh Sunflower", "Simply Fresh Soya", "Simply Gold Palm"];
    const concerns = ["Product Issue", "Packaging Issue", "Variation in Rate", "Stock Theft", "MRP Related Issues"];
    
    for (let i = 1; i <= 114; i++) {
      const month = Math.floor(Math.random() * 12) + 1;
      const day = Math.floor(Math.random() * 28) + 1;
      
      sample2024Complaints.push({
        complaintSource: sources[Math.floor(Math.random() * sources.length)],
        placeOfSupply: locations[Math.floor(Math.random() * locations.length)],
        complaintReceivingLocation: `${locations[Math.floor(Math.random() * locations.length)]} Office`,
        date: `2024-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        depoPartyName: companies[Math.floor(Math.random() * companies.length)],
        email: `contact${i}@company.com`,
        contactNumber: `987654${(3210 + i).toString().slice(-4)}`,
        invoiceNo: `INV-2024-${i.toString().padStart(3, '0')}`,
        invoiceDate: `2024-${month.toString().padStart(2, '0')}-${(day - 5).toString().padStart(2, '0')}`,
        lrNumber: `LR-${i.toString().padStart(3, '0')}-2024`,
        transporterName: "Express Logistics",
        transporterNumber: `987654${(3220 + i).toString().slice(-4)}`,
        complaintType: Math.random() > 0.7 ? "Query" : "Complaint",
        voc: `Sample complaint description for item ${i} - detailed voice of customer feedback`,
        salePersonName: `Sales Person ${i}`,
        productName: products[Math.floor(Math.random() * products.length)],
        areaOfConcern: concerns[Math.floor(Math.random() * concerns.length)],
        subCategory: "Stock Short",
        actionTaken: `Resolution action taken for complaint ${i}`,
        status: "closed",
        priority: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
        finalStatus: "Closed"
      });
    }

    // Insert sample complaints without notifications (they are historical data)
    for (const complaintData of sample2024Complaints) {
      await this.createComplaint(complaintData);
    }

    console.log(`✅ Loaded ${sample2024Complaints.length} sample complaints from 2024`);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.id);
  }

  async getUserById(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Complaint methods - optimized for speed
  async getComplaints(): Promise<Complaint[]> {
    return await db.select().from(complaints)
      .orderBy(desc(complaints.yearlySequenceNumber), desc(complaints.createdAt))
      .limit(500); // Limit to recent 500 complaints for faster loading
  }

  // Get complaints with user information (who created each complaint)
  async getComplaintsWithUserInfo(): Promise<(Complaint & { createdByUser?: Pick<User, 'firstName' | 'lastName' | 'email' | 'username'> })[]> {
    const complaintsData = await db.select({
      complaint: complaints,
      user: users
    })
    .from(complaints)
    .leftJoin(users, eq(complaints.userId, users.id))
    .orderBy(desc(complaints.yearlySequenceNumber), desc(complaints.createdAt))
    .limit(500);

    return complaintsData.map(row => ({
      ...row.complaint,
      createdByUser: row.user ? {
        firstName: row.user.firstName,
        lastName: row.user.lastName,
        email: row.user.email,
        username: row.user.username
      } : undefined
    }));
  }

  async getComplaint(id: number): Promise<Complaint | undefined> {
    const result = await db.select().from(complaints).where(eq(complaints.id, id)).limit(1);
    return result[0];
  }

  async getComplaintsByStatus(status: ComplaintStatus): Promise<Complaint[]> {
    return await db.select().from(complaints).where(eq(complaints.status, status)).orderBy(desc(complaints.createdAt), desc(complaints.yearlySequenceNumber));
  }

  async createComplaint(complaint: InsertComplaint, createdBy?: 'admin' | 'asm'): Promise<Complaint> {
    // Simple approach: 34 complaints exist for 2025, start new ones from #35
    // Only look at recent 2025 complaints (sequence >= 35) to find the next number
    
    const recent2025Complaints = await db.select({ 
      yearlySequenceNumber: complaints.yearlySequenceNumber,
      createdAt: complaints.createdAt
    })
    .from(complaints)
    .where(sql`${complaints.yearlySequenceNumber} IS NOT NULL 
               AND ${complaints.yearlySequenceNumber} >= 35 
               AND ${complaints.createdAt} >= '2025-01-01'`);
    
    // Start from 35, or increment from the highest found
    let yearlySequenceNumber = 35; // Start from 35 since 34 already exist
    
    if (recent2025Complaints.length > 0) {
      const sequenceNumbers = recent2025Complaints
        .map(c => c.yearlySequenceNumber || 0)
        .filter(num => num >= 35);
      
      if (sequenceNumbers.length > 0) {
        const maxSeq = Math.max(...sequenceNumbers);
        yearlySequenceNumber = maxSeq + 1;
      }
    }
    
    console.log(`📈 Creating 2025 complaint with sequence number: ${yearlySequenceNumber} (found ${recent2025Complaints.length} recent 2025 complaints >= 35)`);

    // Insert with yearly sequence number
    const complaintWithSequence = {
      ...complaint,
      yearlySequenceNumber
    };

    const result = await db.insert(complaints).values(complaintWithSequence).returning();
    const newComplaint = result[0];

    // Broadcast complaint creation to all connected users for real-time updates
    if (typeof global !== 'undefined' && (global as any).broadcastComplaintUpdate) {
      (global as any).broadcastComplaintUpdate('created', newComplaint);
    }

    // Create notification for admin users only when ASM creates a complaint
    if (createdBy === 'asm') {
      // Get all admin users
      const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));
      
      // Create notification for each admin user
      for (const adminUser of adminUsers) {
        const notification = await this.createNotification({
          userId: adminUser.id,
          complaintId: newComplaint.id,
          title: 'New Complaint Received',
          message: `New complaint #${newComplaint.yearlySequenceNumber} has been submitted by ASM - ${newComplaint.complaintType}: ${newComplaint.voc || newComplaint.productName || 'New complaint'}`,
          type: 'new_complaint'
        });

        // Broadcast to admin user if connected via WebSocket
        if (typeof global !== 'undefined' && (global as any).broadcastToUser) {
          (global as any).broadcastToUser(adminUser.id, notification);
        }
      }
    }

    return newComplaint;
  }

  async updateComplaint(id: number, updates: UpdateComplaint, updatedBy?: 'admin' | 'asm', updatingUserId?: number): Promise<Complaint | undefined> {
    // Get the current complaint to check for status changes
    const currentComplaint = await this.getComplaint(id);
    
    const result = await db.update(complaints).set(updates).where(eq(complaints.id, id)).returning();
    const updatedComplaint = result[0];
    
    // Broadcast complaint update to all connected users for real-time updates
    if (typeof global !== 'undefined' && (global as any).broadcastComplaintUpdate) {
      (global as any).broadcastComplaintUpdate('updated', updatedComplaint);
    }
    
    // Only send notifications to ASM users when ADMIN updates their complaints
    // Don't send notifications if ASM is updating their own complaint
    const shouldNotify = updatedBy === 'admin' && 
                        updatedComplaint && 
                        updatedComplaint.userId && 
                        updatedComplaint.userId !== updatingUserId; // Ensure it's not admin updating admin's complaint
    
    // Create notification if status has changed and admin is updating ASM complaint
    if (currentComplaint && updates.status && currentComplaint.status !== updates.status && shouldNotify) {
      const notification = await this.createNotification({
        userId: updatedComplaint.userId!,
        complaintId: updatedComplaint.id,
        title: 'Complaint Status Updated by Admin',
        message: `Your complaint #${updatedComplaint.yearlySequenceNumber || updatedComplaint.id} status changed from ${currentComplaint.status} to ${updates.status}`,
        type: 'status_update'
      });

      // Broadcast to ASM user if connected via WebSocket (for real-time notifications with sound)
      if (typeof global !== 'undefined' && (global as any).broadcastToUser) {
        (global as any).broadcastToUser(updatedComplaint.userId, notification);
        console.log(`📢 Admin status change notification sent to ASM user ${updatedComplaint.userId}`);
      }
    }
    
    // Also create notification for any other field updates (priority, etc.) when admin updates ASM complaint
    if (currentComplaint && shouldNotify && 
        (updates.priority && currentComplaint.priority !== updates.priority)) {
      const notification = await this.createNotification({
        userId: updatedComplaint.userId!,
        complaintId: updatedComplaint.id,
        title: 'Complaint Priority Updated by Admin',
        message: `Your complaint #${updatedComplaint.yearlySequenceNumber || updatedComplaint.id} priority changed from ${currentComplaint.priority} to ${updates.priority}`,
        type: 'priority_update'
      });

      // Broadcast priority change to ASM user
      if (typeof global !== 'undefined' && (global as any).broadcastToUser) {
        (global as any).broadcastToUser(updatedComplaint.userId, notification);
        console.log(`📢 Admin priority change notification sent to ASM user ${updatedComplaint.userId}`);
      }
    }
    
    return updatedComplaint;
  }

  async deleteComplaint(id: number): Promise<boolean> {
    const result = await db.delete(complaints).where(eq(complaints.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async searchComplaints(query: string): Promise<Complaint[]> {
    return await db.select().from(complaints)
      .where(
        or(
          like(complaints.depoPartyName, `%${query}%`),
          like(complaints.complaintType, `%${query}%`),
          like(complaints.voc, `%${query}%`),
          like(complaints.status, `%${query}%`)
        )
      )
      .orderBy(desc(complaints.yearlySequenceNumber), desc(complaints.createdAt));
  }

  async getComplaintsByPriority(priority: string): Promise<Complaint[]> {
    return await db.select().from(complaints).where(eq(complaints.priority, priority)).orderBy(desc(complaints.createdAt), desc(complaints.yearlySequenceNumber));
  }

  // Complaint history methods
  async getComplaintHistory(complaintId: number): Promise<ComplaintHistory[]> {
    return await db.select().from(complaintHistory).where(eq(complaintHistory.complaintId, complaintId)).orderBy(desc(complaintHistory.changedAt));
  }

  async addComplaintHistory(history: InsertComplaintHistory): Promise<ComplaintHistory> {
    const result = await db.insert(complaintHistory).values(history).returning();
    return result[0];
  }

  // Analytics methods
  async getComplaintStats(): Promise<{
    total: number;
    new: number;
    inProgress: number;
    resolved: number;
    closed: number;
    resolvedToday: number;
    open: number;
  }> {
    // Use single SQL query with aggregation for maximum speed (like chat system)
    const result = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_count,
        COUNT(CASE WHEN status = 'new' THEN 1 END) as new_count,
        COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed,
        COUNT(CASE WHEN status = 'resolved' AND DATE(updated_at) = CURRENT_DATE THEN 1 END) as resolved_today
      FROM complaints
    `);
    
    const stats = result.rows[0] as any;
    
    return {
      total: parseInt(stats.total) || 0,
      new: parseInt(stats.new_count) || 0,
      open: parseInt(stats.open_count) || 0,
      inProgress: parseInt(stats.in_progress) || 0,
      resolved: parseInt(stats.resolved) || 0,
      closed: parseInt(stats.closed) || 0,
      resolvedToday: parseInt(stats.resolved_today) || 0,
    };
  }

  async getComplaintTrends(days: number): Promise<Array<{
    date: string;
    new: number;
    resolved: number;
  }>> {
    const trends: Array<{ date: string; new: number; resolved: number; }> = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      trends.push({
        date: dateStr,
        new: Math.floor(Math.random() * 5) + 1,
        resolved: Math.floor(Math.random() * 8) + 2
      });
    }
    
    return trends;
  }

  // Notification methods
  async getNotifications(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotifications(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const result = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const result = await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
    return (result.rowCount ?? 0) > 0;
  }

  // Security Key methods
  async getSecurityKeys(): Promise<SecurityKey[]> {
    return await db.select().from(securityKeys).where(eq(securityKeys.isActive, true));
  }

  async validateSecurityKey(keyValue: string): Promise<boolean> {
    const result = await db.select().from(securityKeys)
      .where(and(
        eq(securityKeys.keyValue, keyValue),
        eq(securityKeys.isActive, true)
      ))
      .limit(1);
    return result.length > 0;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting user by email:", error);
      return undefined;
    }
  }

  async updateUserPassword(email: string, hashedPassword: string): Promise<boolean> {
    try {
      const result = await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.email, email));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error updating user password:", error);
      return false;
    }
  }

  async clearDemoComplaints(): Promise<void> {
    // Clear all 2024 complaints to make room for real Excel data
    await db.delete(complaints)
      .where(sql`EXTRACT(year from ${complaints.date}::date) = 2024`);
    console.log('🗑️  Cleared all 2024 complaints for Excel import');
  }

  async importActualExcelData(): Promise<{ imported: number; message: string }> {
    try {
      const XLSX = require('xlsx');
      
      console.log('🔄 Starting import of actual complaints from Excel...');

      // Clear demo 2024 complaints first
      await this.clearDemoComplaints();

      // Read Excel file - this contains 2025 complaints
      const workbook = XLSX.readFile('attached_assets/All complaints_1751602977654.xlsx');
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const excelData = XLSX.utils.sheet_to_json(worksheet);
      console.log(`📊 Found ${excelData.length} complaints in Excel file`);

      let importedCount = 0;

      for (const row of excelData) {
        try {
          // Parse the date from Excel serial number
          let complaintDate;
          const dateField = (row as any)['Month']; // Excel serial number
          
          if (typeof dateField === 'number') {
            // Handle Excel date serial numbers
            const excelEpoch = new Date(1900, 0, 1);
            complaintDate = new Date(excelEpoch.getTime() + (dateField - 2) * 24 * 60 * 60 * 1000);
          }

          if (!complaintDate || isNaN(complaintDate.getTime())) {
            continue;
          }

          // Map Excel data to database fields
          const complaintData = {
            complaintSource: (row as any)['Complaint Source'] || 'Customer',
            placeOfSupply: (row as any)['Place of Supply'] || 'Unknown',
            complaintReceivingLocation: ((row as any)['Complaint Receiving location \r\n'] || '').toString().trim() || 'Office',
            date: complaintDate.toISOString().split('T')[0],
            depoPartyName: 'Complaint ' + (row as any)['S.no.'], // Using S.no. as identifier
            email: '',
            contactNumber: '',
            invoiceNo: '',
            invoiceDate: complaintDate.toISOString().split('T')[0],
            lrNumber: '',
            transporterName: '',
            transporterNumber: '',
            complaintType: ((row as any)['Complaint\r\nType'] || '').toString().trim() || 'Complaint',
            voc: (row as any)['Voc'] || 'No description provided',
            salePersonName: ((row as any)['Sale Person Name '] || '').toString().trim(),
            productName: ((row as any)['Product Name '] || '').toString().trim() || 'Unknown Product',
            areaOfConcern: ((row as any)['Area of Concern'] || '').toString().trim() || 'General',
            subCategory: ((row as any)['Sub Category'] || '').toString().trim(),
            actionTaken: ((row as any)['Action Taken'] || '').toString().trim(),
            status: (() => {
              const finalStatus = ((row as any)['Final Status '] || '').toString().toLowerCase().trim();
              if (finalStatus.includes('closed') || finalStatus.includes('close')) return 'closed';
              if (finalStatus.includes('resolved') || finalStatus.includes('resolve')) return 'resolved';
              return 'open';
            })(),
            priority: 'medium',
            finalStatus: ((row as any)['Final Status '] || '').toString().trim() || 'Open'
          };

          // Create complaint through existing method
          await this.createComplaint(complaintData);
          importedCount++;
          console.log(`✅ Imported complaint ${(row as any)['S.no.']} - ${complaintDate.toISOString().split('T')[0]}`);

        } catch (error) {
          console.error(`Error processing row ${(row as any)['S.no.']}:`, (error as Error).message);
        }
      }

      const message = `Successfully imported ${importedCount} actual complaints from Excel file`;
      console.log(`✅ ${message}`);
      return { imported: importedCount, message };

    } catch (error) {
      console.error('❌ Error importing Excel data:', error);
      throw error;
    }
  }

  // Comment methods
  async getComplaintComments(complaintId: number): Promise<ComplaintComment[]> {
    return await db.select().from(complaintComments)
      .where(eq(complaintComments.complaintId, complaintId))
      .orderBy(complaintComments.createdAt);
  }

  async createComplaintComment(comment: InsertComplaintComment): Promise<ComplaintComment> {
    const result = await db.insert(complaintComments).values(comment).returning();
    return result[0];
  }

  async deleteComplaintComment(id: number): Promise<boolean> {
    const result = await db.delete(complaintComments).where(eq(complaintComments.id, id));
    return true;
  }
}

// Create storage instance
export const storage = new PostgresStorage();