## Wealth Project – High‑Level Explanation

This document explains how the important parts of your project work: **Zod**, **Prisma + PostgreSQL**, **ArcJet**, **Inngest**, **graphs with Recharts**, the **Node.js / Next.js server pieces**, and finally a short **MongoDB refresher**.  
You can export this markdown file as a PDF from your editor or browser.

---

## Project Structure (only the important bits)

- **`prisma/schema.prisma`**: Defines your database models (User, Account, Transaction, Budget) and enums. Prisma uses this to generate a type‑safe client.
- **`lib/prisma.js`**: Creates and exports a singleton `PrismaClient` instance called `db`, which is used in server code to talk to PostgreSQL.
- **`app/lib/schema.js`**: Zod schemas for validating account and transaction forms.
- **`actions/transaction.js`**: Node/Next.js server actions for creating, reading, and updating transactions, scanning receipts with Gemini, and revalidating pages.
- **`actions/seed.js`**: Server action that generates random historical transactions and updates an account balance, so graphs have realistic data.
- **`lib/arcjet.js`**: Configures ArcJet rate‑limiting for user actions.
- **`lib/inngest/client.js`**: Sets up a shared Inngest client with retry behavior.
- **`lib/inngest/functions.js`**: Inngest functions for recurring transactions, monthly reports (Gemini + email), and budget alerts.
- **`app/api/inngest/route.js`**: Wires the Inngest client + functions into a Next.js API route (`/api/inngest`) using `serve` from `inngest/next`.
- **`app/(main)/account/_components/account-chart.jsx`**: Client component that builds time‑series graphs with Recharts based on transactions.

CSS and basic UI boilerplate are intentionally skipped here.

---

## Data Layer: Prisma + PostgreSQL

### 1. Database schema (`prisma/schema.prisma`)

Prisma models represent your SQL tables:

- **`model User`**:  
  - Columns: `id`, `clerkUserId`, `email`, `name`, `imageUrl`, timestamps.  
  - Relations: has many `transactions`, `accounts`, and `budgets`.  
  - `@@map("users")` ties this model to the physical `users` table in PostgreSQL.

- **`model Account`**:  
  - Columns: `id`, `name`, `type` (`AccountType` enum), `balance` (`Decimal`), `isDefault`, `userId`, timestamps.  
  - Relation: `user` is a foreign key to `User`, `transactions` is a one‑to‑many relation.  
  - Indexed on `userId` for faster lookups per user.  
  - Mapped to the `accounts` table.

- **`model Transaction`**:  
  - Columns: `id`, `type` (`TransactionType`), `amount` (`Decimal`), `description`, `date`, `category`, `receiptUrl`, recurring fields (`isRecurring`, `recurringInterval`, `nextRecurringDate`, `lastProcessed`), `status`, `userId`, `accountId`, timestamps.  
  - Relations: belongs to `User` and `Account`.  
  - Indexed by `userId` and `accountId` and mapped to `transactions`.

- **`model Budget`**:  
  - Columns: `id`, `amount`, `lastAlertSent`, `userId`, timestamps.  
  - Relation: one‑to‑one with `User` (unique `userId`).  
  - Mapped to `budgets`.

- **Enums**:  
  - `TransactionType` = `INCOME | EXPENSE`  
  - `AccountType` = `CURRENT | SAVINGS`  
  - `TransactionStatus` = `PENDING | COMPLETED | FAILED`  
  - `RecurringInterval` = `DAILY | WEEKLY | MONTHLY | YEARLY`

This is essentially the **SQL schema expressed in Prisma**. Prisma then generates SQL migrations behind the scenes, and the models map directly to PostgreSQL tables and columns.

### 2. Prisma client setup (`lib/prisma.js`)

```js
import { PrismaClient } from "@prisma/client";

export const db = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}
```

- **`PrismaClient`**: This is the type‑safe ORM client generated from `schema.prisma`.  
- **`db` singleton**: Uses `globalThis.prisma` in development to avoid creating multiple clients on hot reload (which can exhaust DB connections).  
- **Connection details** (host, user, password, DB name) are taken from `DATABASE_URL` in your environment, defined in the `datasource db` block.

### 3. “SQL to Prisma” – how the mapping works

Conceptually:

- If you think in **SQL tables** (`users`, `accounts`, `transactions`, `budgets`), Prisma maps them to **models** (`User`, `Account`, `Transaction`, `Budget`).
- Each Prisma field corresponds to a **column** (with types like `String`, `DateTime`, `Decimal` → appropriate SQL types).
- Relations (`@relation`, foreign keys) map to foreign key constraints in PostgreSQL.

