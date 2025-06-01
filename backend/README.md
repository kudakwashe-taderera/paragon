# Paragon Job Management System - Django Backend

## Setup Instructions

### 1. Create Virtual Environment
\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
\`\`\`

### 2. Install Dependencies
\`\`\`bash
pip install -r requirements.txt
\`\`\`

### 3. Environment Configuration
Copy `.env.example` to `.env` and configure your settings:
\`\`\`bash
cp .env.example .env
\`\`\`

### 4. Database Setup
\`\`\`bash
# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (optional, seed data creates one)
python manage.py createsuperuser

# Seed initial data
python manage.py seed_data
\`\`\`

### 5. Run Development Server
\`\`\`bash
python manage.py runserver
\`\`\`

The API will be available at `http://localhost:8000/api/`

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/token/refresh/` - Refresh JWT token
- `GET /api/auth/profile/` - Get current user profile
- `GET /api/auth/pending-users/` - Get pending user registrations (Superuser only)
- `POST /api/auth/approve-user/` - Approve/decline user (Superuser only)
- `GET /api/auth/admin/stats/` - Get admin statistics (Superuser only)

### Jobs
- `GET /api/jobs/` - List jobs (filtered by user role)
- `POST /api/jobs/` - Create new job
- `GET /api/jobs/{id}/` - Get job details
- `PATCH /api/jobs/{id}/` - Update job
- `PATCH /api/jobs/{id}/status/` - Update job status
- `PATCH /api/jobs/{id}/payment/` - Update job payment status
- `GET /api/jobs/pending/` - Get pending jobs
- `GET /api/jobs/docket-counter/` - Get docket counter for auto-numbering
- `GET /api/jobs/analytics/` - Get job analytics (Superuser only)

### Products
- `GET /api/products/product-types/` - List product types
- `POST /api/products/product-types/` - Create product type
- `GET /api/products/paper-types/` - List paper types
- `POST /api/products/paper-types/` - Create paper type

## Database Migration to PostgreSQL

To switch from SQLite to PostgreSQL:

1. Install PostgreSQL and create a database
2. Update `.env` file:
\`\`\`env
DATABASE_ENGINE=postgresql
DB_NAME=paragon_jms
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
\`\`\`

3. Run migrations:
\`\`\`bash
python manage.py migrate
python manage.py seed_data
\`\`\`

## Testing the API

### Using curl:
\`\`\`bash
# Register a new user
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"full_name": "Test User", "email": "test@example.com", "password": "testpass123", "confirm_password": "testpass123"}'

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@paragon.com", "password": "admin123"}'

# Get jobs (with token)
curl -X GET http://localhost:8000/api/jobs/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
\`\`\`

## Default Users
After running `seed_data`, these users are available:

- **Superuser**: admin@paragon.com / admin123
- **Designer**: designer@paragon.com / password123
- **Sales Rep**: sales@paragon.com / password123
- **Operator**: operator@paragon.com / password123
- **Clerk**: clerk@paragon.com / password123
- **Pending User**: pending@paragon.com / password123 (not approved)

## Admin Interface
Access Django admin at `http://localhost:8000/admin/` using the superuser credentials.
