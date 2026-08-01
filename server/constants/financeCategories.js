const FINANCE_CATEGORIES = [
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

const SUPPORTED_CURRENCIES = ["BDT", "SAR", "USD"];
const PAYMENT_METHODS = ["Cash", "Card", "Bank", "Mobile Payment"];

const FINANCE_CATEGORY_SET = new Set(
  FINANCE_CATEGORIES.map((item) => item.category),
);

const subCategoryMap = FINANCE_CATEGORIES.reduce((acc, item) => {
  acc[item.category] = new Set(item.subCategories);
  return acc;
}, {});

const isValidCategory = (category) => {
  if (!category) {
    return true;
  }
  return FINANCE_CATEGORY_SET.has(category);
};

const isValidSubCategory = (category, subCategory) => {
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
  FINANCE_CATEGORIES,
  SUPPORTED_CURRENCIES,
  PAYMENT_METHODS,
  isValidCategory,
  isValidSubCategory,
};
