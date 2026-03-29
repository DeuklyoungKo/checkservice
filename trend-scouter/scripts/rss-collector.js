const Parser = require('rss-parser');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const parser = new Parser();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const geminiApiKey = process.env.GEMINI_API_KEY;

// 수집 대상 RSS 피드 리스트 (Notion 가이드 기반)
const RSS_FEEDS = [
    { name: 'indie-hackers', url: 'https://www.indiehackers.com/feed.rss' },
    { name: 'reddit-sideproject', url: 'https://www.reddit.com/r/sideproject/.rss' },
    { name: 'product-hunt', url: 'https://www.producthunt.com/feed' },
    { name: 'hacker-news', url: 'https://news.ycombinator.com/rss' },
    { name: 'dev-to', url: 'https://dev.to/feed' },
    { name: 'zdnet-korea', url: 'https://zdnet.co.kr/rss.aspx' }
];

// 분석 대상 핵심 키워드 (Impact Score 산정용)
const TARGET_KEYWORDS = ['AI', '자동화', 'SaaS', '노코드', '수익화', 'ChatGPT', 'Automation', 'Revenue', 'Startup', 'No-code'];

async function calculateImpactScore(title, content) {
    let score = 0;
    const text = (title + ' ' + content).toLowerCase();
    TARGET_KEYWORDS.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
            score += 10; // 키워드당 10점 가점
        }
    });
    return score;
}

async function analyzeWithAI(title, content, source) {
    const prompt = `
    Analyze the following trend/problem found in ${source}.
    Original Title (Temporary): "${title}"
    Content Excerpt: "${content.substring(0, 500)}"

    OUTPUT FORMAT (JSON only):
    {
      "headline": "A punchy business-focused headline in Korean",
      "pain_category": "Functional" | "Financial" | "Emotional",
      "pufe": { "p": 0-25, "u": 0-25, "f": 0-25, "e": 0-25, "reasoning": "..." },
      "summary": "3-sentence analysis in Korean",
      "solution_wizard": { "steps": [...], "checklist": [...] }
    }
    `;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`,
            { contents: [{ parts: [{ text: prompt + "\n\nProvide JSON only." }] }] }
        );
        const resultText = response.data.candidates[0].content.parts[0].text.replace(/```json\n?|```/g, '').trim();
        return JSON.parse(resultText);
    } catch (error) {
        console.error('AI Analysis failed:', error.message);
        return null;
    }
}

async function collectRSS() {
    console.log('🚀 Starting Strict Stats-Only RSS Collection...');

    for (const feed of RSS_FEEDS) {
        try {
            console.log(`📡 Fetching ${feed.name}...`);
            const data = await parser.parseURL(feed.url);
            
            for (const item of data.items) {
                const impactScore = await calculateImpactScore(item.title, item.contentSnippet || item.content || '');
                
                // 1. 임팩트 스코어가 높은 아이템(예: 20점 이상)만 AI 분석 수행
                if (impactScore >= 20) {
                    console.log(`✨ High impact detected: ${item.title.substring(0, 30)}... (Score: ${impactScore})`);
                    
                    const analysis = await analyzeWithAI(item.title, item.content || item.contentSnippet || '', feed.name);
                    
                    if (analysis) {
                        // 2. Trends 테이블에는 통계 정보만 저장 (Strict Stats-Only)
                        const { data: trend, error: tError } = await supabase.from('trends').upsert({
                            source: feed.name,
                            external_id: item.guid || item.id || item.link,
                            url: item.link,
                            impact_score: impactScore,
                            stats_data: {
                                keyword_hits: TARGET_KEYWORDS.filter(k => (item.title + (item.content || '')).toLowerCase().includes(k.toLowerCase())),
                                total_feed_items: data.items.length
                            }
                        }, { onConflict: 'source,external_id' }).select().single();

                        if (trend) {
                            // 3. Analysis 테이블에 AI 생성 헤드라인과 리포트만 저장
                            await supabase.from('analysis').insert({
                                trend_id: trend.id,
                                headline: analysis.headline,
                                pufe_p: analysis.pufe.p,
                                pufe_u: analysis.pufe.u,
                                pufe_f: analysis.pufe.f,
                                pufe_e: analysis.pufe.e,
                                pufe_total: analysis.pufe.p + analysis.pufe.u + analysis.pufe.f + analysis.pufe.e,
                                pain_category: analysis.pain_category,
                                summary: analysis.summary,
                                solution_wizard: analysis.solution_wizard,
                                ai_model: 'gemini-2.5-flash-lite-stats-v1'
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`❌ Error in ${feed.name}:`, error.message);
        }
    }
    console.log('✅ Collection complete.');
}

collectRSS();
