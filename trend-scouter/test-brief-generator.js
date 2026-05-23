const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testBriefAI() {
    console.log('🤖 Testing upgraded Gemini Analysis Prompt...');

    const sampleTitle = "Show HN: Nearly – Self-hosted GPS location tracking Companion app for kids and family";
    const sampleContent = "I bought an expensive kids smartwatch for school tracking but GPS degraded and gps became highly inaccurate. Worst part: it started mixing my kid's location with other devices. Dead end. So I searched for a self-hosted solution. Found nothing usable. So I built Nearly – battery friendly location tracking companion app for families that pairs over WiFi, no device identifiers, no IMEI tracking.";

    console.log('\n📡 Sending sample trend to Gemini 3.1 or 1.5-flash...');

    // Mocking the prompt structure from scripts/rss-collector.js
    const source = "hacker-news";
    const isKorean = false;
    const koreaDemand = {
        group: "AI 코딩",
        ratio: 53,
        growth: -38,
        period: "2026-02-23 ~ 2026-05-23"
    };

    const koreanHint = isKorean
        ? `\n    ※ 이 데이터는 한국 소스(${source})에서 수집된 콘텐츠입니다. 한국 시장 맥락을 최우선으로 분석하세요.`
        : `\n    ※ 이 데이터는 글로벌 소스(${source})에서 수집되었습니다. 한국 시장에 이식 가능한 관점으로 분석하세요.`;

    const datalabHint = `\n    [한국 네이버 검색 수요 데이터 - DataLab 교차검증]\n    - 관련 키워드 그룹: "${koreaDemand.group}"\n    - 최신 검색 지수: ${koreaDemand.ratio}/100 (0=거의 없음, 100=최고점)\n    - 전월 대비 성장률: ${koreaDemand.growth > 0 ? '+' : ''}${koreaDemand.growth}%\n    ※ 이 수요 데이터를 기반으로 한국 시장 실제 관심도를 PUFE 점수에 반영하고, summary에 구체적으로 언급하세요.`;

    const prompt = `
    Analyze this trend from ${source}.${koreanHint}${datalabHint}
    Title: "${sampleTitle}"
    Content: "${sampleContent.substring(0, 1000)}"

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
      "ai_brief": "Detailed, complete product brief in Korean formatted in Markdown. Tailor it specifically for AI Coding tools (Claude Code, ChatGPT, Gemini, etc.) so that developers can directly copy-paste this brief to build the product. Follow this Markdown structure precisely without using code block backticks inside: \\n# 서비스 개발 브리프\\n\\n## 아이디어 요약\\n[1-2 sentence core concept explanation]\\n\\n## 타겟 유저\\n- 페르소나: [Target persona]\\n- 핵심 고통 (Pain Point): [What major problem it solves]\\n- 지불 의사 (Willingness to Pay): [Estimated price/value]\\n\\n## MVP 핵심 기능 (3~5개)\\n1. [Feature 1]\\n2. [Feature 2]\\n3. [Feature 3]\\n\\n## 추천 기술 스택\\n- Frontend: Next.js + Tailwind CSS\\n- Backend/DB: Supabase\\n- 결제: Polar / Stripe\\n- 배포: Vercel\\n\\n## 예상 개발 기간\\n[Estimated time in days/weeks using AI tools]\\n\\n## 수익 가능성\\n[Monthly revenue estimation and logical grounds]"
    }
    `;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const resultText = response.text().replace(/```json\n?|```/g, '').trim();
        const analysis = JSON.parse(resultText);

        console.log('\n🎉 SUCCESS! Gemini returned a valid JSON.');
        console.log('\n--- HEADLINE ---');
        console.log(analysis.headline);
        console.log('\n--- AI BRIEF ---');
        console.log(analysis.ai_brief);
    } catch (e) {
        console.error('❌ AI Analysis failed:', e.message);
    }
}

testBriefAI();
