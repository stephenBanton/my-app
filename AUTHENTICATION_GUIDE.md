# GeoScope Multi-Role Authentication System

## Overview
This authentication system separates users into 3 roles:
- **Clients** - Request reports and track status
- **Analysts** - Process orders and generate reports
- **Admins** - Manage everything (users, orders, assignments)

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client',  -- 'client', 'analyst', 'admin'
  company TEXT,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Orders Table
```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  project_name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  polygon JSON,
  status TEXT DEFAULT 'pending',  -- 'pending', 'assigned', 'in-progress', 'completed'
  assigned_to INTEGER,  -- analyst id
  priority TEXT DEFAULT 'normal',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
)
```

### Reports Table
```sql
CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  report_path TEXT,
  status TEXT DEFAULT 'pending',
  summary TEXT,
  high_risk_count INTEGER DEFAULT 0,
  medium_risk_count INTEGER DEFAULT 0,
  low_risk_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
)
```

## Setup Instructions

### 1. Install Dependencies
```bash
cd geoscope
npm install jsonwebtoken better-sqlite3
```

### 2. Start the Backend Server
```bash
node server.js
```

The server will:
- Initialize SQLite database at `geoscope.db`
- Create all tables automatically
- Create a default admin user: `admin@geoscope.com` / `admin123`

### 3. Start the Frontend
```bash
cd ../workbench
npm start
```

## API Endpoints

### Authentication Endpoints

#### POST /auth/register
Create a new user account
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "client",  // or "analyst", "admin"
  "company": "ACME Corp"
}
```

#### POST /auth/login
Login with email and password
```json
{
  "email": "admin@geoscope.com",
  "password": "admin123"
}
```

Response:
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@geoscope.com",
    "role": "admin",
    "company": "GeoScope"
  }
}
```

#### GET /auth/me
Get current user profile (requires auth header)
```
Authorization: Bearer <token>
```

#### POST /auth/verify
Verify JWT token validity
```json
{
  "token": "jwt-token-here"
}
```

### User Management (Admin Only)

#### GET /admin/users
Get all users
```
Authorization: Bearer <token>
```

#### GET /admin/users/analysts
Get all analysts

#### PUT /admin/users/:userId/role
Update user role
```json
{
  "role": "analyst"
}
```

#### DELETE /admin/users/:userId
Delete a user

### Order Management

#### POST /orders
Create new order (client only)
```json
{
  "project_name": "Downtown Commercial",
  "address": "123 Main St, Miami, FL",
  "latitude": 25.7617,
  "longitude": -80.1918,
  "polygon": [/* optional GeoJSON polygon */]
}
```

#### GET /orders
Get orders (filters by role):
- Client: sees own orders
- Analyst: sees assigned orders
- Admin: sees all orders

#### GET /orders/:orderId
Get specific order details

#### PUT /orders/:orderId/status
Update order status
```json
{
  "status": "in-progress"  // or "completed", "assigned", "pending"
}
```

#### PUT /admin/orders/:orderId/assign
Assign order to analyst (admin only)
```json
{
  "analyst_id": 5
}
```

#### GET /admin/orders
Get all orders with detailed info (admin only)

## Frontend Routes

### Public Routes
- `/` - Homepage
- `/about` - About page
- `/services` - Services
- `/pricing` - Pricing
- `/contact` - Contact form

### Client Routes
- `/client-login` - Client login/register
- `/client-dashboard` - Client dashboard (protected)
- `/client-request` - Create new order (protected)

### Staff Routes
- `/staff-login` - Staff login
- `/workbench` - Analyst workbench (analyst only)
- `/dashboard` - Legacy dashboard (admin/analyst)

### Admin Routes
- `/admin-dashboard` - Admin dashboard (admin only)
- `/admin/manage-orders` - Manage and assign orders (admin only)
- `/admin/manage-users` - Manage users and roles (admin only)

## User Workflow

### CLIENT SIDE
1. Go to `/client-login`
2. Create account or login
3. See `/client-dashboard` showing their orders
4. Create new order via `/client-request`
5. Track order status and download report when ready

