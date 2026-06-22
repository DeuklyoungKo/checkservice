const axios = require('axios');
const Parser = require('rss-parser');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// .env.local 로드 (로컬 개발용)
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const { getKoreanDemandSignal, getFullKoreanTrendSnapshot } = require('./naver-datalab');
const { fetchHackerNewsItems } = require('./hn-collector');
const { fetchGithubItems } = require('./gh-collector');

/**
 * 환경 변수 필수 검증
 * AI 분석 엔진은 MiniMax M3 단독 (MINIMAX_API_KEY 필수). 폴백 없음.
 */
function validateEnv() {
    const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'MINIMAX_API_KEY'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        console.error(`❌ 필수 환경 변수가 누락되었습니다: ${missing.join(', ')}`);
        console.error('GitHub Secrets 또는 .env.local 설정을 확인해 주세요.');
        process.exit(1);
    }
}

validateEnv();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const minimaxApiKey = process.env.MINIMAX_API_KEY;
const naverClientId = process.env.NAVER_CLIENT_ID;
const naverClientSecret = process.env.NAVER_CLIENT_SECRET;

console.log('🔑 MiniMax API Key:', minimaxApiKey ? `Loaded (${minimaxApiKey.substring(0, 6)}...)` : '⚠️  NOT SET');
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
    // NOTE: reddit-sideproject는 Reddit Responsible Builder Policy(상업 이용 사전허가) 위험으로 제거함. 상세: 3.LEGAL_CHECKLIST.md FIX-3
    // NOTE: hacker-news / indie-hackers(hnrss 비공식)는 공식 HN 검색 API로 승격 → 아래 API_SOURCES 참조 (C-1)
    // NOTE: product-hunt는 API/ToS상 상업적 이용 금지(E-4 확인)로 제거함. 상세: 3.LEGAL_CHECKLIST.md E-4
    // sensitive: true → 저작권 민감 소스. original_title 미저장 (Stats-Only 강화). 현재 해당 소스 없음.
    // 품질 역전(권장 2): Dev.to는 저신호(튜토리얼·의견 글) 비중이 높아 minScore 상향(키워드 2+ 매칭 요구)으로 유입 억제.
    { name: 'dev-to',            url: 'https://dev.to/feed',                                        isKorean: false, minScore: 20 },
    // --- [Tier 2] 한국 소스 (Korea Data Pipeline - 단계적 추가) ---
    // NOTE: zdnet-korea(상업 언론사 RSS)는 저작권 위험으로 제거함. 상세: 3.LEGAL_CHECKLIST.md FIX-2
    { name: 'geek-news',         url: 'https://news.hada.io/rss/news',                              isKorean: true  }, // 한국 개발자 커뮤니티 인기 토픽
];

