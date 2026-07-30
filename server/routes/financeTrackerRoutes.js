const express = require("express");
const financeTrackerController = require("../controllers/financeTrackerController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/", authMiddleware, financeTrackerController.create);
router.get("/", authMiddleware, financeTrackerController.getAll);
router.put("/:id", authMiddleware, financeTrackerController.update);
router.delete("/:id", authMiddleware, financeTrackerController.delete);

module.exports = router;
