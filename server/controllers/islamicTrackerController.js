const IslamicTracker = require("../models/IslamicTracker");
const SalahBacklog = require("../models/SalahBacklog");
const IslamicPromise = require("../models/IslamicPromise");

const SALAH_NAMES = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
const SALAH_LOCATIONS = [
  "MASJID_CONGREGATION",
  "MASJID_ALONE",
  "ROOM_ALONE",
  "HOME_CONGREGATION",
];
const SALAH_STATUSES = ["PERFORMED", "MISSED"];
const FASTING_TYPES = ["RAMADAN", "VOLUNTARY", "QADHA", "PROMISE"];

const toDayStart = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const toDayEnd = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const defaultSalahEntry = () => ({
  status: "MISSED",
  location: "ROOM_ALONE",
  sunnah: false,
  nafal: false,
  mustahab: false,
  dukhulMasjid: false,
  tahiyyatulWudu: false,
  notes: "",
});

const normalizeSalah = (salah = {}) => {
  return SALAH_NAMES.reduce((acc, name) => {
    const incoming = salah[name];

    if (typeof incoming === "boolean") {
      acc[name] = {
        ...defaultSalahEntry(),
        status: incoming ? "PERFORMED" : "MISSED",
      };
      return acc;
    }

    const status = SALAH_STATUSES.includes(incoming?.status)
      ? incoming.status
      : incoming?.status === true
        ? "PERFORMED"
        : "MISSED";

    const location = SALAH_LOCATIONS.includes(incoming?.location)
      ? incoming.location
      : "ROOM_ALONE";

    acc[name] = {
      ...defaultSalahEntry(),
      ...(incoming && typeof incoming === "object" ? incoming : {}),
      status,
      location,
      sunnah: Boolean(incoming?.sunnah),
      nafal: Boolean(incoming?.nafal),
      mustahab: Boolean(incoming?.mustahab),
      dukhulMasjid: Boolean(incoming?.dukhulMasjid),
      tahiyyatulWudu: Boolean(incoming?.tahiyyatulWudu),
      notes: (incoming?.notes || "").trim(),
    };

    return acc;
  }, {});
};

const normalizeTrackerPayload = (payload = {}) => {
  const fasting = Boolean(payload.fasting);
  const fastingType = FASTING_TYPES.includes(payload.fastingType)
    ? payload.fastingType
    : null;

  return {
    salah: normalizeSalah(payload.salah || {}),
    fasting,
    fastingType: fasting ? fastingType : null,
    quranPages: Math.max(0, Number(payload.quranPages) || 0),
    hadithNotes: (payload.hadithNotes || "").trim(),
    qualityNotes: (payload.qualityNotes || "").trim(),
    adhkar: Array.isArray(payload.adhkar) ? payload.adhkar : [],
  };
};

const mapTrackerForClient = (tracker) => {
  const raw = tracker.toObject ? tracker.toObject() : tracker;
  return {
    ...raw,
    salah: normalizeSalah(raw.salah || {}),
    fasting: Boolean(raw.fasting),
    fastingType: raw.fastingType || null,
    quranPages: Number(raw.quranPages) || 0,
    hadithNotes: raw.hadithNotes || "",
    qualityNotes: raw.qualityNotes || "",
    adhkar: Array.isArray(raw.adhkar) ? raw.adhkar : [],
  };
};

const isAllSalahPerformed = (tracker) =>
  SALAH_NAMES.every((name) => tracker?.salah?.[name]?.status === "PERFORMED");

const getCalendarStatus = (tracker) => {
  const performedCount = SALAH_NAMES.filter(
    (name) => tracker?.salah?.[name]?.status === "PERFORMED",
  ).length;

  if (performedCount === SALAH_NAMES.length) {
    return "COMPLETE";
  }

  if (performedCount === 0) {
    return "MISSED";
  }

  return "PARTIAL";
};

