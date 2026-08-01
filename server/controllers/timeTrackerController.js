const TimeTracker = require("../models/TimeTracker");
const Task = require("../models/Task");
const timeTrackerCategories = require("../data/timeTrackerCategories");
const { validateTimeTrackerPayload } = require("../utils/validation");
const {
  calculateDurationSeconds,
  buildAnalyticsWindow,
  getOverlapSeconds,
  normalizeTaskName,
  formatTaskName,
  toDateKey,
} = require("../utils/timeTracker");

const allowedCategories = new Set(
  timeTrackerCategories.map((category) => category.name),
);

const getTaskName = (body = {}) => (body.taskName ?? body.task ?? "").trim();

const resolveTask = async ({ userId, taskName, taskId, category }) => {
  const formattedName = formatTaskName(taskName);
  const normalizedName = normalizeTaskName(taskName);

  let task = null;

  if (taskId) {
    task = await Task.findOne({ _id: taskId, userId });
  }

  if (!task) {
    task = await Task.findOne({ userId, normalizedName });
  }

  if (task) {
    task.name = formattedName;
    task.normalizedName = normalizedName;
    task.category = category;
    task.lastUsed = new Date();
    await task.save();
    return task;
  }

  task = new Task({
    userId,
    name: formattedName,
    normalizedName,
    category,
    lastUsed: new Date(),
  });

  await task.save();
  return task;
};

const buildOverlapFilter = ({ userId, startTime, endTime, trackerId }) => {
  const filter = {
    userId,
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };

  if (trackerId) {
    filter._id = { $ne: trackerId };
  }

  return filter;
};

const buildDailySeries = (entries, windowStart, windowEnd) => {
  const dailySeries = new Map();

  entries.forEach((entry) => {
    let cursor = new Date(
      Math.max(new Date(entry.startTime).getTime(), windowStart.getTime()),
    );
    const entryEnd = new Date(
      Math.min(new Date(entry.endTime).getTime(), windowEnd.getTime()),
    );

    while (cursor < entryEnd) {
      const dayEnd = new Date(cursor);
      dayEnd.setHours(23, 59, 59, 999);
      const segmentEnd = new Date(Math.min(dayEnd.getTime(), entryEnd.getTime()));
      const seconds = Math.max(
        0,
        Math.floor((segmentEnd.getTime() - cursor.getTime()) / 1000),
      );

      if (seconds > 0) {
        const key = toDateKey(cursor);
        dailySeries.set(key, (dailySeries.get(key) || 0) + seconds);
      }

      cursor = new Date(segmentEnd.getTime() + 1000);
    }
  });

  return Array.from(dailySeries.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, seconds]) => ({ date, seconds }));
};

