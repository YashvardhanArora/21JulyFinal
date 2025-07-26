# Complaint Management System - Complete Playbook

## Table of Contents
1. [System Overview](#system-overview)
2. [User Roles & Access](#user-roles--access)
3. [Login Instructions](#login-instructions)
4. [Dashboard Navigation](#dashboard-navigation)
5. [Complaint Management Workflow](#complaint-management-workflow)
6. [Analytics & Reporting](#analytics--reporting)
7. [Settings & Configuration](#settings--configuration)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Database Information](#database-information)
10. [Deployment & Maintenance](#deployment--maintenance)

---

## System Overview

The BN Support Desk is a comprehensive complaint management dashboard built for BN Group India. It provides a centralized platform for tracking, managing, and analyzing customer complaints with real-time updates and detailed analytics.

### Key Features
- **Master Admin Access**: Single hardcoded admin account for secure access
- **Complaint Tracking**: Complete lifecycle management from new to closed
- **Visual Analytics**: Interactive dashboards with charts and maps
- **Regional Mapping**: Geographic distribution of complaints across India
- **Data Export**: Excel export functionality for reports
- **Profile Management**: Persistent user profile updates
- **Email Integration**: Daily automated reports and notifications

### Technology Stack
- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Node.js with Express and TypeScript
- **Database**: PostgreSQL (hosted on Neon)
- **Authentication**: Session-based with bcrypt password hashing
- **Charts**: Recharts for data visualization
- **Maps**: Leaflet for interactive India map

---

## User Roles & Access

### Master Administrator
- **Username**: `temp`
- **Password**: `temp`
- **Access Level**: Full system access
- **Capabilities**:
  - View all complaints and analytics
  - Update profile information
  - Export data to Excel
  - Configure email settings
  - Access all dashboard sections

### Security Notes
- Only one admin account exists in the system
- Profile updates persist across login sessions
- No user registration - system is single-admin only
- Database connection secured with environment variables

---

## Login Instructions

### Accessing the System
1. **Navigate to Application**: Open the BN Support Desk URL
2. **Login Page**: You'll see the BN Group branded login interface
3. **Enter Credentials**:
   - Username: `temp`
   - Password: `temp`
4. **Access Dashboard**: Successfully logged-in users are redirected to the main dashboard

### Login Page Features
- Modern blue gradient design with BN Group branding
- "Building Nation" tagline display
- Responsive design for mobile and desktop
- Password visibility toggle
- Smooth transition animations

---

## Dashboard Navigation

### Sidebar Menu
The application features a collapsible sidebar with the following sections:

#### Main Navigation
1. **Dashboard** 📊
   - Complaint status overview
   - Regional distribution map
   - Area of concern analysis
   - Real-time statistics

2. **All Complaints** 📋
   - Complete complaint listing
   - Search and filter capabilities
   - Status management
   - Priority editing
   - Export to Excel functionality

3. **Analytics** 📈
   - Priority distribution charts
   - TAT (Turn Around Time) analysis
   - Product-based visualizations
   - India map with regional markers
   - Email report functionality

4. **Settings** ⚙️
   - Profile management
   - Password updates
   - Email configuration
   - Notification preferences

### User Profile Section
- Displays current user name and email
- Profile picture placeholder
- Logout functionality
- Real-time updates when profile is modified

---

## Complaint Management Workflow

### Complaint Lifecycle
```
New → In Progress → Under Review → Resolved → Closed
```

### Data Fields
Each complaint contains:
- **Basic Information**: ID, date, status, priority
- **Customer Details**: Name, email, contact number
- **Product Information**: Product name, category, batch details
- **Location Data**: Place of supply, region
- **Complaint Details**: Type, area of concern, voice of customer
- **Resolution Data**: TAT, resolution notes

### Status Management
- **New**: Recently submitted complaints
- **In Progress**: Currently being addressed
- **Under Review**: Pending review or verification
- **Resolved**: Solution provided to customer
- **Closed**: Complaint fully resolved and closed

### Priority Levels
- **Low**: Minor issues, non-urgent
- **Medium**: Standard complaints (default for new complaints)
- **High**: Important issues requiring attention
- **Critical**: Urgent complaints needing immediate action

---

## Analytics & Reporting

### Dashboard Visualizations

#### 1. Complaint Status Chart
- **Type**: Bar chart
- **Purpose**: Shows distribution of complaints by status
- **Colors**: Status-specific color coding
- **Real-time**: Updates every 30 seconds

#### 2. Regional Distribution Map
- **Type**: Interactive Leaflet map
- **Coverage**: Focused on Mathura, Agra, and Bhimasur regions
- **Features**: 
  - Colored markers for each region
  - Popup information on click
  - Legend with complaint counts
  - Zoom level 8 for optimal view

#### 3. Area of Concern Analysis
- **Type**: Horizontal bar chart
- **Data**: Complaint categories sorted by frequency
- **Purpose**: Identify common complaint types

### Analytics Page Features

#### Priority Distribution
- **Visualization**: 3D pie chart
- **Data**: Breakdown by Low, Medium, High, Critical priorities
- **Colors**: Professional color scheme

#### TAT (Turn Around Time) Analysis
- **Chart Type**: Line chart with trend analysis
- **Metrics**: Average resolution time by month
- **Y-axis**: Automatically scales from 1-5+ days

#### Product Analysis
- **Visualization**: 3D pie chart
- **Breakdown**: Complaints by product categories
- **Interactive**: Hover effects and detailed tooltips

### Email Reporting
- **Frequency**: Daily automated reports at 9:00 AM
- **Content**: Comprehensive analytics summary
- **Format**: HTML email with charts and statistics
- **Configuration**: Customizable recipient email in Settings

---

## Settings & Configuration

### Profile Management
Located in Settings > Profile tab:

#### Editable Fields
- **First Name**: Personal first name
- **Last Name**: Personal last name  
- **Email**: Contact email address
- **Phone**: Contact phone number

#### Features
- **Real-time Updates**: Changes reflect immediately in sidebar
- **Persistent Storage**: Updates saved permanently to database
- **Validation**: Email domain validation for @bngroupindia.com
- **No Duplicates**: System updates existing user, never creates new accounts

### Email Configuration
Located in Settings > Notifications tab:

#### Daily Reports
- **Default Recipient**: yashvardhanarorayt@gmail.com
- **Delivery Time**: 9:00 AM daily
- **Content**: Complaint statistics and analytics
- **Test Function**: Send test email to verify configuration

#### SMTP Settings
- **Service**: Brevo SMTP relay
- **Server**: smtp-relay.brevo.com
- **Authentication**: API key based
- **Status**: Configured and operational

---

## Troubleshooting Guide

### Common Issues

#### 1. Profile Not Loading
**Symptoms**: Shows "Loading..." for extended period
**Solution**: 
- Check network connection
- Verify database connectivity
- Restart application if needed

#### 2. Login Issues
**Symptoms**: Cannot access with temp/temp credentials
**Solution**:
- Ensure correct username: `temp` (lowercase)
- Ensure correct password: `temp`
- Clear browser cache if needed

#### 3. Data Not Updating
**Symptoms**: Changes not reflecting in dashboard
**Solution**:
- Wait for 30-second auto-refresh cycle
- Manually refresh browser page
- Check database connection status

#### 4. Export Not Working
**Symptoms**: Excel export fails to download
**Solution**:
- Check browser popup blocker settings
- Ensure sufficient data exists to export
- Try different browser if issue persists

### Error Codes
- **500**: Server error - check database connection
- **404**: Resource not found - verify URL path
- **401**: Authentication required - login again

---

## Database Information

### PostgreSQL Database
- **Provider**: Neon Database (Cloud PostgreSQL)
- **Connection**: Pooled connection for optimal performance
- **Location**: Asia Pacific (Singapore)
- **Tier**: Free tier with 3GB storage

### Database Schema
```sql
-- Users table
users (
  id: SERIAL PRIMARY KEY,
  username: VARCHAR(255) UNIQUE,
  password: VARCHAR(255),
  email: VARCHAR(255),
  first_name: VARCHAR(255),
  last_name: VARCHAR(255),
  phone: VARCHAR(20),
  role: VARCHAR(50),
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)

-- Complaints table
complaints (
  id: SERIAL PRIMARY KEY,
  yearly_sequence_number: INTEGER,
  complaint_date: DATE,
  status: VARCHAR(50),
  priority: VARCHAR(20),
  depo_party_name: VARCHAR(255),
  email: VARCHAR(255),
  contact_number: VARCHAR(20),
  product_name: VARCHAR(255),
  place_of_supply: VARCHAR(255),
  area_of_concern: VARCHAR(255),
  complaint_type: VARCHAR(255),
  voice_of_customer: TEXT,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)

-- Complaint History table
complaint_history (
  id: SERIAL PRIMARY KEY,
  complaint_id: INTEGER REFERENCES complaints(id),
  old_status: VARCHAR(50),
  new_status: VARCHAR(50),
  changed_by: VARCHAR(255),
  change_date: TIMESTAMP,
  notes: TEXT
)
```

### Data Backup
- **Automatic Backups**: Managed by Neon Database
- **Retention**: Point-in-time recovery available
- **Export**: Manual export available through SQL tools

---

## Deployment & Maintenance

### Current Deployment
- **Platform**: Replit (Development Environment)
- **URL**: Generated Replit domain
- **Status**: Development mode with hot reload
- **Port**: 5000 (internal), 80 (external)

### Production Deployment Options

#### Replit Deployments
1. Click "Deploy" button in Replit interface
2. Configure custom domain if needed
3. Automatic TLS certificate provisioning
4. Health checks and monitoring included

#### External Hosting
- **Recommended**: Vercel, Netlify, or Railway
- **Requirements**: Node.js 20+, PostgreSQL access
- **Environment Variables**: DATABASE_URL and email credentials
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`

### Maintenance Tasks

#### Daily
- Monitor email report delivery
- Check database connection status
- Review application logs for errors

#### Weekly
- Verify complaint data accuracy
- Test backup and recovery procedures
- Update dependencies if needed

#### Monthly
- Database performance review
- Security audit of access logs
- Feature usage analytics review

### Performance Optimization
- **Database**: Connection pooling implemented
- **Frontend**: Code splitting and lazy loading
- **API**: Response caching where appropriate
- **Assets**: Optimized images and fonts

---

## API Documentation

### Authentication Endpoints
```
POST /api/admin/login
Body: { username, password }
Response: 200 OK or 401 Unauthorized
```

### Profile Endpoints
```
GET /api/profile
Response: { firstName, lastName, email, phone }

POST /api/profile
Body: { firstName, lastName, email, phone }
Response: { message, user }
```

### Complaint Endpoints
```
GET /api/complaints
Response: Array of complaint objects

GET /api/complaints/stats
Response: { total, new, inProgress, resolved, closed }

GET /api/complaints/trends
Response: Monthly trend data

POST /api/complaints/export
Response: Excel file download
```

### Settings Endpoints
```
GET /api/settings/email
Response: { reportEmail }

POST /api/settings/email
Body: { reportEmail }
Response: { message, reportEmail }
```

---

## Security Guidelines

### Access Control
- Single admin account prevents unauthorized access
- Session-based authentication with secure cookies
- Password hashing using bcrypt with salt rounds

### Data Protection
- Database credentials stored as environment variables
- HTTPS enforced in production deployments
- Input validation on all API endpoints

### Best Practices
- Regular password updates recommended
- Database backups automated
- Application logs monitored for suspicious activity
- Dependencies kept updated for security patches

---

## Support & Contact

### Technical Support
For technical issues or questions:
1. Check this playbook for common solutions
2. Review application logs for error details
3. Verify database connectivity
4. Contact system administrator if issues persist

### Feature Requests
To request new features or modifications:
1. Document the specific requirement
2. Provide business justification
3. Include any relevant mockups or examples
4. Submit through appropriate channels

### System Updates
- Application updates deployed automatically in development
- Production updates require manual deployment
- Database schema changes use migration scripts
- Downtime minimized through rolling deployments

---

*Last Updated: July 23, 2025*
*Version: 2.0*
*Contact: BN Group India IT Department*