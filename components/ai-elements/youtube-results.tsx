"use client";

import { PlayCircle } from "lucide-react";
import type { VideoResult } from "@/features/ai/tools/youtube";

/**
 * Horizontally-scrollable row of YouTube video cards.
 * Each card shows a clickable thumbnail + title + channel name.
 */
export function YouTubeResults({ videos }: { videos: VideoResult[] }) {
    if (!videos?.length) {
        return (
            <p className="text-sm text-muted-foreground">No videos found.</p>
        );
    }

    return (
        <div className="flex gap-3 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:thin]">
            {videos.map((video) => (
                <a
                    key={video.id}
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex-shrink-0 w-52 snap-start outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
                >
                    <div className="rounded-xl overflow-hidden border border-border/60 bg-card hover:border-border hover:shadow-md transition-all duration-200">
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-muted overflow-hidden">
                            <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                            {/* Play overlay on hover */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30">
                                <PlayCircle className="size-10 text-white drop-shadow-lg" strokeWidth={1.5} />
                            </div>
                            {/* YouTube red badge */}
                            <span className="absolute bottom-1.5 right-1.5 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                YT
                            </span>
                        </div>

                        {/* Info */}
                        <div className="p-2.5 space-y-0.5">
                            <p className="text-xs font-medium line-clamp-2 leading-snug text-foreground">
                                {video.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                                {video.channelTitle}
                            </p>
                        </div>
                    </div>
                </a>
            ))}
        </div>
    );
}
