"use client";

import { Globe } from "lucide-react";
import type { WebSearchResult } from "@/features/ai/tools/web-search";

/** Compact list of web search source cards — title, domain, and snippet. */
export function WebSearchResults({ results }: { results: WebSearchResult[] }) {
    if (!results?.length) {
        return (
            <p className="text-sm text-muted-foreground">No results found.</p>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {results.map((result) => (
                <a
                    key={result.url}
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col gap-0.5 rounded-lg border border-border/60 bg-card p-2.5 outline-none hover:border-border hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200"
                >
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                        <Globe className="size-3 shrink-0" />
                        {new URL(result.url).hostname.replace(/^www\./, "")}
                    </div>
                    <p className="text-xs font-medium leading-snug text-foreground line-clamp-1">
                        {result.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {result.content}
                    </p>
                </a>
            ))}
        </div>
    );
}
