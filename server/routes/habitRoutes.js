const express = require("express");
const habitController = require("../controllers/habitController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/initialize", authMiddleware, habitController.initialize);
router.post("/", authMiddleware, habitController.create);
router.get("/", authMiddleware, habitController.getAll);
router.get("/templates", authMiddleware, habitController.getTemplates);
router.get("/search", authMiddleware, habitController.search);
router.get("/stats", authMiddleware, habitController.stats);
router.post("/:id/log", authMiddleware, habitController.logToday);
router.put("/:id", authMiddleware, habitController.update);
router.patch("/:id", authMiddleware, habitController.update);
router.delete("/:id", authMiddleware, habitController.delete);

module.exports = router;
