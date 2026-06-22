const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Parser = require('rss-parser');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// .env.local 로드 (로컬 개발용)
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const { getKoreanDemandSignal, getFullKoreanTrendSnapshot } = require('./naver-datalab');

/**
 * 환경 변수 필수 검증
 * DeepSeek 또는 Gemini 중 하나 이상 필수
 */
function validateEnv() {
    const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        console.error(`❌ 필수 환경 변수가 누락되었습니다: ${missing.join(', ')}`);
        console.error('GitHub Secrets 또는 .env.local 설정을 확인해 주세요.');
        process.exit(1);
    }
    if (!process.env.DEEPSEEK_API_KEY && !process.env.GEMINI_API_KEY) {
        console.error('❌ DEEPSEEK_API_KEY 또는 GEMINI_API_KEY 중 하나 이상 필요합니다.');
        process.exit(1);
    }
}

validateEnv();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;
const naverClientId = process.env.NAVER_CLIENT_ID;
const naverClientSecret = process.env.NAVER_CLIENT_SECRET;

// Gemini 폴백 초기화 (GEMINI_API_KEY 있을 때만)
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

console.log('🔑 DeepSeek API Key:', deepseekApiKey ? `Loaded (${deepseekApiKey.substring(0, 8)}...)` : '⚠️  NOT SET (Gemini 폴백 사용)');
console.log('🔑 Gemini API Key:', geminiApiKey ? `Loaded (${geminiApiKey.substring(0, 5)}...)` : '⚠️  NOT SET (폴백 불가)');
console.log('🔑 Naver DataLab Status:', naverClientId ? `Loaded (${naverClientId.substring(0, 4)}...)` : '⚠️  NOT SET (교차검증 비활성화)');

// DataLab 스냅샷 캐시 (한 번 조회 후 재사용 — API 호출 최소화)
let datalabSnapshot = null;

const parser = new Parser({
    headers: {
        // 봇임을 정직하게 식별 + 연락처 노출 (브라우저 위장 ❌). 상세: 3.LEGAL_CHECKLIST.md FIX-5
        'User-Agent': 'TrendScouterBot/1.0 (+https://trend.gonsuit.com; trend@gonsuit.com)',
        'Accept': 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
    },
});

// 수집 대상 RSS 피드 리스트 (글로벌 Tier 1 + 한국 Tier 2)
const RSS_FEEDS = [
    // --- [Tier 1] 글로벌 소스 ---
    { name: 'indie-hackers',     url: 'https://hnrss.org/newest?q=Indie+Hackers&points=20',        isKorean: false },
    { name: 'reddit-sideproject',url: 'https://www.reddit.com/r/sideproject/.rss',                  isKorean: false },
    { name: 'product-hunt',      url: 'https://www.producthunt.com/feed',                           isKorean: false },
    { name: 'hacker-news',       url: 'https://hnrss.org/newest?q=SaaS+OR+Automation&points=20',   isKorean: false },
    { name: 'dev-to',            url: 'https://dev.to/feed',                                        isKorean: false },
    // --- [Tier 2] 한국 소스 (Korea Data Pipeline - 단계적 추가) ---
    // NOTE: zdnet-korea(상업 언론사 RSS)는 저작권 위험으로 제거함. 상세: 3.LEGAL_CHECKLIST.md FIX-2
    { name: 'geek-news',         url: 'https://news.hada.io/rss/news',                              isKorean: true  }, // 한국 개발자 커뮤니티 인기 토픽
];

// 분석 대상 핵심 키워드 (글로벌 + 한국)
const TARGET_KEYWORDS = [
    // 글로벌
    'AI', 'SaaS', 'Automation', 'Revenue', 'Startup', 'No-code', 'OpenAI', 'Gemini', 'ChatGPT',
    // 한국어 (GeekNews, ZDNet Korea 대응)
    '자동화', '노코드', '수익화', 'AI', '스타트업', '창업', '서비스', '앱', '플랫폼', 'SaaS'
];

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

