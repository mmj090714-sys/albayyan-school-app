# Backend Deployment Guide

## Overview
The project now uses professional authentication that requires a backend server. You have two options:

## Option 1: Firebase Cloud Functions (Recommended for Firebase users)
**Requirements**: Upgrade Firebase project to Blaze (pay-as-you-go) plan

### Steps:
1. Visit: https://console.firebase.google.com/project/albayyan-school-app/usage/details
2. Click "Upgrade to Blaze"
3. Run: `firebase deploy --only functions`
4. The API will be available at: `https://albayyan-school-app.web.app/api`

## Option 2: Deploy Node.js Server (Free alternatives)
**Recommended Services**: Railway, Render, Heroku, or other Node.js hosting

### Environment Variables to Set:
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ChangeMe@123Secure
DIRECTOR_USERNAME=director
DIRECTOR_PASSWORD=ChangeMe@456Secure
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
DATABASE_URL=your-postgresql-url
CORS_ORIGIN=https://albayyan-school-app.web.app
```

### Client Configuration:
Set this environment variable in `client/.env`:
```
VITE_API_URL=https://your-backend-url.com
```

## Option 3: Local Development
Run the backend locally during development:
```
cd server
npm install
npm run dev
```

The client will automatically use `http://localhost:5000` by default.

---

## Current Status
- ✅ Fallback authentication removed
- ✅ Professional backend authentication implemented
- ⏳ Backend deployment pending
- ⏳ Payments API pending
- ⏳ Sessions/Terms/Fees/Invoices APIs pending

## Next Steps
1. Choose your deployment option above
2. Set up environment variables
3. Deploy the backend
4. Test login with real credentials
