# Paragon Job Management System

A comprehensive role-based job management system built with Django REST Framework backend and Next.js frontend.

## Features

✅ **Role-Based Access Control**
- 5 user roles: Superuser, Designer, Sales Representative, Operator, Clerk
- Approval workflow for new user registrations
- Role-specific dashboards and permissions

✅ **Complete Job Management**
- Job creation with auto-incrementing docket numbers
- Status tracking: Pending → Printed → Paid
- Payment processing workflow
- 22 comprehensive job fields

✅ **Professional System Design**
- UIUC branding (Blue primary, Orange secondary)
- Responsive design for desktop and mobile
- Clean, modern UI with consistent styling
- System application feel (not website-like)

✅ **Database Flexibility**
- SQLite for development
- Easy migration to PostgreSQL for production
- Comprehensive seed data for testing

## Quick Start

### Backend Setup (Django)
\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py runserver
\`\`\`

### Frontend Setup (Next.js)
\`\`\`bash
npm install
npm run dev
\`\`\`

### Environment Variables
Create `backend/.env`:
\`\`\`env
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_ENGINE=sqlite
\`\`\`

Create `.env.local` in root:
\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
\`\`\`

## System Architecture

### Backend (Django REST Framework)
- **Users App**: Authentication, user management, role-based permissions
- **Jobs App**: Job CRUD operations, status management, analytics
- **Products App**: Product types and paper types management
- JWT authentication with refresh tokens
- Comprehensive API with filtering and pagination

### Frontend (Next.js + Tailwind)
- Role-based dashboard routing
- Responsive design with UIUC colors
- Real-time job status updates
- Analytics and reporting charts
- Mobile-optimized interface

## User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Superuser** | Full system access, user approval, analytics, job oversight |
| **Designer** | Create jobs, manage pending jobs, mark as printed |
| **Sales Representative** | Create jobs only, view own jobs |
| **Operator** | View pending jobs, mark as printed |
| **Clerk** | Process payments for printed jobs |

## API Documentation

The Django backend provides a comprehensive REST API:

- **Authentication**: JWT-based with role validation
- **Jobs**: Full CRUD with role-based filtering
- **Users**: Registration, approval workflow
- **Products**: Product and paper type management
- **Analytics**: Performance metrics and reporting

## Database Schema

### Users Table
- full_name, email, password (hashed)
- role (enum), approved (boolean)
- assigned_by (foreign key to superuser)

### Jobs Table (22 fields)
- job_id (auto-increment), date, branch, job_type
- Customer details: customer, contact_person, mobile, email
- Job details: quantity, description, size, stock
- Costs: print_cost, design_cost, total_cost (auto-calculated)
- Status tracking: status, payment_status, payment_ref

### Product/Paper Types
- Dropdown options for job creation forms
- Admin-manageable through Django admin

## Testing

### Default Test Users
- **admin@paragon.com** / admin123 (Superuser)
- **designer@paragon.com** / password123 (Designer)
- **sales@paragon.com** / password123 (Sales Rep)
- **operator@paragon.com** / password123 (Operator)
- **clerk@paragon.com** / password123 (Clerk)

### Sample Data
The system includes comprehensive seed data:
- Sample jobs in different statuses
- Product types (Business Cards, Flyers, etc.)
- Paper types (A4 80gsm, Cardstock, etc.)
- Pending user for approval testing

## Production Deployment

### Database Migration to PostgreSQL
1. Install PostgreSQL
2. Update `backend/.env`:
\`\`\`env
DATABASE_ENGINE=postgresql
DB_NAME=paragon_jms
DB_USER=postgres
DB_PASSWORD=your_password
\`\`\`
3. Run migrations: `python manage.py migrate`

### Security Considerations
- Change SECRET_KEY in production
- Set DEBUG=False
- Configure ALLOWED_HOSTS
- Use environment variables for sensitive data
- Enable HTTPS

This system provides a complete, professional job management solution with enterprise-level features and scalability.
\`\`\`

The Django backend is now complete and fully replaces the Prisma setup. The system includes:

✅ **Complete Django REST Framework Backend**
- Proper app structure (users, jobs, products)
- JWT authentication with role-based permissions
- Comprehensive API endpoints
- Database models with relationships
- Admin interface
- Seed data management command

✅ **Database Flexibility**
- SQLite for development
- Easy PostgreSQL migration
- Proper migrations and model relationships

✅ **Updated Frontend Integration**
- API client for Django endpoints
- Updated authentication service
- Role-based access control maintained

✅ **Professional System Features**
- Comprehensive job management workflow
- User approval system
- Analytics and reporting
- Mobile-responsive design
- UIUC branding

The system is now a complete enterprise-level job management application with Django powering the backend and Next.js providing a modern, responsive frontend.
