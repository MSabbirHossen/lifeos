# Finance API (Multi-Currency)

All endpoints require `Authorization: Bearer <token>`.

## Base Path

`/api/finance`

## Endpoints

### 1) Create Transaction

- `POST /`
- Supports both `expense` and `income`.

Expense payload:

```json
{
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
  "type": "income",
  "amount": 10000,
  "currency": "BDT",
  "description": "Salary",
  "source": "Company"
}
```

### 2) Get Transactions

- `GET /?range=thisMonth&type=expense`
- Supported `range`: `today`, `thisWeek`, `thisMonth`, `thisYear`, `custom`
- For `custom`, send `startDate` and `endDate`

### 3) Update Transaction

- `PUT /:id`

### 4) Delete Transaction

- `DELETE /:id`

### 5) Categories Metadata

- `GET /categories`

Returns category + subcategory tree, supported currencies, and payment methods.

### 6) Expense Name Suggestions

- `GET /suggestions?q=car&limit=6`

Returns fuzzy-ranked historical expense names with usage count and last-used labels.

### 7) Daily Rates

- `GET /rates`
- Optional: `GET /rates?date=2026-08-01`

Returns BDT base rates for `SAR` and `USD`.

### 8) Analytics

- `GET /analytics?range=thisMonth`

Returns:

- BDT summary (total, change %, average daily, largest category)
- Chart datasets (distribution, trend, category comparison, currency usage)
- Recent transactions

### 9) Legacy Migration (Per User)

- `POST /migrate-legacy`

Backfills missing multi-currency fields for old records.
