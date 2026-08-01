const express = require("express");
const islamicTrackerController = require("../controllers/islamicTrackerController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get("/summary", authMiddleware, islamicTrackerController.getSummary);
router.get("/today", authMiddleware, islamicTrackerController.getToday);
router.get("/backlog", authMiddleware, islamicTrackerController.getBacklog);
router.put("/backlog", authMiddleware, islamicTrackerController.upsertBacklog);
router.get("/promises", authMiddleware, islamicTrackerController.getPromises);
router.post(
  "/promises",
  authMiddleware,
  islamicTrackerController.createPromise,
);
router.put(
  "/promises/:id",
  authMiddleware,
  islamicTrackerController.updatePromise,
);
router.delete(
  "/promises/:id",
  authMiddleware,
  islamicTrackerController.deletePromise,
);
router.post("/", authMiddleware, islamicTrackerController.create);
router.get("/", authMiddleware, islamicTrackerController.getAll);
router.put("/:id", authMiddleware, islamicTrackerController.update);
router.delete("/:id", authMiddleware, islamicTrackerController.delete);

module.exports = router;
