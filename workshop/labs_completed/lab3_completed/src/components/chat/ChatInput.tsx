"use client";

import { useRef, type KeyboardEvent } from "react";
import { Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Maximum height (px) of the textarea before it starts scrolling internally.
 *  Matches Tailwind's max-h-40 (10rem × 16px/rem = 160px). */
const TEXTAREA_MAX_HEIGHT_PX = 160;

export interface ChatInputProps {
  onSend: (text: string) => void;
  /** Called when the user clicks the abort / stop button during streaming. */
  onAbort?: () => void;
  disabled?: boolean;
  /** When `true` the abort button is shown in place of the send button. */
  isStreaming?: boolean;
}

/**
 * ChatInput — textarea + send/abort button for composing chat messages.
 *
 * - Press Enter to send the message.
 * - Press Shift+Enter to insert a newline.
 * - The textarea and send button are disabled while `disabled` is true
 *   (i.e. while the agent is streaming a response or the network is offline).
 * - When `isStreaming` is true an abort (stop) button is shown so the user
 *   can cancel the in-flight generation at any time.
 */
export function ChatInput({
  onSend,
  onAbort,
  disabled = false,
  isStreaming = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const value = textareaRef.current?.value.trim();
    if (!value) return;
    onSend(value);
    if (textareaRef.current) {
      textareaRef.current.value = "";
      // Reset height after clearing.
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    // Auto-grow: reset then clamp to the named max height constant.
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_HEIGHT_PX)}px`;
  }

  return (
    <div className="border-border flex items-end gap-2 border-t px-4 py-3">
      <textarea
        ref={textareaRef}
        rows={1}
        placeholder="Ask anything about the globe…"
        disabled={disabled}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        className={cn(
          "border-input placeholder:text-muted-foreground bg-background flex-1 resize-none rounded-md border px-3 py-2 text-sm leading-relaxed shadow-xs transition-[color,box-shadow] outline-none",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "max-h-40 overflow-y-auto",
        )}
      />
      {isStreaming ? (
        <Button
          size="sm"
          variant="outline"
          onClick={onAbort}
          aria-label="Stop generation"
          title="Stop generation"
          className="h-10"
        >
          <Square className="size-3.5 fill-current" aria-hidden="true" />
        </Button>
      ) : (
        <Button
          size="sm"
          disabled={disabled}
          onClick={submit}
          aria-label="Send message"
          className="h-10"
        >
          Send
        </Button>
      )}
    </div>
  );
}
