# Complaint Management System

## Overview

This is a full-stack complaint management dashboard built with React, Express, and PostgreSQL. The application provides a comprehensive system for tracking and managing customer complaints with features like Kanban boards, analytics, and real-time updates.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend and backend:

- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (fully migrated from MySQL)
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state management

## Key Components

### Frontend Architecture
- **Client Directory**: Contains all React frontend code
- **Component Structure**: Uses shadcn/ui for consistent UI components
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for API data fetching and caching
- **Styling**: Tailwind CSS with custom design system variables
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Server Directory**: Express.js server with TypeScript
- **API Routes**: RESTful API endpoints for complaint management
- **Database Layer**: Drizzle ORM for type-safe database operations
- **Storage Interface**: Abstract storage interface for data operations

### Database Schema
The system uses three main tables:
- **Users**: User authentication and management
- **Complaints**: Core complaint data with status tracking
- **Complaint History**: Audit trail for complaint changes

### Key Features
- **Kanban Board**: Drag-and-drop interface for complaint status management
- **Dashboard Analytics**: Charts and statistics for complaint trends
- **Real-time Updates**: Automatic data refreshing every 30 seconds
- **Search and Filtering**: Advanced complaint filtering capabilities
- **Export Functionality**: Data export capabilities
- **Responsive Design**: Mobile-friendly interface

## Data Flow

1. **User Interaction**: Users interact with React components
2. **API Calls**: TanStack Query manages API requests to Express backend
3. **Server Processing**: Express routes handle business logic
4. **Database Operations**: Drizzle ORM executes PostgreSQL queries
5. **Response Flow**: Data flows back through the same chain
6. **UI Updates**: React components re-render with new data

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React, React DOM, React Router (Wouter)
- **UI Framework**: Radix UI primitives with shadcn/ui components
- **State Management**: TanStack Query
- **Forms**: React Hook Form with Hookform Resolvers
- **Validation**: Zod with Drizzle-Zod integration
- **Charts**: Recharts for data visualization
- **Styling**: Tailwind CSS, Class Variance Authority, clsx
- **Date Handling**: date-fns
- **Carousel**: Embla Carousel React

### Backend Dependencies
- **Server Framework**: Express.js
- **Database**: Drizzle ORM with Neon Database serverless driver
- **Session Management**: connect-pg-simple for PostgreSQL sessions
- **Development**: tsx for TypeScript execution, esbuild for production builds

### Development Tools
- **Build Tool**: Vite with React plugin
- **TypeScript**: Full TypeScript support across the stack
- **Database Migrations**: Drizzle Kit for schema management
- **Linting/Formatting**: PostCSS with Autoprefixer

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

- **Development**: `npm run dev` starts both frontend and backend in development mode
- **Production Build**: `npm run build` creates optimized builds for both client and server
- **Production Start**: `npm run start` runs the production server
- **Database**: PostgreSQL integration with environment variable configuration
- **Static Serving**: Express serves built React assets in production
- **Port Configuration**: Configured for port 5000 with external port 80

### Environment Setup
- **Node.js 20**: Modern JavaScript runtime
- **PostgreSQL 16**: Database with Drizzle migrations
- **Nix Package Management**: Stable channel for consistent builds

### Build Process
1. Frontend builds to `dist/public` using Vite
2. Backend builds to `dist` using esbuild
3. Production server serves static files and API routes
4. Database migrations run via `npm run db:push`

