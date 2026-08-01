const express = require("express");
const studyController = require("../controllers/studyController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get("/analytics", authMiddleware, studyController.getAnalytics);
router.get("/subjects", authMiddleware, studyController.getSubjects);
router.post("/subjects", authMiddleware, studyController.createSubject);
router.patch("/subjects/:id", authMiddleware, studyController.updateSubject);
router.delete("/subjects/:id", authMiddleware, studyController.deleteSubject);

router.get("/plans", authMiddleware, studyController.getPlans);
router.post("/plans", authMiddleware, studyController.upsertPlan);
router.patch("/plans/:id", authMiddleware, studyController.updatePlan);

router.get("/sessions", authMiddleware, studyController.getSessions);
router.post("/sessions", authMiddleware, studyController.createSession);
router.delete("/sessions/:id", authMiddleware, studyController.deleteSession);

router.post("/", authMiddleware, studyController.create);
router.get("/", authMiddleware, studyController.getAll);
router.delete("/:id", authMiddleware, studyController.delete);

module.exports = router;
