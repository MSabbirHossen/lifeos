const express = require("express");
const financeTrackerController = require("../controllers/financeTrackerController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get(
  "/categories",
  authMiddleware,
  financeTrackerController.getCategories,
);
router.get(
  "/suggestions",
  authMiddleware,
  financeTrackerController.getSuggestions,
);
router.get("/rates", authMiddleware, financeTrackerController.getRates);
router.get("/analytics", authMiddleware, financeTrackerController.getAnalytics);
router.post(
  "/migrate-legacy",
  authMiddleware,
  financeTrackerController.migrateLegacyRecords,
);
router.post("/", authMiddleware, financeTrackerController.create);
router.get("/", authMiddleware, financeTrackerController.getAll);
router.put("/:id", authMiddleware, financeTrackerController.update);
router.delete("/:id", authMiddleware, financeTrackerController.delete);

module.exports = router;
