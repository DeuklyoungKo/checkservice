const Parser = require('rss-parser');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });


const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const geminiApiKey = process.env.GEMINI_API_KEY;

console.log('🔑 Gemini API Key Status:', geminiApiKey ? `Loaded (${geminiApiKey.substring(0, 5)}...)` : '❌ NOT FOUND');

// 수집 대상 RSS 피드 리스트 (HNRSS 및 최신 URL 반영)
const RSS_FEEDS = [
    { name: 'indie-hackers', url: 'https://hnrss.org/newest?q=Indie+Hackers&points=20' },
    { name: 'reddit-sideproject', url: 'https://www.reddit.com/r/sideproject/.rss' },
    { name: 'product-hunt', url: 'https://www.producthunt.com/feed' },
    { name: 'hacker-news', url: 'https://hnrss.org/newest?q=SaaS+OR+Automation&points=20' },
    { name: 'dev-to', url: 'https://dev.to/feed' },
    { name: 'zdnet-korea', url: 'https://zdnet.co.kr/feed' }
];

// 브라우저용 User-Agent (차단 우회용)
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';

// 분석 대상 핵심 키워드
const TARGET_KEYWORDS = ['AI', '자동화', 'SaaS', '노코드', '수익화', 'ChatGPT', 'Automation', 'Revenue', 'Startup', 'No-code', 'OpenAI', 'Gemini'];

const parser = new Parser({
    headers: { 'User-Agent': USER_AGENT }
});

async function calculateImpactScore(title, content) {
    let score = 0;
    const text = (title + ' ' + content).toLowerCase();
    TARGET_KEYWORDS.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
            score += 10;
        }
    });
    return score;
}

async function analyzeWithAI(title, content, source) {
    const prompt = `
    Analyze this trend from ${source}.
    Title: "${title}"
    Content: "${content.substring(0, 1000)}"

    OUTPUT JSON ONLY:
    {
      "headline": "Punchy Korean business headline",
      "pain_category": "Functional" | "Financial" | "Emotional",
      "pufe": { "p": 0-25, "u": 0-25, "f": 0-25, "e": 0-25, "reasoning": "Detailed reason in Korean" },
      "summary": "3-sentence Korean analysis",
      "solution_wizard": { "steps": ["step1", "step2", ...], "checklist": ["item1", "item2", ...] }
    }
    `;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${geminiApiKey}`,
            { contents: [{ parts: [{ text: prompt }] }] },
            { headers: { 'User-Agent': USER_AGENT } }
        );
        const resultText = response.data.candidates[0].content.parts[0].text.replace(/```json\n?|```/g, '').trim();
        const analysis = JSON.parse(resultText);
        console.log(`✅ Analysis success: ${analysis.headline.substring(0, 40)}...`);
        return analysis;
    } catch (error) {
        console.error('AI Analysis failed:', error.message);
        if (error.response) {
            console.error('Error Details:', JSON.stringify(error.response.data, null, 2));
        }
        return null;
    }
}

async function collectRSS() {
    console.log('🚀 Starting Robust Stats-Only RSS Collection...');

    for (const feed of RSS_FEEDS) {
        try {
            console.log(`📡 Fetching ${feed.name}...`);
            const data = await parser.parseURL(feed.url);

            for (const item of data.items) {
                try {
                    const impactScore = await calculateImpactScore(item.title, item.contentSnippet || item.content || '');
                    if (impactScore < 10) continue; // 최소 기준점

                    // 중복 체크 (External ID 기준)
                    const externalId = item.guid || item.id || item.link;
                    const { data: existing } = await supabase.from('trends').select('id, impact_score').eq('external_id', externalId).single();

                    if (existing && existing.impact_score >= impactScore) {
                        continue; // 이미 처리된 고득점 아이템 스킵
                    }

                    console.log(`✨ Analyzing: ${item.title.substring(0, 40)}... (Score: ${impactScore})`);
                    const analysis = await analyzeWithAI(item.title, item.content || item.contentSnippet || '', feed.name);

                    if (analysis) {
                        const { data: trend, error: tError } = await supabase.from('trends').upsert({
                            source: feed.name,
                            external_id: externalId,
                            url: item.link,
                            impact_score: impactScore,
                            stats_data: {
                                keyword_hits: TARGET_KEYWORDS.filter(k => (item.title + (item.content || '')).toLowerCase().includes(k.toLowerCase())),
                                original_title: item.title
                            }
                        }, { onConflict: 'source,external_id' }).select().single();

                        if (trend) {
                            const { error: aError } = await supabase.from('analysis').upsert({
                                trend_id: trend.id,
                                headline: analysis.headline,
                                pufe_p: analysis.pufe.p,
                                pufe_u: analysis.pufe.u,
                                pufe_f: analysis.pufe.f,
                                pufe_e: analysis.pufe.e,
                                pufe_total: analysis.pufe.p + analysis.pufe.u + analysis.pufe.f + analysis.pufe.e,
                                pain_category: analysis.pain_category,
                                summary: analysis.summary,
                                reasoning: analysis.pufe.reasoning,
                                solution_wizard: analysis.solution_wizard,
                                ai_model: 'gemini-2.0-flash-lite-stats-v2'
                            }, { onConflict: 'trend_id' });

                            if (aError) {
                                console.error(`❌ Analysis save failed [${trend.id}]:`, aError.message, aError.code);
                            } else {
                                console.log(`💾 Analysis saved: ${analysis.headline?.substring(0, 40)}`);
                            }
                        }
                    }
                } catch (itemError) {
                    console.error(`⚠️  Item skip error: ${item.title.substring(0, 30)} | ${itemError.message}`);
                }
            }
        } catch (error) {
            console.error(`❌ Source failed: ${feed.name} | ${error.message}`);
        }
    }
    console.log('✅ Collection and Analysis complete.');
}

collectRSS();
