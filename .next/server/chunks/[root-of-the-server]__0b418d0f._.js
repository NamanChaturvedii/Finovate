module.exports = {

"[project]/.next-internal/server/app/api/seed/route/actions.js [app-rsc] (server actions loader, ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
}}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/@prisma/client [external] (@prisma/client, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("@prisma/client", () => require("@prisma/client"));

module.exports = mod;
}}),
"[project]/lib/prisma.js [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "db": (()=>db)
});
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
;
const db = globalThis.prisma || new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["PrismaClient"]();
if ("TURBOPACK compile-time truthy", 1) {
    globalThis.prisma = db;
} // the below explanation of above
 // globalThis.prisma: This global variable ensures that the Prisma client instance is
 // reused across hot reloads during development. Without this, each time your application
 // reloads, a new instance of the Prisma client would be created, potentially leading
 // to connection issues.
}}),
"[project]/actions/seed.js [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ [{"0093bf3e237a0062d97f7c5fea6e505dde7b18c873":"seedTransactions"},"",""] */ __turbopack_context__.s({
    "seedTransactions": (()=>seedTransactions)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$app$2d$render$2f$encryption$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/app-render/encryption.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/prisma.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$subDays$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/subDays.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-route] (ecmascript)");
;
;
;
;
const ACCOUNT_ID = "efd07a69-afe9-489d-a141-430d1caeb271";
const USER_ID = "7c25fec3-4353-4e7d-8bf6-15b6838388d2";
// Categories with their typical amount ranges
const CATEGORIES = {
    INCOME: [
        {
            name: "salary",
            range: [
                5000,
                8000
            ]
        },
        {
            name: "freelance",
            range: [
                1000,
                3000
            ]
        },
        {
            name: "investments",
            range: [
                500,
                2000
            ]
        },
        {
            name: "other-income",
            range: [
                100,
                1000
            ]
        }
    ],
    EXPENSE: [
        {
            name: "housing",
            range: [
                1000,
                2000
            ]
        },
        {
            name: "transportation",
            range: [
                100,
                500
            ]
        },
        {
            name: "groceries",
            range: [
                200,
                600
            ]
        },
        {
            name: "utilities",
            range: [
                100,
                300
            ]
        },
        {
            name: "entertainment",
            range: [
                50,
                200
            ]
        },
        {
            name: "food",
            range: [
                50,
                150
            ]
        },
        {
            name: "shopping",
            range: [
                100,
                500
            ]
        },
        {
            name: "healthcare",
            range: [
                100,
                1000
            ]
        },
        {
            name: "education",
            range: [
                200,
                1000
            ]
        },
        {
            name: "travel",
            range: [
                500,
                2000
            ]
        }
    ]
};
// Helper to generate random amount within a range
function getRandomAmount(min, max) {
    return Number((Math.random() * (max - min) + min).toFixed(2));
}
// Helper to get random category with amount
function getRandomCategory(type) {
    const categories = CATEGORIES[type];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const amount = getRandomAmount(category.range[0], category.range[1]);
    return {
        category: category.name,
        amount
    };
}
async function seedTransactions() {
    try {
        // Generate 90 days of transactions
        const transactions = [];
        let totalBalance = 0;
        for(let i = 90; i >= 0; i--){
            const date = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$subDays$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["subDays"])(new Date(), i);
            // Generate 1-3 transactions per day
            const transactionsPerDay = Math.floor(Math.random() * 3) + 1;
            for(let j = 0; j < transactionsPerDay; j++){
                // 40% chance of income, 60% chance of expense
                const type = Math.random() < 0.4 ? "INCOME" : "EXPENSE";
                const { category, amount } = getRandomCategory(type);
                const transaction = {
                    id: crypto.randomUUID(),
                    type,
                    amount,
                    description: `${type === "INCOME" ? "Received" : "Paid for"} ${category}`,
                    date,
                    category,
                    status: "COMPLETED",
                    userId: USER_ID,
                    accountId: ACCOUNT_ID,
                    createdAt: date,
                    updatedAt: date
                };
                totalBalance += type === "INCOME" ? amount : -amount;
                transactions.push(transaction);
            }
        }
        // Insert transactions in batches and update account balance
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].$transaction(async (tx)=>{
            // Clear existing transactions
            await tx.transaction.deleteMany({
                where: {
                    accountId: ACCOUNT_ID
                }
            });
            // Insert new transactions
            await tx.transaction.createMany({
                data: transactions
            });
            // Update account balance
            await tx.account.update({
                where: {
                    id: ACCOUNT_ID
                },
                data: {
                    balance: totalBalance
                }
            });
        });
        return {
            success: true,
            message: `Created ${transactions.length} transactions`
        };
    } catch (error) {
        console.error("Error seeding transactions:", error);
        return {
            success: false,
            error: error.message
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    seedTransactions
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(seedTransactions, "0093bf3e237a0062d97f7c5fea6e505dde7b18c873", null);
}}),
"[project]/app/api/seed/route.js [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "GET": (()=>GET)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$actions$2f$seed$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/actions/seed.js [app-route] (ecmascript)");
;
async function GET() {
    const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$actions$2f$seed$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["seedTransactions"])();
    return Response.json(result);
}
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__0b418d0f._.js.map