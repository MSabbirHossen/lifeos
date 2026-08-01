const Study = require("../models/Study");
const StudyPlan = require("../models/StudyPlan");
const StudySubject = require("../models/StudySubject");
const defaultSubjects = require("../data/studyDefaultSubjects");
const {
  validateStudySessionPayload,
  validateStudySubjectPayload,
  validateStudyPlanPayload,
} = require("../utils/validation");
const {
  normalizeStudyName,
  buildAnalyticsWindow,
  toDateKey,
} = require("../utils/study");

const ensureDefaultSubjects = async (userId) => {
  const existingSubjects = await StudySubject.find({ userId }).select(
    "normalizedName",
  );
  const existingNames = new Set(
    existingSubjects.map((subject) => subject.normalizedName),
  );

  const subjectsToInsert = defaultSubjects
    .map((name) => ({
      userId,
      name,
      normalizedName: normalizeStudyName(name),
    }))
    .filter((subject) => !existingNames.has(subject.normalizedName));

  if (subjectsToInsert.length) {
    await StudySubject.insertMany(subjectsToInsert, { ordered: false });
  }
};

const buildSubjectMap = (subjects) => {
  const byId = new Map();
  const byNormalizedName = new Map();

  subjects.forEach((subject) => {
    byId.set(String(subject._id), subject);
    byNormalizedName.set(subject.normalizedName, subject);
  });

  return { byId, byNormalizedName };
};

const resolveSubject = async ({ userId, subjectId, subject }) => {
  await ensureDefaultSubjects(userId);

  const trimmedSubject = typeof subject === "string" ? subject.trim() : "";
  const normalizedName = normalizeStudyName(trimmedSubject);

  let existingSubject = null;

  if (subjectId) {
    existingSubject = await StudySubject.findOne({ _id: subjectId, userId });
  }

  if (!existingSubject && normalizedName) {
    existingSubject = await StudySubject.findOne({ userId, normalizedName });
  }

  if (existingSubject) {
    if (existingSubject.archived) {
      existingSubject.archived = false;
      await existingSubject.save();
    }

    return existingSubject;
  }

  const createdSubject = new StudySubject({
    userId,
    name: trimmedSubject,
    normalizedName,
  });

  await createdSubject.save();
  return createdSubject;
};

const resolveTopic = async ({
  userId,
  subjectId,
  normalizedSubject,
  topic,
}) => {
  const trimmedTopic = String(topic || "").trim();
  const normalizedTopic = normalizeStudyName(trimmedTopic);

  const topicFilter = {
    userId,
    normalizedTopic,
  };

  if (subjectId) {
    topicFilter.subjectId = subjectId;
  } else {
    topicFilter.normalizedSubject = normalizedSubject;
  }

  const existingTopic = await Study.findOne(topicFilter)
    .sort({ date: -1, createdAt: -1 })
    .select("topic");

  return {
    topic: existingTopic?.topic || trimmedTopic,
    normalizedTopic,
  };
};

const serializePlan = (plan, subject) => {
  const estimatedHours = Number(plan?.estimatedHours || 0);
  const completedHours = Number(plan?.completedHours || 0);
  const totalTopics = Number(plan?.totalTopics || 0);
  const completedTopics = Number(plan?.completedTopics || 0);
  const remainingHours = Math.max(estimatedHours - completedHours, 0);
  const remainingTopics = Math.max(totalTopics - completedTopics, 0);
  const hourProgress = estimatedHours
    ? Math.min((completedHours / estimatedHours) * 100, 100)
    : 0;
  const topicProgress = totalTopics
    ? Math.min((completedTopics / totalTopics) * 100, 100)
    : 0;

  return {
    _id: plan?._id || null,
    subjectId: subject ? String(subject._id) : String(plan.subjectId),
    subjectName: subject?.name || "Unknown Subject",
    estimatedHours,
    completedHours,
    remainingHours,
    targetDate: plan?.targetDate || null,
    totalTopics,
    completedTopics,
    remainingTopics,
    progressPercent: Math.max(hourProgress, topicProgress),
    notes: plan?.notes || "",
    updatedAt: plan?.updatedAt || null,
  };
};

const buildDailyTimeline = (sessions, windowStart, windowEnd) => {
  const series = new Map();

  sessions.forEach((session) => {
    const sessionDate = new Date(session.date);

    if (sessionDate < windowStart || sessionDate > windowEnd) {
      return;
    }

    const key = toDateKey(sessionDate);
    series.set(key, (series.get(key) || 0) + session.duration);
  });

  return Array.from(series.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, minutes]) => ({ date, minutes }));
};