You never write raw SQL in this project; instead you write **Prisma queries** like:

- `db.user.findUnique({ where: { clerkUserId } })`  
- `db.account.update({ where: { id }, data: { balance: { increment: amount } } })`  
- `db.transaction.aggregate({ where: { ... }, _sum: { amount: true } })`

Prisma translates those into parameterized SQL and sends them to PostgreSQL over the connection specified by `DATABASE_URL`.

### 4. How data is sent to PostgreSQL (examples)

**a. Creating and updating transactions (`actions/transaction.js`)**

- The file is a `"use server"` module, so the functions run on the **Node.js server**, not the browser.
- After auth and rate‑limit checks, `createTransaction(data)`:
  - Looks up the app‑level user with `db.user.findUnique({ where: { clerkUserId: userId } })`.
  - Ensures the `account` belongs to that user.
  - Calculates a new balance (`newBalance`) based on the transaction type (income vs expense).
  - Wraps DB updates in `db.$transaction(async (tx) => { ... })`:
    - `tx.transaction.create({ data: { ...data, userId: user.id, nextRecurringDate: ... } })`
    - `tx.account.update({ where: { id: data.accountId }, data: { balance: newBalance } })`

**b. Reading and aggregating data**

- `getTransaction(id)` and `getUserTransactions(query)` use:
  - `db.transaction.findUnique(...)` for a single transaction.
  - `db.transaction.findMany({ where: { userId, ...query }, include: { account: true } })` to fetch a list with joined accounts.

**c. Inngest functions (`lib/inngest/functions.js`)**

- `processRecurringTransaction`:
  - Fetches a transaction with `db.transaction.findUnique({ include: { account: true } })`.
  - Uses `db.$transaction` to:
    - Insert a new transaction (copy of the recurring one).
    - Update the account’s `balance` using `{ increment: balanceChange }`.
    - Update the original recurring transaction’s `lastProcessed` and `nextRecurringDate`.

- `generateMonthlyReports`:
  - For each user, `getMonthlyStats` uses `db.transaction.findMany` to pull that month’s transactions and reduce them into income/expense stats.

- `checkBudgetAlerts`:
  - Uses `db.budget.findMany({ include: { user: { include: { accounts: { where: { isDefault: true } } } } } })` to get budgets and default accounts.
  - Uses `db.transaction.aggregate({ where: { ... }, _sum: { amount: true } })` to compute total expenses for the month.
  - If a threshold is crossed, updates `budget.lastAlertSent` with `db.budget.update`.

**d. Seeding data (`actions/seed.js`)**

- Generates random transactions in memory, then inside `db.$transaction`:
  - Clears existing account transactions: `tx.transaction.deleteMany({ where: { accountId: ACCOUNT_ID } })`
  - Inserts all generated ones: `tx.transaction.createMany({ data: transactions })`
  - Updates the account’s stored `balance` from the simulated totals.

All of the above are **Prisma calls** that Prisma turns into SQL and executes against PostgreSQL.

---

## Validation Layer: Zod (`app/lib/schema.js`)

### 1. Account schema

```js
export const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["CURRENT", "SAVINGS"]),
  balance: z.string().min(1, "Initial balance is required"),
  isDefault: z.boolean().default(false),
});
```

- Ensures the account **name** is non‑empty.
- Restricts **type** to specific allowed values (matching `AccountType` enum in Prisma).
- Validates **balance** as a non‑empty string; later converted to a number/decimal before saving.
- `isDefault` has a default of `false`.

### 2. Transaction schema

```js
export const transactionSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE"]),
    amount: z.string().min(1, "Amount is required"),
    description: z.string().optional(),
    date: z.date({ required_error: "Date is required" }),
    accountId: z.string().min(1, "Account is required"),
    category: z.string().min(1, "Category is required"),
    isRecurring: z.boolean().default(false),
    recurringInterval: z
      .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isRecurring && !data.recurringInterval) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recurring interval is required for recurring transactions",
        path: ["recurringInterval"],
      });
    }
  });
```

- Validates transaction input **before** it reaches your server actions.
- Guarantees that:
  - `type` is either `"INCOME"` or `"EXPENSE"`.
  - `amount`, `accountId`, and `category` are non‑empty.
  - `date` is a real `Date` object.
  - If `isRecurring` is `true`, then `recurringInterval` must be present; otherwise validation fails with a custom error.

