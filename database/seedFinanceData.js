require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../server/models/User");
const FinanceTracker = require("../server/models/FinanceTracker");

const buildDate = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
};

const seedFinanceData = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/lifeOsDB",
    );

    let user = await User.findOne({ email: "test@example.com" });
    if (!user) {
      user = await User.create({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      });
    }

    await FinanceTracker.deleteMany({ userId: user._id, type: "expense" });

    const sampleExpenses = [
      {
        userId: user._id,
        type: "expense",
        amount: 350,
        currency: "BDT",
        exchangeRate: 1,
        convertedAmountBDT: 350,
        category: "Food",
        subCategory: "Breakfast",
        expenseName: "Green Tea",
        description: "Morning tea",
        paymentMethod: "Cash",
        date: buildDate(1),
      },
      {
        userId: user._id,
        type: "expense",
        amount: 90,
        currency: "SAR",
        exchangeRate: 32,
        convertedAmountBDT: 2880,
        category: "Transportation",
        subCategory: "Car Fare",
        expenseName: "Car Fare",
        description: "Airport transfer",
        paymentMethod: "Card",
        date: buildDate(2),
      },
      {
        userId: user._id,
        type: "expense",
        amount: 25,
        currency: "USD",
        exchangeRate: 120,
        convertedAmountBDT: 3000,
        category: "Technology",
        subCategory: "Tools",
        expenseName: "Hosting Renewal",
        description: "Cloud hosting monthly bill",
        paymentMethod: "Bank",
        date: buildDate(3),
      },
      {
        userId: user._id,
        type: "expense",
        amount: 1200,
        currency: "BDT",
        exchangeRate: 1,
        convertedAmountBDT: 1200,
        category: "Groceries",
        subCategory: "Eggs",
        expenseName: "Grocery",
        description: "Eggs and kitchen essentials",
        paymentMethod: "Mobile Payment",
        date: buildDate(5),
      },
      {
        userId: user._id,
        type: "expense",
        amount: 700,
        currency: "BDT",
        exchangeRate: 1,
        convertedAmountBDT: 700,
        category: "Personal Care",
        subCategory: "Haircut",
        expenseName: "Gym Fee",
        description: "Fitness club monthly pass",
        paymentMethod: "Cash",
        date: buildDate(7),
      },
      {
        userId: user._id,
        type: "expense",
        amount: 400,
        currency: "BDT",
        exchangeRate: 1,
        convertedAmountBDT: 400,
        category: "Transportation",
        subCategory: "Car Fare",
        expenseName: "Car Fare",
        description: "Office commute",
        paymentMethod: "Cash",
        date: buildDate(10),
      },
      {
        userId: user._id,
        type: "expense",
        amount: 650,
        currency: "BDT",
        exchangeRate: 1,
        convertedAmountBDT: 650,
        category: "Transportation",
        subCategory: "Car Fare",
        expenseName: "Car Fare",
        description: "Family visit transport",
        paymentMethod: "Cash",
        date: buildDate(15),
      },
    ];

    await FinanceTracker.insertMany(sampleExpenses);

    console.log(
      `Seeded ${sampleExpenses.length} finance expenses for testing.`,
    );
    process.exit(0);
  } catch (error) {
    console.error("Error seeding finance data:", error.message);
    process.exit(1);
  }
};

seedFinanceData();
