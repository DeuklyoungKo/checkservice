const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function automateAnalysis() {
    console.log('🚀 Starting Automated AI Analysis...');

    if (!openaiApiKey) {
        console.warn('⚠️ OPENAI_API_KEY is missing. Please add it to .env.local to run the actual analysis.');
        console.log('💡 Dry run mode: Fetching trends that need analysis...');
    }

    // 1. Fetch trends that don't have analysis yet
    // 우리는 trends 테이블과 analysis 테이블을 조인하여 analysis가 없는 항목을 찾습니다.
    const { data: trends, error } = await supabase
        .from('trends')
        .select(`
            id,
            title,
            description,
            source,
            url,
            raw_data
        `);

    if (error) {
        console.error('❌ Error fetching trends:', error.message);
        return;
    }

    // Filter trends that already have analysis (simple check for now)
    const { data: existingAnalysis } = await supabase.from('analysis').select('trend_id');
    const existingIds = new Set(existingAnalysis?.map(a => a.trend_id) || []);

    const targetTrends = trends.filter(t => !existingIds.has(t.id)).slice(0, 5); // Limit to 5 for safety

    console.log(`📊 Found ${trends.length} total trends, ${targetTrends.length} need analysis (Batch limit: 5).`);

    if (targetTrends.length === 0) {
        console.log('✅ All trends are already analyzed.');
        return;
    }

    if (!openaiApiKey) {
        console.log('⏹️ Stopping here because OPENAI_API_KEY is missing.');
        return;
    }

    for (const trend of targetTrends) {
        console.log(`🤖 Analyzing: ${trend.title}...`);

        const prompt = `
        You are an expert business analyst and entrepreneur. 
        Analyze the following business trend/product and provide a detailed report in JSON format.
        
        TREND DATA:
        Title: ${trend.title}
        Description: ${trend.description}
        Source: ${trend.source}
        
        OUTPUT FORMAT (JSON only):
        {
          "title_ko": "Korean translated/localized title",
          "summary": "3-sentence summary of what this is in Korean",
          "score_revenue": 0-100,
          "score_difficulty": 0-100,
          "score_korea_potential": 0-100,
          "reasoning": "Detailed reasoning for the scores in Korean",
          "business_model": "Suggested business model in Korean",
          "gtm_strategy": "Go-to-market strategy for the Korean market",
          "korea_localization_tips": "Specific tips for the Korean market",
          "tech_stack_suggestion": "Suggested tech stack for an MVP"
        }
        
        Language: All text fields must be in Korean (Except tech stack if technical).
        Focus on providing actionable and high-quality insights for a solo developer or small team in Korea.
        `;

        try {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a professional business scout.' },
                    { role: 'user', content: prompt }
                ],
                response_format: { type: 'json_object' }
            }, {
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = JSON.parse(response.data.choices[0].message.content);

            // 2. Save to analysis table
            const combinedSummary = `${result.summary}\n\n### 💡 Reasoning\n${result.reasoning}`;

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
                ai_model: 'gpt-4o-mini'
            });

            if (insertError) {
                console.error(`❌ Error saving analysis for ${trend.title}:`, insertError.message);
            } else {
                console.log(`✅ Analysis completed and saved for: ${trend.title}`);
            }

        } catch (apiError) {
            console.error(`❌ API Error for ${trend.title}:`, apiError.response?.data || apiError.message);
        }
    }

    console.log('🎉 Batch analysis completed!');
}

automateAnalysis();