async function analyzeWithAI(title, content, source, isKorean = false, koreaDemand = null) {
    let lastError = null;
    const koreanHint = isKorean
        ? `\n    ※ 이 데이터는 한국 소스(${source})에서 수집된 콘텐츠입니다. 한국 시장 맥락을 최우선으로 분석하세요.`
        : `\n    ※ 이 데이터는 글로벌 소스(${source})에서 수집되었습니다. 한국 시장에 이식 가능한 관점으로 분석하세요.`;

    const datalabHint = koreaDemand
        ? `\n    [한국 네이버 검색 수요 데이터 - DataLab 교차검증]\n    - 관련 키워드 그룹: "${koreaDemand.group}"\n    - 최신 검색 지수: ${koreaDemand.ratio}/100 (0=거의 없음, 100=최고점)\n    - 전월 대비 성장률: ${koreaDemand.growth > 0 ? '+' : ''}${koreaDemand.growth}%\n    ※ 이 수요 데이터를 기반으로 한국 시장 실제 관심도를 PUFE 점수에 반영하고, summary에 구체적으로 언급하세요.`
        : '';

    const prompt = `
    Analyze this trend from ${source}.${koreanHint}${datalabHint}
    Title: "${title}"
    Content: "${content.substring(0, 1000)}"

    OUTPUT JSON ONLY:
    {
      "headline": "Punchy Korean business headline",
      "pain_category": "Functional" | "Financial" | "Emotional",
      "pufe": { "p": 0-25, "u": 0-25, "f": 0-25, "e": 0-25, "reasoning": "Detailed reason in Korean for each PUFE score" },
      "summary": "3-sentence Korean market analysis",
      "gtm_strategy": "Step-by-step Korean Go-to-Market strategy",
      "tech_stack_suggestion": ["Tech1", "Tech2", "Tech3"],
      "korea_localization_tips": "Specific tips for Korean market localization",
      "solution_wizard": { "steps": ["step1", "step2", ...], "checklist": ["item1", "item2", ...] },
      "ai_buildability_score": 1-5,
      "ai_brief": "Detailed, complete product brief in Korean formatted in Markdown. Tailor it specifically for AI Coding tools (Claude Code, ChatGPT, Gemini, etc.) so that developers can directly copy-paste this brief to build the product. Follow this Markdown structure precisely without using code block backticks inside: \\n# 서비스 개발 브리프\\n\\n## 아이디어 요약\\n[1-2 sentence core concept explanation]\\n\\n## 타겟 유저\\n- 페르소나: [Target persona]\\n- 핵심 고통 (Pain Point): [What major problem it solves]\\n- 지불 의사 (Willingness to Pay): [Estimated price/value]\\n\\n## MVP 핵심 기능 (3~5개)\\n1. [Feature 1]\\n2. [Feature 2]\\n3. [Feature 3]\\n\\n## 추천 기술 스택\\n- Frontend: Next.js + Tailwind CSS\\n- Backend/DB: Supabase\\n- 결제: Polar / Stripe\\n- 배포: Vercel\\n\\n## 예상 개발 기간\\n[Estimated time in days/weeks using AI tools]\\n\\n## 수익 가능성\\n[Monthly revenue estimation and logical grounds]"
    }
    
    ※ "ai_buildability_score" GUIDELINES: Rate how easy it is to implement this service using AI coding tools as an integer between 1 and 5:
    - 1: 1 day (simple forms, landing page + payments)
    - 2: 2-3 days (CRUD, simple SaaS MVP with auth)
    - 3: 1 week (integrates external APIs or databases)
    - 4: 2 weeks (real-time chat, notifications, complex flows)
    - 5: 1 month+ (requires ML models training, custom complex backend)
    `;

    // 1순위: DeepSeek V3
    if (deepseekApiKey) {
        try {
            const response = await axios.post(
                'https://api.deepseek.com/chat/completions',
                {
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a business trend analyst specializing in Korean market insights. Always respond with valid JSON only, no markdown code blocks.'
                        },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${deepseekApiKey}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000,
                }
            );

            const resultText = response.data.choices[0].message.content
                .replace(/```json\n?|```/g, '').trim();
            const analysis = JSON.parse(resultText);

            console.log(`✅ Analysis success (deepseek-chat): ${analysis.headline.substring(0, 40)}...`);
            return analysis;
        } catch (error) {
            lastError = error;
            console.warn(`⚠️  DeepSeek failed: ${error.message} — Gemini 폴백 시도`);
        }
    }

    // 2순위 폴백: Gemini 2.5 Flash-Lite
    if (genAI) {
        const fallbackModels = ['gemini-3.5-flash', 'gemini-2.5-flash-lite'];
        for (const modelName of fallbackModels) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const resultText = response.text().replace(/```json\n?|```/g, '').trim();
                const analysis = JSON.parse(resultText);

                console.log(`✅ Analysis success (${modelName} fallback): ${analysis.headline.substring(0, 40)}...`);
                return analysis;
            } catch (error) {
                lastError = error;
                console.warn(`⚠️  ${modelName} fallback failed: ${error.message}`);
            }
        }
    }

    console.error('❌ AI Analysis failed (DeepSeek + Gemini 모두 실패):', lastError?.message);
    return null;
}

