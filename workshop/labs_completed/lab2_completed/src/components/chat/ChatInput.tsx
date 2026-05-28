"use client";

import { useRef, type KeyboardEvent } from "react";
import { Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TEXTAREA_MAX_HEIGHT_PX = 160;

export interface ChatInputProps {
  onSend: (text: string) => void;
  onAbort?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
}

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
          type="button"
          size="sm"
          variant="outline"
          onClick={onAbort}
          aria-label="Stop generation"
          className="h-10"
        >
          <Square className="size-4" aria-hidden="true" />
        </Button>
      ) : (
        <Button
          type="button"
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
