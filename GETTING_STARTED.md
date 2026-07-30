# Getting Started with Personal Life OS

Welcome! This guide will help you get the application up and running.

## ⚡ Quick Start (5 minutes)

### 1. Install Dependencies

```bash
npm install
cd client && npm install && cd ..
```

### 2. Start Application

```bash
npm run dev
```

### 3. Open in Browser

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### 4. Login

- Email: `test@example.com`
- Password: `password123`

**That's it!** You're ready to use the app.

---

## 📋 Full Setup Guide

### Prerequisites

✓ Node.js v14 or higher
✓ MongoDB (local or MongoDB Atlas)
✓ npm or yarn

### Step 1: Install Dependencies

```bash
npm install
cd client
npm install
cd ..
```

### Step 2: Configure Database

#### Option A: Local MongoDB

Ensure MongoDB is running:

```bash
mongod
```

#### Option B: MongoDB Atlas (Cloud)

1. Create free account at https://mongodb.com/cloud/atlas
2. Create a cluster
3. Copy connection string
4. Update `.env` file:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lifeOsDB
```

### Step 3: Seed Database (Optional)

Adds demo user and sample data:

```bash
npm run seed
```

### Step 4: Start Application

```bash
npm run dev
```

Both servers will start:

- React App: http://localhost:3000
- Express API: http://localhost:5000

### Step 5: Access Application

1. Open http://localhost:3000
2. Login or register
3. Explore features

---

## 🎯 Using Each Tracker

### Dashboard

Shows real-time summary of:

- Daily stats
- Recent activities
- Quick overview

### Journal

1. Click "New Entry"
2. Add title, mood, and notes
3. Submit to save

### Time Tracker

1. Click "Start Task"
2. Select category
3. Set start/end times
4. Duration auto-calculates

### Study Tracker

1. Click "Log Study"
2. Choose subject
3. Add topic and duration
4. Save notes

### Islamic Tracker

1. Click "Log"
2. Check salah prayers
3. Log Quran pages
4. Add hadith notes

### Calorie Tracker

1. Click "Log Meal"
2. Select meal type
3. Add food and calories
4. Add macros and water

### Fitness Tracker

1. Click "Log Workout"
2. Add exercise name
3. Set type and duration
4. Log calories and weight

### Habits

1. Click "New Habit"
2. Add habit name
3. Click ✓ to mark complete
4. Tracked daily

### Finance

1. Click "Add Transaction"
2. Set type (income/expense)
3. Add amount and category
4. View charts and history

---

## 🔑 Key Features

✅ **Authentication** - Secure login/register
✅ **Real-time Updates** - Data saves instantly
✅ **Dark Mode** - Toggle in sidebar
✅ **Responsive** - Works on all devices
✅ **Charts** - Visual data breakdown
✅ **Data Export** - Ready for integration
✅ **Seed Data** - Demo data included

---

## 📊 Understanding the Data

### User Registration

- Create new account with email/password
- Password is hashed securely
- Token valid for 30 days

### Data Organization

Each tracker stores:

- User ID (ensures privacy)
- Timestamp (when created)
- Tracker-specific fields
- Date for daily tracking

### Data Access

Only logged-in users see their data:

- Others cannot access your data
- Data deleted when removed
- Secure API with JWT tokens

---

## 🛠️ Troubleshooting

### "Cannot connect to MongoDB"

**Solution:**

1. Check MongoDB is running (`mongod`)
2. Or update `MONGODB_URI` in `.env`
3. For Atlas: whitelist your IP

### "Port already in use"

**Solution:**
Windows:

```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

Mac/Linux:

```bash
lsof -i :5000
kill -9 <PID>
```

### "Module not found"

**Solution:**

```bash
npm cache clean --force
rm -rf node_modules
npm install
```

### "Seed script fails"

**Solution:**

1. Ensure MongoDB is running
2. Delete existing database
3. Run seed again: `npm run seed`

---

## 📱 Mobile Usage

The app is fully responsive:

- Sidebar becomes hamburger menu
- Touch-optimized buttons
- Adapted layouts
- Works on iPhone, Android, tablets

---

## 🌙 Dark Mode

Toggle in the sidebar:

1. Click your profile area
2. Select "Dark Mode" or "Light Mode"
3. Preference saves automatically

---

## 🔒 Security Tips

1. **Change JWT Secret** (for production)
   - Edit `JWT_SECRET` in `.env`
   - Use long, random string

2. **Strong Password**
   - Use 8+ characters
   - Mix uppercase, lowercase, numbers

3. **HTTPS** (for production)
   - Deploy with SSL certificate
   - Use secure MongoDB connection

4. **Environment Variables**
   - Never commit `.env` to git
   - Already in `.gitignore`

---

## 📚 Documentation

Detailed guides available:

- **README.md** - Complete documentation
- **QUICKSTART.md** - Quick reference
- **INSTALLATION.md** - Setup details
- **PROJECT_SUMMARY.md** - Feature overview
- **FILE_INVENTORY.md** - File listing

---

## 🚀 Deployment

### Frontend (Vercel/Netlify)

```bash
cd client
npm run build
# Deploy dist/ folder
```

### Backend (Heroku/Railway)

```bash
npm run server:start
# Set environment variables on platform
```

### Environment Setup

Set on deployment platform:

```
PORT=5000
MONGODB_URI=<your_atlas_uri>
JWT_SECRET=<secure_secret>
NODE_ENV=production
```

---

## ✅ Checklist

Getting started:

- [ ] Node.js installed
- [ ] Dependencies installed
- [ ] MongoDB configured
- [ ] `.env` file set up
- [ ] Servers started
- [ ] Application loaded
- [ ] Logged in successfully

---

## 💡 Tips & Tricks

1. **Keyboard Shortcuts**
   - Focus on form with Tab
   - Submit with Enter

2. **Bulk Actions**
   - Delete entries individually
   - Or start fresh with `npm run seed`

3. **Data Backup**
   - Export from MongoDB Atlas
   - Or backup before updates

4. **Development Mode**
   - Use `npm run dev` for both servers
   - Backend hot-reloads with nodemon
   - Frontend hot-reloads with Vite

---

## 📞 Support

Issues or questions?

1. Check documentation files
2. Review error messages
3. Check browser console
4. Verify MongoDB is running

---

## 🎉 Ready to Go!

You now have everything needed to:
✅ Track your time
✅ Journal daily
✅ Monitor fitness
✅ Track habits
✅ Manage finances
✅ And much more!

---

**Enjoy your Personal Life OS experience!** 🎯

Last Updated: December 9, 2025
