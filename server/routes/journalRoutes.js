const express = require("express");
const journalController = require("../controllers/journalController");
const journalQuestionController = require("../controllers/journalQuestionController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get(
  "/questions/random",
  authMiddleware,
  journalQuestionController.getRandomQuestion,
);
router.post("/", authMiddleware, journalController.create);
router.get("/", authMiddleware, journalController.getAll);
router.get("/:id", authMiddleware, journalController.getById);
router.put("/:id", authMiddleware, journalController.update);
router.delete("/:id", authMiddleware, journalController.delete);

module.exports = router;
