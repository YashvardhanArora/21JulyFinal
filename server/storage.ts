import { 
  users, 
  complaints, 
  complaintHistory,
  notifications,
  securityKeys,
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
  type ComplaintStatus 
} from "@shared/schema";
import { eq, desc, like, or, sql, and } from 'drizzle-orm';
import { db } from './db';

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
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
  createComplaint(complaint: InsertComplaint): Promise<Complaint>;
  updateComplaint(id: number, updates: UpdateComplaint): Promise<Complaint | undefined>;
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
}

export class PostgresStorage implements IStorage {
  constructor() {
    console.log('📝 PostgreSQL storage initialized');
    this.initializeBasicData();
  }

  private async initializeBasicData() {
    try {
      const bcrypt = await import('bcryptjs');

      // Check if master admin user exists
      const existingAdmin = await this.getUserByUsername('temp');
      if (!existingAdmin) {
        // Create master admin user with hardcoded credentials
        await this.createUser({
          username: "temp",
          password: await bcrypt.hash("temp", 10),
          email: "temp@bngroupindia.com",
          firstName: "Master",
          lastName: "Admin",
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
        { keyName: "SECURITY_KEY_1", keyValue: "K9X4M2P" },
        { keyName: "SECURITY_KEY_2", keyValue: "H7Q3N8W" },
        { keyName: "SECURITY_KEY_3", keyValue: "R6L5A9T" },
        { keyName: "SECURITY_KEY_4", keyValue: "D2F8C7Y" },
        { keyName: "SECURITY_KEY_5", keyValue: "V3J9E4B" }
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
      console.log('🔑 Security Keys: K9X4M2P, H7Q3N8W, R6L5A9T, D2F8C7Y, V3J9E4B');

      // Load existing complaints to check if we need to initialize sample data
      const existingComplaints = await this.getComplaints();
      // Removed automatic sample data loading to keep database clean
      console.log(`📊 Found ${existingComplaints.length} existing complaints in database`);
      if (existingComplaints.length === 0) {
        console.log('📋 Database is clean and ready for real complaint data');
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

    // Insert sample complaints
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

  // Complaint methods
  async getComplaints(): Promise<Complaint[]> {
    return await db.select().from(complaints).orderBy(desc(complaints.createdAt));
  }

  async getComplaint(id: number): Promise<Complaint | undefined> {
    const result = await db.select().from(complaints).where(eq(complaints.id, id)).limit(1);
    return result[0];
  }

  async getComplaintsByStatus(status: ComplaintStatus): Promise<Complaint[]> {
    return await db.select().from(complaints).where(eq(complaints.status, status)).orderBy(desc(complaints.createdAt));
  }

  async createComplaint(complaint: InsertComplaint): Promise<Complaint> {
    // Calculate the year-based sequence number
    const complaintYear = new Date(complaint.date || new Date()).getFullYear();
    const existingComplaintsInYear = await db.select()
      .from(complaints)
      .where(sql`EXTRACT(year from ${complaints.date}::date) = ${complaintYear}`);
    
    const yearlySequenceNumber = existingComplaintsInYear.length + 1;

    // Insert with yearly sequence number
    const complaintWithSequence = {
      ...complaint,
      yearlySequenceNumber
    };

    const result = await db.insert(complaints).values(complaintWithSequence).returning();
    const newComplaint = result[0];

    // Note: Notifications only created on status changes, not on complaint creation

    return newComplaint;
  }

  async updateComplaint(id: number, updates: UpdateComplaint): Promise<Complaint | undefined> {
    // Get the current complaint to check for status changes
    const currentComplaint = await this.getComplaint(id);
    
    const result = await db.update(complaints).set(updates).where(eq(complaints.id, id)).returning();
    const updatedComplaint = result[0];
    
    // Only create notification if status has changed
    if (currentComplaint && updates.status && currentComplaint.status !== updates.status && updatedComplaint && updatedComplaint.userId) {
      await this.createNotification({
        userId: updatedComplaint.userId,
        complaintId: updatedComplaint.id,
        title: 'Complaint Status Updated',
        message: `Complaint #${updatedComplaint.yearlySequenceNumber} status changed from ${currentComplaint.status} to ${updates.status}`,
        type: 'status_update'
      });
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
      .orderBy(desc(complaints.createdAt));
  }

  async getComplaintsByPriority(priority: string): Promise<Complaint[]> {
    return await db.select().from(complaints).where(eq(complaints.priority, priority)).orderBy(desc(complaints.createdAt));
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
  }> {
    const allComplaints = await this.getComplaints();
    
    const stats = {
      total: allComplaints.length,
      new: allComplaints.filter(c => c.status === 'new').length,
      inProgress: allComplaints.filter(c => c.status === 'in-progress').length,
      resolved: allComplaints.filter(c => c.status === 'resolved').length,
      closed: allComplaints.filter(c => c.status === 'closed').length,
      resolvedToday: 0
    };

    // Calculate resolved today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    stats.resolvedToday = allComplaints.filter(c => 
      c.status === 'resolved' && 
      c.dateOfResolution && 
      new Date(c.dateOfResolution) >= today
    ).length;

    return stats;
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
}

// Create storage instance
export const storage = new PostgresStorage();