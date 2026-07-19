import { tool } from "ai";
import { z } from "zod";

export type WebSearchResult = {
    title: string;
    url: string;
    content: string;
};

/**
 * AI SDK tool that searches the web via the Tavily Search API and returns
 * a short list of relevant results (title, url, snippet).
 */
export const searchWeb = tool({
    description:
        "Search the web for current information. Use this when the user asks about recent events, " +
        "facts you may not know, or anything that needs up-to-date or real-world information.",
    inputSchema: z.object({
        query: z.string().describe("The search query"),
    }),
    execute: async ({ query }) => {
        const apiKey = process.env.Tavily_API_KEY;
        if (!apiKey) throw new Error("Tavily_API_KEY is not configured");

        const res = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                query,
                max_results: 5,
            }),
        });

        if (!res.ok) {
            throw new Error(`Tavily API error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        const results: WebSearchResult[] = (data.results ?? []).map(
            (item: Record<string, any>) => ({
                title: item.title,
                url: item.url,
                content: item.content,
            })
        );

        return results;
    },
});
