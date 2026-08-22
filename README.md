# Dayflow — Human Resource Management System

*Every workday, perfectly aligned.*

Dayflow is a lightweight, self-hosted HRMS built for teams that want their HR data on their own machines — no cloud vendor, no subscription, no internet dependency. It covers the everyday HR loop: onboarding an employee, tracking who's in the office today, managing leave requests, and keeping payroll numbers straight.

## Why Dayflow

Most HRMS demos lean on Firebase or Supabase and call it a day. Dayflow doesn't. Everything — auth, storage, real-time attendance status, payroll math — runs on a local database and a server you control. That was a deliberate choice: it forces the system to be genuinely self-sufficient, and it means the app keeps working even with no internet connection at all.

## Core Features

- **Authentication & Role-Based Access** — Admin/HR and Employee roles, JWT-based sessions, secure password handling, forced password reset on first login.
- **Employee Profiles** — Personal details, job details, private info (bank, PAN, UAN), resume, skills, and certifications — editable scope depends on role.
- **Attendance Tracking** — One-click check-in/check-out, daily and monthly views, live status (present / absent / on leave) visible across the team.
- **Leave & Time-Off** — Apply for paid, sick, or unpaid leave with date ranges and remarks; Admin/HR review queue with approve/reject and comments.
- **Payroll & Salary Structure** — Wage-driven salary components (Basic, HRA, allowances, PF, professional tax) computed automatically; read-only view for employees, full control for Admin.

See [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) for how each of these is built, split across the team, and sequenced.

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js + Tailwind CSS | File-based routing, fast dev loop, good defaults for a multi-page app built by two people |
| Backend | Node.js + Express | Minimal, unopinionated, easy for two people to split by module |
| Database | PostgreSQL + Prisma | Real relational DB running locally (not a cloud service), Prisma keeps schema/migrations/queries consistent across two backend devs |
| Real-time | WebSockets (`ws`) | Live attendance status without polling |
| Auth | JWT + bcrypt | Industry-standard, no external auth provider |

No BaaS, no third-party UI kit — Postgres runs locally (via a local install or a local Docker container, never a hosted/cloud instance) and Prisma is the one exception to "minimal dependencies," since it removes a whole class of hand-rolled SQL/migration bugs and is standard practice for a timeboxed build.

## Project Structure

```
dayflow-hrms/
├── client/               # Next.js frontend
│   ├── app/               # Route-level views (Dashboard, Profile, Attendance, ...)
│   ├── components/        # Reusable UI pieces
│   ├── lib/api/            # Fetch wrappers for backend endpoints
│   └── context/            # Auth/session context
├── server/               # Express backend
│   ├── prisma/
│   │   ├── schema.prisma  # Data model
│   │   └── migrations/
│   └── src/
│       ├── routes/        # Route definitions per module
│       ├── controllers/   # Request handlers
│       ├── middleware/    # Auth guard, validation, error handling
│       └── sockets/       # WebSocket event handlers
```

## Getting Started

```bash
# Backend
cd server
npm install
npx prisma migrate dev   # creates the local Postgres schema
npm run dev

# Frontend (in a separate terminal)
cd client
npm install
npm run dev
```

Postgres itself just needs to be running locally (native install or `docker run postgres` on your machine — no hosted/cloud database). The backend seeds a bootstrap Admin account on first run so the very first sign-in has somewhere to start from. Every employee account after that is created by an Admin/HR user from within the app.