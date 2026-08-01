require("dotenv").config();
const mongoose = require("mongoose");
const FinanceTracker = require("../server/models/FinanceTracker");

const migrateFinanceMultiCurrency = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/lifeOsDB",
    );

    const records = await FinanceTracker.find({
      $or: [
        { currency: { $exists: false } },
        { exchangeRate: { $exists: false } },
        { convertedAmountBDT: { $exists: false } },
        { expenseName: { $exists: false } },
      ],
    });

    let updatedCount = 0;

    for (const record of records) {
      if (!record.currency) {
        record.currency = "BDT";
      }

      if (
        !record.exchangeRate ||
        Number.isNaN(record.exchangeRate) ||
        record.exchangeRate <= 0
      ) {
        record.exchangeRate = 1;
      }

      if (
        record.convertedAmountBDT == null ||
        Number.isNaN(record.convertedAmountBDT) ||
        record.convertedAmountBDT <= 0
      ) {
        record.convertedAmountBDT =
          Number(record.amount || 0) * Number(record.exchangeRate || 1);
      }

      if (!record.expenseName && record.type === "expense") {
        record.expenseName = record.description || "Expense";
      }

      await record.save();
      updatedCount += 1;
    }

    console.log(
      `Finance migration completed. Updated ${updatedCount} records.`,
    );
    process.exit(0);
  } catch (error) {
    console.error("Finance migration failed:", error.message);
    process.exit(1);
  }
};

migrateFinanceMultiCurrency();
