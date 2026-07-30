# Personal Life OS - Complete Project Documentation

A comprehensive full-stack personal life management system combining journal, time tracker, study tracker, Islamic tracker, calorie tracker, fitness tracker, habit tracker, and finance tracker in one unified dashboard.

## 🚀 Production Readiness

This release hardens the app for local development and deployment by improving environment validation, safer API responses, auth handling, startup reliability, and a lightweight CI workflow.

## 🚀 Features

- **Dashboard** - Overview of all activities, habits, and metrics
- **Journal** - Daily journal entries with mood tracking
- **Time Tracker** - Track time spent on different activities
- **Study Tracker** - Log study sessions by subject
- **Islamic Tracker** - Track salah, Quran reading, and hadith notes
- **Calorie Tracker** - Log meals and track nutrition
- **Fitness Tracker** - Log workouts and weight
- **Habits** - Create and track daily habits with completion status
- **Finance Tracker** - Track income and expenses with analytics
- **Dark/Light Mode** - Theme toggle support
- **Full Authentication** - JWT-based authentication system
- **Responsive Design** - Works seamlessly on desktop and mobile

## 📋 Tech Stack

### Backend

- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs for password hashing

### Frontend

- React 18 + Vite
- React Router DOM
- Tailwind CSS
- Recharts for data visualization
- Lucide React for icons

## 📁 Project Structure

```
personal-life-os/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── Card.jsx
│   │   │   └── Modal.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard/
│   │   │   ├── Journal/
│   │   │   ├── TimeTracker/
│   │   │   ├── Study/
│   │   │   ├── Islamic/
│   │   │   ├── Calories/
│   │   │   ├── Fitness/
│   │   │   ├── Habits/
│   │   │   ├── Finance/
│   │   │   ├── Settings/
│   │   │   └── Auth/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
├── server/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── journalController.js
│   │   ├── timeTrackerController.js
│   │   ├── studyController.js
│   │   ├── islamicTrackerController.js
│   │   ├── calorieTrackerController.js
│   │   ├── fitnessTrackerController.js
│   │   ├── habitController.js
│   │   └── financeTrackerController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Journal.js
│   │   ├── TimeTracker.js
│   │   ├── Study.js
│   │   ├── IslamicTracker.js
│   │   ├── CalorieTracker.js
│   │   ├── FitnessTracker.js
│   │   ├── Habit.js
│   │   └── FinanceTracker.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── journalRoutes.js
│   │   ├── timeTrackerRoutes.js
│   │   ├── studyRoutes.js
│   │   ├── islamicTrackerRoutes.js
│   │   ├── calorieTrackerRoutes.js
│   │   ├── fitnessTrackerRoutes.js
│   │   ├── habitRoutes.js
│   │   └── financeTrackerRoutes.js
│   ├── middleware/
│   │   └── auth.js
│   └── server.js
├── database/
│   ├── db.js
│   └── seed.js
├── package.json
├── .env.example
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v14+)
- MongoDB (local or cloud - MongoDB Atlas)
- npm or yarn

### Backend Setup

1. **Install dependencies:**

```bash
npm install
```

2. **Create .env file** in root directory using the example file:

```bash
cp .env.example .env
```

3. **Configure your environment variables:**

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lifeOsDB
JWT_SECRET=replace-with-a-long-random-secret
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
VITE_API_URL=/api
```

4. **Seed database with demo data:**

```bash
npm run seed
```

5. **Start server:**

```bash
npm run server:dev
```

Server will run on `http://localhost:5000`

### Frontend Setup

1. **Install client dependencies:**

```bash
cd client
npm install
```

2. **Start development server:**

