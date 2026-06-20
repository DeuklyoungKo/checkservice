import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { LOGO_DATA_URI } from "@/lib/logo-data";

export const runtime = "edge";
export const alt = "Trend Scouter — 트렌드 분석 리포트";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // 쿠키 기반 SSR 클라이언트는 OG 생성 환경에서 부적합 → anon 키로 직접 조회.
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data: analysis } = await supabase
        .from("analysis")
        .select("headline, pufe_total, pain_category")
        .eq("trend_id", id)
        .single();

    const headline = analysis?.headline || "수익형 사이드 프로젝트 아이디어";
    const score = analysis?.pufe_total ?? null;
    const category = analysis?.pain_category || "";

    return new ImageResponse(
        (
            <div
                style={{
                    width: 1200,
                    height: 630,
                    background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "72px 80px",
                    fontFamily: "sans-serif",
                    position: "relative",
                }}
            >
                {/* 배경 효과 */}
                <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: "radial-gradient(circle at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(99,102,241,0.1) 0%, transparent 40%)",
                }} />

                {/* 상단: 베타 + 카테고리 뱃지 */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                        display: "flex", alignItems: "center",
                        background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)",
                        borderRadius: 999, padding: "8px 20px",
                    }}>
                        <span style={{ color: "#f59e0b", fontSize: 14, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
                            🎉 Beta · Trend Scouter
                        </span>
                    </div>
                    {category ? (
                        <div style={{
                            display: "flex", alignItems: "center",
                            background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.4)",
                            borderRadius: 999, padding: "8px 20px",
                        }}>
                            <span style={{ color: "#818cf8", fontSize: 14, fontWeight: 700 }}>{category}</span>
                        </div>
                    ) : null}
                </div>

                {/* 중앙: 트렌드 헤드라인 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <span style={{
                        color: "#ffffff", fontSize: 60, fontWeight: 900, lineHeight: 1.15, letterSpacing: -2,
                        maxWidth: 1040,
                    }}>
                        {headline.length > 60 ? headline.slice(0, 60) + "…" : headline}
                    </span>
                </div>

                {/* 하단: PUFE 점수 + 도메인 */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <img src={LOGO_DATA_URI} width={44} height={44} style={{ borderRadius: 12 }} />
                        <span style={{ color: "#6366f1", fontSize: 22, fontWeight: 700 }}>trend.gonsuit.com</span>
                    </div>
                    {score !== null ? (
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                            <span style={{ color: "#94a3b8", fontSize: 20, fontWeight: 700 }}>PUFE</span>
                            <span style={{ color: "#ffffff", fontSize: 44, fontWeight: 900 }}>{score}</span>
                            <span style={{ color: "#94a3b8", fontSize: 20, fontWeight: 700 }}>/100</span>
                        </div>
                    ) : null}
                </div>
            </div>
        ),
        { width: 1200, height: 630 },
    );
}
