# Vercel Deployment Guide (Free)

This guide deploys the frontend and backend on Vercel (free tier). The backend will run as serverless functions under `/api/*` and reuse your Supabase database.

## Pre-requisites
- GitHub (or GitLab/Bitbucket) repository
- Vercel account
- Supabase project with credentials

## Steps

1. Push this repository to your Git provider (e.g. GitHub).
2. Go to https://vercel.com/new and import the repo.
3. Vercel will detect a monorepo. Configure project root as `.` and set the following:
   - Framework: Other
   - Build Command: `npm run build --workspace=client`
   - Output Directory: `client/dist`

4. For the API project, in Vercel create a second project or configure a monorepo setting that points to `api/` as the root:
   - Build Command: (none) or `npm i`
   - Output Directory: Leave blank

5. Add Environment Variables in Vercel (Project Settings):
   - `SUPABASE_URL` = `https://your-project.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `<service-role-key>`
   - `JWT_SECRET` = `<random-32+ chars>`
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `DIRECTOR_USERNAME`, `DIRECTOR_PASSWORD`
   - `CORS_ORIGIN` = `https://your-app.vercel.app`
   - `NODE_ENV` = `production`

6. Deploy both projects. Vercel will route `/api/*` requests to `/api/index.js` serverless function.

## Local testing
1. Build client: `cd client && npm run build`
2. Run server locally: `cd server && npm install && node server.js`
3. Set `VITE_API_URL` to your backend URL in `client/.env.production` if needed

## Notes
- This uses your existing Express app and Supabase client; no code change required in most routes.
- If you see CORS errors, ensure `CORS_ORIGIN` matches your Vercel frontend domain exactly.
- Vercel Serverless has ephemeral file system; do not write persistent files.
