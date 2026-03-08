const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
    console.error('❌ GEMINI_API_KEY is missing.');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(geminiApiKey);

async function listModels() {
    try {
        const models = await genAI.listModels();
        console.log('Available models:');
        console.log(JSON.stringify(models, null, 2));
    } catch (err) {
        console.error('❌ Error listing models:', err.message);
    }
}

listModels();
