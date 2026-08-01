const CurrencyRate = require("../models/CurrencyRate");

const FALLBACK_RATES = {
  SAR: 32,
  USD: 120,
  BDT: 1,
};

const inMemoryCache = new Map();

const formatDateKey = (date = new Date()) => date.toISOString().slice(0, 10);

const fetchLiveRates = async () => {
  const response = await fetch("https://open.er-api.com/v6/latest/BDT");
  if (!response.ok) {
    throw new Error(`Exchange API failed with status ${response.status}`);
  }

  const payload = await response.json();
  if (!payload?.rates?.SAR || !payload?.rates?.USD) {
    throw new Error("Exchange API response missing SAR or USD rates");
  }

  return {
    SAR: 1 / Number(payload.rates.SAR),
    USD: 1 / Number(payload.rates.USD),
    BDT: 1,
    source: "open.er-api.com",
  };
};

const persistRatesForDate = async (dateKey, rates) => {
  const upserts = ["SAR", "USD", "BDT"].map((currency) =>
    CurrencyRate.findOneAndUpdate(
      { currency, date: dateKey },
      {
        currency,
        date: dateKey,
        rateToBDT: Number(rates[currency]),
        source: rates.source || "fallback",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ),
  );

  await Promise.all(upserts);
};

const getStoredRates = async (dateKey) => {
  const rows = await CurrencyRate.find({ date: dateKey }).lean();
  if (!rows.length) {
    return null;
  }

  const rates = rows.reduce(
    (acc, row) => {
      acc[row.currency] = row.rateToBDT;
      acc.source = row.source || acc.source;
      return acc;
    },
    { source: "database" },
  );

  if (!rates.BDT) {
    rates.BDT = 1;
  }

  return rates;
};

const getRatesForDate = async (date = new Date()) => {
  const dateKey = formatDateKey(date);

  if (inMemoryCache.has(dateKey)) {
    return inMemoryCache.get(dateKey);
  }

  const stored = await getStoredRates(dateKey);
  if (stored?.SAR && stored?.USD) {
    inMemoryCache.set(dateKey, stored);
    return stored;
  }

  try {
    const liveRates = await fetchLiveRates();
    await persistRatesForDate(dateKey, liveRates);
    inMemoryCache.set(dateKey, liveRates);
    return liveRates;
  } catch (error) {
    const fallbackRates = {
      ...FALLBACK_RATES,
      source: "fallback",
    };

    await persistRatesForDate(dateKey, fallbackRates);
    inMemoryCache.set(dateKey, fallbackRates);
    return fallbackRates;
  }
};

const getRateToBDT = async (currency, date = new Date()) => {
  if (!currency || currency === "BDT") {
    return { rateToBDT: 1, source: "fixed" };
  }

  const rates = await getRatesForDate(date);
  const rateToBDT = Number(rates[currency]);

  if (!rateToBDT || Number.isNaN(rateToBDT) || rateToBDT <= 0) {
    return {
      rateToBDT: Number(FALLBACK_RATES[currency] || 1),
      source: "fallback",
    };
  }

  return {
    rateToBDT,
    source: rates.source || "database",
  };
};

module.exports = {
  getRatesForDate,
  getRateToBDT,
  formatDateKey,
};