const sumMinutesWithinDays = (sessions, dayCount) => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (dayCount - 1));

  return sessions.reduce((total, session) => {
    const sessionDate = new Date(session.date);
    if (sessionDate >= start && sessionDate <= now) {
      return total + session.duration;
    }
    return total;
  }, 0);
};

const sumMinutesThisMonth = (sessions) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  return sessions.reduce((total, session) => {
    const sessionDate = new Date(session.date);
    if (sessionDate >= start && sessionDate <= now) {
      return total + session.duration;
    }
    return total;
  }, 0);
};

const studyController = {
  createSession: async (req, res) => {
    try {
      const payload = {
        subjectId: req.body.subjectId,
        subject: req.body.subject,
        topic: req.body.topic,
        duration: Number(req.body.duration),
        date: req.body.date,
      };
      const validation = validateStudySessionPayload(payload);

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
      }

      const subject = await resolveSubject({
        userId: req.userId,
        subjectId: req.body.subjectId,
        subject: req.body.subject,
      });

      const normalizedSubject = subject.normalizedName;
      const resolvedTopic = await resolveTopic({
        userId: req.userId,
        subjectId: subject._id,
        normalizedSubject,
        topic: req.body.topic,
      });

      const study = new Study({
        userId: req.userId,
        subjectId: subject._id,
        subject: subject.name,
        normalizedSubject,
        topic: resolvedTopic.topic,
        normalizedTopic: resolvedTopic.normalizedTopic,
        duration: Number(req.body.duration),
        notes: typeof req.body.notes === "string" ? req.body.notes.trim() : "",
        resources: Array.isArray(req.body.resources)
          ? req.body.resources.filter((item) => typeof item === "string")
          : [],
        date: req.body.date ? new Date(req.body.date) : new Date(),
      });

      await study.save();

      res.status(201).json({
        success: true,
        data: {
          ...study.toObject(),
          subjectDetails: subject,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  getSessions: async (req, res) => {
    try {
      const sessions = await Study.find({ userId: req.userId })
        .populate("subjectId")
        .sort({ date: -1, createdAt: -1 });

      res.json({ success: true, data: sessions });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  deleteSession: async (req, res) => {
    try {
      const session = await Study.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId,
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Study session not found",
        });
      }

      res.json({ success: true, message: "Study session deleted" });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  getSubjects: async (req, res) => {
    try {
      await ensureDefaultSubjects(req.userId);

      const includeArchived = req.query.includeArchived === "true";
      const filter = { userId: req.userId };

      if (!includeArchived) {
        filter.archived = false;
      }

      const subjects = await StudySubject.find(filter).sort({
        archived: 1,
        name: 1,
      });
      res.json({ success: true, data: subjects });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  createSubject: async (req, res) => {
    try {
      const validation = validateStudySubjectPayload(req.body);

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
      }

      const name = req.body.name.trim();
      const normalizedName = normalizeStudyName(name);
      let subject = await StudySubject.findOne({
        userId: req.userId,
        normalizedName,
      });

      if (subject) {
        subject.name = subject.name || name;
        subject.category =
          typeof req.body.category === "string"
            ? req.body.category.trim()
            : subject.category;
        subject.archived = false;
        await subject.save();

        return res.json({ success: true, data: subject, reused: true });
      }

      subject = new StudySubject({
        userId: req.userId,
        name,
        normalizedName,
        category:
          typeof req.body.category === "string" ? req.body.category.trim() : "",
        archived: false,
      });

      await subject.save();
      res.status(201).json({ success: true, data: subject });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  updateSubject: async (req, res) => {
    try {
      const updates = {};

      if (typeof req.body.name === "string" && req.body.name.trim()) {
        const name = req.body.name.trim();
        const normalizedName = normalizeStudyName(name);
        const conflictingSubject = await StudySubject.findOne({
          userId: req.userId,
          normalizedName,
          _id: { $ne: req.params.id },
        });

        if (conflictingSubject) {
          return res.status(409).json({
            success: false,
            message: "A study subject with this name already exists",
          });
        }

        updates.name = name;
        updates.normalizedName = normalizedName;
      }

      if (typeof req.body.category === "string") {
        updates.category = req.body.category.trim();
      }

      if (typeof req.body.archived === "boolean") {
        updates.archived = req.body.archived;
      }

      const subject = await StudySubject.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        updates,
        { new: true },
      );

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: "Study subject not found",
        });
      }

      res.json({ success: true, data: subject });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  deleteSubject: async (req, res) => {
    try {
      const subject = await StudySubject.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { archived: true },
        { new: true },
      );

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: "Study subject not found",
        });
      }

      res.json({
        success: true,
        data: subject,
        message: "Study subject archived",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  getPlans: async (req, res) => {
    try {
      await ensureDefaultSubjects(req.userId);

      const [plans, subjects] = await Promise.all([
        StudyPlan.find({ userId: req.userId }).sort({ updatedAt: -1 }),
        StudySubject.find({ userId: req.userId }),
      ]);
      const subjectMap = buildSubjectMap(subjects);

      res.json({
        success: true,
        data: plans.map((plan) =>
          serializePlan(plan, subjectMap.byId.get(String(plan.subjectId))),
        ),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  upsertPlan: async (req, res) => {
    try {
      const validation = validateStudyPlanPayload(req.body);

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
      }

      const subject = await StudySubject.findOne({
        _id: req.body.subjectId,
        userId: req.userId,
      });

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: "Study subject not found",
        });
      }

      const updates = {
        estimatedHours: Number(req.body.estimatedHours || 0),
        completedHours: Number(req.body.completedHours || 0),
        targetDate: req.body.targetDate ? new Date(req.body.targetDate) : null,
        totalTopics: Number(req.body.totalTopics || 0),
        completedTopics: Number(req.body.completedTopics || 0),
        notes: typeof req.body.notes === "string" ? req.body.notes.trim() : "",
      };

      const plan = await StudyPlan.findOneAndUpdate(
        {
          userId: req.userId,
          subjectId: req.body.subjectId,
        },
        updates,
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      );

      res.status(201).json({
        success: true,
        data: serializePlan(plan, subject),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  updatePlan: async (req, res) => {
    try {
      const plan = await StudyPlan.findOne({
        _id: req.params.id,
        userId: req.userId,
      });

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: "Study plan not found",
        });
      }

      const validation = validateStudyPlanPayload({
        ...req.body,
        subjectId: String(plan.subjectId),
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
      }

      if (req.body.estimatedHours != null) {
        plan.estimatedHours = Number(req.body.estimatedHours);
      }

      if (req.body.completedHours != null) {
        plan.completedHours = Number(req.body.completedHours);
      }

      if (req.body.totalTopics != null) {
        plan.totalTopics = Number(req.body.totalTopics);
      }

      if (req.body.completedTopics != null) {
        plan.completedTopics = Number(req.body.completedTopics);
      }

      if (req.body.targetDate !== undefined) {
        plan.targetDate = req.body.targetDate
          ? new Date(req.body.targetDate)
          : null;
      }

      if (typeof req.body.notes === "string") {
        plan.notes = req.body.notes.trim();
      }

      await plan.save();

      const subject = await StudySubject.findById(plan.subjectId);

      res.json({
        success: true,
        data: serializePlan(plan, subject),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  getAnalytics: async (req, res) => {
    try {
      await ensureDefaultSubjects(req.userId);

      const { windowStart, windowEnd } = buildAnalyticsWindow({
        range: req.query.range,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      });

      const [sessions, subjects, plans] = await Promise.all([
        Study.find({ userId: req.userId })
          .populate("subjectId")
          .sort({ date: -1, createdAt: -1 }),
        StudySubject.find({ userId: req.userId }),
        StudyPlan.find({ userId: req.userId }),
      ]);

      const subjectMap = buildSubjectMap(subjects);
      const plansBySubjectId = new Map(
        plans.map((plan) => [String(plan.subjectId), plan]),
      );
      const sessionsInWindow = sessions.filter((session) => {
        const sessionDate = new Date(session.date);
        return sessionDate >= windowStart && sessionDate <= windowEnd;
      });

      const subjectTotals = new Map();
      let totalMinutes = 0;

      sessionsInWindow.forEach((session) => {
        const subjectId = session.subjectId?._id
          ? String(session.subjectId._id)
          : session.subjectId
            ? String(session.subjectId)
            : null;
        const normalizedSubject =
          session.normalizedSubject || normalizeStudyName(session.subject);
        const subject =
          (subjectId && subjectMap.byId.get(subjectId)) ||
          subjectMap.byNormalizedName.get(normalizedSubject);
        const key = subject ? String(subject._id) : normalizedSubject;
        const current = subjectTotals.get(key) || {
          subjectId: subject ? String(subject._id) : null,
          name: subject?.name || session.subject,
          minutes: 0,
        };

        current.minutes += session.duration;
        totalMinutes += session.duration;
        subjectTotals.set(key, current);
      });

      const subjectDistribution = Array.from(subjectTotals.values())
        .sort((left, right) => right.minutes - left.minutes)
        .map((entry) => ({
          ...entry,
          share: totalMinutes
            ? Number(((entry.minutes / totalMinutes) * 100).toFixed(1))
            : 0,
        }));

      const progressData = subjects
        .map((subject) => {
          const subjectSessions = sessions.filter((session) => {
            if (session.subjectId?._id) {
              return String(session.subjectId._id) === String(subject._id);
            }

            if (session.subjectId) {
              return String(session.subjectId) === String(subject._id);
            }

            return (
              (session.normalizedSubject ||
                normalizeStudyName(session.subject)) === subject.normalizedName
            );
          });

          const uniqueTopics = new Map();
          subjectSessions.forEach((session) => {
            const normalizedTopic =
              session.normalizedTopic || normalizeStudyName(session.topic);
            if (!uniqueTopics.has(normalizedTopic)) {
              uniqueTopics.set(normalizedTopic, session.topic);
            }
          });

          const totalMinutesForSubject = subjectSessions.reduce(
            (sum, session) => sum + session.duration,
            0,
          );
          const lastStudiedAt = subjectSessions.length
            ? subjectSessions[0].date
            : null;
          const plan = plansBySubjectId.get(String(subject._id));
          const estimatedHours = Number(plan?.estimatedHours || 0);
          const completedHours = Number(plan?.completedHours || 0);
          const totalTopics = Number(plan?.totalTopics || 0);
          const completedTopics = Number(plan?.completedTopics || 0);
          const remainingHours = Math.max(
            estimatedHours -
              Math.max(completedHours, totalMinutesForSubject / 60),
            0,
          );
          const progressByHours = estimatedHours
            ? Math.min(
                (Math.max(completedHours, totalMinutesForSubject / 60) /
                  estimatedHours) *
                  100,
                100,
              )
            : 0;
          const progressByTopics = totalTopics
            ? Math.min(
                (Math.max(completedTopics, uniqueTopics.size) / totalTopics) *
                  100,
                100,
              )
            : 0;
          const neglectedDays = lastStudiedAt
            ? Math.floor(
                (Date.now() - new Date(lastStudiedAt).getTime()) / 86400000,
              )
            : null;

          return {
            subjectId: String(subject._id),
            name: subject.name,
            archived: subject.archived,
            totalMinutes: totalMinutesForSubject,
            totalHours: Number((totalMinutesForSubject / 60).toFixed(1)),
            topicsCompleted: uniqueTopics.size,
            totalTopics,
            completedTopics: Math.max(completedTopics, uniqueTopics.size),
            progressPercent: Number(
              Math.max(progressByHours, progressByTopics).toFixed(1),
            ),
            lastStudiedAt,
            remainingHours: Number(remainingHours.toFixed(1)),
            estimatedHours,
            targetDate: plan?.targetDate || null,
            neglectedDays,
            notes: plan?.notes || "",
          };
        })
        .sort((left, right) => right.totalMinutes - left.totalMinutes);

      res.json({
        success: true,
        data: {
          range: req.query.range || "7days",
          windowStart,
          windowEnd,
          totalMinutes,
          summary: {
            todayMinutes: sumMinutesWithinDays(sessions, 1),
            last7DaysMinutes: sumMinutesWithinDays(sessions, 7),
            monthMinutes: sumMinutesThisMonth(sessions),
            allTimeMinutes: sessions.reduce(
              (sum, session) => sum + session.duration,
              0,
            ),
          },
          subjectDistribution,
          dailyTimeline: buildDailyTimeline(
            sessionsInWindow,
            windowStart,
            windowEnd,
          ),
          progress: progressData,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  create: async (req, res) => studyController.createSession(req, res),
  getAll: async (req, res) => studyController.getSessions(req, res),
  delete: async (req, res) => studyController.deleteSession(req, res),
};

module.exports = studyController;
