import { MetadataRoute } from "next";
import { createClient } from "@/utils/supabase/server";

const BASE_URL = "https://trend.gonsuit.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = await createClient();

    // 분석 완료된 트렌드 ID + 수정일 조회
    const { data: trends } = await supabase
        .from("analysis")
        .select("trend_id, updated_at")
        .order("updated_at", { ascending: false })
        .limit(500);

    const trendUrls: MetadataRoute.Sitemap = (trends || []).map((a) => ({
        url: `${BASE_URL}/trend/${a.trend_id}`,
        lastModified: new Date(a.updated_at),
        changeFrequency: "daily",
        priority: 0.8,
    }));

    return [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: "hourly",
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/trends`,
            lastModified: new Date(),
            changeFrequency: "hourly",
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/contact`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.4,
        },
        ...trendUrls,
    ];
}
