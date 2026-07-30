require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./server/models/User");
const Journal = require("./server/models/Journal");
const TimeTracker = require("./server/models/TimeTracker");
const Study = require("./server/models/Study");
const IslamicTracker = require("./server/models/IslamicTracker");
const CalorieTracker = require("./server/models/CalorieTracker");
const FitnessTracker = require("./server/models/FitnessTracker");
const Habit = require("./server/models/Habit");
const FinanceTracker = require("./server/models/FinanceTracker");

const seedDatabase = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/lifeOsDB",
    );
    console.log("Connected to MongoDB");

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Journal.deleteMany({}),
      TimeTracker.deleteMany({}),
      Study.deleteMany({}),
      IslamicTracker.deleteMany({}),
      CalorieTracker.deleteMany({}),
      FitnessTracker.deleteMany({}),
      Habit.deleteMany({}),
      FinanceTracker.deleteMany({}),
    ]);

    // Create test user
    const user = await User.create({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });
    console.log("Test user created:", user.email);

    // Create sample journals
    const journals = await Journal.insertMany([
      {
        userId: user._id,
        title: "Great Day at Work",
        mood: "happy",
        highlights: "Completed project milestone",
        notes:
          "Had a productive day, finished the feature implementation ahead of schedule.",
        date: new Date(),
      },
      {
        userId: user._id,
        title: "Learning React",
        mood: "excited",
        highlights: "Understood hooks better",
        notes: "Spent time learning React hooks and implementing custom hooks.",
        date: new Date(Date.now() - 86400000),
      },
    ]);
    console.log("Journals created:", journals.length);

    // Create sample time trackers
    const trackers = await TimeTracker.insertMany([
      {
        userId: user._id,
        task: "Study React",
        category: "Study",
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(),
        duration: 60,
      },
      {
        userId: user._id,
        task: "Morning Run",
        category: "Fitness",
        startTime: new Date(Date.now() - 1800000),
        endTime: new Date(),
        duration: 30,
      },
    ]);
    console.log("Time trackers created:", trackers.length);

    // Create sample study records
    const studies = await Study.insertMany([
      {
        userId: user._id,
        subject: "Web Dev",
        topic: "React Components",
        duration: 120,
        notes: "Learned about functional components and hooks",
      },
    ]);
    console.log("Study records created:", studies.length);

    // Create sample islamic tracker
    const islamic = await IslamicTracker.insertMany([
      {
        userId: user._id,
        salah: {
          fajr: true,
          dhuhr: true,
          asr: true,
          maghrib: false,
          isha: false,
        },
        quranPages: 2,
        hadithNotes: "Hadith about intention",
      },
    ]);
    console.log("Islamic trackers created:", islamic.length);

    // Create sample calorie tracker
    const calories = await CalorieTracker.insertMany([
      {
        userId: user._id,
        mealType: "breakfast",
        foodName: "Oatmeal with berries",
        calories: 350,
        macros: { protein: 10, carbs: 60, fats: 5 },
        waterIntake: 500,
      },
      {
        userId: user._id,
        mealType: "lunch",
        foodName: "Grilled chicken with rice",
        calories: 650,
        macros: { protein: 45, carbs: 50, fats: 15 },
        waterIntake: 750,
      },
    ]);
    console.log("Calorie trackers created:", calories.length);

    // Create sample fitness tracker
    const fitness = await FitnessTracker.insertMany([
      {
        userId: user._id,
        exercise: "Running",
        type: "cardio",
        duration: 30,
        caloriesBurned: 300,
        weight: 75.5,
      },
    ]);
    console.log("Fitness trackers created:", fitness.length);

    // Create sample habits
    const habits = await Habit.insertMany([
      {
        userId: user._id,
        habitName: "Drink 8 glasses of water",
        category: "Health",
        status: true,
      },
      {
        userId: user._id,
        habitName: "Read 30 minutes",
        category: "Learning",
        status: false,
      },
      {
        userId: user._id,
        habitName: "Exercise",
        category: "Fitness",
        status: true,
      },
    ]);
    console.log("Habits created:", habits.length);

    // Create sample finance tracker
    const finance = await FinanceTracker.insertMany([
      {
        userId: user._id,
        type: "income",
        amount: 3000,
        source: "Salary",
        date: new Date(),
      },
      {
        userId: user._id,
        type: "expense",
        amount: 150,
        category: "Food",
        description: "Grocery shopping",
      },
      {
        userId: user._id,
        type: "expense",
        amount: 50,
        category: "Transport",
        description: "Gas",
      },
    ]);
    console.log("Finance trackers created:", finance.length);

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
