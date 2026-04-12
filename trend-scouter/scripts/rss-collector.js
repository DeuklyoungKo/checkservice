const Parser = require('rss-parser');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const { getKoreanDemandSignal, getFullKoreanTrendSnapshot } = require('./naver-datalab');


const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const geminiApiKey = process.env.GEMINI_API_KEY;
const naverClientId = process.env.NAVER_CLIENT_ID;
const naverClientSecret = process.env.NAVER_CLIENT_SECRET;

console.log('🔑 Gemini API Key Status:', geminiApiKey ? `Loaded (${geminiApiKey.substring(0, 5)}...)` : '❌ NOT FOUND');
console.log('🔑 Naver DataLab Status:', naverClientId ? `Loaded (${naverClientId.substring(0, 4)}...)` : '⚠️  NOT SET (교차검증 비활성화)');

// DataLab 스냅샷 캐시 (한 번 조회 후 재사용 — API 호출 최소화)
let datalabSnapshot = null;

const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
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
    { name: 'zdnet-korea',       url: 'https://zdnet.co.kr/feed',                                   isKorean: true  },
    { name: 'geek-news',         url: 'https://news.hada.io/rss/news',                              isKorean: true  }, // 한국 개발자 커뮤니티 인기 토픽
];

// 브라우저용 User-Agent (차단 우회용)
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';

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
      "solution_wizard": { "steps": ["step1", "step2", ...], "checklist": ["item1", "item2", ...] }
    }
    `;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`,
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

                    // 중복 체크 (External ID 기준)
                    const externalId = item.guid || item.id || item.link;
                    const { data: existing } = await supabase.from('trends').select('id, impact_score').eq('external_id', externalId).single();

                    if (existing && existing.impact_score >= impactScore) {
                        continue; // 이미 처리된 고득점 아이템 스킵
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
                                gtm_strategy: analysis.gtm_strategy,
                                tech_stack_suggestion: JSON.stringify(analysis.tech_stack_suggestion),
                                korea_localization_tips: analysis.korea_localization_tips,
                                solution_wizard: analysis.solution_wizard,
                                ai_model: 'gemini-2.0-flash-lite-stats-v3'
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
            console.error(`❌ Source failed: ${feed.name} | ${error.message} | ${error.code || ''}`);
        }
    }
    console.log('✅ Collection and Analysis complete.');
}

collectRSS().catch(err => {
    console.error('CRITICAL ERROR in collectRSS:', err);
    process.exit(1);
});
