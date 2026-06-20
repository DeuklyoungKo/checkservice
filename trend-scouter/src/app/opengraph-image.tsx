import { ImageResponse } from "next/og";
import { LOGO_DATA_URI } from "@/lib/logo-data";

export const runtime = "edge";
export const alt = "Trend Scouter — 주말에 만들 수 있는 수익형 AI 사이드 프로젝트 아이디어";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: 1200,
                    height: 630,
                    background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    padding: "80px",
                    fontFamily: "sans-serif",
                    position: "relative",
                }}
            >
                {/* 배경 그리드 효과 */}
                <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: "radial-gradient(circle at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(99,102,241,0.1) 0%, transparent 40%)",
                }} />

                {/* 베타 뱃지 */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)",
                    borderRadius: 999, padding: "8px 20px", marginBottom: 32, alignSelf: "flex-start",
                }}>
                    <span style={{ color: "#f59e0b", fontSize: 14, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
                        🎉 Beta Open · Vibe Coding × Side Project
                    </span>
                </div>

                {/* 메인 헤드라인 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
                    <span style={{ color: "#ffffff", fontSize: 56, fontWeight: 900, lineHeight: 1.1, letterSpacing: -2 }}>
                        주말에 만들 수 있는
                    </span>
                    <span style={{ color: "#818cf8", fontSize: 56, fontWeight: 900, lineHeight: 1.1, letterSpacing: -2 }}>
                        수익형 아이디어
                    </span>
                    <span style={{ color: "#ffffff", fontSize: 56, fontWeight: 900, lineHeight: 1.1, letterSpacing: -2 }}>
                        AI가 매일 발굴합니다
                    </span>
                </div>

                {/* 서브 설명 */}
                <p style={{ color: "#94a3b8", fontSize: 22, lineHeight: 1.5, marginBottom: 48, maxWidth: 700 }}>
                    Reddit · Product Hunt · GeekNews 페인포인트를 PUFE 프레임워크로 분석.
                    Claude Code · ChatGPT · Gemini에 바로 붙여넣을 수 있는 개발 브리프 제공.
                </p>

                {/* 하단 도메인 */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img src={LOGO_DATA_URI} width={44} height={44} style={{ borderRadius: 12 }} />
                    <span style={{ color: "#6366f1", fontSize: 22, fontWeight: 700 }}>trend.gonsuit.com</span>
                </div>
            </div>
        ),
        { width: 1200, height: 630 },
    );
}