In your forms, these schemas are typically connected to `react-hook-form` using `zodResolver`, so the user sees friendly validation errors before the data is posted to the server.

---

## Security and Rate Limiting: ArcJet

### 1. ArcJet configuration (`lib/arcjet.js`)

```js
import arcjet, { tokenBucket } from "@arcjet/next";

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["userId"], // Track based on Clerk userId
  rules: [
    tokenBucket({
      mode: "LIVE",
      refillRate: 10,
      interval: 3600,
      capacity: 10,
    }),
  ],
});

export default aj;
```

- Uses ArcJet’s **token bucket** rule:
  - Each user gets a bucket of tokens (capacity 10).
  - The bucket refills at 10 tokens per hour.
  - Every protected action consumes some tokens.

### 2. Using ArcJet in a server action (`actions/transaction.js`)

In `createTransaction(data)`:

- `const { userId } = await auth();` identifies the authenticated Clerk user.
- `const req = await request();` builds the ArcJet request context.
- `const decision = await aj.protect(req, { userId, requested: 1 });`
  - Tells ArcJet: **user X is trying to perform 1 protected action**.
- If `decision.isDenied()` and `decision.reason.isRateLimit()`:
  - Logs info about `remaining` tokens and `reset` time.
  - Throws `"Too many requests. Please try again later."`

This ensures that **creating transactions is rate‑limited per user**, helping to defend against abuse or accidental spam.

---

## Background Jobs and Automation: Inngest

### 1. Inngest client (`lib/inngest/client.js`)

```js
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "finance platform-ai",
  name: "Finance Platform-ai",
  retryFunction: async (attempt) => ({
    delay: Math.pow(2, attempt) * 1000,
    maxAttempts: 2,
  }),
});
```

- Defines a shared Inngest client:
  - `id` and `name` identify your app in Inngest.
  - `retryFunction` controls exponential backoff when a function fails.

### 2. Inngest HTTP entrypoint (`app/api/inngest/route.js`)

```js
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  checkBudgetAlerts,
  generateMonthlyReports,
  processRecurringTransaction,
  triggerRecurringTransactions,
} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processRecurringTransaction,
    triggerRecurringTransactions,
    generateMonthlyReports,
    checkBudgetAlerts,
  ],
});
```

- Binds your Inngest functions to a Next.js route (`/api/inngest`) using `serve`.
- Inngest calls this route (GET/POST/PUT) to run jobs and handle event delivery.

### 3. Inngest functions (`lib/inngest/functions.js`)

#### a. `processRecurringTransaction`

- Triggered by events named `"transaction.recurring.process"`.
- Has a **throttle** config so each user can process only a limited number of recurring transactions per minute.
- Steps:
  1. Fetches the reference recurring transaction from Prisma.
  2. Checks if it’s due (`isTransactionDue` based on `nextRecurringDate`).
  3. In a Prisma `db.$transaction`:
     - Creates a new transaction representing the current occurrence.
     - Updates the related account’s `balance`.
     - Updates the original recurring transaction’s `lastProcessed` and `nextRecurringDate`.

#### b. `triggerRecurringTransactions`

- Runs on a **cron schedule** (`"0 0 * * *"` – daily at midnight).
- Fetches all recurring transactions due or never processed.
- For each, sends an event `{ name: "transaction.recurring.process", data: { transactionId, userId } }` via `inngest.send(events)`.
- This decouples **finding due recurring transactions** from actually **processing** them.

#### c. `generateMonthlyReports`

- Runs on the **first day of each month**.
- For each user:
  1. Computes last month’s date range.
  2. Calls `getMonthlyStats` (Prisma queries) to compute totals and per‑category expenses.
  3. Calls `generateFinancialInsights` which:
     - Uses `@google/generative-ai` (`GoogleGenerativeAI`) with `gemini-1.5-flash`.
     - Sends a prompt containing summary stats.
     - Parses the model’s JSON response into an array of insight strings.
  4. Sends an email via `sendEmail` and a React `EmailTemplate` component, including the stats + AI‑generated insights.

#### d. `checkBudgetAlerts`

- Runs **every 6 hours** by cron (`"0 */6 * * *"`).
- For each budget:
  - Finds the user’s default account.
  - Aggregates this month’s expenses for that account.
  - Computes `percentageUsed = totalExpenses / budgetAmount * 100`.
  - If above 80% and no alert has been sent this month:
    - Sends an email alert with budget usage info.
    - Updates `lastAlertSent` on the budget.

