require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./db");
const JournalQuestion = require("../server/models/JournalQuestion");
const { journalQuestions } = require("../server/data/journalQuestions");

const seedQuestions = async () => {
  try {
    await connectDB();

    const operations = journalQuestions.map((item) => ({
      updateOne: {
        filter: {
          question: item.question,
          category: item.category,
        },
        update: {
          $set: {
            subCategory: item.subCategory,
            difficulty: item.difficulty,
            targetAudience: item.targetAudience,
            isActive: item.isActive,
          },
          $setOnInsert: {
            question: item.question,
            category: item.category,
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    const result = await JournalQuestion.bulkWrite(operations, {
      ordered: false,
    });
    const totalCount = await JournalQuestion.countDocuments();

    console.log("Journal questions seed complete");
    console.log(`Upserts: ${result.upsertedCount}`);
    console.log(`Modified: ${result.modifiedCount}`);
    console.log(`Total questions in DB: ${totalCount}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding journal questions:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedQuestions();
