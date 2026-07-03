# Expense Tracker Backend API Documentation

This document describes the current backend API contract for connecting a frontend application to this Express + Prisma backend.

## Backend Overview

- Runtime: Node.js + Express
- API base path: `/api`
- Default local server port: `5000`
- Default local base URL: `http://localhost:5000`
- Database: MySQL through Prisma
- Authentication: none currently implemented
- Request body format: JSON
- Response format: JSON
- CORS: currently allows all origins (`*`) and the methods `GET`, `POST`, and `DELETE`

## Base URLs

Use this in frontend environment config:

```txt
http://localhost:5000
```

API endpoints are mounted under:

```txt
http://localhost:5000/api
```

Health check is mounted outside `/api`:

```txt
http://localhost:5000/health
```

## Global Response Shapes

### Success Response

Most successful API responses follow this shape:

```json
{
  "success": true,
  "message": "Optional success message",
  "data": {}
}
```

Some successful responses do not include `message`.

### Error Response

All handled errors currently return:

```json
{
  "success": false,
  "message": "Error message"
}
```

Important: validation errors are created with field-level details internally, but the current error middleware does not expose those details in the HTTP response. Frontend code should currently rely on `message` only.

Common error examples:

```json
{
  "success": false,
  "message": "Validation failed"
}
```

```json
{
  "success": false,
  "message": "Expense category not found"
}
```

```json
{
  "success": false,
  "message": "Expense not found"
}
```

```json
{
  "success": false,
  "message": "Route not found: GET /unknown"
}
```

## Data Models Returned To Frontend

### Category

```ts
type Category = {
  id: string;
  name: string;
  slug: string;
};
```

Example:

```json
{
  "id": "1",
  "name": "Food",
  "slug": "food"
}
```

### Expense

```ts
type Expense = {
  id: string;
  categoryId: string;
  category: Category;
  amount: string;
  expenseDate: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};
```

Notes:

- IDs are returned as strings because the database uses unsigned big integers.
- `amount` is returned as a fixed 2-decimal string.
- `expenseDate`, `createdAt`, and `updatedAt` are ISO datetime strings.
- `note` can be `null`.

Example:

```json
{
  "id": "15",
  "categoryId": "6",
  "category": {
    "id": "6",
    "name": "Others",
    "slug": "others"
  },
  "amount": "1500.00",
  "expenseDate": "2026-07-03T00:00:00.000Z",
  "note": "Gift purchase",
  "createdAt": "2026-07-03T06:00:00.000Z",
  "updatedAt": "2026-07-03T06:00:00.000Z"
}
```

### Summary Item

```ts
type ExpenseSummaryItem = {
  category: Category;
  totalSpend: string;
  expenseCount: number;
};
```

Example:

```json
{
  "category": {
    "id": "1",
    "name": "Food",
    "slug": "food"
  },
  "totalSpend": "1551.00",
  "expenseCount": 3
}
```

## Validation Rules

### ID Fields

Applies to `categoryId` and expense route `id`.

- Accepts positive integer values.
- Can be sent as a JSON number or string.
- Returned values are always strings.

Valid examples:

```json
"1"
```

```json
1
```

Invalid examples:

```json
"abc"
```

```json
0
```

### Amount

- Required when creating an expense.
- Accepts a positive number or numeric string.
- Maximum value: `9999999999.99`
- Up to 2 decimal places.
- Returned as a 2-decimal string.

Valid examples:

```json
"450.75"
```

```json
450.75
```

```json
"120"
```

Invalid examples:

```json
"0"
```

```json
"12.345"
```

```json
"abc"
```

### Date Fields

Applies to request field `date` and query fields `from` / `to`.

Accepted formats:

- Date only: `YYYY-MM-DD`
- ISO datetime string beginning with `YYYY-MM-DDT`

Valid examples:

```txt
2026-07-03
2026-07-03T10:30:00.000Z
```

For date-only values:

- Create expense `date` is stored as `YYYY-MM-DDT00:00:00.000Z`
- Query `from` uses start of day
- Query `to` uses end of day

### Note

- Optional when creating an expense.
- Maximum length: 500 characters.
- Empty string is accepted and stored as `null`.
- `null` is accepted.
- Non-empty values are trimmed before storage.

### Search

- Optional query parameter on expense list.
- Searches only the expense `note` field.
- Maximum length: 500 characters.
- Empty string is treated as omitted.

## Endpoints

## 1. Health Check

### `GET /health`

Checks whether the server is running.

Full URL:

```txt
GET http://localhost:5000/health
```

### Success Response

Status: `200 OK`

```json
{
  "status": "ok"
}
```

## 2. List Categories

### `GET /api/categories`

Returns all available expense categories sorted by category name ascending.

Full URL:

