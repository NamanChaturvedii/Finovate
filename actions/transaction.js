"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const serializeAmount = (obj) => ({
  ...obj,
  amount: obj.amount.toNumber(),
});

// ✅ Reusable Arcjet check
async function checkRateLimit(userId) {
  const req = await request();

  const decision = await aj.protect(req, {
    userId,
    requested: 1,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      throw new Error("Too many requests. Please try again later.");
    }
    throw new Error("Request blocked");
  }
}

// Create Transaction
export async function createTransaction(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // ✅ Arcjet check
    await checkRateLimit(userId);

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const account = await db.account.findUnique({
      where: {
        id: data.accountId,
        userId: user.id,
      },
    });

    if (!account) throw new Error("Account not found");

    const balanceChange =
      data.type === "EXPENSE" ? -data.amount : data.amount;

    const newBalance = account.balance.toNumber() + balanceChange;

    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          ...data,
          userId: user.id,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(
                  data.date,
                  data.recurringInterval
                )
              : null,
        },
      });

      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: newBalance },
      });

      return newTransaction;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);

    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Get Transaction
export async function getTransaction(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const transaction = await db.transaction.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!transaction) throw new Error("Transaction not found");

  return serializeAmount(transaction);
}

// Update Transaction
export async function updateTransaction(id, data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // ✅ Arcjet check here also
    await checkRateLimit(userId);

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const originalTransaction = await db.transaction.findUnique({
      where: {
        id,
        userId: user.id,
      },
      include: {
        account: true,
      },
    });

    if (!originalTransaction)
      throw new Error("Transaction not found");

    const oldBalanceChange =
      originalTransaction.type === "EXPENSE"
        ? -originalTransaction.amount.toNumber()
        : originalTransaction.amount.toNumber();

    const newBalanceChange =
      data.type === "EXPENSE" ? -data.amount : data.amount;

    const netBalanceChange =
      newBalanceChange - oldBalanceChange;

    const transaction = await db.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: {
          id,
          userId: user.id,
        },
        data: {
          ...data,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(
                  data.date,
                  data.recurringInterval
                )
              : null,
        },
      });

      await tx.account.update({
        where: { id: data.accountId },
        data: {
          balance: {
            increment: netBalanceChange,
          },
        },
      });

      return updated;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${data.accountId}`);

    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Get User Transactions
export async function getUserTransactions(query = {}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        ...query,
      },
      include: {
        account: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return { success: true, data: transactions };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Scan Receipt
// Returns ONLY plain JSON-serializable values for client autofill
export async function scanReceipt({ base64String, mimeType }) {
  try {
    if (!base64String || typeof base64String !== "string") {
      throw new Error("Invalid receipt image data");
    }
    if (!mimeType || typeof mimeType !== "string") {
      throw new Error("Invalid receipt mime type");
    }

    const prompt = `Analyze this receipt image and extract the following information in JSON format:
- Total amount (just the number)
- Date (in ISO format)
- Description or items purchased (brief summary)
- Merchant/store name
- Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense)

Only respond with valid JSON in this exact format:
{
  "amount": number,
  "date": "ISO date string",
  "description": "string",
  "merchantName": "string",
  "category": "string"
}

If it's not a receipt, return {}.`;

    const result = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: base64String,
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const text = result.content[0].text;
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    const extractFirstJsonObject = (input) => {
      if (!input) return "";
      const start = input.indexOf("{");
      if (start === -1) return "";
      let depth = 0;
      for (let i = start; i < input.length; i++) {
        const ch = input[i];
        if (ch === "{") depth++;
        if (ch === "}") {
          depth--;
          if (depth === 0) return input.slice(start, i + 1);
        }
      }
      return "";
    };

    const jsonCandidate = extractFirstJsonObject(cleanedText) || cleanedText;
    const parsed = JSON.parse(jsonCandidate);

    const data =
      parsed &&
      typeof parsed === "object" &&
      parsed.receipt &&
      typeof parsed.receipt === "object" &&
      parsed.receipt !== null
        ? { ...parsed, ...parsed.receipt }
        : parsed;

    if (!data || typeof data !== "object") return {};
    if (Object.keys(data).length === 0) return {};

    const rawAmount = data.amount ?? data.total ?? data.totalAmount ?? data.total_amount;
    const parsedAmount =
      typeof rawAmount === "number"
        ? rawAmount
        : typeof rawAmount === "string"
          ? parseFloat(rawAmount.replace(/,/g, "").replace(/[^\d.-]/g, ""))
          : undefined;

    const parsedDate =
      typeof data.date === "string" && data.date
        ? (() => {
            const d = new Date(data.date);
            return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
          })()
        : undefined;

    const rawDescription =
      typeof data.description === "string"
        ? data.description
        : Array.isArray(data.items)
          ? data.items.slice(0, 5).join(", ")
          : typeof data.summary === "string"
            ? data.summary
            : undefined;

    const merchantName =
      typeof data.merchantName === "string" && data.merchantName ? data.merchantName : undefined;

    // Fallbacks: if Gemini misses amount/description, try to pull from raw text
    let fallbackAmount = undefined;
    if (!(typeof parsedAmount === "number" && !Number.isNaN(parsedAmount))) {
      const m =
        cleanedText.match(/(?:grand\s*total|amount\s*due|total)\D{0,20}([\d][\d,]*\.\d{2})/i) ||
        cleanedText.match(/([\d][\d,]*\.\d{2})/);
      if (m?.[1]) {
        const n = parseFloat(String(m[1]).replace(/,/g, ""));
        if (!Number.isNaN(n)) fallbackAmount = n;
      }
    }

    const finalAmount =
      typeof parsedAmount === "number" && !Number.isNaN(parsedAmount) ? parsedAmount : fallbackAmount;

    const finalDescription =
      typeof rawDescription === "string" && rawDescription.trim()
        ? rawDescription
        : merchantName
          ? `Purchase at ${merchantName}`
          : undefined;

    return {
      ...(typeof finalAmount === "number" ? { amount: finalAmount } : {}),
      ...(parsedDate ? { date: parsedDate } : {}),
      ...(finalDescription ? { description: finalDescription } : {}),
      ...(merchantName ? { merchantName } : {}),
      ...(typeof data.category === "string" && data.category ? { category: data.category } : {}),
    };
  } catch (error) {
    throw new Error(error?.message || "Failed to scan receipt");
  }
}

// Helper
function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}