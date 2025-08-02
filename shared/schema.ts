import { pgTable, text, integer, boolean, timestamp, varchar, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  role: varchar("role", { length: 20 }).notNull().default("admin"), // "admin" or "customer"
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  yearlySequenceNumber: integer("yearly_sequence_number"), // Year-based sequence starting from 1 each year
  // Basic Information
  complaintSource: varchar("complaint_source", { length: 255 }).notNull(),
  placeOfSupply: varchar("place_of_supply", { length: 255 }).notNull(),
  complaintReceivingLocation: varchar("complaint_receiving_location", { length: 255 }).notNull(),
  date: varchar("date", { length: 50 }),
  
  // Party/Customer Details
  depoPartyName: varchar("depo_party_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  contactNumber: varchar("contact_number", { length: 50 }),
  
  // Invoice & Transport Details
  invoiceNo: varchar("invoice_no", { length: 100 }),
  invoiceDate: varchar("invoice_date", { length: 50 }),
  lrNumber: varchar("lr_number", { length: 100 }),
  transporterName: varchar("transporter_name", { length: 255 }),
  transporterNumber: varchar("transporter_number", { length: 50 }),
  
  // Complaint Details
  complaintType: varchar("complaint_type", { length: 100 }).notNull(),
  voc: text("voc"), // Voice of Customer - keeping as text for longer content
  salePersonName: varchar("sale_person_name", { length: 255 }),
  productName: varchar("product_name", { length: 255 }),
  
  // Classification
  areaOfConcern: varchar("area_of_concern", { length: 255 }),
  subCategory: varchar("sub_category", { length: 255 }),
  
  // Resolution Details
  actionTaken: text("action_taken"), // keeping as text for longer content
  creditDate: varchar("credit_date", { length: 50 }),
  creditNoteNumber: varchar("credit_note_number", { length: 100 }),
  
  // User tracking
  userId: integer("user_id"), // ID of the customer who submitted the complaint
  attachment: varchar("attachment", { length: 255 }), // File attachment path
  creditAmount: varchar("credit_amount", { length: 50 }),
  personResponsible: varchar("person_responsible", { length: 255 }),
  rootCauseActionPlan: text("root_cause_action_plan"), // keeping as text for longer content
  
  // Status & Dates
  status: varchar("status", { length: 50 }).notNull().default("open"),
  priority: varchar("priority", { length: 50 }).notNull().default("medium"),
  complaintCreation: timestamp("complaint_creation").defaultNow(),
  dateOfResolution: timestamp("date_of_resolution"),
  dateOfClosure: timestamp("date_of_closure"),
  finalStatus: varchar("final_status", { length: 50 }).default("Open"),
  daysToResolve: integer("days_to_resolve"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const complaintHistory = pgTable("complaint_history", {
  id: serial("id").primaryKey(),
  complaintId: integer("complaint_id").notNull(),
  fromStatus: varchar("from_status", { length: 50 }),
  toStatus: varchar("to_status", { length: 50 }).notNull(),
  assignedTo: varchar("assigned_to", { length: 255 }),
  notes: text("notes"),
  changedBy: varchar("changed_by", { length: 255 }).notNull(),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  complaintId: integer("complaint_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull().default("status_update"), // status_update, new_comment, etc.
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const securityKeys = pgTable("security_keys", {
  id: serial("id").primaryKey(),
  keyName: varchar("key_name", { length: 50 }).notNull().unique(),
  keyValue: varchar("key_value", { length: 255 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const complaintComments = pgTable("complaint_comments", {
  id: serial("id").primaryKey(),
  complaintId: integer("complaint_id").notNull(),
  userId: integer("user_id").notNull(),
  userRole: varchar("user_role", { length: 20 }).notNull(), // 'admin' or 'customer' (ASM)
  message: text("message").notNull(),
  parentCommentId: integer("parent_comment_id"), // For replies
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertComplaintSchema = createInsertSchema(complaints).omit({
  id: true,
  yearlySequenceNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const updateComplaintSchema = createInsertSchema(complaints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertComplaintHistorySchema = createInsertSchema(complaintHistory).omit({
  id: true,
  changedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertSecurityKeySchema = createInsertSchema(securityKeys).omit({
  id: true,
  createdAt: true,
});

export const insertComplaintCommentSchema = createInsertSchema(complaintComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  profilePicture: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type UpdateComplaint = z.infer<typeof updateComplaintSchema>;
export type ComplaintHistory = typeof complaintHistory.$inferSelect;
export type InsertComplaintHistory = z.infer<typeof insertComplaintHistorySchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type SecurityKey = typeof securityKeys.$inferSelect;
export type InsertSecurityKey = z.infer<typeof insertSecurityKeySchema>;
export type ComplaintComment = typeof complaintComments.$inferSelect;
export type InsertComplaintComment = z.infer<typeof insertComplaintCommentSchema>;

export const COMPLAINT_STATUSES = ["open", "resolved", "closed"] as const;
export const COMPLAINT_PRIORITIES = ["low", "medium", "high"] as const;
export const COMPLAINT_SOURCES = ["Depot", "Management", "Customer"] as const;
export const COMPLAINT_TYPES = ["Complaint", "Query"] as const;
export const COMPLAINT_CATEGORIES = ["Product", "Service", "Billing"] as const;
export const PLACE_OF_SUPPLY_OPTIONS = ["Mathura", "Bhimasar", "Agra"] as const;
export const PRODUCT_NAMES = ["Nutrica", "Healthy Value", "Simply Fresh Sunflower", "Simply Fresh Soya", "Simply Gold Palm"] as const;
export const AREA_OF_CONCERNS = ["Packaging Issue", "Variation in Rate", "Product Issue", "Variation in Weight", "Stock Theft", "Variation in Rates", "MRP Related Issues", "Extraneous Factors", "Sticker Adhesive Issues"] as const;
export const SUB_CATEGORIES = ["Leakages", "Stock Short", "Bargain Rate Related Issue", "Foaming Issue", "Perception", "Mismatch Stock", "Leakages/Short Stock", "Wrong Stock Received", "Wrong/Without MRP Print", "Wet Carton", "Stock Excess"] as const;

// Area of Concern to Sub Category mapping
export const AREA_OF_CONCERN_SUB_CATEGORIES: Record<string, string[]> = {
  "Packaging Issue": ["Leakages", "Leakages/Short Stock", "Wet Carton"],
  "Variation in Rate": ["Bargain Rate Related Issue"],
  "Product Issue": ["Foaming Issue", "Perception"],
  "Variation in Weight": ["Stock Short", "Wrong Stock Received"],
  "Stock Theft": ["Mismatch Stock", "Stock Excess"],
  "Variation in Rates": ["Bargain Rate Related Issue"],
  "MRP Related Issues": ["Wrong/Without MRP Print"],
  "Extraneous Factors": ["Perception"],
  "Sticker Adhesive Issues": ["Wet Carton"]
};

export type ComplaintStatus = typeof COMPLAINT_STATUSES[number];
export type ComplaintPriority = typeof COMPLAINT_PRIORITIES[number];
export type ComplaintSource = typeof COMPLAINT_SOURCES[number];
export type ComplaintType = typeof COMPLAINT_TYPES[number];
export type ComplaintCategory = typeof COMPLAINT_CATEGORIES[number];
export type PlaceOfSupplyOption = typeof PLACE_OF_SUPPLY_OPTIONS[number];
export type ProductName = typeof PRODUCT_NAMES[number];
export type AreaOfConcern = typeof AREA_OF_CONCERNS[number];
export type SubCategory = typeof SUB_CATEGORIES[number];