```txt
GET http://localhost:5000/api/categories
```

### Success Response

Status: `200 OK`

```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "4",
        "name": "Bills",
        "slug": "bills"
      },
      {
        "id": "1",
        "name": "Food",
        "slug": "food"
      }
    ]
  }
}
```

### Seeded Categories

The seed script creates these categories:

```txt
Food
Transport
Shopping
Bills
Health
Others
```

Do not hardcode IDs in the frontend. Fetch categories first and use the returned `id`.

## 3. Create Expense

### `POST /api/expenses`

Creates a new expense.

Full URL:

```txt
POST http://localhost:5000/api/expenses
```

### Headers

```http
Content-Type: application/json
```

### Request Body

```ts
type CreateExpenseRequest = {
  amount: string | number;
  categoryId: string | number;
  date: string;
  note?: string | null;
};
```

### Request Example

```json
{
  "amount": "450.75",
  "categoryId": "1",
  "date": "2026-07-03",
  "note": "Lunch with team"
}
```

### Success Response

Status: `201 Created`

```json
{
  "success": true,
  "message": "Expense created successfully",
  "data": {
    "expense": {
      "id": "16",
      "categoryId": "1",
      "category": {
        "id": "1",
        "name": "Food",
        "slug": "food"
      },
      "amount": "450.75",
      "expenseDate": "2026-07-03T00:00:00.000Z",
      "note": "Lunch with team",
      "createdAt": "2026-07-03T08:00:00.000Z",
      "updatedAt": "2026-07-03T08:00:00.000Z"
    }
  }
}
```

### Error Responses

Validation failure:

Status: `400 Bad Request`

```json
{
  "success": false,
  "message": "Validation failed"
}
```

Category does not exist:

Status: `404 Not Found`

```json
{
  "success": false,
  "message": "Expense category not found"
}
```

### Frontend Notes

- Load categories using `GET /api/categories` before showing the create form.
- Submit `categoryId` from the selected category.
- Prefer sending `amount` as a string to avoid frontend floating-point display issues.
- Use `YYYY-MM-DD` from date inputs unless the UI requires datetime precision.
- Treat empty note as optional; the backend stores it as `null`.

## 4. List Expenses

### `GET /api/expenses`

Returns expenses sorted by `expenseDate` descending, then `id` descending.

Full URL:

```txt
GET http://localhost:5000/api/expenses
```

### Query Parameters

```ts
type ListExpensesQuery = {
  categoryId?: string | number;
  from?: string;
  to?: string;
  search?: string;
};
```

| Parameter | Required | Description |
| --- | --- | --- |
| `categoryId` | No | Filters expenses by category ID. |
| `from` | No | Inclusive start date or datetime. |
| `to` | No | Inclusive end date or datetime. |
| `search` | No | Searches expense notes using a contains match. |

### Request Examples

List all expenses:

```txt
GET /api/expenses
```

Filter by category:

```txt
GET /api/expenses?categoryId=1
```

Filter by date range:

```txt
GET /api/expenses?from=2026-07-01&to=2026-07-03
```

Search note text:

```txt
GET /api/expenses?search=lunch
```

Combined filters:

```txt
GET /api/expenses?categoryId=1&from=2026-07-01&to=2026-07-03&search=lunch
```

### Success Response

Status: `200 OK`

```json
{
  "success": true,
  "data": {
    "expenses": [
      {
        "id": "16",
        "categoryId": "1",
        "category": {
          "id": "1",
          "name": "Food",
          "slug": "food"
        },
        "amount": "450.75",
        "expenseDate": "2026-07-03T00:00:00.000Z",
        "note": "Lunch with team",
        "createdAt": "2026-07-03T08:00:00.000Z",
        "updatedAt": "2026-07-03T08:00:00.000Z"
      }
    ]
  }
}
```

If no expenses match, `expenses` is an empty array:

```json
{
  "success": true,
  "data": {
    "expenses": []
  }
}
```

### Error Responses

Invalid query parameter:

Status: `400 Bad Request`

```json
{
  "success": false,
  "message": "Validation failed"
}
```

Invalid date range:

Status: `400 Bad Request`

```json
{
  "success": false,
  "message": "Validation failed"
}
```

### Frontend Notes

- There is currently no pagination.
- There is currently no update endpoint.
- Search is note-only; it does not search category name or amount.
- Date filters are inclusive.
- If both `from` and `to` are provided, `from` must be earlier than or equal to `to`.

## 5. Delete Expense

### `DELETE /api/expenses/:id`

Deletes one expense by ID.

Full URL:

```txt
DELETE http://localhost:5000/api/expenses/16
```

### Path Parameters

| Parameter | Required | Description |
| --- | --- | --- |
| `id` | Yes | Positive integer expense ID. |

