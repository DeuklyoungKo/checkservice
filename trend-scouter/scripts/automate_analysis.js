const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiApiKey) {
    console.error('❌ Missing credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeTrend(trend) {
    const prompt = `
    Analyze the following business trend/product and provide a detailed report in JSON format.
    Title: ${trend.title}
    Description: ${trend.description}
    Source: ${trend.source}
    
    OUTPUT FORMAT (JSON only):
    {
      "title_ko": "Korean translated title",
      "summary": "3-sentence summary in Korean",
      "score_revenue": 0-100,
      "score_difficulty": 0-100,
      "score_korea_potential": 0-100,
      "reasoning": "Detailed reasoning in Korean. Follow these formatting rules: 1) Split paragraphs at topic/context changes. 2) Use double newlines every 2-3 sentences for web readability. 3) Use markdown bullet points for key evidence.",
      "business_model": "Business model in Korean (One clear sentence)",
      "gtm_strategy": "Step-by-step GTM strategy in Korean. Follow these formatting rules: 1) Group 2-3 sentences per paragraph. 2) Break at logical strategy shifts. 3) Use markdown lists/bolding for priority items.",
      "korea_localization_tips": "Localization tips in Korean. Follow these formatting rules: 1) Group 2-3 sentences per paragraph. 2) Break at logical context/topic shifts. 3) Use bolding for key action items.",
      "tech_stack_suggestion": "Recommended tech stack (Use markdown bullet points)"
    }
    `;

    try {
        // Using axios for raw REST API call to Gemini 2.5 Flash Lite (v1beta endpoint)
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`,
            {
                contents: [{ parts: [{ text: prompt + "\n\nProvide the result exactly as a valid JSON object without any markdown wrapping." }] }]
            }
        );

        let responseText = response.data.candidates[0].content.parts[0].text;
        // Basic cleaning
        responseText = responseText.replace(/```json\n?|```/g, '').trim();
        const result = JSON.parse(responseText);

        const combinedSummary = `[TITLE_KO] ${result.title_ko}\n\n${result.summary}\n\n### 💡 점수 부여 근거 (Reasoning)\n${result.reasoning}\n\n### 🇰🇷 한국형 진입 전략 (GTM)\n${result.gtm_strategy}`;

        const { error: insertError } = await supabase.from('analysis').insert({
            trend_id: trend.id,
            score_revenue: result.score_revenue,
            score_difficulty: result.score_difficulty,
            score_korea_potential: result.score_korea_potential,
            summary: combinedSummary,
            business_model: result.business_model,
            gtm_strategy: result.gtm_strategy,
            tech_stack_suggestion: result.tech_stack_suggestion,
            korea_localization_tips: result.korea_localization_tips,
            ai_model: 'gemini-2.5-flash-lite'
        });

        if (insertError) {
            console.error(`❌ DB Error: ${insertError.message}`);
            return false;
        }
        console.log(`✅ Success: ${trend.title}`);
        return true;
    } catch (err) {
        console.error(`❌ API Error for ${trend.title}:`, err.response?.data || err.message);
        return false;
    }
}

async function run() {
    console.log('🚀 Running Gemini Analysis via Axios...');
    const { data: trends } = await supabase.from('trends').select('id, title, description, source');
    const { data: existing } = await supabase.from('analysis').select('trend_id');
    const existingIds = new Set(existing?.map(e => e.trend_id) || []);
    const targets = trends.filter(t => !existingIds.has(t.id));

    console.log(`📊 Targets: ${targets.length}`);

    for (const trend of targets) {
        await analyzeTrend(trend);
        await new Promise(r => setTimeout(r, 500)); // 500ms delay for Tier 1 (150+ RPM)
    }
}

run();