## Changelog
```
Changelog:
- June 27, 2025. Initial setup with React/Express complaint management system
- June 27, 2025. Fixed API routing issues for stats and trends endpoints  
- June 27, 2025. Added sample complaint data (6 complaints across different statuses)
- June 27, 2025. Created complete navigation with All Complaints, Analytics, Reports, Settings pages
- June 27, 2025. Fixed navigation warnings and implemented global sidebar layout
- June 27, 2025. Integrated BN logo and updated branding (removed "Management" from titles)
- June 27, 2025. Added Excel export functionality and collapsible sidebar with toggle button
- June 27, 2025. Removed "New Complaint" buttons to make dashboard visualization-only (no input functionality)
- June 27, 2025. Simplified Settings page to only include essential features: profile data management, password change, and 2-factor authentication
- January 4, 2025. Fixed Excel export functionality by removing template file dependency
- January 4, 2025. Created analytics report with monthly resolution percentages showing total complaints, resolved complaints, and resolution percentage by month
- January 4, 2025. All Complaints export uses 31-column structure matching user's template format
- January 4, 2025. Removed 2FA and department options from Settings page as requested
- January 4, 2025. Updated dashboard visualizations to focus on ticket status, product categories, and regional complaints
- January 4, 2025. Added email functionality to send visual reports with complaint statistics and summaries
- January 4, 2025. Removed complaints by category visualization and key performance indicators from dashboard
- January 4, 2025. Simplified dashboard layout to focus on ticket status and regional complaint visualizations
- January 4, 2025. Removed complaints by category visualization and key performance indicators from analytics page
- January 4, 2025. Analytics page now shows only Priority Distribution and Resolution Time Analysis charts
- January 4, 2025. Added product-based visualization with 3D pie chart to analytics page
- January 4, 2025. Fixed y-axis scaling to show values 1-5 and automatically adjust for higher values
- January 4, 2025. Moved email visual report functionality from dashboard to analytics page only
- January 4, 2025. Set up automatic daily email delivery to arorayashvardhan123@gmail.com at 9 AM with comprehensive reports
- January 4, 2025. Moved email address configuration from analytics page to Settings page in notifications tab
- January 4, 2025. Added email settings management with backend API to configure daily report recipient address
- January 4, 2025. Added priority editing functionality to complaint list and detail views with inline select dropdowns
- January 4, 2025. Enhanced Kanban board cards to show detailed complaint information including complaint type, area of concern, voice of customer, party details, and locations
- January 4, 2025. Added view details button to Kanban cards with comprehensive complaint information dialog
- January 4, 2025. Set default priority for all new complaints to "medium" as requested
- January 4, 2025. Added notification system with bell icon next to dashboard header showing new complaints since last login
- January 4, 2025. Created YouTube-style notification popup that displays new complaints with details
- January 4, 2025. Confirmed priority editing functionality is available in All Complaints section with inline dropdown selectors
- January 6, 2025. Migrated from in-memory storage to PostgreSQL database for persistent data storage
- January 6, 2025. Successfully created database tables and populated with sample complaint data
- January 6, 2025. Implemented user profile management with PostgreSQL backend - profile updates now persist in database
- January 6, 2025. Added API endpoints for profile retrieval and updates with proper database integration
- January 6, 2025. Added real-time profile updates using UserProfileContext for instant sidebar updates
- January 6, 2025. Enforced company email domain "@bngroupindia.com" with input validation preventing @ symbols, spaces, and invalid characters
- January 7, 2025. Updated sidebar to display company square logo when collapsed with proper vertical layout and toggle button positioning
- January 7, 2025. Added smooth animation transitions between full logo and square logo during sidebar collapse/expand with scale and opacity effects
- January 7, 2025. Removed circular logo from collapsed sidebar, keeping only the full logo when expanded
- January 7, 2025. Improved sidebar collapse animation speed from 500ms to 200ms for more responsive feel
- January 7, 2025. Removed black focus outlines from all input fields globally, replaced with subtle gray border focus styling
- January 7, 2025. Migrated database schema from PostgreSQL to MySQL-compatible structure with varchar field lengths and proper MySQL column types
- January 7, 2025. Updated Drizzle schema to use mysqlTable, int with autoincrement, and varchar fields with appropriate length constraints
- January 8, 2025. Configured Brevo SMTP service for email functionality with server smtp-relay.brevo.com
- January 8, 2025. Implemented daily email reports using Brevo SMTP with HTML formatting and comprehensive analytics
- January 8, 2025. Added test email functionality in Settings page to verify SMTP configuration
- January 8, 2025. Redesigned all login pages with beautiful blue gradient backgrounds and modern card layouts matching user's design specifications
- January 8, 2025. Added BN Group logo, enhanced UI with glass morphism effects, password visibility toggles, and smooth transitions
- January 8, 2025. Created two-step customer login flow: welcome screen with Login/Register buttons, then dedicated login form
- January 8, 2025. Updated all login pages to use high-quality BN Group logo with gradient design and "Building Nation" tagline
- January 8, 2025. Applied beautiful blue-to-red gradient effect to "BN Support Desk" text across all login pages using linear-gradient from #007BFF to #e74c3c
- January 8, 2025. Completely recreated all login pages to match original PHP design with exact styling, Poppins font, container layout, button effects, and responsive design
- January 9, 2025. Implemented comprehensive real-time notification system with WebSocket connections for instant status updates
- January 9, 2025. Added notification bell component to ASM sidebar with unread count badges and dropdown interface
- January 9, 2025. Created notification API endpoints for fetching, marking as read, and real-time broadcasting
- January 9, 2025. Updated storage layer to automatically create notifications when complaint status changes
- January 9, 2025. Fixed center alignment issues in login/register pages by adding position fixed, full width/height and proper margin/padding properties
- January 9, 2025. Removed transporter name dropdown from both admin and ASM complaint forms, making it a typed input field for consistency
- January 9, 2025. Enhanced form animations with smooth slide-in effects for custom input fields when selecting "Others" in dropdowns
- January 9, 2025. Added smooth page transition animations for all menu navigation with consistent right-to-left slide effect for better visual experience
- January 9, 2025. Enhanced main content area with fade animation that triggers on every sidebar menu click for smooth screen transitions
- January 9, 2025. Updated all test data to use only Mathura, Bhimasur, and Agra as place of supply locations for consistency
- January 11, 2025. Fixed email system with correct Brevo SMTP credentials (91409f002@smtp-brevo.com) and updated recipient to yashvardhanarorayt@gmail.com
- January 11, 2025. Added comprehensive sample data to ASM and Admin complaint forms including realistic company names, contact details, product information, and detailed voice of customer descriptions
- January 11, 2025. Enhanced track complaint page with informative help content when no complaints exist, explaining the complaint tracking process
- January 11, 2025. Removed pre-filled sample data from both ASM and Admin complaint forms - all fields now start empty for clean user input
- January 11, 2025. Added area of concern histogram visualization showing area of concern values sorted from high to low on dashboard
- January 11, 2025. Cleared all existing complaints and populated database with realistic sample data matching admin and ASM complaint form structure
- January 9, 2025. Fixed x-axis styling in complaints by region chart with proper text rotation and improved readability
- January 14, 2025. Enhanced analytics visualization with professional color schemes and authentic India map using react-simple-maps
- January 14, 2025. Implemented area of concern bar chart optimization with proper proportions and removed pie chart as requested
- January 14, 2025. Renamed "Resolution Time Analysis" to "TAT" for better business terminology alignment
- January 14, 2025. Created India map visualization showing complaint regions with distinct colors for Mathura (red), Agra (green), and Bhimasur (purple)
- January 14, 2025. Optimized map loading performance with instant label display and reduced external dependencies for immediate city name visibility
- January 14, 2025. Implemented authentic India map using Leaflet library with OpenStreetMap tiles focused on Uttar Pradesh region
- January 14, 2025. Added interactive markers with custom styling, popup information, and circle overlays for better complaint visualization
- January 14, 2025. Finalized map layout with h-64 height, compact legend overlay, and smaller regional icons below map
- January 14, 2025. Confirmed default map view settings: Optimized center at [27.2, 78.0] with zoom level 8 for better regional focus
- January 14, 2025. Updated map default zoom to level 8 with centered view on Mathura-Agra-Bhimasur triangle for optimal complaint visualization
- January 14, 2025. Created complete hardcoded dataset with 114 complaints for 2024 (IDs 1-114) in sequential order
- January 14, 2025. All 2024 complaints set to "closed" status and fully integrated with dashboard visualizations and analytics
- January 14, 2025. Replaced year dropdown filters with rounded button toggles (2024/2025) with 2025 as default across all pages
- January 14, 2025. Migrated 2024 complaints from hardcoded data to database storage for full editability and status updates
- January 14, 2025. Updated chart titles: "Ticket Status" to "Complaint Status" and simplified "Complaints by Region - India Heat Map" to "Complaints by Region"
- January 14, 2025. Renamed "Area of Concern Analysis" to "Complaint Type Analysis" in the analytics tab for better clarity
- January 16, 2025. Removed auto-fill for depo/party name and email fields from both admin and ASM complaint forms as requested
- January 16, 2025. Removed category field completely from both admin and ASM complaint forms - users will no longer need to select a category
- January 16, 2025. Added default ASM login credentials for easy testing: username "asm" password "123" and username "demo" password "demo"
- January 16, 2025. Fixed ASM login issue by updating frontend to properly handle simple usernames without auto-appending email domain for default credentials
- January 16, 2025. Made depo/party name, email, and contact number optional instead of required fields in both admin and ASM complaint forms
- January 16, 2025. Enhanced complaint source field: "Others" option provides custom input field
- July 22, 2025. Successfully migrated project from Replit Agent to standard Replit environment with PostgreSQL database
- July 22, 2025. Removed automatic sample data generation to keep database clean for real complaint data entry
- July 23, 2025. Created Render deployment configuration with render.yaml and comprehensive deployment guide
- July 23, 2025. Updated server to support dynamic PORT configuration for Render hosting compatibility
- July 23, 2025. Added environment variable template (.env.example) for easy configuration setup
- July 24, 2025. Fixed Render deployment build issues by separating Vite imports and creating production-safe build process
- July 24, 2025. Resolved "Cannot find package 'vite'" error in production by conditionally importing development dependencies
- July 24, 2025. Updated build process to use custom build script that excludes Vite from production bundle
- July 24, 2025. Created separate production.ts entry point to completely eliminate Vite dependencies from production builds
- July 24, 2025. Final fix for Render deployment - production build now completely clean of development dependencies
- July 24, 2025. Moved all build dependencies (vite, esbuild, typescript, etc.) from devDependencies to main dependencies for Render compatibility
- July 24, 2025. Removed Dockerfile to ensure Node.js detection instead of Docker in Render deployment
- July 24, 2025. Fixed Vite build path resolution by consolidating build process into single build.js script with proper working directory handling
- July 24, 2025. Successfully migrated project from Replit Agent to standard Replit environment
- July 24, 2025. Fixed tsx dependency installation and created working frontend build system with proper asset imports
- July 24, 2025. Confirmed Neon database connectivity with existing complaint data and user profiles
- July 24, 2025. Fixed Render deployment issues by moving build dependencies to main dependencies and using production.ts entry point
- July 24, 2025. Build system now correctly creates production-ready frontend and backend builds for deployment
- July 24, 2025. Created esbuild-free build system using file copying and import path transformation to eliminate Render dependency issues
- July 24, 2025. Final deployment configuration tested and working - system ready for production Render deployment
- July 24, 2025. Moved essential build dependencies (vite, typescript, tsx, postcss, autoprefixer, tailwindcss, @vitejs/plugin-react) from devDependencies to main dependencies for Render compatibility
- July 24, 2025. Build system now works correctly in production environment - verified with successful frontend/backend builds and database connectivity
- July 24, 2025. Successfully migrated project from Replit Agent to standard Replit environment with proper client/server separation
- July 24, 2025. Fixed Vite configuration issues by creating root vite.config.js file for server development mode compatibility
- July 24, 2025. Updated build process to properly build from client directory and resolve Vercel deployment issues
- July 24, 2025. Created vercel.json configuration file for proper Vercel serverless deployment with Node.js runtime
- July 24, 2025. Successfully migrated project from Replit Agent to standard Replit environment with proper client/server separation
- July 24, 2025. Fixed build configuration for both Replit and Vercel deployments - created custom build.js script that builds from correct client directory
- July 24, 2025. Added vercel.json configuration file for proper Vercel deployment with Node.js serverless functions
- July 24, 2025. Resolved vite.config.js import issues by creating root configuration that properly references client build setup
- July 25, 2025. Removed AI suggestions and priority fields from ASM dashboard for cleaner interface
- July 25, 2025. Added notification sounds that play when new complaint activity occurs via WebSocket
- July 25, 2025. Created delivery app-style progress bars showing complaint status stages (New → Processing → Resolved → Completed)
- July 25, 2025. Changed dashboard title from "Smart Dashboard" to "ASM Dashboard" 
- July 25, 2025. Replaced quick action cards with complaint statistics cards showing total, open, resolved, and closed complaint counts
- January 16, 2025. Removed "(optional)" text from placeholder fields while keeping validation rules flexible
- January 16, 2025. Fixed "Others" dropdown functionality - now properly shows text input when selected with smooth animations
- January 16, 2025. Redesigned "Others" text input with modern professional UI: inline return button, blue accent colors, hover effects, smooth transitions, and enhanced visual feedback
- January 16, 2025. Extended modern styling to place of supply, area of concern, and sub category fields with same professional design
- January 16, 2025. Made file attachment areas fully clickable by removing choose file buttons - entire upload area now clickable with improved UX
- January 16, 2025. Made salesperson name, invoice number, invoice date, LR number, transporter name, and transporter number optional fields
- January 16, 2025. Removed "Others" option from complaint type dropdown - users must select from predefined complaint types only
- January 16, 2025. Applied modern professional styling to product name "Others" field with inline buttons, blue accents, hover effects, and smooth animations
- January 16, 2025. Implemented dynamic subcategory filtering based on area of concern selection - subcategories now show only related options for the selected area
- January 16, 2025. Changed month field to date field - users can now select specific dates instead of just month/year
- January 16, 2025. Enhanced date picker with auto-close functionality and future date prevention - calendar automatically closes when date is selected and blocks selection of dates after today
- January 16, 2025. Updated feedback form file upload area to be fully clickable - removed "Choose File" button and made entire upload area clickable with improved hover effects
- January 16, 2025. Simplified feedback page per user request: removed AI-powered features, templates, and extra fields like "recommend service" and "follow up required"
- January 16, 2025. Updated feedback form to use simple heading instead of "smart feedback system AI powered feedback collection"
- January 16, 2025. Maintained modern UI/UX design but simplified functionality focusing only on complaint selection, rating, and comments
- January 16, 2025. Modernized account settings page with comprehensive design featuring enhanced UI components, better organization, and improved user experience
- January 16, 2025. Added profile completion progress tracking, gradient backgrounds, enhanced form fields with icons, and improved mobile responsiveness
- January 16, 2025. Implemented three-tab layout (Profile, Security, Notifications) with modern styling, password visibility toggles, and notification preferences management
- January 16, 2025. Enhanced security section with password requirements, status indicators, and improved form validation with visual feedback
- January 16, 2025. Completely modernized new complaint page with comprehensive design overhaul featuring enhanced UI components, better organization, and improved user experience
- January 16, 2025. Added dynamic form progress tracking, gradient backgrounds, enhanced section headers with icons, and improved visual hierarchy
- January 16, 2025. Implemented modern card layouts with backdrop blur effects, enhanced input fields with better styling and icons, and improved mobile responsiveness
- January 16, 2025. Added comprehensive submit section with checklist, form validation indicators, modern button styling with gradients, and enhanced file upload area
- January 21, 2025. Migrated complete database from MySQL to PostgreSQL for better performance and reliability
- January 21, 2025. Updated Drizzle ORM schema from mysql-core to pg-core with proper PostgreSQL column types and constraints
- January 21, 2025. Removed MySQL dependencies and implemented PostgreSQL connection pool for efficient database operations
- January 21, 2025. Ensured all complaint data persists permanently in PostgreSQL database with proper year-based filtering for dashboard analytics
- January 22, 2025. Fixed year-based filtering to use complaint date field instead of createdAt - ensures 114 hardcoded complaints remain in 2024 section while new complaints go to 2025
- January 22, 2025. Updated dashboard, analytics, and complaints pages to properly filter by complaint date for accurate year-based separation
- January 22, 2025. Successfully migrated project from Replit Agent to standard Replit environment with PostgreSQL database and restored all 114 hardcoded 2024 complaints
- January 22, 2025. Created Supabase deployment documentation and PostgreSQL schema for external hosting
- January 22, 2025. Confirmed Neon free tier hosting provides excellent capacity for complaint management system with 3GB storage and 100 compute hours monthly
- January 22, 2025. Updated to user's Neon database connection string with pooler configuration for optimal performance
- January 22, 2025. Successfully populated Neon database with all 115 complaints (114 from 2024 + 1 new 2025) and 5 users - migration complete
- July 22, 2025. Successfully migrated project from Replit Agent to standard Replit environment with PostgreSQL database
- July 22, 2025. Removed hardcoded 2024/2025 year filtering sections and all sample complaint data - system now uses real data only
- July 22, 2025. Connected server to user's personal Neon database at ep-wandering-queen-a1uv5kby-pooler.ap-southeast-1.aws.neon.tech
- July 22, 2025. Cleaned database and removed automatic sample data generation to maintain authentic complaint data only
- July 22, 2025. Implemented hardcoded master admin user "temp" with password "temp" for admin access
- July 22, 2025. Fixed profile update system to properly persist changes for the master admin user across login sessions
- July 23, 2025. Created comprehensive documentation package including Playbook, SOP, and End-to-End technical details
- July 23, 2025. Documented complete system architecture, user workflows, security implementation, and operational procedures
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
Map display preference: Default analytics map should load with current configuration - h-64 height, zoom level 8, center [27.2, 78.0], compact regional icons below, no summary text. Map should focus on Mathura-Agra-Bhimasur triangle region.
```