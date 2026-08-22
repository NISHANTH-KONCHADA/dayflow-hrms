# Dayflow — Human Resource Management System

*Every workday, perfectly aligned.*

Dayflow is a lightweight, self-hosted HRMS built for teams that want their HR data on their own machines — no cloud vendor, no subscription, no internet dependency. It covers the everyday HR loop: onboarding an employee, tracking who's in the office today, managing leave requests, and keeping payroll numbers straight.

## Status

**Frontend: feature-complete against the core spec, running on mock data.** Every screen below is built and working end-to-end in the browser — sign in, apply for leave, run payroll numbers, the lot. There's no backend yet: the app runs entirely on an in-memory mock data layer (`client/lib/mock/`), which is designed so swapping it for real API calls later is a small, mechanical change (see [Architecture note](#architecture-note) below).

**Backend: not started.** Express + PostgreSQL/Prisma, per the plan in [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md).

## Why Dayflow

Most HRMS demos lean on Firebase or Supabase and call it a day. Dayflow doesn't. Everything — auth, storage, real-time attendance status, payroll math — is designed to run on a local database and a server you control. That was a deliberate choice: it forces the system to be genuinely self-sufficient, and it means the app keeps working even with no internet connection at all.

## Core Features

- **Authentication & Role-Based Access** — Admin/HR and Employee roles, session-based login, forced password reset on first sign-in. No open self-registration — accounts are created by Admin/HR with an auto-generated Login ID (`DFJODO20220001` style) and temp password, matching the spec's onboarding flow.
- **Dashboards** — Employee quick-access cards + recent activity; Admin employee grid with live status dots (present / on leave / absent), search, and a "+ New Employee" flow.
- **Employee Profiles** — My Profile, Private Info (bank/PAN/UAN), Resume, Skills, Certifications, and a Security tab (Login ID + change password). Field-level edit permissions: an employee can touch their own phone/address/avatar/about/skills; everything else is Admin/HR-managed. Admin viewing another employee's profile is always read-only.
- **Attendance Tracking** — Persistent check-in/out widget in the nav, day-wise self view with month navigation, admin day-wise list across all employees with search.
- **Leave & Time-Off** — Apply via a modal (type, validity period, live-computed day allocation, remarks, attachment for sick leave), a month calendar showing your leave days, and an Admin/HR approval queue (approve/reject + comment, balance auto-deducted on approval).
- **Payroll & Salary Structure** — Wage-driven components (Basic, HRA, Standard Allowance, Performance Bonus, LTA, Fixed Allowance, PF, professional tax) computed automatically with live recalculation; read-only for employees viewing their own pay, full editing for Admin/HR with validation that components can't exceed the wage.

Built and verified screen-by-screen against both the written spec and the project's Excalidraw wireframes — see [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) for the module breakdown and team split.

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js + Tailwind CSS | File-based routing, fast dev loop, good defaults for a multi-page app built by two people |
| Backend *(planned)* | Node.js + Express | Minimal, unopinionated, easy for two people to split by module |
| Database *(planned)* | PostgreSQL + Prisma | Real relational DB running locally (not a cloud service), Prisma keeps schema/migrations/queries consistent across two backend devs |
| Real-time *(planned)* | WebSockets (`ws`) | Live attendance status without polling — the frontend already has a mock event bus (`lib/mock/events.ts`) standing in for this |
| Auth *(planned)* | JWT + bcrypt | Industry-standard, no external auth provider |

No BaaS, no third-party UI kit — Postgres will run locally (native install or a local Docker container, never a hosted/cloud instance), and Prisma is the one exception to "minimal dependencies," since it removes a whole class of hand-rolled SQL/migration bugs.

## Project Structure

```
dayflow-hrms/
├── client/                    # Next.js frontend (built)
│   ├── app/
│   │   ├── sign-in/            # Sign in
│   │   ├── reset-password/     # Forced first-login password reset
│   │   └── (app)/              # Authenticated routes (behind RequireAuth)
│   │       ├── dashboard/      # Employee / Admin dashboard
│   │       ├── profile/        # Own profile (editable)
│   │       ├── employees/      # [id] read-only profile, new/ create-employee form
│   │       ├── attendance/     # Self / admin attendance views
│   │       └── time-off/       # Calendar + apply modal / admin approval queue
│   ├── components/
│   │   ├── nav/                 # TopNav, UserMenu, AppShell
│   │   ├── auth/                 # RequireAuth guard
│   │   ├── dashboard/            # Dashboards, employee cards, status dots
│   │   ├── profile/              # ProfileView + one component per tab
│   │   ├── attendance/           # Check-in widget, self/admin views
│   │   ├── leave/                 # Balance cards, calendar, apply modal, admin queue
│   │   ├── employees/             # Create-employee form
│   │   └── ui/                    # Shared primitives (Button, TextField, Modal, Avatar, Field)
│   ├── context/                # AuthContext (session, login/logout)
│   └── lib/
│       ├── mock/                # In-memory mock "database" + mutators + event bus
│       ├── api/                 # (empty — where real fetch wrappers land later)
│       ├── types.ts             # Shared TS types, mirrors the future API contract
│       ├── payroll.ts           # Salary calculation engine
│       └── validation.ts        # Password strength, etc.
├── server/                    # Express backend — not started yet
└── docs/
    └── IMPLEMENTATION_PLAN.md  # Schema, API contract, module breakdown, team split
```

## Getting Started

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:3000** — it redirects to Sign In.

### Demo accounts

Every seeded account uses the password `Password@123`, shown on the sign-in page too.

| Account | Role | Notes |
|---|---|---|
| `admin@dayflow.local` | Admin/HR | Employee grid, attendance list, leave approvals, payroll editor |
| `john.doe@dayflow.local` | Employee | Standard employee flow |
| `riya.shah@dayflow.local` | Employee | Forced password reset on first login |

Try creating a new employee as Admin (Employees → + New Employee) — you'll get a generated Login ID and temp password to sign in with.

### Architecture note

All data lives in `client/lib/mock/db.ts`, an in-memory clone of the JSON fixtures in `client/lib/mock/*.json`. Every read/write goes through async functions in `client/lib/mock/index.ts` (`getUsers`, `applyLeave`, `checkIn`, …) that return `Promise`s even though nothing's actually async yet — that's deliberate, so swapping the mock layer for real `fetch` calls to the Express API later doesn't require touching any component. State resets on a full page reload (expected for an in-memory store); client-side navigation within the app preserves it.

The backend build starts from the schema and API contract already written out in [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — the mock layer's shapes were written to match that contract from day one.