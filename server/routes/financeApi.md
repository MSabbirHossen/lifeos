# Finance API (Cash Flow)

All endpoints require `Authorization: Bearer <token>`.

## Base Path

`/api/finance`

## Endpoints

### 1) Create Transaction

- `POST /create` or `POST /`
- Supports `expense`, `income`, and `transfer`.

Expense payload:

```json
{
  "transactionType": "expense",
  "type": "expense",
  "amount": 50,
  "currency": "SAR",
  "category": "Transportation",
  "subCategory": "Car Fare",
  "expenseName": "Car Fare",
  "description": "Airport transfer",
  "paymentMethod": "Card",
  "date": "2026-08-01"
}
```

Income payload:

```json
{
  "transactionType": "income",
  "type": "income",
  "amount": 10000,
  "currency": "BDT",
  "incomeSource": "Salary",
  "category": "Salary",
  "description": "Monthly payout"
}
```

Transfer payload:

```json
{
  "transactionType": "transfer",
  "amount": 3000,
  "currency": "BDT",
  "category": "Account Transfer",
  "transactionName": "Savings Move",
  "description": "Cash to bank"
}
```

### 2) Get Transactions

- `GET /?range=thisMonth&transactionType=expense`
- Supported `range`: `today`, `thisWeek`, `thisMonth`, `thisYear`, `custom`
- For `custom`, send `startDate` and `endDate`
- Supported `transactionType`: `all`, `expense`, `income`, `transfer`

### 3) Update Transaction

- `PUT /:id`

### 4) Delete Transaction

- `DELETE /:id`

### 5) Categories Metadata

- `GET /categories`

Returns expense, income, and transfer category trees with currencies and payment methods.

### 6) Typed Suggestions

- `GET /suggestions?transactionType=income&q=sch&limit=8`

Returns fuzzy-ranked historical names with usage count and last-used labels.

### 7) Daily Rates

- `GET /rates`
- Optional: `GET /rates?date=2026-08-01`

Returns BDT base rates for `SAR` and `USD`.

### 8) Analytics

- `GET /analytics?range=thisMonth`

Returns:

- BDT summary (balance, income, expense, savings rate)
- Chart datasets (cash flow, balance trend, expense distribution, income sources)
- Recent transactions

### 9) Income Summary

- `GET /income-summary?range=thisMonth`

Returns total income and source breakdown.

### 10) Balance Snapshot

- `GET /balance`

Returns all-time income, expense, and balance in BDT.

### 11) Cash Flow Series

- `GET /cash-flow?range=thisMonth`

Returns period-wise income, expense, transfer, and net series.

### 12) Legacy Migration (Per User)

- `POST /migrate-legacy`

Backfills missing transaction and multi-currency fields for old records.
