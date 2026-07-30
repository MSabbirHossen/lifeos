# INSTALLATION & GETTING STARTED

## Prerequisites

- Node.js v14+ installed
- MongoDB (local or MongoDB Atlas account)
- npm or yarn package manager

## Step-by-Step Installation

### 1. Navigate to Project Directory

```
cd personal-life-os
```

### 2. Install Root Dependencies

```
npm install
```

### 3. Install Client Dependencies

```
cd client
npm install
cd ..
```

### 4. Setup MongoDB

#### Option A: Local MongoDB

Make sure MongoDB is running:

```
mongod
```

#### Option B: MongoDB Atlas (Cloud)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Update MONGODB_URI in .env:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lifeOsDB
```

### 5. Configure Environment

The .env file is already set up with defaults:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lifeOsDB
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

Change JWT_SECRET to something secure for production.

### 6. Seed Database (Optional but Recommended)

This creates a test user and sample data:

```
npm run seed
```

Test Credentials:

- Email: test@example.com
- Password: password123

### 7. Start Both Servers

```
npm run dev
```

The application will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Running Individual Servers

### Backend Only

```
npm run server:dev
```

### Frontend Only

```
npm run client:dev
```

## Building for Production

### Build Frontend

```
cd client
npm run build
cd ..
```

The built files will be in `client/dist/`

### Start Production Server

```
npm run server:start
```

## Available Commands

```
npm run dev              - Start both frontend and backend
npm run server:dev      - Start backend with hot-reload
npm run client:dev      - Start frontend with hot-reload
npm run seed            - Populate database with demo data
npm run build           - Build frontend for production
npm run server:start    - Start backend in production
```

## First Time Setup Complete!

1. ✅ Dependencies installed
2. ✅ Environment configured
3. ✅ Database connected
4. ✅ Demo data seeded
5. ✅ Servers running

## Next Steps

1. Open http://localhost:3000 in your browser
2. Login with test@example.com / password123
3. Explore all the features!
4. Create your own entries
5. Try different trackers

## Troubleshooting

### Port Already in Use

If port 5000 or 3000 is already in use:

```
# Windows - Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux - Kill process on port 5000
lsof -i :5000
kill -9 <PID>
```

### MongoDB Connection Error

- Check MongoDB is running
- Verify MONGODB_URI in .env
- Check firewall settings

### Dependencies Not Installed

```
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Clear Old Data

To reset database and reseed:

```
npm run seed
```

This will clear all existing data and create fresh demo data.

## Project Structure Quick Reference

```
personal-life-os/
├── client/              ← Frontend (React + Vite)
├── server/              ← Backend (Express)
├── database/            ← Database setup
├── package.json         ← Root dependencies
├── .env                 ← Environment config
├── README.md            ← Full documentation
├── QUICKSTART.md        ← Quick reference
└── PROJECT_SUMMARY.md   ← Project overview
```

## Features Overview

- 📊 Dashboard - Overview of all activities
- 📔 Journal - Daily journal entries
- ⏱️ Time Tracker - Track time on tasks
- 📚 Study Tracker - Log study sessions
- 📿 Islamic Tracker - Salah, Quran, Hadith
- 🍎 Calorie Tracker - Meal and nutrition tracking
- 💪 Fitness Tracker - Workouts and weight
- ✅ Habits - Daily habit tracking
- 💰 Finance - Income and expense tracking
- 🌙 Dark Mode - Light/Dark theme toggle

## Support

For issues:

1. Check the README.md for detailed documentation
2. Review QUICKSTART.md for quick reference
3. Check server console for error messages
4. Verify MongoDB is running
5. Clear browser cache if UI issues

## Security Notes

For production deployment:

1. Change JWT_SECRET in .env
2. Use environment-specific configs
3. Enable HTTPS
4. Configure CORS properly
5. Use strong MongoDB password
6. Keep dependencies updated

## Deployment

### Frontend (Vercel, Netlify, etc.)

```
cd client
npm run build
# Deploy the dist/ folder
```

### Backend (Heroku, Railway, etc.)

```
npm run server:start
```

## Questions?

All documentation is in:

- README.md - Complete guide
- QUICKSTART.md - Quick reference
- PROJECT_SUMMARY.md - Feature overview

---

Enjoy your Personal Life OS! 🎯
