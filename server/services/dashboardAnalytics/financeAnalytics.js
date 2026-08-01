module.exports = function analyzeFinance({ rangeData, previousData, context }) {
  const { round, convertFromBDT, toBDT, currency, rates, clamp } = context;

  const incomeBDT = rangeData
    .filter((entry) => entry.type === "income")
    .reduce((sum, entry) => sum + toBDT(entry), 0);
  const expenseBDT = rangeData
    .filter((entry) => entry.type === "expense")
    .reduce((sum, entry) => sum + toBDT(entry), 0);

  const prevIncomeBDT = previousData
    .filter((entry) => entry.type === "income")
    .reduce((sum, entry) => sum + toBDT(entry), 0);
  const prevExpenseBDT = previousData
    .filter((entry) => entry.type === "expense")
    .reduce((sum, entry) => sum + toBDT(entry), 0);

  const savingsBDT = incomeBDT - expenseBDT;
  const savingsRate =
    incomeBDT > 0 ? round((savingsBDT / incomeBDT) * 100, 1) : 0;

  const categorySpending = Object.entries(
    rangeData
      .filter((entry) => entry.type === "expense")
      .reduce((acc, entry) => {
        const key = entry.category || "Other";
        acc[key] = (acc[key] || 0) + toBDT(entry);
        return acc;
      }, {}),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const topCategory = categorySpending[0] || null;

  const converted = {
    income: round(convertFromBDT(incomeBDT, currency, rates), 2),
    expense: round(convertFromBDT(expenseBDT, currency, rates), 2),
    savings: round(convertFromBDT(savingsBDT, currency, rates), 2),
    balance: round(convertFromBDT(savingsBDT, currency, rates), 2),
  };

  const expenseControl = clamp(
    Math.round(
      100 -
        Math.min(
          (expenseBDT / Math.max(1, incomeBDT || expenseBDT)) * 100,
          100,
        ),
    ),
    0,
    100,
  );
  const budgetAdherence = clamp(
    Math.round(
      100 -
        Math.min(
          (Math.max(0, expenseBDT - incomeBDT) / Math.max(1, incomeBDT)) * 100,
          100,
        ),
    ),
    0,
    100,
  );

  const foodCurrent =
    categorySpending.find((item) => item.name.toLowerCase() === "food")
      ?.value || 0;
  const foodPrevious = previousData
    .filter(
      (entry) =>
        entry.type === "expense" &&
        String(entry.category || "").toLowerCase() === "food",
    )
    .reduce((sum, entry) => sum + toBDT(entry), 0);

  const foodLeakChange = context.calcChange(foodCurrent, foodPrevious);

  const subscriptionCurrent =
    categorySpending.find((item) =>
      item.name.toLowerCase().includes("subscription"),
    )?.value || 0;
  const subscriptionPrevious = previousData
    .filter(
      (entry) =>
        entry.type === "expense" &&
        String(entry.category || "")
          .toLowerCase()
          .includes("subscription"),
    )
    .reduce((sum, entry) => sum + toBDT(entry), 0);

  const financialHealthScore = round(
    clamp((savingsRate + expenseControl + budgetAdherence) / 3, 0, 100),
    0,
  );

  const insights = [
    {
      area: "finance",
      priority: financialHealthScore >= 75 ? "medium" : "high",
      text: `Financial health score is ${financialHealthScore}/100 with savings rate ${savingsRate}%.`,
    },
    {
      area: "finance",
      priority: "medium",
      text: `You spent ${Math.abs(foodLeakChange)}% ${foodLeakChange >= 0 ? "more" : "less"} on food this period.`,
    },
    {
      area: "finance",
      priority: "low",
      text: `Subscription expenses are ${Math.abs(context.calcChange(subscriptionCurrent, subscriptionPrevious))}% ${context.calcChange(subscriptionCurrent, subscriptionPrevious) >= 0 ? "higher" : "lower"} than previous period.`,
    },
  ];

  const summary = {
    currency,
    income: converted.income,
    expense: converted.expense,
    previousIncome: round(convertFromBDT(prevIncomeBDT, currency, rates), 2),
    previousExpense: round(convertFromBDT(prevExpenseBDT, currency, rates), 2),
    savings: converted.savings,
    balance: converted.balance,
    savingsRate,
    topCategory: topCategory
      ? {
          name: topCategory.name,
          value: round(convertFromBDT(topCategory.value, currency, rates), 2),
        }
      : null,
    financialHealthScore,
    moneyLeaks: {
      foodChangePercent: round(foodLeakChange, 1),
      subscriptionChangePercent: round(
        context.calcChange(subscriptionCurrent, subscriptionPrevious),
        1,
      ),
    },
    summary: `Current balance is ${currency} ${converted.balance}.`,
  };

  const days = context.listDays(context.window.start, context.window.days);
  const incomeVsExpense = days.map((date) => ({ date, income: 0, expense: 0 }));
  const index = new Map(incomeVsExpense.map((item, idx) => [item.date, idx]));

  rangeData.forEach((entry) => {
    const idx = index.get(context.toDateKey(entry.date));
    if (idx == null) return;
    const value = convertFromBDT(toBDT(entry), currency, rates);
    if (entry.type === "income") {
      incomeVsExpense[idx].income += value;
    } else {
      incomeVsExpense[idx].expense += value;
    }
  });

  const savingsGrowth = incomeVsExpense.map((entry, idx, arr) => {
    const cumulativeIncome = arr
      .slice(0, idx + 1)
      .reduce((sum, item) => sum + item.income, 0);
    const cumulativeExpense = arr
      .slice(0, idx + 1)
      .reduce((sum, item) => sum + item.expense, 0);
    return {
      date: entry.date,
      savings: round(cumulativeIncome - cumulativeExpense, 2),
    };
  });

  return {
    summary,
    charts: {
      incomeVsExpense: incomeVsExpense.map((entry) => ({
        date: entry.date,
        income: round(entry.income, 2),
        expense: round(entry.expense, 2),
      })),
      monthlySpending: incomeVsExpense.map((entry) => ({
        date: entry.date,
        expense: round(entry.expense, 2),
      })),
      categorySpending: categorySpending.map((entry) => ({
        name: entry.name,
        value: round(convertFromBDT(entry.value, currency, rates), 2),
      })),
      savingsGrowth,
    },
    insights,
    score: {
      value: financialHealthScore,
      changedByPercent: context.calcChange(expenseBDT, prevExpenseBDT),
    },
  };
};
