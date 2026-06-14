"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

interface TrendViewTrackerProps {
    trendId: string;
}

/**
 * 트렌드 상세 페이지 진입 시 GA4 이벤트를 발화하는 클라이언트 트래커.
 * 서버 컴포넌트인 상세 페이지에 삽입해 마운트 시 1회 측정한다.
 */
export function TrendViewTracker({ trendId }: TrendViewTrackerProps) {
    useEffect(() => {
        trackEvent("trend_detail_view", { trend_id: trendId });
    }, [trendId]);

    return null;
}
