"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const serializeAmount = (obj) => ({
    ...obj,
    amount: obj.amount.toNumber(),
});

// Create Transaction
export async function createTransaction(data) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        // Get request data for ArcJet
        const req = await request();

        // Check rate limit
        const decision = await aj.protect(req, {
            userId,
            requested: 1, // Specify how many tokens to consume
        });

        if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) {
                const { remaining, reset } = decision.reason;
                console.error({
                    code: "RATE_LIMIT_EXCEEDED",
                    details: {
                        remaining,
                        resetInSeconds: reset,
                    },
                });

                throw new Error("Too many requests. Please try again later.");
            }

            throw new Error("Request blocked");
        }

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) {
            throw new Error("User not found");
        }

        const account = await db.account.findUnique({
            where: {
                id: data.accountId,
                userId: user.id,
            },
        });

        if (!account) {
            throw new Error("Account not found");
        }

        // Calculate new balance
        const balanceChange = data.type === "EXPENSE" ? -data.amount : data.amount;
        const newBalance = account.balance.toNumber() + balanceChange;

        // Create transaction and update account balance
        const transaction = await db.$transaction(async (tx) => {
            const newTransaction = await tx.transaction.create({
                data: {
                    ...data, // data getting
                    userId: user.id,
                    nextRecurringDate:
                        data.isRecurring && data.recurringInterval  // checking if is true or not
                            ? calculateNextRecurringDate(data.date, data.recurringInterval)
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

export async function getTransaction(id) {  // for updating the transcation when clicked on it
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

export async function updateTransaction(id, data) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) throw new Error("User not found");

        // Get original transaction to calculate balance change
        const originalTransaction = await db.transaction.findUnique({
            where: {
                id,
                userId: user.id,
            },
            include: {
                account: true,
            },
        });

        if (!originalTransaction) throw new Error("Transaction not found");

        // Calculate balance changes
        const oldBalanceChange =
            originalTransaction.type === "EXPENSE"
                ? -originalTransaction.amount.toNumber()
                : originalTransaction.amount.toNumber();

        const newBalanceChange =
            data.type === "EXPENSE" ? -data.amount : data.amount;

        const netBalanceChange = newBalanceChange - oldBalanceChange;

        // Update transaction and account balance in a transaction
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
                            ? calculateNextRecurringDate(data.date, data.recurringInterval)
                            : null,
                },
            });

            // Update account balance
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

        if (!user) {
            throw new Error("User not found");
        }

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
// Accepts a plain object with base64-encoded image data and mimeType
export async function scanReceipt({ base64String, mimeType }) {
    try {
        if (!base64String || typeof base64String !== "string") {
            throw new Error("Invalid receipt image data");
        }
        if (!mimeType || typeof mimeType !== "string") {
            throw new Error("Invalid receipt mime type");
        }

        const modelName =
            process.env.GEMINI_MODEL?.trim() ||
            process.env.GOOGLE_GEMINI_MODEL?.trim() ||
            // Current recommended alias for the Flash family (hot-swapped by Google)
            "gemini-flash-latest";

        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `
    Analyze this receipt image and extract the following information in JSON format:
    - Total amount (just the number)
    - Date (in ISO format)
    - Description or items purchased (brief summary)
    - Merchant/store name
    - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense )
    
    Only respond with valid JSON in this exact format:
    {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
    }

    If its not a recipt, return an empty object
    `;

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64String,
                    mimeType,
                },
            },
            prompt,
        ]);

        const response = await result.response;
        const text = response.text();
        const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

        const extractFirstJsonObject = (input) => {
            if (!input) return "";
            const start = input.indexOf("{");
            if (start === -1) return "";
            // naive brace matching (good enough for Gemini JSON responses)
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

        try {
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

            const rawAmount =
                data.amount ?? data.total ?? data.totalAmount ?? data.total_amount;

            const parsedAmount =
                typeof rawAmount === "number"
                    ? rawAmount
                    : typeof rawAmount === "string"
                        ? parseFloat(
                            rawAmount
                                .replace(/,/g, "")
                                .replace(/[^\d.-]/g, "")
                        )
                        : undefined;

            const rawDescription =
                typeof data.description === "string"
                    ? data.description
                    : Array.isArray(data.items)
                        ? data.items.slice(0, 5).join(", ")
                        : typeof data.summary === "string"
                            ? data.summary
                            : undefined;

            const parsedDate =
                typeof data.date === "string" && data.date
                    ? (() => {
                        const d = new Date(data.date);
                        return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
                    })()
                    : undefined;

            // Important: return only plain JSON-serializable values (no Date instances)
            return {
                ...(typeof parsedAmount === "number" && !Number.isNaN(parsedAmount)
                    ? { amount: parsedAmount }
                    : {}),
                ...(parsedDate ? { date: parsedDate } : {}),
                ...(typeof rawDescription === "string" && rawDescription
                    ? { description: rawDescription }
                    : {}),
                ...(typeof data.category === "string" && data.category
                    ? { category: data.category }
                    : {}),
                ...(typeof data.merchantName === "string" && data.merchantName
                    ? { merchantName: data.merchantName }
                    : {}),
            };
        } catch (parseError) {
            console.error("Error parsing JSON response:", parseError);
            throw new Error("Invalid response format from Gemini");
        }
    } catch (error) {
        console.error("Error scanning receipt:", error);
        throw new Error(error?.message || "Failed to scan receipt");
    }
}

// Helper function to calculate next recurring date
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