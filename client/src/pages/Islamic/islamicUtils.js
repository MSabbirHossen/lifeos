export const SALAH_NAMES = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export const SALAH_LABELS = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

export const SALAH_LOCATIONS = [
  { value: "MASJID_CONGREGATION", label: "Masjid with congregation" },
  { value: "MASJID_ALONE", label: "Masjid alone" },
  { value: "ROOM_ALONE", label: "Alone in room" },
  { value: "HOME_CONGREGATION", label: "Congregation at home" },
];

export const FASTING_TYPES = [
  { value: "RAMADAN", label: "Ramadan" },
  { value: "VOLUNTARY", label: "Voluntary" },
  { value: "QADHA", label: "Qadha" },
  { value: "PROMISE", label: "Promise" },
];

export const defaultSalahEntry = () => ({
  status: "MISSED",
  location: "ROOM_ALONE",
  sunnah: false,
  nafal: false,
  mustahab: false,
  dukhulMasjid: false,
  tahiyyatulWudu: false,
  notes: "",
});

export const createDefaultDayForm = () => ({
  salah: SALAH_NAMES.reduce((acc, name) => {
    acc[name] = defaultSalahEntry();
    return acc;
  }, {}),
  fasting: false,
  fastingType: "RAMADAN",
  quranPages: 0,
  hadithNotes: "",
  qualityNotes: "",
  adhkar: [],
});

export const normalizeTrackerForm = (tracker) => {
  const fallback = createDefaultDayForm();
  if (!tracker) {
    return fallback;
  }

  const normalizedSalah = SALAH_NAMES.reduce((acc, name) => {
    const incoming = tracker?.salah?.[name];
    if (typeof incoming === "boolean") {
      acc[name] = {
        ...defaultSalahEntry(),
        status: incoming ? "PERFORMED" : "MISSED",
      };
      return acc;
    }

    acc[name] = {
      ...defaultSalahEntry(),
      ...(incoming || {}),
      status: incoming?.status === "PERFORMED" ? "PERFORMED" : "MISSED",
    };
    return acc;
  }, {});

  return {
    ...fallback,
    ...tracker,
    salah: normalizedSalah,
    fasting: Boolean(tracker.fasting),
    fastingType: tracker.fastingType || "RAMADAN",
    quranPages: Number(tracker.quranPages) || 0,
    hadithNotes: tracker.hadithNotes || "",
    qualityNotes: tracker.qualityNotes || "",
    adhkar: Array.isArray(tracker.adhkar) ? tracker.adhkar : [],
  };
};

export const formatDisplayDate = (value) => {
  return new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export const toDateInputValue = (value = new Date()) => {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

export const getStatusStyles = (status) => {
  if (status === "COMPLETE") {
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  }

  if (status === "PARTIAL") {
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
  }

  return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
};
