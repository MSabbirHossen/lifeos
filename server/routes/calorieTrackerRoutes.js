const express = require("express");
const calorieTrackerController = require("../controllers/calorieTrackerController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/", authMiddleware, calorieTrackerController.create);
router.get("/", authMiddleware, calorieTrackerController.getAll);
router.put("/:id", authMiddleware, calorieTrackerController.update);
router.delete("/:id", authMiddleware, calorieTrackerController.delete);

module.exports = router;
