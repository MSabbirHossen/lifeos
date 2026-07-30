const express = require("express");
const islamicTrackerController = require("../controllers/islamicTrackerController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/", authMiddleware, islamicTrackerController.create);
router.get("/", authMiddleware, islamicTrackerController.getAll);
router.put("/:id", authMiddleware, islamicTrackerController.update);
router.delete("/:id", authMiddleware, islamicTrackerController.delete);

module.exports = router;
