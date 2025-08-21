-- PostgreSQL Schema for Complaint Management System
-- Run this SQL in your PostgreSQL database

-- Create Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  profile_picture VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create Complaints table
CREATE TABLE complaints (
  id SERIAL PRIMARY KEY,
  yearly_sequence_number INTEGER,
  complaint_source VARCHAR(255) NOT NULL,
  place_of_supply VARCHAR(255) NOT NULL,
  complaint_receiving_location VARCHAR(255) NOT NULL,
  date VARCHAR(50),
  depo_party_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  contact_number VARCHAR(50),
  invoice_no VARCHAR(100),
  invoice_date VARCHAR(50),
  lr_number VARCHAR(100),
  transporter_name VARCHAR(255),
  transporter_number VARCHAR(50),
  complaint_type VARCHAR(100) NOT NULL,
  voc TEXT,
  sale_person_name VARCHAR(255),
  product_name VARCHAR(255),
  area_of_concern VARCHAR(255),
  sub_category VARCHAR(255),
  action_taken TEXT,
  credit_date VARCHAR(50),
  credit_note_number VARCHAR(100),
  user_id INTEGER,
  attachment VARCHAR(255),
  credit_amount VARCHAR(50),
  person_responsible VARCHAR(255),
  root_cause_action_plan TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'new',
  priority VARCHAR(50) NOT NULL DEFAULT 'medium',
  complaint_creation TIMESTAMP DEFAULT NOW(),
  date_of_resolution TIMESTAMP,
  date_of_closure TIMESTAMP,
  final_status VARCHAR(50) DEFAULT 'Open',
  days_to_resolve INTEGER,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create Complaint History table
CREATE TABLE complaint_history (
  id SERIAL PRIMARY KEY,
  complaint_id INTEGER NOT NULL,
  from_status VARCHAR(50),
  to_status VARCHAR(50) NOT NULL,
  assigned_to VARCHAR(255),
  notes TEXT,
  changed_by VARCHAR(255) NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create Notifications table
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  complaint_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'status_update',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_priority ON complaints(priority);
CREATE INDEX idx_complaints_date ON complaints(date);
CREATE INDEX idx_complaints_yearly_seq ON complaints(yearly_sequence_number);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);

-- Add foreign key constraints (optional)
-- ALTER TABLE complaint_history ADD CONSTRAINT fk_complaint_history_complaint 
--   FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE;
-- ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user 
--   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE notifications ADD CONSTRAINT fk_notifications_complaint 
--   FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE;