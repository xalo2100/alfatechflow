
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ GEMINI_API_KEY not found in .env.local");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        // There isn't a direct listModels method on the client instance in some versions, 
        // but we can try to use the API directly or just test a generation.

        console.log("Testing gemini-pro...");
        try {
            const result = await model.generateContent("Hello");
            console.log("✅ gemini-pro works!");
        } catch (e) {
            console.error("❌ gemini-pro failed:", e.message);
        }

        const modelFlash = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("Testing gemini-1.5-flash...");
        try {
            const result = await modelFlash.generateContent("Hello");
            console.log("✅ gemini-1.5-flash works!");
        } catch (e) {
            console.error("❌ gemini-1.5-flash failed:", e.message);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
