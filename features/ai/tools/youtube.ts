import { tool } from "ai";
import { z } from "zod";

export type VideoResult = {
    id: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
    publishedAt: string;
    url: string;
};

/**
 * AI SDK tool that searches YouTube Data API v3 and returns
 * structured video results (id, title, thumbnail, channel, url).
 */
export const searchYouTube = tool({
    description:
        "Search YouTube for videos. Use this when the user asks to find videos, watch something on YouTube, or wants video recommendations about a topic.",
    inputSchema: z.object({
        query: z.string().describe("The search query for YouTube"),
        maxResults: z
            .number()
            .min(1)
            .max(10)
            .default(5)
            .describe("Number of videos to return (1–10)"),
    }),
    execute: async ({ query, maxResults }: { query: string; maxResults: number }) => {
        const apiKey = process.env.YT_API_KEY;
        if (!apiKey) throw new Error("YT_API_KEY is not configured");

        const params = new URLSearchParams({
            part: "snippet",
            q: query,
            type: "video",
            maxResults: String(maxResults),
            key: apiKey,
        });

        const res = await fetch(
            `https://www.googleapis.com/youtube/v3/search?${params}`
        );

        if (!res.ok) {
            throw new Error(`YouTube API error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        const videos: VideoResult[] = (data.items ?? []).map((item: Record<string, any>) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            thumbnail:
                item.snippet.thumbnails.high?.url ??
                item.snippet.thumbnails.default?.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        }));

        return videos;
    },
});
