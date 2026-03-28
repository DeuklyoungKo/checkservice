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
    Title: ${trend.title}
    Description: ${trend.description}
    Source: ${trend.source}
    Statistics: Upvotes/Mentions count is ${trend.upvotes || 'unknown'}.
    
    PUFE DEFINITION:
    - Pain (0-25): Depth of the user's problem. (Functional, Financial, Emotional)
    - Urgency (0-25): How quickly they need a solution.
    - Frequency (0-25): How often the problem occurs.
    - Existing Solution (0-25): How difficult/expensive current alternatives are (Higher score means more difficult/worse alternatives).

    OUTPUT FORMAT (JSON only):
    {
      "title_ko": "Korean translated title",
      "pain_category": "Functional" | "Financial" | "Emotional",
      "pufe": {
        "p": 0-25,
        "u": 0-25,
        "f": 0-25,
        "e": 0-25,
        "reasoning": "Brief explanation for each score in Korean"
      },
      "summary": "3-sentence summary in Korean focused on the Pain Point and Stats",
      "solution_wizard": {
        "steps": ["Step 1 for solution", "Step 2", "Step 3"],
        "checklist": ["Action item 1", "Action item 2"]
      },
      "business_model": "Monetization strategy one-liner",
      "gtm_strategy": "Step-by-step GTM for the Korean market",
      "korea_localization_tips": "Specific tips for Korea",
      "tech_stack_suggestion": "Recommended tech stack (Markdown list)"
    }
    `;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`,
            {
                contents: [{ parts: [{ text: prompt + "\n\nProvide the result exactly as a valid JSON object without any markdown wrapping." }] }]
            }
        );

        let responseText = response.data.candidates[0].content.parts[0].text;
        responseText = responseText.replace(/```json\n?|```/g, '').trim();
        const result = JSON.parse(responseText);

        const totalScore = result.pufe.p + result.pufe.u + result.pufe.f + result.pufe.e;
        const combinedSummary = `[${result.pain_category} Pain] ${result.title_ko}\n\n${result.summary}\n\n### ⚖️ PUFE 분석 근거\n${result.pufe.reasoning}\n\n### 🇰🇷 한국형 진입 전략 (GTM)\n${result.gtm_strategy}`;

        const { error: insertError } = await supabase.from('analysis').insert({
            trend_id: trend.id,
            pufe_p: result.pufe.p,
            pufe_u: result.pufe.u,
            pufe_f: result.pufe.f,
            pufe_e: result.pufe.e,
            pufe_total: totalScore,
            pain_category: result.pain_category,
            solution_wizard: result.solution_wizard,
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
    const { data: trends } = await supabase.from('trends').select('id, title, description, source, upvotes');
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