### Success Response

Status: `200 OK`

```json
{
  "success": true,
  "message": "Expense deleted successfully",
  "data": null
}
```

### Error Responses

Invalid ID:

Status: `400 Bad Request`

```json
{
  "success": false,
  "message": "Validation failed"
}
```

Expense does not exist:

Status: `404 Not Found`

```json
{
  "success": false,
  "message": "Expense not found"
}
```

### Frontend Notes

- After delete succeeds, remove the expense from local UI state or refetch `GET /api/expenses`.
- Also refetch `GET /api/summary` if the UI shows category totals.

## 6. Expense Summary

### `GET /api/summary`

Returns total spend and expense count grouped by category. Every category is returned, even if it has zero expenses.

Full URL:

```txt
GET http://localhost:5000/api/summary
```

### Success Response

Status: `200 OK`

```json
{
  "success": true,
  "data": {
    "summary": [
      {
        "category": {
          "id": "4",
          "name": "Bills",
          "slug": "bills"
        },
        "totalSpend": "3449.00",
        "expenseCount": 3
      },
      {
        "category": {
          "id": "1",
          "name": "Food",
          "slug": "food"
        },
        "totalSpend": "1551.00",
        "expenseCount": 3
      }
    ]
  }
}
```

### Frontend Notes

- Use this endpoint for dashboards, category cards, charts, or total-by-category views.
- `totalSpend` is a string, not a number.
- Categories with no expenses return `totalSpend: "0.00"` and `expenseCount: 0`.

## Suggested Frontend Integration Flow

1. On app load, call `GET /api/categories`.
2. In parallel or after categories load, call `GET /api/expenses` and `GET /api/summary`.
3. For a create-expense form:
   - Use categories from `GET /api/categories`.
   - Send `POST /api/expenses`.
   - On success, either append the returned expense to local state or refetch `GET /api/expenses`.
   - Refetch `GET /api/summary`.
4. For filters:
   - Build query params for `GET /api/expenses`.
   - Omit empty filters.
   - Use `YYYY-MM-DD` for date picker values.
5. For delete:
   - Call `DELETE /api/expenses/:id`.
   - Remove the item locally or refetch expenses.
   - Refetch summary.

## Frontend TypeScript Types

```ts
export type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

export type ApiError = {
  success: false;
  message: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type Expense = {
  id: string;
  categoryId: string;
  category: Category;
  amount: string;
  expenseDate: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseSummaryItem = {
  category: Category;
  totalSpend: string;
  expenseCount: number;
};

export type CreateExpenseRequest = {
  amount: string | number;
  categoryId: string | number;
  date: string;
  note?: string | null;
};

export type ListExpensesQuery = {
  categoryId?: string | number;
  from?: string;
  to?: string;
  search?: string;
};

export type CategoriesResponse = ApiSuccess<{
  categories: Category[];
}>;

export type CreateExpenseResponse = ApiSuccess<{
  expense: Expense;
}>;

export type ListExpensesResponse = ApiSuccess<{
  expenses: Expense[];
}>;

export type DeleteExpenseResponse = ApiSuccess<null>;

export type ExpenseSummaryResponse = ApiSuccess<{
  summary: ExpenseSummaryItem[];
}>;
```

## Example Fetch Client

```ts
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message ?? "Request failed");
  }

  return payload as T;
}

export function getCategories() {
  return apiFetch<CategoriesResponse>("/api/categories");
}

export function getExpenses(query: ListExpensesQuery = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      params.set(key, String(value));
    }
  });

  const queryString = params.toString();
  return apiFetch<ListExpensesResponse>(
    `/api/expenses${queryString ? `?${queryString}` : ""}`,
  );
}

export function createExpense(input: CreateExpenseRequest) {
  return apiFetch<CreateExpenseResponse>("/api/expenses", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteExpense(id: string) {
  return apiFetch<DeleteExpenseResponse>(`/api/expenses/${id}`, {
    method: "DELETE",
  });
}

export function getExpenseSummary() {
  return apiFetch<ExpenseSummaryResponse>("/api/summary");
}
```

## Current API Limitations

- No authentication or user ownership.
- No pagination on expense listing.
- No update expense endpoint.
- No create/update/delete category endpoints.
- Validation error details are not currently exposed to the client.
- CORS does not currently allow `PUT` or `PATCH`.
- `GET /api/summary` is global and does not accept date or category filters.

## Route Reference

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Server health check |
| `GET` | `/api/categories` | List expense categories |
| `POST` | `/api/expenses` | Create expense |
| `GET` | `/api/expenses` | List/filter expenses |
| `DELETE` | `/api/expenses/:id` | Delete expense |
| `GET` | `/api/summary` | Category-wise expense summary |