Together, these functions turn your app into a **smart financial assistant**:

- Automating recurring payments.
- Summarizing monthly performance.
- Proactively warning about over‑spending.

---

## Graphs and Analytics: Recharts (`AccountChart`)

### 1. Component overview (`app/(main)/account/_components/account-chart.jsx`)

- `"use client"` React component – runs in the browser.
- Props: `transactions` (array of transaction objects with `date`, `amount`, `type`).
- Uses:
  - `useState` to track the selected date range (`"7D"`, `"1M"`, `"3M"`, `"6M"`, `ALL`).
  - `useMemo` to efficiently recompute filtered and grouped data.
  - `Recharts` components: `ResponsiveContainer`, `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `Legend`.

### 2. Data preparation

- Chooses a **start date** based on the selected range.
- Filters `transactions` where `date` is between `startDate` and today (end of day).
- Groups by formatted day (e.g. `"Jan 05"`) and sums:
  - `income` for `type === "INCOME"`.
  - `expense` for `type === "EXPENSE"`.
- Sorts the resulting array by date so the chart moves left → right in time.

### 3. Rendering the chart

- Shows small summary cards (total income, total expenses, net) for the selected period.
- Renders a **bar chart** where:
  - X‑axis = date label (per day).
  - Y‑axis = amount.
  - One bar per day for **income** (green).
  - One bar per day for **expenses** (red).
- Tooltip shows the exact value on hover.

This is where your **Prisma data ends up visualized**: seeded or real transactions drive the chart’s bars.

---

## Node.js / Next.js Server Pieces

- **Server actions** (e.g. `actions/transaction.js`, `actions/seed.js`) are marked with `"use server"`, which tells Next.js to run them on the **Node.js server runtime**.
- These files can safely use:
  - `process.env` for API keys and DB URLs.
  - Node built‑ins like `Buffer` (used in `scanReceipt` to base64‑encode receipt images).
  - Prisma client `db` to talk to PostgreSQL.
  - `revalidatePath` from `next/cache` to invalidate and refresh cached pages after mutations.
- **Client components** (like `AccountChart`) are `"use client"` and never directly access the DB or secrets; they get data via props or API calls.

Overall flow:

1. **Client** (React) → sends data (validated by Zod) to a server action.
2. **Server action** (Node.js) → checks auth, rate limits (ArcJet), then calls Prisma (`db`) to read/write Postgres.
3. **Background jobs** (Inngest) → run periodically or on events, also using Prisma and other Node libraries.
4. **Client charts and UI** → render the final state back to the user.

---

## MongoDB Refresher (Not Used in This Project)

Even though this app uses **PostgreSQL + Prisma**, here’s a short MongoDB reminder.

### 1. Core ideas

- MongoDB stores data in **collections** (similar to tables).
- Each collection contains **documents** (similar to rows), which are flexible JSON‑like objects.
- Documents don’t need to share the exact same shape; there is no enforced schema unless you add validation.

### 2. Basic Node.js example (without Prisma)

```js
import { MongoClient } from "mongodb";

// 1. Connect
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db("wealth");
const transactions = db.collection("transactions");

// 2. Insert a document
await transactions.insertOne({
  userId: "user-123",
  type: "EXPENSE",
  amount: 49.99,
  category: "food",
  date: new Date(),
});

// 3. Query documents
const recentExpenses = await transactions
  .find({ userId: "user-123", type: "EXPENSE" })
  .sort({ date: -1 })
  .limit(10)
  .toArray();

console.log(recentExpenses);
```

- `MongoClient` connects using your MongoDB connection string.
- `db.collection("transactions")` returns a handle to the `transactions` collection.
- `insertOne` writes a new document.
- `find(...).sort().limit().toArray()` reads multiple documents into an array.

### 3. Conceptual comparison with this project

- **This project**: uses **Prisma + PostgreSQL**, with a strict schema (`schema.prisma`) and relational models.
- **MongoDB**: is document‑based and schema‑flexible; no Prisma here unless you add a separate MongoDB driver/ORM.
- The overall Node.js pattern is similar (connect → insert → query), but the query language (and data model) is different.

---

## How to Export This as a PDF

- Open `WEALTH_PROJECT_OVERVIEW.md` in your editor or preview.
- Use your editor or browser’s **“Print” → “Save as PDF”** feature to generate a PDF copy.

