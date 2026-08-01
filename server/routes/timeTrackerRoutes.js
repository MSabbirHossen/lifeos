const express = require("express");
const timeTrackerController = require("../controllers/timeTrackerController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get("/categories", authMiddleware, timeTrackerController.getCategories);
router.get("/analytics", authMiddleware, timeTrackerController.getAnalytics);
router.post("/", authMiddleware, timeTrackerController.create);
router.get("/", authMiddleware, timeTrackerController.getAll);
router.put("/:id", authMiddleware, timeTrackerController.update);
router.delete("/:id", authMiddleware, timeTrackerController.delete);

module.exports = router;
