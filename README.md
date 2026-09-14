# ProjectFlow — Enterprise Project & Task Management System

A production-grade, secure, full-stack web application designed to help teams organize projects, track tasks, manage workflows, and inspect operational statistics through real-time dashboards.

---

## 📑 Table of Contents
1. [Overview & Tech Stack](#overview--tech-stack)
2. [Database Schema & ER Diagram](#database-schema--er-diagram)
3. [Key Features & Capabilities](#key-features--capabilities)
4. [Security & Architectural Safeguards](#security--architectural-safeguards)
5. [Prerequisites & Environment Configuration](#prerequisites--environment-configuration)
6. [Step-by-Step Local Setup](#step-by-step-local-setup)
7. [Docker & Containerized Setup](#docker--containerized-setup)
8. [API Reference & Swagger Documentation](#api-reference--swagger-documentation)
9. [Automated Testing](#automated-testing)
10. [Bonus Features Delivered](#bonus-features-delivered)
11. [CI/CD & Deployment Guide](#cicd--deployment-guide)

---

## 1. Overview & Tech Stack

### Frontend
- **Framework**: React 18 (TypeScript) powered by Vite
- **Styling**: Tailwind CSS with custom responsive layout and clean color palette
- **Icons**: Lucide React
- **State & Routing**: React Context API, React Router v6, Axios with automatic JWT interceptors

### Backend
- **Framework**: Node.js with Express & TypeScript
- **Database & ORM**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens) with Bearer token header verification
- **Hashing**: `bcryptjs` with 10 salt rounds (zero plain-text password storage)
- **Validation**: Zod schema validation on all inputs
- **Security Middlewares**: Helmet, CORS, and `express-rate-limit` brute-force protection
- **Logging**: Morgan HTTP logger
- **Testing**: Jest + Supertest integration testing

---

## 2. Database Schema & ER Diagram

```mermaid
erDiagram
    USERS ||--o{ PROJECTS : "owns (1:N)"
    USERS ||--o{ TASKS : "owns (1:N)"
    USERS ||--o{ AUDIT_LOGS : "generates (1:N)"
    PROJECTS ||--o{ TASKS : "contains (1:N, cascade delete)"

    USERS {
        uuid id PK
        string fullName
        string email UK
        string passwordHash
        enum role "USER | ADMIN"
        datetime createdAt
        datetime updatedAt
    }

    PROJECTS {
        uuid id PK
        string name
        string description
        enum status "NOT_STARTED | IN_PROGRESS | COMPLETED"
        datetime startDate
        datetime endDate
        uuid userId FK
        datetime createdAt
        datetime updatedAt
    }

    TASKS {
        uuid id PK
        string name
        string description
        enum priority "LOW | MEDIUM | HIGH"
        enum status "PENDING | IN_PROGRESS | COMPLETED"
        datetime dueDate
        uuid projectId FK
        uuid userId FK
        datetime createdAt
        datetime updatedAt
    }

    AUDIT_LOGS {
        uuid id PK
        uuid userId FK
        string action
        string entity
        string entityId
        string details
        datetime createdAt
    }
```

---

## 3. Key Features & Capabilities

- **User Authentication**:
  - Secure registration with email format & unique constraint checks
  - Login issuing signed JWT tokens
  - Logout with stateless client clearance
  - Authenticated session persistence
- **Project Management**:
  - Create, view details, edit, and delete projects
  - Fields: Name, Description, Status (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`), Start Date, End Date, Created Date
  - Real-time project progress calculation (`% completed`)
- **Task Management**:
  - Add tasks associated with projects
  - Fields: Task Name, Description, Priority (`LOW`, `MEDIUM`, `HIGH`), Status (`PENDING`, `IN_PROGRESS`, `COMPLETED`), Due Date
  - One-click task completion toggle
  - Cascade deletion: Deleting a project automatically and cleanly deletes all its tasks
- **Search & Multi-Criteria Filtering**:
  - Search projects and tasks by name
  - Filter projects by status
  - Filter tasks by status, priority, and project
  - Sorting (newest, oldest, name, due date) and pagination
- **Executive Dashboard**:
  - Real-time KPI summary: Total Projects, Total Tasks, Completed Tasks, Pending Tasks, Projects In Progress
  - Visual completion rate gauges & status distributions
  - Task priority breakdown & recent activity feeds
- **Audit Logging**:
  - Tracks user mutations (project created/updated/deleted, task created/updated/deleted)

---

## 4. Security & Architectural Safeguards

1. **Password Encryption**: All passwords hashed using `bcrypt` (10 rounds). Passwords never stored or returned in plain text.
2. **Strict Authorization & Multi-Tenancy**:
   - Users can only view, edit, or delete their own projects and tasks.
   - Cross-tenant access attempts return `403 Forbidden`.
3. **Request Validation**:
   - Zod schemas validate all request bodies: non-empty strings, email format, ISO 8601 date validity, and valid enum values.
4. **SQL Injection Prevention**:
   - Prisma ORM utilizes parameterized queries and prepared statements. Raw unescaped user queries are strictly prohibited.
5. **Rate Limiting**:
   - `express-rate-limit` protects `/api/auth/*` against credential stuffing and brute-force attacks.
6. **Error Sanitization**:
   - Centralized error handling returns structured JSON without leaking stack traces or internal environment variables in production.

---

## 5. Prerequisites & Environment Configuration

### Prerequisites
- Node.js v18+ (tested on v22.18)
- PostgreSQL v13+ (or Docker)
- npm v9+

### Environment Variables

#### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:root@localhost:5432/project_management?schema=public"
JWT_SECRET="supersecretjwtkey_for_project_management_system_2026!"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:5173"
```

#### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 6. Step-by-Step Local Setup

### 1. Backend Setup
```bash
cd backend
npm install

# Push Prisma schema to PostgreSQL & generate client
npx prisma db push

# Seed sample users, projects, and tasks
npx ts-node prisma/seed.ts

# Start backend dev server
npm run dev
```
Backend runs on `http://localhost:5000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

### 3. Demo Login Credentials
- **Standard User**:
  - Email: `alice@example.com`
  - Password: `Password123!`
- **Administrator**:
  - Email: `admin@example.com`
  - Password: `AdminPass123!`

*(You can also use the one-click demo login buttons on the Login page).*

---

## 7. Docker & Containerized Setup

To run the complete system (PostgreSQL + Express + React Nginx) with a single command:
```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Swagger Docs: `http://localhost:5000/api/docs`

---

## 8. API Reference & Swagger Documentation

Interactive OpenAPI / Swagger UI is available at:
`http://localhost:5000/api/docs`

### Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Register a new user | No (Rate Limited) |
| `POST` | `/api/auth/login` | Log in and receive JWT token | No (Rate Limited) |
| `POST` | `/api/auth/logout` | Log out session | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Bearer JWT |

### Projects Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/projects` | List projects (search, filter, pagination, sort) | Bearer JWT |
| `GET` | `/api/projects/:id` | Get project details and tasks | Bearer JWT |
| `POST` | `/api/projects` | Create a new project | Bearer JWT |
| `PUT` | `/api/projects/:id` | Update project details or status | Bearer JWT |
| `DELETE` | `/api/projects/:id` | Delete project (cascades to tasks) | Bearer JWT |

### Tasks Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/tasks` | List tasks (search, filter by status/priority/project) | Bearer JWT |
| `GET` | `/api/tasks/:id` | Get task details | Bearer JWT |
| `POST` | `/api/tasks` | Create a task under a project | Bearer JWT |
| `PUT` | `/api/tasks/:id` | Update task fields or status | Bearer JWT |
| `DELETE` | `/api/tasks/:id` | Delete a task | Bearer JWT |

### Dashboard & Audit Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/dashboard/stats` | Aggregate dashboard statistics & charts data | Bearer JWT |
| `GET` | `/api/audit-logs` | Retrieve recent activity audit trail | Bearer JWT |

---

## 9. Automated Testing

Run the automated integration test suite:
```bash
cd backend
npm test
```

### Test Coverage Summary:
- **Auth Suite**: Registration validation, email uniqueness, password complexity, login verification, token issuance.
- **Projects Suite**: CRUD operations, required fields, pagination, search, **cross-user data isolation (User B cannot access or modify User A's project)**.
- **Tasks Suite**: Creation under owned project, priority/status filtering, status toggling, cross-user modification prevention.
- **Dashboard Suite**: Dynamic metric calculation and empty user baseline.
- **Cascade Deletion**: Verifies deleting a project removes all child tasks from the database.

**Result: 21 / 21 Tests Passing (100% Pass Rate).**

---

## 10. Bonus Features Delivered

- ✅ **Docker Support**: Multi-stage `Dockerfile`s + `docker-compose.yml`
- ✅ **Unit & Integration Tests**: 21 Supertest & Jest integration tests
- ✅ **Pagination & Sorting**: Paginated responses with `page`, `limit`, `sortBy`, `sortOrder`
- ✅ **Audit Logs**: Activity tracking for all mutations (`GET /api/audit-logs`)
- ✅ **Role-Based Access Control (RBAC)**: Support for `USER` and `ADMIN` roles
- ✅ **CI/CD Pipeline**: GitHub Actions workflow at `.github/workflows/ci.yml`
- ✅ **Swagger / OpenAPI Documentation**: Live interactive documentation at `/api/docs`

---

## 11. CI/CD & Deployment Guide

### Deployment Options
1. **Docker Compose**: Deploy to any VPS (DigitalOcean, AWS EC2, GCP) with `docker compose up -d`.
2. **Cloud Platforms**:
   - Backend: Deploy on Render, Railway, or AWS Elastic Beanstalk using `backend/Dockerfile`.
   - Database: Supabase, Neon, or AWS RDS PostgreSQL.
   - Frontend: Vercel, Netlify, or AWS Amplify using Vite build (`npm run build`).
