'use server'

import axios from 'axios';
import { createClient } from "@/utils/supabase/server";

const minimaxApiKey = process.env.MINIMAX_API_KEY;

export async function analyzeUserIdea(painPoint: string) {
    if (!painPoint || painPoint.length < 10) {
        throw new Error('페인포인트를 10자 이상 구체적으로 입력해 주세요.');
    }

    if (!minimaxApiKey) {
        throw new Error('AI 분석 설정이 완료되지 않았습니다.');
    }

    // ⛔ 위저드는 PHASE 2 보류 기능 → 기본 비활성화 (ENABLE_WIZARD=true 일 때만 작동).
    // AI 엔진은 수집기와 동일하게 MiniMax M3 단독. 활성화 시 MiniMax Plus 구독 쿼터 사용.
    if (process.env.ENABLE_WIZARD !== 'true') {
        throw new Error('아이디어 컨버터는 현재 점검 중입니다. 잠시 후 다시 이용해 주세요.');
    }

    const prompt = `
    Analyze the following user-submitted 'Pain Point' and provide a business architecture based on the PUFE framework.
    User Entry: "${painPoint}"
    
    PUFE DEFINITION:
    - Pain (0-25): Depth of the problem. (Functional, Financial, Emotional)
    - Urgency (0-25): How quickly they need a solution.
    - Frequency (0-25): How often the problem occurs.
    - Existing Solution (0-25): How difficult/expensive current alternatives are.

    OUTPUT FORMAT (JSON only):
    {
      "pain_category": "Functional" | "Financial" | "Emotional",
      "pufe": {
        "p": 0-25, "u": 0-25, "f": 0-25, "e": 0-25,
        "reasoning": "Brief explanation in Korean"
      },
      "summary": "3-sentence analysis in Korean",
      "solution_wizard": {
        "steps": ["Step 1", "Step 2", "Step 3"],
        "checklist": ["Action 1", "Action 2"]
      },
      "booster_package": {
        "lean_canvas": {
            "problem": "...", "solution": "...", "unique_value_proposition": "...", "revenue_streams": "..."
        },
        "gtm_copy": ["Ad Copy 1", "Ad Copy 2", "Ad Copy 3"],
        "target_channels": ["Channel 1", "Channel 2", "Channel 3"],
        "vibe_coding_md": "# Project: [Name]\\n\\n## Purpose\\n[Explain]\\n\\n## Features\\n- [Feature1]\\n- [Feature2]\\n\\n## Tech Stack Recommendation\\n- [Frontend/Backend]\\n\\n## Implementation Guide for AI Coder\\n[Instructions]"
      }
    }
    `;

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const response = await axios.post(
            'https://api.minimax.io/v1/chat/completions',
            {
                model: 'MiniMax-M3',
                messages: [
                    { role: 'system', content: 'You are a Korean business analyst. Respond with valid JSON only, no markdown code blocks.' },
                    { role: 'user', content: prompt + "\n\nProvide the result exactly as a valid JSON object without any markdown wrapping. Ensure 'vibe_coding_md' is highly detailed for AI coding tools." }
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

        let responseText = response.data.choices[0].message.content;
        responseText = responseText.replace(/```json\n?|```/g, '').trim();
        const result = JSON.parse(responseText);

        const totalScore = result.pufe.p + result.pufe.u + result.pufe.f + result.pufe.e;

        // DB 저장 (user_id 연동)
        const { data, error } = await supabase.from('analysis').insert({
            user_id: user?.id || null, // 로그인 사용자면 ID 저장
            pufe_p: result.pufe.p,
            pufe_u: result.pufe.u,
            pufe_f: result.pufe.f,
            pufe_e: result.pufe.e,
            pufe_total: totalScore,
            pain_category: result.pain_category,
            solution_wizard: {
                ...result.solution_wizard,
                booster_package: result.booster_package // booster 데이터도 저장
            },
            summary: `[User Input Analysis] ${result.summary}\n\n### ⚖️ PUFE 분석 근거\n${result.pufe.reasoning}`,
            ai_model: 'MiniMax-M3-wizard',
        }).select().single();

        return {
            id: data?.id,
            ...result,
            totalScore
        };
    } catch (err: any) {
        console.error('❌ Wizard API Error:', err.message);
        throw new Error('AI 분석 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }
}
