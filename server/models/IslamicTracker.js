const mongoose = require("mongoose");

const SALAH_STATUSES = ["PERFORMED", "MISSED"];
const SALAH_LOCATIONS = [
  "MASJID_CONGREGATION",
  "MASJID_ALONE",
  "ROOM_ALONE",
  "HOME_CONGREGATION",
];

const FASTING_TYPES = ["RAMADAN", "VOLUNTARY", "QADHA", "PROMISE"];

const salahDetailSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: SALAH_STATUSES,
      default: "MISSED",
    },
    location: {
      type: String,
      enum: SALAH_LOCATIONS,
      default: "ROOM_ALONE",
    },
    sunnah: {
      type: Boolean,
      default: false,
    },
    nafal: {
      type: Boolean,
      default: false,
    },
    mustahab: {
      type: Boolean,
      default: false,
    },
    dukhulMasjid: {
      type: Boolean,
      default: false,
    },
    tahiyyatulWudu: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false },
);

const defaultSalah = () => ({
  fajr: { status: "MISSED", location: "ROOM_ALONE" },
  dhuhr: { status: "MISSED", location: "ROOM_ALONE" },
  asr: { status: "MISSED", location: "ROOM_ALONE" },
  maghrib: { status: "MISSED", location: "ROOM_ALONE" },
  isha: { status: "MISSED", location: "ROOM_ALONE" },
});

const islamicTrackerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
    index: true,
  },
  salah: {
    type: mongoose.Schema.Types.Mixed,
    default: defaultSalah,
  },
  fasting: {
    type: Boolean,
    default: false,
  },
  fastingType: {
    type: String,
    enum: FASTING_TYPES,
    default: null,
  },
  quranPages: {
    type: Number,
    default: 0,
  },
  hadithNotes: String,
  adhkar: [String],
  qualityNotes: {
    type: String,
    default: "",
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

islamicTrackerSchema.pre("save", function updateTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

islamicTrackerSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("IslamicTracker", islamicTrackerSchema);
