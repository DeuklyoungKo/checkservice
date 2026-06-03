interface PufeItem {
    key: "P" | "U" | "F" | "E";
    label: string;
    sublabel: string;
    score: string | null; // "18/25" 형태 점수 (있을 경우)
    content: string;
    color: {
        bg: string;
        border: string;
        badge: string;
        text: string;
    };
}

const PUFE_META = {
    P: {
        label: "Pain",
        sublabel: "고통의 깊이",
        color: {
            bg: "bg-indigo-50 dark:bg-indigo-950/30",
            border: "border-indigo-200/60 dark:border-indigo-800/40",
            badge: "bg-indigo-500 text-white",
            text: "text-indigo-700 dark:text-indigo-300",
        },
    },
    U: {
        label: "Urgency",
        sublabel: "해결 긴급도",
        color: {
            bg: "bg-orange-50 dark:bg-orange-950/30",
            border: "border-orange-200/60 dark:border-orange-800/40",
            badge: "bg-orange-500 text-white",
            text: "text-orange-700 dark:text-orange-300",
        },
    },
    F: {
        label: "Frequency",
        sublabel: "발생 빈도",
        color: {
            bg: "bg-emerald-50 dark:bg-emerald-950/30",
            border: "border-emerald-200/60 dark:border-emerald-800/40",
            badge: "bg-emerald-500 text-white",
            text: "text-emerald-700 dark:text-emerald-300",
        },
    },
    E: {
        label: "Existing Solution",
        sublabel: "기존 대안 한계",
        color: {
            bg: "bg-purple-50 dark:bg-purple-950/30",
            border: "border-purple-200/60 dark:border-purple-800/40",
            badge: "bg-purple-500 text-white",
            text: "text-purple-700 dark:text-purple-300",
        },
    },
};

/**
 * 다양한 포맷의 PUFE 텍스트를 파싱합니다.
 *
 * 지원 포맷:
 * - 단일 문자:       P:  U:  F:  E:
 * - 한국어 괄호:     P(통증): U(급박성): F(빈도): E(수익성):
 * - 영어 괄호:       P(Pain): U(Urgency): F(Frequency): E(Existing Solution):
 * - 전체 단어:       Pain: Urgency: Frequency: Financial: Effort: Existing:
 * - 점수 포함:       Pain(18/25): Urgency(8/25): Financial(12/25): Effort(15/25):
 */
function parsePufeReasoning(text: string): PufeItem[] {
    // 키워드 → PUFE 키 매핑
    const keywordMap: Record<string, "P" | "U" | "F" | "E"> = {
        // 단일 문자
        "P": "P", "U": "U", "F": "F", "E": "E",
        // 영어 전체 단어
        "Pain": "P", "Urgency": "U",
        "Frequency": "F", "Financial": "F",
        "Existing": "E", "Existing Solution": "E", "Effort": "E",
    };

    // 구분자 패턴: 위 키워드 + 선택적 괄호 내용 + 콜론
    // 예: "Pain(18/25):", "P(통증):", "Urgency:", "F:"
    const splitPattern = new RegExp(
        `(?=(?:Pain|Urgency|Frequency|Financial|Existing Solution|Existing|Effort|[PUFE])\\s*(?:\\([^)]*\\))?\\s*:)`,
        "g"
    );

    const parts = text.split(splitPattern).map(s => s.trim()).filter(Boolean);
    const items: PufeItem[] = [];

    // 각 파트에서 키, 점수, 내용 추출
    const headerPattern = /^(Pain|Urgency|Frequency|Financial|Existing Solution|Existing|Effort|[PUFE])\s*(?:\(([^)]*)\))?\s*:\s*/;

    for (const part of parts) {
        const match = part.match(headerPattern);
        if (!match) continue;

        const keyword = match[1];
        const parenContent = match[2] || null; // 괄호 안 내용 (점수 or 한국어 라벨)
        const content = part.replace(headerPattern, "").trim();
        if (!content) continue;

        const key = keywordMap[keyword];
        if (!key) continue;

        // 점수 추출: "18/25" 형태인지 확인
        const scoreMatch = parenContent?.match(/^(\d+)\s*\/\s*(\d+)$/);
        const score = scoreMatch ? `${scoreMatch[1]}/${scoreMatch[2]}` : null;

        const meta = PUFE_META[key];
        items.push({ key, score, content, ...meta });
    }

    return items;
}

interface PufeReasoningProps {
    text: string;
}

export function PufeReasoning({ text }: PufeReasoningProps) {
    const items = parsePufeReasoning(text);

    // 파싱 실패 시 기존 텍스트 그대로 출력
    if (items.length === 0) {
        return (
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-line bg-background/60 p-6 rounded-2xl border border-muted">
                {text}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {items.map((item) => (
                <div
                    key={item.key}
                    className={`rounded-2xl border p-5 sm:p-6 ${item.color.bg} ${item.color.border} transition-all duration-200 hover:shadow-md`}
                >
                    {/* 헤더 */}
                    <div className="flex items-center gap-3 mb-3">
                        {/* 키 뱃지 */}
                        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-black flex-shrink-0 ${item.color.badge}`}>
                            {item.key}
                        </span>
                        {/* 라벨 + 서브라벨 */}
                        <div className="flex flex-col min-w-0">
                            <span className={`text-xs font-black uppercase tracking-widest ${item.color.text}`}>
                                {item.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium">
                                {item.sublabel}
                            </span>
                        </div>
                        {/* 점수 (있을 경우) */}
                        {item.score && (
                            <span className={`ml-auto text-xs font-black px-2.5 py-1 rounded-full ${item.color.badge} opacity-80`}>
                                {item.score}
                            </span>
                        )}
                    </div>
                    {/* 내용 */}
                    <p className="text-sm text-foreground leading-relaxed pl-0 sm:pl-12">
                        {item.content}
                    </p>
                </div>
            ))}
        </div>
    );
}
