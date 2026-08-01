const Journal = require("../models/Journal");
const JournalQuestion = require("../models/JournalQuestion");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toCaseInsensitiveExactMatch = (value) =>
  new RegExp(`^${escapeRegex(value)}$`, "i");

const fetchRandomQuestion = async (match) => {
  const [question] = await JournalQuestion.aggregate([
    { $match: match },
    { $sample: { size: 1 } },
  ]);
  return question || null;
};

const getRandomQuestion = async (req, res) => {
  try {
    const { category, difficulty } = req.query;

    const baseMatch = { isActive: true };

    if (category) {
      baseMatch.category = toCaseInsensitiveExactMatch(String(category).trim());
    }

    if (difficulty) {
      baseMatch.difficulty = toCaseInsensitiveExactMatch(
        String(difficulty).trim(),
      );
    }

    const answeredQuestionIds = await Journal.distinct(
      "reflectionQuestion.questionId",
      {
        userId: req.userId,
        "reflectionQuestion.questionId": { $exists: true, $ne: null },
      },
    );

    let question = null;

    if (answeredQuestionIds.length > 0) {
      question = await fetchRandomQuestion({
        ...baseMatch,
        _id: { $nin: answeredQuestionIds },
      });
    }

    if (!question) {
      question = await fetchRandomQuestion(baseMatch);
    }

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "No active reflection question available",
      });
    }

    return res.json({
      success: true,
      question: {
        id: question._id,
        text: question.question,
        category: question.category,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  getRandomQuestion,
};
