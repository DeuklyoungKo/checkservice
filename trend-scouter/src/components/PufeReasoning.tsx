interface PufeItem {
    key: "P" | "U" | "F" | "E";
    label: string;
    sublabel: string;
    content: string;
    color: {
        bg: string;
        border: string;
        badge: string;
        text: string;
        dot: string;
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
            dot: "bg-indigo-500",
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
            dot: "bg-orange-500",
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
            dot: "bg-emerald-500",
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
            dot: "bg-purple-500",
        },
    },
};

function parsePufeReasoning(text: string): PufeItem[] {
    // P/U/F/E 각 항목을 분리하는 패턴
    // 예: "P(통증):", "P(Pain):", "P:", "P :" 등 대응
    const splitPattern = /(?=\b[PUFE]\s*(?:\([^)]*\))?\s*:)/g;
    const parts = text.split(splitPattern).map(s => s.trim()).filter(Boolean);

    const items: PufeItem[] = [];
    const keyPattern = /^([PUFE])\s*(?:\([^)]*\))?\s*:\s*/;

    for (const part of parts) {
        const match = part.match(keyPattern);
        if (!match) continue;
        const key = match[1] as "P" | "U" | "F" | "E";
        const content = part.replace(keyPattern, "").trim();
        if (!content) continue;

        const meta = PUFE_META[key];
        items.push({ key, content, ...meta });
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
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {text}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {items.map((item) => (
                <div
                    key={item.key}
                    className={`rounded-2xl border p-6 ${item.color.bg} ${item.color.border} transition-all duration-200 hover:shadow-md`}
                >
                    {/* 헤더 */}
                    <div className="flex items-center gap-3 mb-3">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-sm font-black ${item.color.badge}`}>
                            {item.key}
                        </span>
                        <div className="flex flex-col">
                            <span className={`text-xs font-black uppercase tracking-widest ${item.color.text}`}>
                                {item.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium">
                                {item.sublabel}
                            </span>
                        </div>
                    </div>
                    {/* 내용 */}
                    <p className="text-sm text-foreground leading-relaxed">
                        {item.content}
                    </p>
                </div>
            ))}
        </div>
    );
}
