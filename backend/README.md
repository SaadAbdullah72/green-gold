# GreenGold OS — Full-Stack Bin Deployment Management System (Backend API)

Production-grade Express.js, Node.js, MongoDB (Mongoose) REST API server with JWT authentication, role authorization, 5-minute server-side job assignment timeout processor, notification system, and audit log tracking.

---

## 🚀 Quick Start

### 1. Environment Setup
Copy `.env.example` to `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/greengold_os
JWT_SECRET=greengold_os_super_secret_jwt_key_2026_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Seeding (Development)
Populate initial accounts for all 3 roles (`USER`, `MANAGEMENT`, `TECHNICAL`):
```bash
npm run seed
```

**Seed Credentials Created**:
- **MANAGEMENT**: `manager@greengold.org` / `Password123!`
- **USER / CUSTOMER**: `marriott@greengold.org` / `Password123!`
- **TECHNICAL 1**: `ali.tech@greengold.org` / `Password123!`
- **TECHNICAL 2**: `ahmed.tech@greengold.org` / `Password123!`

### 4. Start Server
```bash
npm start
```

---

## 🛠️ Key Architectural Features

1. **Role-Based Authorization (`USER`, `MANAGEMENT`, `TECHNICAL`)**:
   - Backend middleware `requireRole(...)` verifies JWT token claims. Role claims supplied by client headers are strictly ignored.
2. **Mandatory Decline Reason**:
   - Management cannot decline a request without providing a non-empty `declineReason`.
3. **5-Minute Server-Side Worker Assignment Timeout**:
   - Background background worker (`workerTimeoutService.js`) checks pending `JobAssignment` records every 10 seconds.
   - If a technical worker does not respond within 5 minutes (`responseDeadline < Date.now()`), the server automatically marks the job as `EXPIRED`, releases the worker to `IDLE`, sets request status back to `ASSIGNING`, notifies management and worker, and creates an audit entry.
4. **Calculated Required Workers**:
   - `calculateRequiredWorkers(numberOfBins)` returns `Math.ceil(numberOfBins / 2)`.
5. **Multi-Worker Request Progress**:
   - Tracks quota completion per worker and marks the entire `ServiceRequest` as `COMPLETED` when all worker jobs finish.

---

## 📡 API Endpoint Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register/user`: Register Customer Account.
- `POST /api/auth/register/management`: Register Management Account.
- `POST /api/auth/register/technical`: Register Technical Worker Account.
- `POST /api/auth/login`: Login for all roles (Returns JWT + user object).
- `POST /api/auth/logout`: Logout user.
- `GET  /api/auth/me`: Get current authenticated user profile.

### Customer Requests (`/api/requests`)
- `POST /api/requests`: Submit new Bin Deployment Request (manual address + lat/lng).
- `GET  /api/requests/my`: Get current user's submitted requests.
- `GET  /api/requests/:id`: Get detailed request info.

### Management Command (`/api/management`)
- `GET   /api/management/requests`: View all incoming requests (with optional `status` filter).
- `PATCH /api/management/requests/:id/approve`: Approve request & set required workers count.
- `PATCH /api/management/requests/:id/decline`: Decline request (**Requires `declineReason`**).
- `GET   /api/management/workers`: List technical workers with live MongoDB status (`IDLE`, `ASSIGNED`, `WORKING`, `OFFLINE`).
- `POST  /api/management/jobs/:requestId/assign`: Assign worker to request (triggers 5-min timer).

### Technical Workforce (`/api/technical`)
- `GET   /api/technical/jobs`: View worker's assigned job queue.
- `PATCH /api/technical/jobs/:jobId/accept`: Accept job within 5-min window (updates status to `ACCEPTED`).
- `PATCH /api/technical/jobs/:jobId/decline`: Decline job (updates status to `DECLINED` & worker to `IDLE`).
- `PATCH /api/technical/jobs/:jobId/start`: Start work (updates status to `IN_PROGRESS` & worker to `WORKING`).
- `PATCH /api/technical/jobs/:jobId/complete`: Mark job completed (updates worker to `IDLE` & checks request completion).

### Notifications & Audit (`/api/notifications`, `/api/audit`)
- `GET   /api/notifications`: Get recipient's notification feed.
- `PATCH /api/notifications/:id/read`: Mark notification as read.
- `GET   /api/audit`: View system audit logs (Management only).
