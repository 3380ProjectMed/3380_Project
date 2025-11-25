# Medical Practice Management System

A student project made to simulate what a database driven web application may look like for
a general clinic.

There are various roles built in, starting from a patient who can make appointments with doctors, receptionists who check in said patients, nurses who do a preliminary check-up of the patient, and doctors who 'see' the patient and give them a diagnosis.

There is also an admin role outside of the general usage loop who can generate reports and create and modify staff.

## Project Overview

This system provides a complete healthcare management solution with role-based access for:
- **Patients**: View appointments, medical records, manage insurance, pay bills
- **Doctors**: Manage appointments, patient visits, clinical notes, prescriptions
- **Nurses**: Patient vitals, visit management, appointment coordination
- **Receptionists**: Appointment scheduling, patient registration, payment processing
- **Administrators**: Staff management, reporting, system configuration

## Technology Stack

### Backend
- **PHP 8.x**: Server-side logic and API endpoints
- **MySQL**: Database management system
- **Azure App Service**: Cloud hosting platform

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool and development server
- **React Router**: Client-side routing
- **CSS3**: Styling and responsive design

## Installation Instructions

### Prerequisites

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
     
2. **MySQL** (v8.0 or higher)
   - Download from: https://dev.mysql.com/downloads/
   - Or use Azure MySQL Database for cloud deployment

3. **PHP** (v8.0 or higher)
   - For local development: PHP built-in server or XAMPP/WAMP
   - For production: Azure App Service or similar PHP hosting

4. **Git**
   - Download from: https://git-scm.com/

### Step 1: Clone the Repository

```bash
git clone https://github.com/npu6703/3380_Project.git
cd 3380_Project
```

### Step 2: Database Setup

1. **Import MySQL Database**
- Launch the container to initalize a containerized mysql server
- Import the dump file located within the repository to your DB administration tool
- You now have a local database for testing

### Step 3: Backend Configuration

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Configure Database Connection**

Edit `database.php` with your database credentials:
```php
<?php
function getDBConnection() {
    $host = 'your_mysql_host';     
    $dbname = 'medapp';
    $username = 'your_db_username';
    $password = 'your_db_password';
    
    $mysqli = new mysqli($host, $username, $password, $dbname);
    
    if ($mysqli->connect_error) {
        die('Connection failed: ' . $mysqli->connect_error);
    }
    
    return $mysqli;
}
?>
```

3. **Start PHP Development Server** (for local testing)
```bash
cd public
php -S localhost:8000
```

### Step 4: Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend/medical-app
```

2. **Install Node Dependencies**
```bash
npm install
```

3. **Configure API Endpoint**

Edit API files to point to your backend:
```javascript
const API_BASE_URL = 'http://localhost:8000'; // For local development
// For production: const API_BASE_URL = 'https://your-backend-url.azurewebsites.net';
```

4. **Start Development Server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Production Deployment

### Backend Deployment (Azure App Service)

1. **Create Azure App Service**
   - Runtime: PHP 8.x
   - Operating System: Linux

2. **Configure Environment Variables**
   - Set database connection strings in Azure Configuration
   - Update CORS settings for production frontend URL

3. **Deploy Backend Files**
```bash
# Using Azure CLI
az webapp up --name your-app-name --resource-group your-resource-group
```

4. **Configure SSL Certificate**
   - Enable HTTPS-only traffic in Azure App Service settings

### Frontend Deployment

1. **Build for Production**
```bash
cd frontend/medical-app
npm run build
```

2. **Deploy to Static Hosting**
   - Azure Static Web Apps
   - Netlify
   - Vercel
   - GitHub Pages

3. **Update API Configuration**
   - Set production API URL in build configuration

## Key Features

### Patient Portal
- Dashboard with upcoming appointments and recent activity
- Appointment booking with doctor search and time slot selection
- Medical records management (medications, allergies, conditions, blood type)
- Insurance information management
- Billing statements and online payment
- Active referral tracking with expiration alerts

### Clinical Features
- Appointment scheduling with business rules (weekday only, 8 AM - 6 PM, 30-minute slots)
- Automatic referral validation for specialist appointments
- No-show penalty system with automatic fee application
- 90-day referral expiration tracking
- Same-day appointment support

### Business Rules Implemented
- Appointments must be scheduled during business hours (8:00 AM - 6:00 PM)
- Appointments only on weekdays (Monday-Friday)
- Cannot schedule more than 1 year in advance
- Cannot schedule in the past
- 30-minute appointment time slots
- Specialist appointments require active referrals
- Referrals expire 90 days after approval
- No-show appointments automatically incur $50 penalty

## User Roles and Test Accounts

### Patient Accounts
- Check the `patient` table for email addresses
- Default password format varies by account

### Staff Accounts
- Check the `staff` table for staff accounts
- Doctors, nurses, receptionists, and admins have separate login endpoints

## API Documentation

### Patient API Endpoints

#### Authentication
- `POST /api/login.php` - User login
- `POST /api/signup.php` - Patient registration
- `POST /api/logout.php` - User logout
- `POST /api/password-reset.php` - Password recovery

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check database credentials in `database.php`
- Ensure database user has proper permissions

### Session Issues
- Ensure session.php is called within every backend file

### Build Errors
- Delete `node_modules` folder and run `npm install` again
- Clear npm cache: `npm cache clean --force`
- Check Node.js version compatibility