```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

### Run Both Concurrently

From root directory:

```bash
npm run dev
```

## 📚 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### Journal

- `GET /api/journal` - Get all journals (protected)
- `POST /api/journal` - Create journal entry (protected)
- `GET /api/journal/:id` - Get specific journal (protected)
- `PUT /api/journal/:id` - Update journal (protected)
- `DELETE /api/journal/:id` - Delete journal (protected)

### Time Tracker

- `GET /api/time-tracker` - Get all trackers (protected)
- `POST /api/time-tracker` - Create tracker (protected)
- `PUT /api/time-tracker/:id` - Update tracker (protected)
- `DELETE /api/time-tracker/:id` - Delete tracker (protected)

### Study

- `GET /api/study` - Get all study records (protected)
- `POST /api/study` - Create study record (protected)
- `PUT /api/study/:id` - Update study record (protected)
- `DELETE /api/study/:id` - Delete study record (protected)

### Islamic Tracker

- `GET /api/islamic` - Get all islamic records (protected)
- `POST /api/islamic` - Create islamic record (protected)
- `PUT /api/islamic/:id` - Update islamic record (protected)
- `DELETE /api/islamic/:id` - Delete islamic record (protected)

### Calories

- `GET /api/calories` - Get all calorie logs (protected)
- `POST /api/calories` - Create calorie log (protected)
- `PUT /api/calories/:id` - Update calorie log (protected)
- `DELETE /api/calories/:id` - Delete calorie log (protected)

### Fitness

- `GET /api/fitness` - Get all fitness logs (protected)
- `POST /api/fitness` - Create fitness log (protected)
- `PUT /api/fitness/:id` - Update fitness log (protected)
- `DELETE /api/fitness/:id` - Delete fitness log (protected)

### Habits

- `GET /api/habits` - Get all habits (protected)
- `POST /api/habits` - Create habit (protected)
- `PUT /api/habits/:id` - Update habit (protected)
- `DELETE /api/habits/:id` - Delete habit (protected)

### Finance

- `GET /api/finance` - Get all transactions (protected)
- `POST /api/finance` - Create transaction (protected)
- `PUT /api/finance/:id` - Update transaction (protected)
- `DELETE /api/finance/:id` - Delete transaction (protected)

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication:

1. User registers/logs in and receives a token
2. Token is stored in localStorage
3. Token is sent in Authorization header for protected routes: `Bearer <token>`
4. Token expires in 30 days

## 🎨 Features Details

### Dashboard

Displays a summary of:

- Daily calorie intake
- Habits completed
- Expenses and income
- Recent journal entries
- Islamic tracker progress
- Salah completion status

### Journal

- Create daily journal entries
- Add mood, activities, highlights
- View all past entries sorted by date
- Delete entries

### Time Tracker

- Track time spent on tasks
- Categorize by: Study, Fitness, Islamic, Work, Social, Sleep
- Automatic duration calculation
- Timeline view

### Study Tracker

- Log study sessions
- Multiple subjects: Web Dev, Cybersecurity, OSINT, Arabic, Islamic Studies, IT Skills
- Add notes and resources
- Track total study hours

### Islamic Tracker

- Track 5 daily salah prayers (Fajr, Dhuhr, Asr, Maghrib, Isha)
- Log Quran pages read
- Add Hadith notes
- Record adhkar

### Calorie Tracker

- Log meals: Breakfast, Lunch, Dinner, Snack
- Track calories and macros (protein, carbs, fats)
- Water intake tracking
- Daily calorie summary

### Fitness Tracker

- Log workouts by type: Cardio, Strength, Flexibility, Sports
- Track duration and calories burned
- Weight progress tracking
- Total workout statistics

### Habits

- Create daily habits
- Check off completed habits
- Category organization
- Daily completion percentage

### Finance Tracker

- Log expenses and income
- Categorize transactions
- Expense breakdown pie chart
- Balance calculation
- Monthly reports

## 📱 Responsive Design

The application is fully responsive with:

- Mobile-optimized sidebar (hamburger menu on small screens)
- Touch-friendly buttons and inputs
- Grid layouts that adapt to screen size
- Works on devices of all sizes

## 🌙 Dark Mode

Toggle between light and dark themes:

- Preference is saved to localStorage
- All components support both themes
- Smooth transitions between themes

## 🔄 State Management

Uses React Context API for:

- Authentication state (user, token, login/logout)
- Theme state (light/dark mode)
- Centralized API calls with axios interceptors

## 📊 Data Visualization

Uses Recharts for:

- Pie charts (expense breakdown)
- Bar charts (statistics)
- Line charts (trends)

## ✅ Testing

### Test User Credentials (after seeding)

- Email: `test@example.com`
- Password: `password123`

## 🚀 Deployment

### Frontend (Vercel/Netlify)

```bash
cd client
npm run build
# Deploy the dist folder
```

### Backend (Heroku/Railway)

```bash
npm run server:start
```

## 📝 Environment Variables

### Backend (.env)

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lifeOsDB
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

## 🐛 Troubleshooting

### MongoDB Connection Issues

- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in .env
- For MongoDB Atlas, ensure IP whitelist includes your IP

### CORS Errors

- Check server proxy configuration in vite.config.js
- Ensure server is running on correct port
- Set CORS_ORIGIN in .env to the frontend origin when deploying

### Token Expiration

- Tokens expire after 30 days
- Invalid or expired tokens trigger a graceful logout and redirect to login

### Build Failures

- Make sure dependencies are installed in both the root and client directories
- Run `npm run test` and `npm run client:build` to verify locally

## 📄 License

MIT License - feel free to use this project as a base for your own applications

## 👨‍💻 Author

Developed by Part-time Coder

---

**Happy Tracking! 🎯**
