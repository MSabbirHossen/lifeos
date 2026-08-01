const express = require("express");
const fitnessTrackerController = require("../controllers/fitnessTrackerController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get(
  "/exercises",
  authMiddleware,
  fitnessTrackerController.listExercises,
);
router.post("/", authMiddleware, fitnessTrackerController.create);
router.get("/", authMiddleware, fitnessTrackerController.getAll);
router.put("/:id", authMiddleware, fitnessTrackerController.update);
router.delete("/:id", authMiddleware, fitnessTrackerController.delete);

module.exports = router;
