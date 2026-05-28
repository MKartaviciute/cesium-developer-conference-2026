"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage, ChatStatus } from "@/hooks/useAIChat";
import { MessageBubble } from "./MessageBubble";

export interface ChatMessagesProps {
  messages: ChatMessage[];
  status: ChatStatus;
}

export function ChatMessages({ messages, status }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isLoading = status === "loading";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4">
      {messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground text-sm">
            Ask anything about the globe…
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>
      )}

      {isLoading && (
        <div className="mt-3 flex justify-start">
          <div className="bg-muted flex items-center gap-1 rounded-2xl rounded-bl-sm px-4 py-3">
            <span
              className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