const timeTrackerController = {
  create: async (req, res) => {
    try {
      const taskName = getTaskName(req.body);
      const { category, startTime, endTime, notes, taskId } = req.body;
      const validation = validateTimeTrackerPayload({
        taskName,
        category,
        startTime,
        endTime,
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
      }

      if (!allowedCategories.has(category)) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: ["category must be a valid time tracker category"],
        });
      }

      const resolvedTask = await resolveTask({
        userId: req.userId,
        taskName,
        taskId,
        category,
      });

      const normalizedStartTime = new Date(startTime);
      const normalizedEndTime = new Date(endTime);

      const overlappingTracker = await TimeTracker.findOne(
        buildOverlapFilter({
          userId: req.userId,
          startTime: normalizedStartTime,
          endTime: normalizedEndTime,
        }),
      );

      if (overlappingTracker) {
        return res.status(409).json({
          success: false,
          message: "Time entry overlaps an existing entry",
        });
      }

      const durationSeconds = calculateDurationSeconds(startTime, endTime);
      const tracker = new TimeTracker({
        userId: req.userId,
        task: {
          id: resolvedTask._id,
          name: resolvedTask.name,
          normalizedName: resolvedTask.normalizedName,
        },
        category,
        startTime: normalizedStartTime,
        endTime: normalizedEndTime,
        durationSeconds,
        durationMinutes: Math.round(durationSeconds / 60),
        notes: typeof notes === "string" ? notes.trim() : "",
      });

      await tracker.save();
      res.status(201).json({ success: true, data: tracker });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  getAll: async (req, res) => {
    try {
      const trackers = await TimeTracker.find({ userId: req.userId }).sort({
        startTime: -1,
      });

      res.json({ success: true, data: trackers });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  getCategories: async (req, res) => {
    res.json({ success: true, data: timeTrackerCategories });
  },

  getAnalytics: async (req, res) => {
    try {
      const { range = "today", startDate, endDate } = req.query;
      const { windowStart, windowEnd } = buildAnalyticsWindow({
        range,
        startDate,
        endDate,
      });

      const trackers = await TimeTracker.find({
        userId: req.userId,
        startTime: { $lt: windowEnd },
        endTime: { $gt: windowStart },
      }).sort({ startTime: 1 });

      const categoryTotals = new Map();
      const taskTotals = new Map();
      let totalSeconds = 0;

      trackers.forEach((tracker) => {
        const seconds = getOverlapSeconds(
          tracker.startTime,
          tracker.endTime,
          windowStart,
          windowEnd,
        );

        if (!seconds) {
          return;
        }

        totalSeconds += seconds;
        categoryTotals.set(
          tracker.category,
          (categoryTotals.get(tracker.category) || 0) + seconds,
        );
        taskTotals.set(
          tracker.task.name,
          (taskTotals.get(tracker.task.name) || 0) + seconds,
        );
      });

      const categoryDistribution = Array.from(categoryTotals.entries())
        .map(([name, seconds]) => ({ name, seconds }))
        .sort((left, right) => right.seconds - left.seconds);

      const taskDistribution = Array.from(taskTotals.entries())
        .map(([name, seconds]) => ({ name, seconds }))
        .sort((left, right) => right.seconds - left.seconds);

      const dailySeries = buildDailySeries(trackers, windowStart, windowEnd);

      const entries = trackers
        .map((tracker) => {
          const clippedStart = new Date(
            Math.max(new Date(tracker.startTime).getTime(), windowStart.getTime()),
          );
          const clippedEnd = new Date(
            Math.min(new Date(tracker.endTime).getTime(), windowEnd.getTime()),
          );

          return {
            id: tracker._id,
            task: tracker.task,
            category: tracker.category,
            startTime: clippedStart,
            endTime: clippedEnd,
            durationSeconds: getOverlapSeconds(
              tracker.startTime,
              tracker.endTime,
              windowStart,
              windowEnd,
            ),
            notes: tracker.notes,
          };
        })
        .filter((entry) => entry.durationSeconds > 0)
        .sort((left, right) => new Date(left.startTime) - new Date(right.startTime));

      res.json({
        success: true,
        data: {
          totalSeconds,
          categoryDistribution,
          taskDistribution,
          dailySeries,
          entries,
          range,
          startDate: windowStart,
          endDate: windowEnd,
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

  update: async (req, res) => {
    try {
      const tracker = await TimeTracker.findOne({
        _id: req.params.id,
        userId: req.userId,
      });

      if (!tracker) {
        return res.status(404).json({
          success: false,
          message: "Tracker not found",
        });
      }

      const taskName = getTaskName(req.body) || tracker.task.name;
      const category = req.body.category || tracker.category;
      const startTime = req.body.startTime || tracker.startTime;
      const endTime = req.body.endTime || tracker.endTime;
      const notes =
        typeof req.body.notes === "string" ? req.body.notes.trim() : tracker.notes;

      const validation = validateTimeTrackerPayload({
        taskName,
        category,
        startTime,
        endTime,
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
      }

      if (!allowedCategories.has(category)) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: ["category must be a valid time tracker category"],
        });
      }

      const resolvedTask = await resolveTask({
        userId: req.userId,
        taskName,
        taskId: req.body.taskId,
        category,
      });

      const normalizedStartTime = new Date(startTime);
      const normalizedEndTime = new Date(endTime);
      const overlappingTracker = await TimeTracker.findOne(
        buildOverlapFilter({
          userId: req.userId,
          startTime: normalizedStartTime,
          endTime: normalizedEndTime,
          trackerId: tracker._id,
        }),
      );

      if (overlappingTracker) {
        return res.status(409).json({
          success: false,
          message: "Time entry overlaps an existing entry",
        });
      }

      tracker.task = {
        id: resolvedTask._id,
        name: resolvedTask.name,
        normalizedName: resolvedTask.normalizedName,
      };
      tracker.category = category;
      tracker.startTime = normalizedStartTime;
      tracker.endTime = normalizedEndTime;
      tracker.durationSeconds = calculateDurationSeconds(startTime, endTime);
      tracker.durationMinutes = Math.round(tracker.durationSeconds / 60);
      tracker.notes = notes;

      await tracker.save();
      res.json({ success: true, data: tracker });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  delete: async (req, res) => {
    try {
      const tracker = await TimeTracker.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId,
      });

      if (!tracker) {
        return res.status(404).json({
          success: false,
          message: "Tracker not found",
        });
      }

      res.json({ success: true, message: "Tracker deleted" });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },
};

module.exports = timeTrackerController;