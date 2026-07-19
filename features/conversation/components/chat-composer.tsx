"use client";

import * as React from "react";
import { ArrowUpIcon, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type ChatComposerProps = {
    onSend: (content: string) => Promise<void> | void;
    isSending?: boolean;
    placeholder?: string;
    className?: string;
    autoFocus?: boolean;
    webSearchEnabled?: boolean;
    onWebSearchToggle?: (enabled: boolean) => void;
};

/**
 * Message input form with send button. Enter sends; Shift+Enter inserts a newline.
 */
export function ChatComposer({
    onSend,
    isSending = false,
    placeholder = "Message ChaiGPT…",
    className,
    autoFocus = false,
    webSearchEnabled = false,
    onWebSearchToggle,
}: ChatComposerProps) {
    const [value, setValue] = React.useState("");
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
        if (autoFocus) {
            textareaRef.current?.focus();
        }
    }, [autoFocus]);

    /** Submits the current message when the form is submitted or Enter is pressed. */
    async function handleSubmit(event?: React.FormEvent) {
        event?.preventDefault();
        const content = value.trim();
        if (!content || isSending) return;

        setValue("");
        await onSend(content);
        textareaRef.current?.focus();
    }

    /** Handles keyboard shortcuts — Enter to send, Shift+Enter for a new line. */
    function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void handleSubmit();
        }
    }

    const canSend = value.trim().length > 0 && !isSending;

    return (
        <form
            onSubmit={(event) => void handleSubmit(event)}
            className={cn("mx-auto w-full max-w-3xl px-4 pb-4 md:px-6", className)}
        >
            <div className="flex h-14 items-center gap-2 rounded-full border border-border/80 bg-background px-2 pl-4 shadow-sm dark:bg-input/40">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onWebSearchToggle?.(!webSearchEnabled)}
                    className={cn(
                        "h-8 shrink-0 gap-1.5 rounded-full border px-3 text-xs",
                        webSearchEnabled
                            ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                            : "border-border/60 text-muted-foreground"
                    )}
                    aria-pressed={webSearchEnabled}
                    aria-label="Toggle web search"
                >
                    <Globe className="size-3.5" />
                    Web search
                </Button>
                <Textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={isSending}
                    rows={1}
                    className="max-h-48 min-h-0 flex-1 resize-none border-0 bg-transparent px-0 py-0 text-[15px] leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
                />
                <Button
                    type="submit"
                    size="icon"
                    variant="default"
                    disabled={!canSend}
                    className="size-9 shrink-0 rounded-full"
                    aria-label="Send message"
                >
                    {isSending ? <Spinner /> : <ArrowUpIcon />}
                </Button>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
                ChaiGPT can make mistakes. Check important info.
            </p>
        </form>
    );
}
