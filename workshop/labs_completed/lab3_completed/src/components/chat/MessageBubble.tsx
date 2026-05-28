import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/hooks/useAIChat";
import { ToolResultCard } from "./ToolResultCard";

export interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      data-testid="chat-message"
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm",
        )}
      >
        {isUser ? (
          message.content
        ) : (
          <>
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div
                className={cn("flex flex-col gap-2", message.content && "mb-3")}
              >
                {message.toolCalls.map((toolCall) => (
                  <ToolResultCard key={toolCall.id} toolCall={toolCall} />
                ))}
              </div>
            )}

            {message.content && (
              <div className="chat-markdown">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
