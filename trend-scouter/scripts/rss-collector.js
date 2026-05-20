const { GoogleGenerativeAI } = require("@google/generative-ai");
const Parser = require('rss-parser');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// .env.local 로드 (로컬 개발용)
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

/**
 * 환경 변수 필수 검증
 */
function validateEnv() {
    const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GEMINI_API_KEY'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        console.error(`❌ 필수 환경 변수가 누락되었습니다: ${missing.join(', ')}`);
        console.error('GitHub Secrets 또는 .env.local 설정을 확인해 주세요.');
        process.exit(1);
    }
}

validateEnv();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 수집 대상 RSS 피드 리스트
const RSS_FEEDS = [
    { name: 'indie-hackers', url: 'https://hnrss.org/newest?q=Indie+Hackers&points=20' },
    { name: 'reddit-sideproject', url: 'https://www.reddit.com/r/sideproject/.rss' },
    { name: 'product-hunt', url: 'https://www.producthunt.com/feed' },
    { name: 'hacker-news', url: 'https://hnrss.org/newest?q=SaaS+OR+Automation&points=20' },
    { name: 'dev-to', url: 'https://dev.to/feed' },
    { name: 'zdnet-korea', url: 'https://zdnet.co.kr/feed' }
];

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';
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
    // 3.1 모델을 우선 시도하되, 실패 시 1.5-flash로 폴백
    const modelNames = ["gemini-3.1-flash-lite-preview", "gemini-1.5-flash"];
    let lastError = null;

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

    for (const modelName of modelNames) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const resultText = response.text().replace(/```json\n?|```/g, '').trim();
            const analysis = JSON.parse(resultText);
            
            console.log(`✅ Analysis success (${modelName}): ${analysis.headline.substring(0, 40)}...`);
            return analysis;
        } catch (error) {
            lastError = error;
            console.warn(`⚠️  Model ${modelName} failed, trying next... Error: ${error.message}`);
        }
    }

    console.error('❌ AI Analysis failed for all models:', lastError.message);
    return null;
}

async function collectRSS() {
    console.log('🚀 트렌드 데이터 수집 및 분석 시작...');

    for (const feed of RSS_FEEDS) {
        try {
            console.log(`📡 Fetching ${feed.name}...`);
            const data = await parser.parseURL(feed.url);
            
            for (const item of data.items) {
                try {
                    const impactScore = await calculateImpactScore(item.title, item.contentSnippet || item.content || '');
                    if (impactScore < 10) continue;

                    const externalId = item.guid || item.id || item.link;
                    
                    // DB 조회 에러 핸들링 추가
                    const { data: existing, error: checkError } = await supabase
                        .from('trends')
                        .select('id, impact_score')
                        .eq('external_id', externalId)
                        .maybeSingle();

                    if (checkError) {
                        console.error(`❌ DB Check Error: ${checkError.message}`);
                        continue;
                    }

                    if (existing && existing.impact_score >= impactScore) {
                        continue;
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

                        if (tError) {
                            console.error(`❌ Trend Upsert Error: ${tError.message}`);
                            continue;
                        }

                        if (trend) {
                            const { error: aError } = await supabase.from('analysis').upsert({
                                trend_id: trend.id,
                                headline: analysis.headline,
                                pufe_p: analysis.pufe.p,
                                pufe_u: analysis.pufe.u,
                                pufe_f: analysis.pufe.f,
                                pufe_e: analysis.pufe.e,
                                pufe_total: (analysis.pufe.p || 0) + (analysis.pufe.u || 0) + (analysis.pufe.f || 0) + (analysis.pufe.e || 0),
                                pain_category: analysis.pain_category,
                                summary: analysis.summary,
                                reasoning: analysis.pufe.reasoning,
                                solution_wizard: analysis.solution_wizard,
                                ai_model: 'gemini-3.1-or-1.5-flash-v3'
                            }, { onConflict: 'trend_id' });

                            if (aError) {
                                console.error(`❌ Analysis Upsert Error: ${aError.message}`);
                            }
                        }
                    }
                } catch (itemError) {
                    console.error(`⚠️  Item skip error: ${item.title?.substring(0, 30)} | ${itemError.message}`);
                }
            }
        } catch (error) {
            console.error(`❌ Source failed: ${feed.name} | ${error.message}`);
        }
    }
    console.log('✅ 수집 및 분석 작업이 완료되었습니다.');
}

// 메인 실행부: 에러 발생 시 프로세스 종료 코드 전달
collectRSS()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('🔥 Fatal Error during execution:', err);
        process.exit(1);
    });
