# PlaceHub — Smart Placement Management System

PlaceHub is a premium, modern full-stack placement management SaaS/admin dashboard built with React (TypeScript + Tailwind CSS) on the frontend, Node.js + Express on the backend, and MongoDB as the database.

## Key Features

1. **Analytical Dashboard:** Complete statistics showing placement rates, department strength (bar charts), gender distribution (pie charts), academic distribution (UG% brackets), active recruiters, and placement team performance.
2. **Student Database:** Full CRUD support for student profiles, searching, and advanced filtering (department, gender, hostel, percentage range).
3. **Excel Import/Export:** Import bulk student data from Excel (.xlsx/.xls) using a built-in template, with full row-level validation. Generate and download reports as Excel files instantly.
4. **Placement CRM / Pipeline:** Track company leads through a status pipeline: `COLD` ➔ `WARM` ➔ `HOT` ➔ `DRIVE COMPLETED`.
5. **Role-Based Access Control (RBAC):** Three distinct roles:
   * **ADMIN:** Full system access (manages team, students, companies, approvals).
   * **MANAGER:** Manages student database, soft deletes, Excel imports (view-only reports/companies/team).
   * **PLACEMENT LEAD:** Manages assigned companies, status pipelines, uploads Job Descriptions (JD), and forwards to Admin for approval.
6. **Rule-Based ATS Resume Matching:** Automated, rule-based algorithm that parses JDs (PDF, DOC, DOCX text extraction) and matches required skills against student profiles, generating compatibility scores (0–100%) categorized into visual score brackets with detailed student lists.
7. **Simple Notification System:** Real-time feedback for forwarded companies, approvals, status updates, and placement drives.
8. **Audit Trail:** History log of critical database modifications, actions, entities, users, and timestamps.

---

## Seeded Demo Credentials

The application is pre-seeded with **80+ realistic student records**, **15 companies**, and **10 placement team members**. Use the following accounts to log in:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@placehub.com` | `Admin@123` | Full access, user/role management, approvals |
| **Manager** | `manager@placehub.com` | `Manager@123` | Student CRUD, Excel import, view-only other sections |
| **Placement Lead** | `lead@placehub.com` | `Lead@123` | Company CRM, status updates, JD parsing, ATS matching |

---

## Local Setup & Run

### Prerequisite: Node.js (v18+)

### 1. Backend Server Setup
Navigate into the backend directory:
```bash
cd backend
npm install
```

#### Database Fallback (Zero-Configuration)
We have implemented a **hybrid database fallback system**:
1. If a local MongoDB instance or `MONGODB_URI` environment variable is detected, it will connect to it.
2. If no database is found (e.g. MongoDB is not installed), the server will **automatically spin up an in-memory MongoDB database** using `mongodb-memory-server`.
3. If the database is empty on start (such as a fresh in-memory instance), the server **automatically seeds the database with the demo data**.

Start the backend:
```bash
npm run dev
```
The backend runs at `http://localhost:5000`.

### 2. Frontend App Setup
Navigate into the frontend directory:
```bash
cd ../frontend
npm install
npm run dev
```
The frontend runs at `http://localhost:5173`. Open this URL in your web browser to access the dashboard.

---

## Build for Production
To generate optimized production builds:

* **Frontend:**
  ```bash
  cd frontend
  npm run build
  ```
  Generates static files in `frontend/dist/`.

* **Backend:**
  The server is production-ready. You can start it in production mode:
  ```bash
  cd backend
  npm start
  ```

---

## Cloud Deployment Guide

### Database (MongoDB Atlas)
1. Sign up for a free database at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create an **M0 Free Cluster** and set up Database Access (username/password) and Network Access (Allow IP `0.0.0.0/0`).
3. Copy your database connection string: `mongodb+srv://<user>:<password>@cluster.mongodb.net/placehub?retryWrites=true&w=majority`.

### Backend (Render / Railway)
1. Deploy the `backend/` directory to **Render** or **Railway** as a Web Service.
2. Set the Environment Variables:
   * `MONGODB_URI`: Your MongoDB Atlas connection string.
   * `JWT_SECRET`: A secure random secret key.
   * `CLIENT_URL`: The URL of your deployed frontend (e.g., `https://placehub.vercel.app`).
   * `PORT`: `5000` (or leave default).

### Frontend (Vercel / Netlify)
1. Deploy the `frontend/` directory to **Vercel** or **Netlify**.
2. Set the Environment Variables:
   * `VITE_API_URL`: The URL of your deployed backend (e.g., `https://placehub-backend.onrender.com`).
3. Set the build commands:
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
