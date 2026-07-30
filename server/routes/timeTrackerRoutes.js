const express = require("express");
const timeTrackerController = require("../controllers/timeTrackerController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/", authMiddleware, timeTrackerController.create);
router.get("/", authMiddleware, timeTrackerController.getAll);
router.put("/:id", authMiddleware, timeTrackerController.update);
router.delete("/:id", authMiddleware, timeTrackerController.delete);

module.exports = router;