const buildBacklogStats = (backlog) => {
  if (!backlog?.startDate) {
    return {
      startDate: null,
      totalDays: 0,
      completedDays: 0,
      remainingDays: 0,
      progressPercentage: 0,
      notes: "",
      wasFastingOnStartDate: false,
    };
  }

  const start = toDayStart(backlog.startDate);
  const today = toDayStart(new Date());
  const totalDays = Math.max(
    0,
    Math.floor((today.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1,
  );
  const completedDays = Math.min(
    totalDays,
    Math.max(0, backlog.completedDays || 0),
  );
  const remainingDays = Math.max(0, totalDays - completedDays);
  const progressPercentage = totalDays
    ? Number(((completedDays / totalDays) * 100).toFixed(1))
    : 0;

  return {
    startDate: backlog.startDate,
    totalDays,
    completedDays,
    remainingDays,
    progressPercentage,
    notes: backlog.notes || "",
    wasFastingOnStartDate: Boolean(backlog.wasFastingOnStartDate),
  };
};

const islamicTrackerController = {
  create: async (req, res) => {
    try {
      const payload = normalizeTrackerPayload(req.body);
      const targetDate = req.body.date ? new Date(req.body.date) : new Date();
      const dayStart = toDayStart(targetDate);
      const dayEnd = toDayEnd(targetDate);

      const tracker = await IslamicTracker.findOneAndUpdate(
        {
          userId: req.userId,
          date: {
            $gte: dayStart,
            $lte: dayEnd,
          },
        },
        {
          ...payload,
          date: dayStart,
          updatedAt: new Date(),
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      );

      res.status(201).json(mapTrackerForClient(tracker));
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const trackers = await IslamicTracker.find({ userId: req.userId }).sort({
        date: -1,
      });
      res.json(trackers.map(mapTrackerForClient));
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  getToday: async (req, res) => {
    try {
      const dayStart = toDayStart(new Date());
      const dayEnd = toDayEnd(new Date());
      const tracker = await IslamicTracker.findOne({
        userId: req.userId,
        date: { $gte: dayStart, $lte: dayEnd },
      });

      res.json({
        success: true,
        data: tracker ? mapTrackerForClient(tracker) : null,
      });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          message: "Server error",
          error: error.message,
        });
    }
  },

  getSummary: async (req, res) => {
    try {
      const [trackers, backlog, promises] = await Promise.all([
        IslamicTracker.find({ userId: req.userId }).sort({ date: -1 }),
        SalahBacklog.findOne({ userId: req.userId }),
        IslamicPromise.find({ userId: req.userId }).sort({ createdAt: -1 }),
      ]);

      const normalizedTrackers = trackers.map(mapTrackerForClient);
      const today = toDayStart(new Date());
      const last30Start = new Date(today);
      last30Start.setDate(last30Start.getDate() - 29);

      const last30Trackers = normalizedTrackers.filter((tracker) => {
        const date = new Date(tracker.date);
        return date >= last30Start && date <= toDayEnd(today);
      });

      const locationCounts = {
        MASJID_CONGREGATION: 0,
        MASJID_ALONE: 0,
        ROOM_ALONE: 0,
        HOME_CONGREGATION: 0,
      };

      let locationTotal = 0;
      last30Trackers.forEach((tracker) => {
        SALAH_NAMES.forEach((name) => {
          if (tracker.salah[name].status === "PERFORMED") {
            const location = tracker.salah[name].location;
            if (locationCounts[location] != null) {
              locationCounts[location] += 1;
              locationTotal += 1;
            }
          }
        });
      });

      const locationDistribution = Object.entries(locationCounts).map(
        ([location, count]) => ({
          location,
          count,
          percentage: locationTotal
            ? Number(((count / locationTotal) * 100).toFixed(1))
            : 0,
        }),
      );

      const trackerByDateKey = new Map(
        normalizedTrackers.map((tracker) => {
          const key = toDayStart(tracker.date).toISOString().slice(0, 10);
          return [key, tracker];
        }),
      );

      const calendar = [];
      for (let index = 0; index < 30; index += 1) {
        const date = new Date(last30Start);
        date.setDate(last30Start.getDate() + index);
        const key = date.toISOString().slice(0, 10);
        const tracker = trackerByDateKey.get(key);
        calendar.push({
          date: key,
          status: tracker ? getCalendarStatus(tracker) : "MISSED",
        });
      }

      let currentStreak = 0;
      const dateCursor = new Date(today);
      while (true) {
        const key = dateCursor.toISOString().slice(0, 10);
        const tracker = trackerByDateKey.get(key);
        if (!tracker || !isAllSalahPerformed(tracker)) {
          break;
        }
        currentStreak += 1;
        dateCursor.setDate(dateCursor.getDate() - 1);
      }

      const todayTracker =
        trackerByDateKey.get(today.toISOString().slice(0, 10)) || null;

      const normalizedPromises = promises.map((promise) => {
        const targetAmount = Math.max(1, Number(promise.targetAmount) || 1);
        const completedAmount = Math.min(
          targetAmount,
          Math.max(0, Number(promise.completedAmount) || 0),
        );
        return {
          ...promise.toObject(),
          targetAmount,
          completedAmount,
          remainingAmount: Math.max(0, targetAmount - completedAmount),
        };
      });

      res.json({
        success: true,
        data: {
          today: todayTracker,
          backlog: buildBacklogStats(backlog),
          currentStreak,
          locationDistribution,
          calendar,
          promises: normalizedPromises,
          totals: {
            entries: normalizedTrackers.length,
            completeDays: normalizedTrackers.filter(isAllSalahPerformed).length,
          },
        },
      });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          message: "Server error",
          error: error.message,
        });
    }
  },

  getBacklog: async (req, res) => {
    try {
      const backlog = await SalahBacklog.findOne({ userId: req.userId });
      res.json({ success: true, data: buildBacklogStats(backlog) });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          message: "Server error",
          error: error.message,
        });
    }
  },

  upsertBacklog: async (req, res) => {
    try {
      const startDate = new Date(req.body.startDate);
      if (Number.isNaN(startDate.getTime())) {
        return res
          .status(400)
          .json({ success: false, message: "startDate must be a valid date" });
      }

      const payload = {
        startDate: toDayStart(startDate),
        completedDays: Math.max(0, Number(req.body.completedDays) || 0),
        wasFastingOnStartDate: Boolean(req.body.wasFastingOnStartDate),
        notes: (req.body.notes || "").trim(),
      };

      const backlog = await SalahBacklog.findOneAndUpdate(
        { userId: req.userId },
        payload,
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      );

      res.json({ success: true, data: buildBacklogStats(backlog) });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          message: "Server error",
          error: error.message,
        });
    }
  },

  getPromises: async (req, res) => {
    try {
      const promises = await IslamicPromise.find({ userId: req.userId }).sort({
        createdAt: -1,
      });
      const mapped = promises.map((promise) => {
        const targetAmount = Math.max(1, Number(promise.targetAmount) || 1);
        const completedAmount = Math.min(
          targetAmount,
          Math.max(0, Number(promise.completedAmount) || 0),
        );
        return {
          ...promise.toObject(),
          targetAmount,
          completedAmount,
          remainingAmount: Math.max(0, targetAmount - completedAmount),
        };
      });
      res.json({ success: true, data: mapped });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          message: "Server error",
          error: error.message,
        });
    }
  },

  createPromise: async (req, res) => {
    try {
      const type = req.body.type;
      if (!["SALAH", "FAST"].includes(type)) {
        return res
          .status(400)
          .json({ success: false, message: "type must be SALAH or FAST" });
      }

      const targetAmount = Number(req.body.targetAmount);
      if (Number.isNaN(targetAmount) || targetAmount <= 0) {
        return res
          .status(400)
          .json({
            success: false,
            message: "targetAmount must be greater than 0",
          });
      }

      const completedAmount = Math.max(
        0,
        Number(req.body.completedAmount) || 0,
      );

      const promise = await IslamicPromise.create({
        userId: req.userId,
        type,
        title: (req.body.title || `${type} Promise`).trim(),
        targetAmount,
        completedAmount: Math.min(targetAmount, completedAmount),
        notes: (req.body.notes || "").trim(),
      });

      res.status(201).json({
        success: true,
        data: {
          ...promise.toObject(),
          remainingAmount: Math.max(
            0,
            promise.targetAmount - promise.completedAmount,
          ),
        },
      });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          message: "Server error",
          error: error.message,
        });
    }
  },

  updatePromise: async (req, res) => {
    try {
      const update = {};
      if (req.body.type) {
        if (!["SALAH", "FAST"].includes(req.body.type)) {
          return res
            .status(400)
            .json({ success: false, message: "type must be SALAH or FAST" });
        }
        update.type = req.body.type;
      }

      if (req.body.title != null) {
        update.title = String(req.body.title).trim();
      }

      if (req.body.notes != null) {
        update.notes = String(req.body.notes).trim();
      }

      if (req.body.targetAmount != null) {
        const targetAmount = Number(req.body.targetAmount);
        if (Number.isNaN(targetAmount) || targetAmount <= 0) {
          return res
            .status(400)
            .json({
              success: false,
              message: "targetAmount must be greater than 0",
            });
        }
        update.targetAmount = targetAmount;
      }

      if (req.body.completedAmount != null) {
        const completedAmount = Number(req.body.completedAmount);
        if (Number.isNaN(completedAmount) || completedAmount < 0) {
          return res
            .status(400)
            .json({
              success: false,
              message: "completedAmount must be 0 or greater",
            });
        }
        update.completedAmount = completedAmount;
      }

      const promise = await IslamicPromise.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        update,
        { new: true },
      );

      if (!promise) {
        return res
          .status(404)
          .json({ success: false, message: "Promise not found" });
      }

      const targetAmount = Math.max(1, Number(promise.targetAmount) || 1);
      const completedAmount = Math.min(
        targetAmount,
        Math.max(0, Number(promise.completedAmount) || 0),
      );

      if (completedAmount !== promise.completedAmount) {
        promise.completedAmount = completedAmount;
        await promise.save();
      }

      res.json({
        success: true,
        data: {
          ...promise.toObject(),
          targetAmount,
          completedAmount,
          remainingAmount: Math.max(0, targetAmount - completedAmount),
        },
      });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          message: "Server error",
          error: error.message,
        });
    }
  },

  deletePromise: async (req, res) => {
    try {
      const promise = await IslamicPromise.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId,
      });

      if (!promise) {
        return res
          .status(404)
          .json({ success: false, message: "Promise not found" });
      }

      res.json({ success: true, message: "Promise deleted" });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          message: "Server error",
          error: error.message,
        });
    }
  },

  update: async (req, res) => {
    try {
      const payload = {
        ...normalizeTrackerPayload(req.body),
        updatedAt: new Date(),
      };

      const tracker = await IslamicTracker.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        payload,
        { new: true },
      );

      if (!tracker) {
        return res
          .status(404)
          .json({ success: false, message: "Islamic tracker not found" });
      }

      res.json({ success: true, data: mapTrackerForClient(tracker) });
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
      const tracker = await IslamicTracker.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId,
      });
      if (!tracker) {
        return res
          .status(404)
          .json({ success: false, message: "Islamic tracker not found" });
      }
      res.json({ success: true, message: "Islamic tracker deleted" });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },
};

module.exports = islamicTrackerController;
