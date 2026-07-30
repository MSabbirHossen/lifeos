# 🚀 Quick Start Guide

## Installation Steps

### 1. Install Backend Dependencies

```bash
npm install
```

### 2. Install Frontend Dependencies

```bash
cd client
npm install
cd ..
```

### 3. Start MongoDB

Make sure MongoDB is running locally or update MONGODB_URI in .env to use MongoDB Atlas with the lifeOsDB database name.

### 4. Seed Database (Optional - for demo data)

```bash
npm run seed
```

### 5. Start Both Servers

```bash
npm run dev
```

This will start:

- Backend API on http://localhost:5000
- Frontend on http://localhost:3000

### 6. Login

After seeding, use these credentials:

- Email: `test@example.com`
- Password: `password123`

Or register a new account.

## Project Structure Overview

- **`/server`** - Express API with controllers, models, routes
- **`/client`** - React Vite app with components and pages
- **`/database`** - MongoDB connection and seed script

## Key Scripts

```bash
npm run dev              # Run both frontend and backend
npm run server:dev      # Run only backend with nodemon
npm run client:dev      # Run only frontend
npm run seed            # Seed database with demo data
npm run build           # Build frontend for production
npm run server:start    # Start backend for production
```

## Features at a Glance

| Feature         | Location        | Status      |
| --------------- | --------------- | ----------- |
| Dashboard       | `/dashboard`    | ✅ Complete |
| Journal         | `/journal`      | ✅ Complete |
| Time Tracker    | `/time-tracker` | ✅ Complete |
| Study Tracker   | `/study`        | ✅ Complete |
| Islamic Tracker | `/islamic`      | ✅ Complete |
| Calorie Tracker | `/calories`     | ✅ Complete |
| Fitness Tracker | `/fitness`      | ✅ Complete |
| Habits          | `/habits`       | ✅ Complete |
| Finance         | `/finance`      | ✅ Complete |
| Dark Mode       | Settings        | ✅ Complete |
| Authentication  | Auth System     | ✅ Complete |

## Database Schema

All data is stored in MongoDB with user-specific documents. Each tracker stores:

- `userId` - Reference to the user
- `date` - When the entry was created
- Tracker-specific fields (varies by tracker type)

## API Request Example

```javascript
// Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

// Response
{
  "token": "jwt_token_here",
  "user": { "id": "...", "username": "...", "email": "..." }
}

// Create Journal Entry
POST /api/journal
Authorization: Bearer jwt_token_here
{
  "title": "Great Day",
  "mood": "happy",
  "notes": "Had a productive day"
}
```

## Frontend Architecture

- **Pages** - Each tracker has its own page component
- **Components** - Reusable components (Sidebar, Header, Card, Modal)
- **Context** - AuthContext and ThemeContext for state management
- **Utils** - API client with axios

## Backend Architecture

- **Controllers** - Business logic for each feature
- **Models** - MongoDB schema definitions
- **Routes** - API endpoints
- **Middleware** - Authentication middleware

## Dark Mode

The app automatically saves your theme preference. Switch in the sidebar.

## Troubleshooting

### "Cannot find module" errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### MongoDB connection error

- Check if MongoDB is running: `mongod`
- Or update MONGODB_URI to use MongoDB Atlas: `mongodb+srv://user:pass@cluster.mongodb.net/personal-life-os`

### Port already in use

```bash
# Kill process on port 5000 (backend)
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Start servers
3. ✅ Explore features
4. ✅ Create your own data
5. ✅ Customize as needed

---

For full documentation, see README.md

Happy tracking! 🎯
