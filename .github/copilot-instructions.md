# Albayyan International School Fee Management System

## Project Overview
Full-stack school fee management system for managing student invoices and payment tracking at Albayyan International School.

- **Backend**: Node.js/Express with Prisma ORM
- **Frontend**: React with Axios
- **Database**: PostgreSQL

## Setup Progress
- [x] Create copilot-instructions.md
- [x] Scaffold project structure
- [x] Customize project for school fees app
- [x] Install dependencies
- [x] Create and run dev server task
- [x] Ensure documentation is complete
- [x] Setup database (SQLite dev, PostgreSQL ready)
- [x] Create admin dashboard
- [x] Add enhanced API endpoints

## Development Environment
The project uses a monorepo structure with separate `server/` and `client/` directories. Each has its own `package.json` and development setup.

### Getting Started
1. Install dependencies: `npm install` (runs in both directories)
2. Set up environment variables: Copy `.env.example` to `.env` in server/
3. Set up database: `npm run db:push` in server/
4. Start development: `npm run dev` (runs both server and client)
