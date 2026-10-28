# ResourceLoop — Hackathon Starter

A small React + Vite frontend and Express API to get the first milestone running quickly.

## Requirements
- Node.js LTS
- npm

## Run the backend
```bash
cd backend
npm install
npm run dev
```
API: http://localhost:3000/api/health

## Run the frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```
Frontend: http://localhost:5173

The frontend calls `http://localhost:3000` by default. Set `VITE_API_URL` in `frontend/.env` if needed.

## Current MVP
- Browse sample resources
- Search by name/category
- Request a booking
- View booking requests
- Approve/reject requests through demo owner controls

## Important limitation
The backend currently stores data in memory so the team can start quickly. Data resets whenever the backend restarts. Before final submission, connect Supabase/PostgreSQL and add real authentication/role checks. The demo owner controls are not secure authentication.
