const EXPENSE_CATEGORIES = [
  {
    category: "Food",
    subCategories: [
      "Breakfast",
      "Lunch",
      "Dinner",
      "Snacks",
      "Drinks",
      "Restaurant",
      "Fast Food",
      "Sahri",
      "Iftar",
    ],
  },
  {
    category: "Groceries",
    subCategories: [
      "Rice",
      "Dal",
      "Oil",
      "Vegetables",
      "Meat",
      "Fish",
      "Eggs",
      "Fruits",
      "Kitchen Supplies",
    ],
  },
  {
    category: "Transportation",
    subCategories: [
      "Bus",
      "Taxi",
      "Car Fare",
      "Uber",
      "Religious Travel",
      "Tour Travel",
    ],
  },
  {
    category: "Housing",
    subCategories: ["Rent", "Utilities", "Maintenance", "Cleaning"],
  },
  {
    category: "Technology",
    subCategories: [
      "Laptop",
      "Mobile",
      "Accessories",
      "Repair",
      "Internet",
      "SIM",
      "Recharge",
    ],
  },
  {
    category: "Clothing",
    subCategories: ["Clothes", "Shoes", "Sandal", "Accessories"],
  },
  {
    category: "Personal Care",
    subCategories: ["Haircut", "Medicine", "Personal Items"],
  },
  {
    category: "Religion",
    subCategories: ["Umrah", "Donation", "Kaffara", "Fitra", "Islamic Event"],
  },
  {
    category: "Education",
    subCategories: ["Books", "Exam", "Course", "Printing"],
  },
  {
    category: "Career",
    subCategories: ["Domain", "Hosting", "Tools", "Promotion"],
  },
  {
    category: "Family",
    subCategories: ["Parents", "Home Support", "Gifts"],
  },
  {
    category: "Debt",
    subCategories: ["Loan Payment", "Payback"],
  },
  {
    category: "Shopping",
    subCategories: ["General Shopping", "Amazon", "Market"],
  },
  {
    category: "Social",
    subCategories: ["Picnic", "Party", "Friends"],
  },
  {
    category: "Fees",
    subCategories: ["Registration", "Official Fees"],
  },
  {
    category: "Other",
    subCategories: [],
  },
];

const INCOME_CATEGORIES = [
  "Salary",
  "Scholarship",
  "Freelance",
  "Business",
  "Family Support",
  "Gift",
  "Refund",
  "Investment",
  "Other",
].map((category) => ({
  category,
  subCategories: [],
}));

const TRANSFER_CATEGORIES = [
  { category: "Account Transfer", subCategories: [] },
  { category: "Savings Move", subCategories: [] },
  { category: "Wallet Top-up", subCategories: [] },
  { category: "Other", subCategories: [] },
];

const SUPPORTED_CURRENCIES = ["BDT", "SAR", "USD"];
const PAYMENT_METHODS = [
  "Cash",
  "Card",
  "Bank",
  "Mobile Payment",
  "Mobile Banking",
];

const TRANSACTION_TYPES = ["expense", "income", "transfer"];

const getCategoryTree = (transactionType = "expense") => {
  if (transactionType === "income") {
    return INCOME_CATEGORIES;
  }

  if (transactionType === "transfer") {
    return TRANSFER_CATEGORIES;
  }

  return EXPENSE_CATEGORIES;
};

const FINANCE_CATEGORY_SET = new Set(
  EXPENSE_CATEGORIES.map((item) => item.category),
);

const INCOME_CATEGORY_SET = new Set(
  INCOME_CATEGORIES.map((item) => item.category),
);

const TRANSFER_CATEGORY_SET = new Set(
  TRANSFER_CATEGORIES.map((item) => item.category),
);

const subCategoryMap = EXPENSE_CATEGORIES.reduce((acc, item) => {
  acc[item.category] = new Set(item.subCategories);
  return acc;
}, {});

const isValidCategory = (category, transactionType = "expense") => {
  if (!category) {
    return true;
  }

  if (transactionType === "income") {
    return INCOME_CATEGORY_SET.has(category);
  }

  if (transactionType === "transfer") {
    return TRANSFER_CATEGORY_SET.has(category);
  }

  return FINANCE_CATEGORY_SET.has(category);
};

const isValidSubCategory = (
  category,
  subCategory,
  transactionType = "expense",
) => {
  if (transactionType !== "expense") {
    return true;
  }

  if (!subCategory) {
    return true;
  }

  if (!category || !subCategoryMap[category]) {
    return false;
  }

  if (category === "Other") {
    return true;
  }

  return subCategoryMap[category].has(subCategory);
};

module.exports = {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  TRANSFER_CATEGORIES,
  SUPPORTED_CURRENCIES,
  PAYMENT_METHODS,
  TRANSACTION_TYPES,
  getCategoryTree,
  isValidCategory,
  isValidSubCategory,
};
