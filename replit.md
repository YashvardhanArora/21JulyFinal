# Complaint Management System

## Overview
This is a full-stack complaint management dashboard designed to track and manage customer complaints. Key capabilities include Kanban boards for status management, comprehensive analytics, and real-time updates. The system aims to streamline complaint resolution, provide actionable insights for business vision, and enhance overall customer satisfaction.

## User Preferences
Preferred communication style: Simple, everyday language.
Map display preference: Default analytics map should load with current configuration - h-64 height, zoom level 8, center [27.2, 78.0], compact regional icons below, no summary text. Map should focus on Mathura-Agra-Bhimasur triangle region.

## System Architecture
The application employs a modern full-stack architecture.
- **Frontend**: Built with React (TypeScript), using Vite, Tailwind CSS with shadcn/ui components, Wouter for routing, and TanStack Query for state management. Form handling uses React Hook Form with Zod validation.
- **Backend**: Express.js server (TypeScript) providing RESTful API endpoints.
- **Database**: PostgreSQL with Drizzle ORM for type-safe operations.
- **UI/UX**: Consistent design using shadcn/ui and Tailwind CSS. Login pages feature gradient backgrounds, glass morphism effects, and modern card layouts. Custom scrollbars and smooth page transitions are implemented throughout. Profile and settings pages use a clean, card-based layout.
- **Key Features**: Kanban board with drag-and-drop, dashboard analytics (charts, statistics), search/filtering, data export (template-based Excel), responsive design, and shareable complaint views. Real-time updates are facilitated via WebSockets for notifications. Complaint status progresses through stages (New → Processing → Resolved → Completed) via visual progress bars.
- **Data Flow**: User interaction (React) triggers API calls (TanStack Query) to the Express backend, which processes requests and performs database operations (Drizzle ORM with PostgreSQL). Data then flows back to update the UI.
- **Authentication**: JWT-based authentication for admin users with dynamic email-based login. ASM users have separate credentials.
- **Notifications**: Real-time WebSocket-based notification system for relevant updates, distinguishing between admin and ASM actions. Audio notifications are disabled.
- **Data Management**: Supports year-based filtering (2024/2025) for historical and current complaint data, with automatic loading of historical complaints upon initialization if not already present. Empty fields in imported data are marked with "-".
- **File Management**: Enhanced file attachment areas are fully clickable.
- **Mapping**: Utilizes Leaflet with OpenStreetMap for India map visualization, focusing on specific regions with interactive markers and accurate geographical coordinates for Bhimasar (Gujarat), Mathura, and Agra (Uttar Pradesh).

## External Dependencies
- **Frontend**: React, React DOM, Wouter, Radix UI, shadcn/ui, TanStack Query, React Hook Form, Zod, Recharts, Tailwind CSS, Class Variance Authority, clsx, date-fns, Embla Carousel React.
- **Backend**: Express.js, Drizzle ORM, Neon Database serverless driver, connect-pg-simple.
- **Development/Build**: Vite, TypeScript, tsx, esbuild, Drizzle Kit, PostCSS, Autoprefixer.
- **Utilities**: Python openpyxl (for template-based Excel export), xlsx-populate.
```