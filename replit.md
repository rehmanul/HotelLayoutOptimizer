# Professional Floor Plan Analyzer

## Overview

This is a full-stack web application for analyzing floor plans and optimizing space utilization. The application allows users to upload DXF files (architectural drawings), configure analysis parameters, and generate optimized layouts with ilots (space units) and corridors. It features a modern React frontend with shadcn/ui components and an Express.js backend with PostgreSQL database integration.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: shadcn/ui components based on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **File Upload**: Multer for handling DXF file uploads
- **API Design**: RESTful API with JSON responses

### Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/           # Utility functions and configurations
│   │   └── hooks/         # Custom React hooks
├── server/                 # Express.js backend
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Database operations
│   └── db.ts             # Database connection setup
├── shared/                 # Shared TypeScript types and schemas
└── migrations/            # Database migration files
```

## Key Components

### Database Schema
- **Users**: User authentication and profile management
- **Projects**: Floor plan projects with DXF data storage
- **Configurations**: Analysis parameters and settings
- **Analyses**: Results of floor plan analysis including detected zones and placed ilots

### API Endpoints
- `GET /api/projects` - Retrieve user projects
- `POST /api/projects` - Create new project with DXF upload
- `GET /api/projects/:id` - Get specific project details
- Configuration and analysis endpoints for managing optimization parameters

### Core Features
- **DXF File Processing**: Upload and parse architectural drawing files
- **Zone Detection**: Identify walls, restricted areas, and entrances
- **Ilot Placement**: Optimize space utilization with configurable size distributions
- **Corridor Generation**: Automatic corridor planning with customizable parameters
- **Real-time Visualization**: Canvas-based rendering of floor plans and analysis results

## Data Flow

1. **File Upload**: User uploads DXF file through the frontend
2. **Project Creation**: Backend stores project data and file metadata
3. **Configuration**: User sets analysis parameters (ilot distribution, corridor settings)
4. **Analysis Processing**: Backend processes floor plan and generates optimized layout
5. **Visualization**: Frontend renders results with interactive canvas display
6. **Export**: Generate PDF or image exports of the analysis results

## External Dependencies

### Frontend Dependencies
- React ecosystem (React, React DOM, React Router alternative)
- UI Components (Radix UI primitives, shadcn/ui)
- Styling (Tailwind CSS, class-variance-authority)
- Data Fetching (TanStack Query)
- Form Handling (React Hook Form with Zod validation)

### Backend Dependencies
- Express.js for API server
- Drizzle ORM for database operations
- Neon serverless PostgreSQL client
- Multer for file upload handling
- Zod for schema validation

### Development Tools
- TypeScript for type safety
- Vite for frontend development and building
- ESBuild for backend bundling
- Drizzle Kit for database migrations

## Deployment Strategy

### Development Environment
- Frontend: Vite dev server with HMR
- Backend: Node.js with tsx for TypeScript execution
- Database: Neon serverless PostgreSQL

### Production Build
- Frontend: Static files built with Vite
- Backend: Bundled with ESBuild for Node.js execution
- Database: Production Neon instance

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment mode (development/production)

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- July 07, 2025. Initial setup