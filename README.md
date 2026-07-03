# Expense Tracker Backend

Backend API for a simple expense tracker. It is built with Node.js, Express, TypeScript, Prisma, and MySQL.

## Tech Stack

- Node.js
- Express
- TypeScript
- Prisma
- MySQL
- Joi for request validation
- Vitest and Supertest for tests

## Prerequisites

- Node.js installed
- MySQL running locally or available through a hosted connection
- npm

## Local Setup

Install dependencies:

```bash
npm install
```

Set the required values in `.env`:

```env
DATABASE_URL=""
PORT=5000
CORS_ORIGIN=""
```

Create the database in MySQL if it does not already exist:

```sql
CREATE DATABASE expense_tracker;
```

Run Prisma migrations:

```bash
npm run prisma:migrate
```

Seed the database with default categories and sample expenses:

```bash
npm run db:seed
```

Start the development server:

```bash
npm run dev
```

The API will run on:

```txt
http://localhost:5000
```

Health check:

```txt
GET /health
```

## Production Build

Build the project:

```bash
npm run build
```

Start the compiled server:

```bash
npm start
```

## Tests

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## API Overview

Base API path:

```txt
/api
```

Current endpoints:

```txt
GET    /health
GET    /api/categories
GET    /api/expenses
POST   /api/expenses
DELETE /api/expenses/:id
GET    /api/summary
```

`GET /api/expenses` supports these optional query filters:

```txt
categoryId
from
to
search
```

`POST /api/expenses` expects:

```json
{
  "amount": "120.50",
  "categoryId": "1",
  "date": "2026-07-03",
  "note": "Lunch"
}
```

Validation rules:

- `amount` must be positive and support up to 2 decimal places.
- `categoryId` and `id` values must be positive unsigned bigint-compatible IDs.
- `date`, `from`, and `to` must be an ISO date or timezone-aware datetime.
- `note` is optional and limited to 500 characters.
- `from` must be earlier than or equal to `to`.

## Database Schema

The schema has two main tables:

### expense_categories

Stores the allowed expense categories.

```txt
id          BIGINT UNSIGNED PRIMARY KEY
name        VARCHAR(64) UNIQUE
slug        VARCHAR(80) UNIQUE
created_at  DATETIME
```

### expenses

Stores each expense entry.

```txt
id            BIGINT UNSIGNED PRIMARY KEY
category_id   BIGINT UNSIGNED FOREIGN KEY
amount        DECIMAL(12, 2)
expense_date  DATETIME
note          VARCHAR(500) NULL
created_at    DATETIME
updated_at    DATETIME
```

Indexes:

```txt
idx_expenses_date(expense_date, id)
idx_expenses_category_date(category_id, expense_date, id)
```

The database also has a check constraint to ensure:

```txt
amount > 0
```

## Schema Design Rationale

Categories are stored in a separate `expense_categories` table instead of being saved as free text on every expense. This keeps category names consistent, avoids duplicate spellings, and makes category-based reporting easier.

Expenses reference categories through `category_id`. The foreign key uses `ON DELETE RESTRICT` so a category cannot be deleted while expenses still depend on it. This protects historical expense data from accidentally losing its category context.

`amount` uses `DECIMAL(12, 2)` instead of a floating-point type because money should not be stored with binary floating-point rounding errors. The precision supports large enough values for this use case while keeping exactly two decimal places.

IDs use unsigned big integers so the tables have enough room to grow without changing the public API later. The API returns IDs as strings because JavaScript can lose precision with large integer values.

The `expense_date` field is indexed for date-based listing and reporting. A second compound index on `category_id`, `expense_date`, and `id` supports common filtering by category and date range while keeping ordering stable.

The `note` field is optional and capped at 500 characters because it is meant for short user context, not long-form descriptions.

## Environment Variables

```txt
DATABASE_URL  MySQL connection string. Required.
PORT          Server port. Defaults to 5000.
CORS_ORIGIN   Allowed frontend origin.
```

## Useful Commands

```bash
npm run dev              # Start local dev server
npm run build            # Generate Prisma client and compile TypeScript
npm start                # Run compiled app from dist
npm test                 # Run tests
npm run prisma:migrate   # Apply migrations in development
npm run db:seed          # Seed categories and sample expenses
npm run prisma:studio    # Open Prisma Studio
npm run db:validate      # Validate Prisma schema
```

## What I Would Improve With More Time

- Add authentication and user ownership so expenses are scoped per user.
- Add pagination to `GET /api/expenses` before the table grows large.
- Add update support for expenses.
- Add monthly and date-range summary endpoints.
- Add soft delete for data instead of hard delete