async function collectRSS() {
    console.log('🚀 트렌드 데이터 수집 및 분석 시작...');

    // 네이버 DataLab 전체 스냅샷 선조회 (API 호출 1번으로 캐시)
    if (naverClientId && naverClientSecret) {
        console.log('📊 [DataLab] 한국 검색 트렌드 스냅샷 조회 중...');
        datalabSnapshot = await getFullKoreanTrendSnapshot(naverClientId, naverClientSecret);
        if (datalabSnapshot) {
            const topKeywords = Object.entries(datalabSnapshot)
                .sort((a, b) => b[1].ratio - a[1].ratio)
                .slice(0, 3)
                .map(([k, v]) => `${k}(${v.ratio})`)
                .join(', ');
            console.log(`✅ [DataLab] 스냅샷 로드 완료. 상위 키워드: ${topKeywords}`);
        }
    } else {
        console.log('⏩ [DataLab] API 키 없음 — 교차검증 스킵 (NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 설정 필요)');
    }

    for (const feed of RSS_FEEDS) {
        try {
            console.log(`📡 Fetching ${feed.name}...`);
            const data = await parser.parseURL(feed.url);

            for (const item of data.items) {
                try {
                    const impactScore = await calculateImpactScore(item.title, item.contentSnippet || item.content || '');
                    // 한국 소스는 필터 기준을 낮춤 (한국어 키워드가 적어 점수가 낮게 나올 수 있음)
                    const minScore = feed.isKorean ? 5 : 10;
                    if (impactScore < minScore) continue;

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

                    // 네이버 DataLab 교차검증 — 해당 아이템의 한국 수요 신호 추출
                    let koreaDemand = null;
                    if (naverClientId && naverClientSecret) {
                        koreaDemand = await getKoreanDemandSignal(item.title, naverClientId, naverClientSecret);
                        if (koreaDemand) {
                            console.log(`   📊 [DataLab] "${koreaDemand.group}" 지수: ${koreaDemand.ratio}/100, 성장률: ${koreaDemand.growth > 0 ? '+' : ''}${koreaDemand.growth}%`);
                        }
                    }

                    console.log(`✨ [${feed.isKorean ? '🇰🇷 KR' : '🌐 GL'}] Analyzing: ${item.title.substring(0, 40)}... (Score: ${impactScore})`);
                    const analysis = await analyzeWithAI(item.title, item.content || item.contentSnippet || '', feed.name, feed.isKorean, koreaDemand);

                    if (analysis) {
                        const { data: trend, error: tError } = await supabase.from('trends').upsert({
                            source: feed.name,
                            external_id: externalId,
                            url: item.link,
                            impact_score: impactScore,
                            stats_data: {
                                keyword_hits: TARGET_KEYWORDS.filter(k => (item.title + (item.content || '')).toLowerCase().includes(k.toLowerCase())),
                                original_title: item.title,
                                // 네이버 DataLab 교차검증 데이터
                                korea_demand: koreaDemand ? {
                                    group: koreaDemand.group,
                                    ratio: koreaDemand.ratio,
                                    growth: koreaDemand.growth,
                                    period: koreaDemand.period,
                                } : null,
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
                                gtm_strategy: analysis.gtm_strategy,
                                tech_stack_suggestion: JSON.stringify(analysis.tech_stack_suggestion),
                                korea_localization_tips: analysis.korea_localization_tips,
                                solution_wizard: analysis.solution_wizard,
                                ai_brief: analysis.ai_brief || null,
                                ai_buildability_score: analysis.ai_buildability_score || null,
                                ai_model: deepseekApiKey ? 'deepseek-chat' : 'gemini-2.5-flash-lite'
                            }, { onConflict: 'trend_id' });

                            if (aError) {
                                console.error(`❌ Analysis save failed [${trend.id}]:`, aError.message, aError.code);
                            } else {
                                console.log(`💾 Analysis saved: ${analysis.headline?.substring(0, 40)}`);
                            }
                        }
                    }
                } catch (itemError) {
                    console.error(`⚠️  Item skip error: ${item.title?.substring(0, 30)} | ${itemError.message}`);
                }
            }
        } catch (error) {
            console.error(`❌ Source failed: ${feed.name} | ${error.message} | ${error.code || ''}`);
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
