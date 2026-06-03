import { MetadataRoute } from "next";

const BASE_URL = "https://trend.gonsuit.com";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: ["/", "/trends", "/trend/"],
                disallow: ["/api/", "/workspace", "/login", "/auth/", "/premium", "/wizard"],
            },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
    };
}