// API 기반 소스 (RSS 아님). fetch()가 RSS item과 호환되는 정규화 배열을 반환한다.
// minScore: 0 → API 쿼리 단계에서 이미 관련성 필터링됨 (키워드 재필터 불필요).
const API_SOURCES = [
    { name: 'hacker-news', isKorean: false, sensitive: false, minScore: 0, fetch: fetchHackerNewsItems }, // C-1: 공식 HN 검색 API
    { name: 'github',      isKorean: false, sensitive: false, minScore: 0, fetch: fetchGithubItems },     // C-3: GitHub Search API
    // NOTE: Stack Overflow(so-collector.js)는 디버깅 노이즈 비율이 높아 미연동(보관). 상세: 3.LEGAL_CHECKLIST.md C-2
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

    // AI 분석 — MiniMax M3 단독 (OpenAI 호환 API). 폴백 없음(비용 차단). 실패 시 해당 아이템 스킵.
    try {
        const response = await axios.post(
            'https://api.minimax.io/v1/chat/completions',
            {
                model: 'MiniMax-M3',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a business trend analyst specializing in Korean market insights. Always respond with valid JSON only, no markdown code blocks.'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 4000,
            },
            {
                headers: {
                    'Authorization': `Bearer ${minimaxApiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 60000,
            }
        );

        const raw = response.data.choices[0].message.content;
        const resultText = raw.replace(/```json\n?|```/g, '').trim();
        let analysis;
        try {
            analysis = JSON.parse(resultText);
        } catch (parseErr) {
            // 추론형 모델이 JSON 앞뒤에 설명을 덧붙일 경우 대비: 첫 '{' ~ 마지막 '}' 추출 후 재시도
            const s = resultText.indexOf('{');
            const e = resultText.lastIndexOf('}');
            if (s === -1 || e === -1) throw parseErr;
            analysis = JSON.parse(resultText.slice(s, e + 1));
        }

        console.log(`✅ Analysis success (MiniMax-M3): ${analysis.headline.substring(0, 40)}...`);
        return analysis;
    } catch (error) {
        console.error(`❌ AI Analysis failed (MiniMax-M3): ${error.message}`);
        return null;
    }
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

            for (const item of data.items) await processItem(item, feed);
        } catch (error) {
            console.error(`❌ Source failed: ${feed.name} | ${error.message} | ${error.code || ''}`);
        }
    }

    // API 기반 소스 (공식 API). RSS와 동일 파이프라인(processItem)으로 처리.
    for (const src of API_SOURCES) {
        try {
            console.log(`📡 Fetching ${src.name} (API)...`);
            const items = await src.fetch();
            console.log(`   ↳ ${items.length} items fetched`);
            for (const item of items) await processItem(item, src);
        } catch (error) {
            console.error(`❌ API Source failed: ${src.name} | ${error.message}`);
        }
    }
    console.log('✅ 수집 및 분석 작업이 완료되었습니다.');
}

// 단일 아이템 처리: 임팩트 점수 → 중복체크 → DataLab 교차검증 → AI 분석 → DB 저장.
// RSS item과 API item(_stats 포함)을 동일 파이프라인으로 처리한다.
async function processItem(item, feed) {
    try {
        const impactScore = await calculateImpactScore(item.title, item.contentSnippet || item.content || '');
        // minScore: API 소스는 쿼리 단계에서 이미 관련성 필터됨(0). 한국 소스는 낮춤(5). 그 외 10.
        const minScore = feed.minScore ?? (feed.isKorean ? 5 : 10);
        if (impactScore < minScore) return;

        const externalId = item.guid || item.id || item.link;

        const { data: existing, error: checkError } = await supabase
            .from('trends')
            .select('id, impact_score')
            .eq('external_id', externalId)
            .maybeSingle();

        if (checkError) {
            console.error(`❌ DB Check Error: ${checkError.message}`);
            return;
        }

        if (existing && existing.impact_score >= impactScore) return;

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

        if (!analysis) return;

        const { data: trend, error: tError } = await supabase.from('trends').upsert({
            source: feed.name,
            external_id: externalId,
            url: item.link,
            impact_score: impactScore,
            stats_data: {
                keyword_hits: TARGET_KEYWORDS.filter(k => (item.title + (item.content || '')).toLowerCase().includes(k.toLowerCase())),
                // 저작권 민감 소스(feed.sensitive)는 원문 제목 verbatim 저장을 생략 (Stats-Only 강화). 상세: 3.LEGAL_CHECKLIST.md FIX-4
                ...(feed.sensitive ? {} : { original_title: item.title }),
                // API 소스 참여 수치 (HN points/comments 등) — Stats-Only 데이터
                ...(item._stats ? { engagement: item._stats } : {}),
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
            return;
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
                ai_model: 'MiniMax-M3'
            }, { onConflict: 'trend_id' });

            if (aError) {
                console.error(`❌ Analysis save failed [${trend.id}]:`, aError.message, aError.code);
            } else {
                console.log(`💾 Analysis saved: ${analysis.headline?.substring(0, 40)}`);
            }
        }
    } catch (itemError) {
        console.error(`⚠️  Item skip error: ${item.title?.substring(0, 30)} | ${itemError.message}`);
    }
}

// 메인 실행부: 에러 발생 시 프로세스 종료 코드 전달
collectRSS()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('🔥 Fatal Error during execution:', err);
        process.exit(1);
    });
