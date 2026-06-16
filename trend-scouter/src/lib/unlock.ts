import type { SupabaseClient } from "@supabase/supabase-js";
import { IS_BETA } from "@/lib/beta";

/**
 * 현재 유저가 단건 결제로 잠금 해제한 trend_id 집합을 반환한다.
 * - 베타(전체 공개) 또는 비로그인 시에는 DB 조회를 생략하고 빈 집합을 반환.
 * - `unlocks` 테이블은 (user_id, trend_id) 단위 → 결제한 본인에게만 권한이 있다.
 */
export async function getUnlockedTrendIds(
    supabase: SupabaseClient,
    userId: string | undefined | null,
): Promise<Set<string>> {
    if (IS_BETA || !userId) return new Set();
    const { data } = await supabase.from("unlocks").select("trend_id").eq("user_id", userId);
    return new Set((data ?? []).map((r) => r.trend_id as string));
}

/**
 * 트렌드 리포트 잠금 판정.
 * 베타 전체공개 || 프리미엄 구독 || 본인이 이 트렌드를 단건 결제로 해제한 경우 true.
 */
export function isTrendUnlocked(
    trendId: string,
    opts: { isPremium: boolean; unlockedIds: Set<string> },
): boolean {
    return IS_BETA || opts.isPremium || opts.unlockedIds.has(trendId);
}