### ANALYST SIDE
1. Go to `/staff-login`
2. Login with analyst credentials
3. See `/workbench` with assigned orders and map
4. Analyze order details, generate report
5. Save progress and submit report

### ADMIN SIDE
1. Go to `/staff-login`
2. Login with admin credentials
3. See `/admin-dashboard` with stats and recent orders
4. Go to `/admin/manage-orders` to assign analysts
5. Go to `/admin/manage-users` to manage users and roles
6. Review and approve reports

## Testing the System

### Test Case 1: Admin Login
```
Email: admin@geoscope.com
Password: admin123
Expected: Redirect to /admin-dashboard
```

### Test Case 2: Create Client User
1. Go to `/client-login`
2. Click "Create Account"
3. Fill in: Name, Company, Email, Password
4. Submit
5. Expected: Account created, can login and see client dashboard

### Test Case 3: Create Analyst User
1. Login as admin at `/staff-login`
2. Go to `/admin/manage-users`
3. Fill in analyst details, set Role to "Analyst"
4. Click "Create User"
5. Expected: Analyst appears in users list

### Test Case 4: Assign Order to Analyst
1. Login as admin
2. Go to `/admin/manage-orders`
3. Select pending order and analyst
4. Click "Assign"
5. Expected: Order status changes to "assigned"

### Test Case 5: Analyst Sees Assigned Order
1. Login as analyst
2. Go to `/workbench`
3. Expected: See assigned order in list with details

## Security Notes

### Current Implementation
- Passwords stored in plain text (development only)
- JWT tokens expire in 30 days
- Tokens stored in localStorage (vulnerable to XSS)

### For Production
1. Hash passwords with bcrypt:
```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash(password, 10);
// Check: await bcrypt.compare(password, hash)
```

2. Use secure storage for tokens:
   - HttpOnly cookies instead of localStorage
   - Implement CSRF protection

3. Add rate limiting:
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);
```

4. Validate and sanitize all inputs

5. Use HTTPS only

## Troubleshooting

### Issue: "User not found" error
- Check email is correct
- Verify user exists in database
- Check role requirements for the page

### Issue: Token expired
- Login again to get new token
- Token valid for 30 days

### Issue: Can't access admin page
- Verify user role is "admin"
- Check JWT token is being sent in Authorization header
- Ensure token hasn't expired

### Issue: Database errors
- Delete `geoscope.db` and restart server to reset
- Check file permissions on geoscope directory
- Verify Node has write access to create database file

## Environment Variables

Create `.env` file in `geoscope/` folder:
```
JWT_SECRET=your-super-secret-key-change-in-production
PORT=5000
OPENAI_API_KEY=sk-your-key
GOOGLE_MAPS_API_KEY=your-key
```

## File Structure
```
geoscope/
  ├── server.js                 # Express backend
  ├── auth.js                   # Auth module with database functions
  ├── geoscope.db               # SQLite database (auto-generated)
  ├── reportTemplate.html       # Report template
  └── reports/                  # Generated PDF reports

workbench/
  └── src/
      ├── App.js                # Main routing
      ├── pages/
      │   ├── AdminDashboard.js     # Admin dashboard
      │   ├── ManageOrders.js       # Order management
      │   ├── ManageUsers.js        # User management
      │   ├── ClientLogin.js        # Client login/register
      │   ├── StaffLogin.js         # Staff login
      │   ├── ClientDashboard.js    # Client dashboard
      │   └── ...other pages
      └── components/
          └── ProtectedRoute.js  # Role-based route protection
```

## Next Steps

1. **Implement password hashing** with bcrypt for production
2. **Add email verification** for client registration
3. **Implement report generation workflow** with status tracking
4. **Add analytics dashboard** showing system metrics
5. **Create admin notifications** when orders are ready
6. **Add payment integration** for premium reports
7. **Implement audit logging** for all admin actions

---

For questions or issues, contact: support@geoscope.com
