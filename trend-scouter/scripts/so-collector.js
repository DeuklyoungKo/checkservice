/**
 * so-collector.js
 * Stack Overflow(Stack Exchange API)에서 니치 태그의 고득표 질문을 수집한다.
 * 자주·강하게 표가 쏠리는 질문 = 개발자 공통 페인포인트 = 도구(마이크로SaaS) 기회 신호.
 *
 * API 문서: https://api.stackexchange.com/docs/questions  (인증 불필요, 일 300req/IP)
 * - GET /2.3/questions?site=stackoverflow&sort=votes&tagged=<tag>&fromdate=<ts>
 * - 응답: items[].{ question_id, title, link, score, answer_count, view_count }
 *
 * Stats-Only: 본문(body)은 요청하지 않는다(기본 필터). 제목 + 참여수치(score/answers/views)만.
 * CC BY-SA 라이선스 — 본문 미저장·미표시 + 원문 링크아웃으로 출처 보존.
 */

const axios = require('axios');

const SE_QUESTIONS = 'https://api.stackexchange.com/2.3/questions';

// "통합/연동 페인포인트"가 도구 기회로 이어지는 니치 태그.
const SO_TAGS = ['openai-api', 'stripe-payments', 'web-scraping', 'google-sheets-api', 'pdf-generation', 'automation'];

// HTML 엔티티 최소 디코드 (SO 제목은 &quot; &#39; 등 포함)
function decodeEntities(s) {
    return (s || '')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
}

/**
 * 니치 태그별 고득표 질문을 정규화된 item 배열로 반환한다.
 * @param {Object} opts - { minScore, perTag, monthsBack }
 * @returns {Promise<Array>} rss-parser 호환 item ( _stats 포함 )
 */
async function fetchStackOverflowItems({ minScore = 50, perTag = 15, monthsBack = 12 } = {}) {
    const fromdate = Math.floor(Date.now() / 1000) - monthsBack * 30 * 24 * 3600;
    const seen = new Set();
    const items = [];

    for (const tag of SO_TAGS) {
        try {
            const res = await axios.get(SE_QUESTIONS, {
                params: {
                    site: 'stackoverflow',
                    tagged: tag,
                    sort: 'votes',
                    order: 'desc',
                    fromdate,
                    pagesize: perTag,
                    filter: 'default', // 본문 미포함 (Stats-Only)
                },
                timeout: 10000,
                headers: { 'User-Agent': 'TrendScouterBot/1.0 (+https://trend.gonsuit.com; trend@gonsuit.com)' },
            });

            for (const q of res.data?.items || []) {
                if (!q.title || seen.has(q.question_id)) continue;
                if ((q.score ?? 0) < minScore) continue;
                seen.add(q.question_id);
                items.push({
                    title: decodeEntities(q.title),
                    content: '',                          // 본문 미수집 (Stats-Only, CC BY-SA 보수적 처리)
                    link: q.link,                         // 원문 링크아웃 (출처 보존)
                    guid: `so-${q.question_id}`,
                    _stats: { score: q.score ?? 0, answers: q.answer_count ?? 0, views: q.view_count ?? 0, tag },
                });
            }

            await new Promise(r => setTimeout(r, 300)); // rate-limit 보호
        } catch (err) {
            console.warn(`⚠️  StackOverflow tag "${tag}" failed: ${err.message}`);
        }
    }

    return items;
}

module.exports = { fetchStackOverflowItems, SO_TAGS };

// 독립 실행 검증: node scripts/so-collector.js
if (require.main === module) {
    fetchStackOverflowItems().then(items => {
        console.log(`✅ StackOverflow fetched: ${items.length} items`);
        items.slice(0, 5).forEach(i => console.log(`  - [${i._stats.score}↑/${i._stats.tag}] ${i.title.substring(0, 60)}`));
        process.exit(0);
    }).catch(e => { console.error('🔥', e.message); process.exit(1); });
}
