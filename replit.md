# SwagSuite - Promotional Products ERP System

## Overview

SwagSuite is a comprehensive Order Management System specifically designed for the promotional products industry. Built by Liquid Screen Design, it serves as an intelligent, end-to-end platform that centralizes order processing, customer relationship management, supplier integration, and business analytics for distributors and suppliers in the promotional products space.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom SwagSuite branding colors
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API design
- **Authentication**: Replit Auth with OpenID Connect
- **File Uploads**: Multer middleware for artwork file handling
- **Session Management**: Express sessions with PostgreSQL store

### Database Architecture
- **Database**: PostgreSQL with Neon serverless connection
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection Pooling**: Neon serverless connection pooling

## Key Components

### Core Business Entities
1. **Users**: Authentication and role-based access control
2. **Companies**: Customer/client management with full contact information
3. **Contacts**: Individual contacts within companies
4. **Suppliers**: Vendor management with performance tracking
5. **Products**: Product catalog with pricing, specifications, and availability
6. **Orders**: Complete order lifecycle from quote to delivery
7. **Order Items**: Line items within orders with product details
8. **Artwork Files**: File management for product customization assets
9. **Activities**: Audit trail and activity logging

### UI Components
- **Dashboard**: Customizable home screen with KPIs and quick actions
- **Layout System**: Consistent sidebar navigation and top bar
- **Data Tables**: Reusable table components for entity management
- **Modal System**: Dialog-based forms for CRUD operations
- **Search**: Universal search functionality across all entities

### Integration Points
- **HubSpot CRM**: Customer relationship and marketing automation
- **Slack**: Team notifications and workflow alerts
- **AI Knowledge Base**: Intelligent search for company documentation
- **External Databases**: SAGE, ESP, Distributor Central integration ready

## Data Flow

### Order Processing Flow
1. Quote creation with customer and product selection
2. Approval workflow with status tracking
3. Production management with milestone updates
4. Shipping and delivery confirmation
5. Invoice generation and payment tracking

### CRM Integration Flow
1. Lead capture from HubSpot
2. Customer qualification and onboarding
3. Order history and relationship tracking
4. Marketing campaign integration
5. Customer portal access for self-service

### Reporting Flow
1. Real-time data aggregation from all modules
2. KPI calculation and dashboard updates
3. Custom report generation
4. Analytics export and visualization
5. Performance tracking and alerting

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **express**: Web server framework
- **passport**: Authentication middleware

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Integration Dependencies
- **multer**: File upload handling
- **connect-pg-simple**: PostgreSQL session store
- **openid-client**: Authentication with Replit
- **ws**: WebSocket support for real-time features

## Deployment Strategy

### Development Environment
- Replit-hosted development with hot reload
- Vite development server with middleware mode
- Environment variable configuration for database and auth

### Production Build
- Vite production build for client assets
- ESBuild bundling for server-side code
- Static asset serving from Express server
- PostgreSQL database with connection pooling

### Scalability Considerations
- Serverless database connection for auto-scaling
- Stateless authentication with session storage
- File upload handling with size limits
- Query optimization with Drizzle ORM

### Security Features
- Role-based access control (user, admin, manager)
- Authenticated API endpoints
- File type validation for uploads
- SQL injection prevention through ORM
- XSS protection via React's built-in sanitization

### Monitoring and Logging
- Request/response logging middleware
- Error handling with status codes
- Activity tracking for audit trails
- Performance monitoring through query tracking