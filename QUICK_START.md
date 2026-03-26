# GeoScope Multi-Role Authentication - Quick Start Guide

## ✅ System is Ready!

Your three-role authentication system has been successfully implemented with:

### 🎯 Three User Roles
1. **Clients** - Request reports, track orders
2. **Analysts** - Process orders, generate reports  
3. **Admins** - Manage users, assign work

### 🗂️ What Was Created

**Backend:**
- ✅ `auth.js` - Custom JWT authentication with no external dependencies
- ✅ Authentication endpoints  (/auth/login, /auth/register)
- ✅ Admin endpoints (/admin/users, /admin/orders)
- ✅ Order management endpoints
- ✅ Role-based middleware (requireAuth, requireRole)
- ✅ File-based JSON database (`.data/users.json`, `.data/orders.json`)

**Frontend:**
- ✅ `StaffLogin.js` - Staff/admin login page (updated)
- ✅ `ClientLogin.js` - Client login/register page (updated)
- ✅ `AdminDashboard.js` - Admin dashboard with stats
- ✅ `ManageOrders.js` - Order assignment interface
- ✅ `ManageUsers.js` - User management interface
- ✅ `ProtectedRoute.js` - Role-based route protection (updated)
- ✅ `App.js` - Complete routing setup (updated)

### 📊 Database Files (Auto-Generated)
```
.data/
├── users.json       # All users with roles
├── orders.json      # Orders with assignments
└── reports.json     # Report metadata
```

### 🔐 Default Admin Account
```
Email:    admin@geoscope.com
Password: admin123
```

---

## 🚀 How to Start

### 1. Start Backend Server
```bash
cd geoscope
node server.js
```

Expected output:
```
✓ Data directory created
✓ Default admin created: admin@geoscope.com / admin123
✓ Database files initialized
Server running on port 5000
```

### 2. Start Frontend (in new terminal)
```bash
cd workbench
npm start
```

This opens http://localhost:3000

---

## 👥 User Workflows

### CLIENT WORKFLOW
1. Navigate to http://localhost:3000/client-login
2. Click "Create Account" to register
3. Fill in: Name, Company, Email, Password
4. Login with credentials
5. Go to `/client-dashboard` to see your orders
6. Create new orders via `/client-request`

### ANALYST WORKFLOW
1. Go to http://localhost:3000/staff-login
2. Login with analyst credentials (created by admin)
3. Access `/workbench` to see assigned orders
4. Analyze data and generate reports
5. Mark orders as complete

### ADMIN WORKFLOW
1. Go to http://localhost:3000/staff-login
2. Login as: admin@geoscope.com / admin123
3. Redirects to `/admin-dashboard`
4. **Dashboard Actions:**
   - View stats (total orders, pending, assigned, completed)
   - Click "Manage Orders" to assign analysts
   - Click "Manage Users" to manage accounts
5. **Manage Orders (/admin/manage-orders):**
   - Select pending order → Select analyst → Click "Assign"
   - Update order status (pending → assigned → in-progress → completed)
6. **Manage Users (/admin/manage-users):**
   - Create new analyst/client accounts
   - Change user roles
   - Delete users

---

## 🧪 Quick Test Cases

### Test 1: Create Analyst User (As Admin)
```
1. Login as admin
2. Go to /admin/manage-users
3. Fill: Name="John Doe", Email="analyst@test.com", Password="pass123", Role="Analyst"
4. Click "Create User"
5. ✓ User appears in list
```

### Test 2: Create Client User
```
1. Go to /client-login
2. Click "Create Account"
3. Fill: Name="Jane Smith", Company="ACME", Email="jane@acme.com", Password="pass123"
4. ✓ Account created, can login now
```

### Test 3: Assign Order to Analyst
```
1. Login as admin
2. Create test client order (as client user, create order)
3. Go to /admin/manage-orders
4. Select the pending order
5. Select the analyst user
6. Click "Assign"
7. ✓ Order status changes to "assigned"
```

### Test 4: Analyst Access
```
1. Logout admin
2. Login as analyst (email: analyst@test.com)
3. ✓ Redirects to /workbench
4. ✓ See assigned orders in list
```

---

## 🔄 API Endpoints Reference

### Authentication
```
POST /auth/login
POST /auth/register
POST /auth/verify
GET /auth/me
```

### Admin Management
```
GET /admin/users
GET /admin/users/analysts
PUT /admin/users/:userId/role
DELETE /admin/users/:userId
PUT /admin/orders/:orderId/assign
GET /admin/orders
```

### Order Management
```
POST /orders
GET /orders
GET /orders/:orderId
PUT /orders/:orderId/status
```

---

## 📁 File Structure

```graphql
geoscope/
  ├── server.js              ← Backend server
  ├── auth.js                ← Auth module (NEW!)
  ├── .data/                 ← Database (NEW!)
  │   ├── users.json
  │   ├── orders.json
  │   └── reports.json
  └── ...existing files

workbench/src/
  ├── App.js                       ← Updated routing
  ├── pages/
  │   ├── AdminDashboard.js        ← NEW!
  │   ├── ManageOrders.js          ← NEW!
  │   ├── ManageUsers.js           ← NEW!
  │   ├── StaffLogin.js            ← UPDATED
  │   ├── ClientLogin.js           ← UPDATED
  │   └── ...existing pages
  └── components/
      └── ProtectedRoute.js        ← UPDATED

AUTHENTICATION_GUIDE.md            ← Full documentation
```

---

## 🔐 Security Notes

### Current Implementation (Development)
- ✅ Custom JWT tokens (no external dependencies)
- ✅ Role-based access control
- ✅ File-based data persistence
- ⚠️ Passwords stored in plain text
- ⚠️ Tokens in localStorage (XSS vulnerable)

### For Production
1. **Hash Passwords** - Install `bcryptjs`
2. **Use HTTPS** - Secure SSL certificate
3. **HttpOnly Cookies** - Move tokens from localStorage
4. **Add CSRF Protection** - Express CSRF middleware
5. **Rate Limiting** - Prevent brute force attacks
6. **Validation** - Sanitize all inputs

---

## 🐛 Troubleshooting

### Issue: "Cannot POST /auth/login"
- Server not running? Check `node server.js` is active
- Port conflict? Kill other Node processes
- Correct endpoint? Check URL spelling

### Issue: "Token invalid/expired"
- Login again to get new token
- Tokens valid for 30 days
- Check browser console for errors

### Issue: "Insufficient permissions"
- Check user role is correct
- Admin: role must be "admin"
- Analyst: role must be "analyst"
- Client: role must be "client"

### Issue: Database corrupted
- Delete `.data/` folder
- Restart server
- Recreates clean database

---

## 📞 Next Steps

### Immediate (Testing)
- [ ] Test login as admin
- [ ] Create test analyst user
- [ ] Create test client user
- [ ] Assign order to analyst
- [ ] Verify dashboard shows correct data

### Short Term
- [ ] Implement password hashing (bcryptjs)
- [ ] Add email verification
- [ ] Set up cloud database (Supabase/PostgreSQL)
- [ ] Add audit logging

### Medium Term
- [ ] Implement real report generation workflow
- [ ] Add payment processing
- [ ] Create analytics dashboard
- [ ] Implement push notifications

### Long Term
- [ ] Mobile app
- [ ] Advanced GIS features
- [ ] AI-powered analysis
- [ ] Multi-language support

---

## 📚 Full Documentation
See `AUTHENTICATION_GUIDE.md` for complete API reference, schema, and in-depth examples.

---

**System Status: ✅ READY FOR TESTING**

Start the servers and test the workflows above!
