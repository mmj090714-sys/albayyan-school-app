# Development Guide

## Quick Start

After cloning the repository:

```bash
# Install dependencies
npm install

# Setup environment
cp server/.env.example server/.env
# Edit server/.env and add your database URL

# Setup database
npm run db:push --workspace=server

# Start development
npm run dev
```

## Project Structure

```
server/
├── prisma/
│   └── schema.prisma    # Database schema
├── server.js            # Express app
├── package.json
└── .env                 # Environment variables (git ignored)

client/
├── src/
│   ├── App.jsx          # Main component
│   ├── App.css          # Styling
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── index.html
├── vite.config.js
└── package.json
```

## Available Commands

### Development
- `npm run dev` - Start both backend and frontend
- `npm run dev --workspace=server` - Start backend only
- `npm run dev --workspace=client` - Start frontend only

### Database
- `npm run db:push --workspace=server` - Sync database schema
- `npm run prisma:studio --workspace=server` - Open Prisma Studio GUI

### Building
- `npm run build` - Build for production

## Environment Variables

### Server (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/albayyan_fees
PORT=5000
NODE_ENV=development
```

### Client (.env.local)
```
VITE_API_URL=http://localhost:5000
```

## Database Setup

PostgreSQL must be running locally or accessible via the DATABASE_URL.

### Local PostgreSQL (Windows)

1. Download and install from https://www.postgresql.org/download/windows/
2. During installation, set password for postgres user
3. Create database:
   ```bash
   psql -U postgres -c "CREATE DATABASE albayyan_fees;"
   ```

4. Update DATABASE_URL in .env:
   ```
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/albayyan_fees"
   ```

## Common Issues

### Port Already in Use
- Backend: Change PORT in .env
- Frontend: Change port in client/vite.config.js

### Database Connection Error
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env is correct
- Run `npm run db:push --workspace=server` to create tables

### Module Not Found
- Run `npm install` from root directory
- Check that both server/ and client/ have node_modules

## API Development

### Creating New Routes

Add to `server/server.js`:

```javascript
app.get('/api/route', async (req, res) => {
  try {
    // Your code here
    res.json({ data: 'example' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Modifying Database Schema

1. Edit `server/prisma/schema.prisma`
2. Run `npm run db:push --workspace=server`
3. Regenerate client if needed: `npm run db:generate --workspace=server`

## Frontend Development

### Creating New Components

1. Create file in `client/src/`
2. Import and use in `App.jsx` or other components
3. Changes hot-reload automatically during development

### API Calls

Use axios to call backend:

```javascript
import axios from 'axios';

const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/endpoint`);
```

## Debugging

### Backend
- Check server console for logs
- Use `npm run prisma:studio` to inspect database

### Frontend
- Open browser DevTools (F12)
- Check Network tab for API calls
- Check Console for errors

## Testing

To be implemented - see Future Enhancements in README.md

## Deployment

See main README.md for deployment guidelines.
