"use client";

import { useCallback, useRef, useState } from "react";
import type { ModelMessage, Tool } from "ai";
import { chat } from "@/lib/ai/agent";

export type ChatStatus = "idle" | "loading" | "streaming" | "error";
export type ToolCallStatus = "pending" | "running" | "done";

export interface ToolCallInfo {
  id: string;
  toolName: string;
  origin: "cesium" | "mcp";
  status: ToolCallStatus;
  input?: unknown;
  output?: unknown;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCallInfo[];
}

export interface UseAIChatOptions {
  tools?: Record<string, Tool>;
  toolOrigins?: Record<string, "cesium" | "mcp">;
  maxSteps?: number;
  getViewerContext?: () => string | undefined;
  streamingTimeoutMs?: number;
}

export interface UseAIChatReturn {
  messages: ChatMessage[];
  status: ChatStatus;
  error: string | null;
  sendMessage: (text: string) => void;
  abort: () => void;
  retry: () => void;
}

function newId(): string {
  return crypto.randomUUID();
}

interface APICallError extends Error {
  statusCode?: number;
}

function classifyError(err: unknown): string {
  if (!(err instanceof Error)) return "Something went wrong. Please try again.";
  const { statusCode } = err as APICallError;
  if (typeof statusCode === "number") {
    if (statusCode === 429) return "Rate limit reached. Please wait a moment before sending another message.";
    if (statusCode === 401 || statusCode === 403) return "Authentication error. Please check your API key configuration.";
    if (statusCode >= 500) return "The AI service is temporarily unavailable. Please try again later.";
  }
  const lowerMsg = err.message.toLowerCase();
  if (lowerMsg.includes("no_capacity") || lowerMsg.includes("too_many_requests") || lowerMsg.includes("high demand") || lowerMsg.includes("maximum usage size"))
    return "The AI service is at capacity. Please wait a moment and try again.";
  if (err.name === "FetchError" || lowerMsg.includes("failed to fetch") || lowerMsg.includes("network error") || lowerMsg.includes("load failed") || lowerMsg.includes("networkerror"))
    return "Network error. Please check your connection and try again.";
  return err.message || "Something went wrong. Please try again.";
}

function toModelMessages(messages: ChatMessage[]): ModelMessage[] {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

export function useAIChat({
  tools = {},
  toolOrigins = {},
  maxSteps = 25,
  getViewerContext,
  streamingTimeoutMs = 120_000,
}: UseAIChatOptions = {}): UseAIChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;
  const isProcessingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUserMessageRef = useRef<string | null>(null);

  const abort = useCallback(() => {
    if (timeoutRef.current !== null) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    abortControllerRef.current?.abort();
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      lastUserMessageRef.current = text;
      const historyForApi = toModelMessages(messagesRef.current);
      const userMessage: ChatMessage = { id: newId(), role: "user", content: text };
      const assistantId = newId();

      setError(null);
      setMessages((prev) => [...prev, userMessage, { id: assistantId, role: "assistant", content: "" }]);
      setStatus("loading");

      const ac = new AbortController();
      abortControllerRef.current = ac;

      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        ac.abort(new Error("Request timed out after " + Math.round(streamingTimeoutMs / 1000) + "s"));
      }, streamingTimeoutMs);

      const modelMessages: ModelMessage[] = [...historyForApi, { role: "user", content: text }];

      void (async () => {
        try {
          let streamingStarted = false;
          const viewerContext = getViewerContext?.();

          await chat({
            messages: modelMessages,
            tools,
            onTextChunk: (chunk) => {
              if (!streamingStarted) { streamingStarted = true; setStatus("streaming"); }
              setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: m.content + chunk } : m));
            },
            maxSteps,
            abortSignal: ac.signal,
            viewerContext,
            onToolStart: (toolCallId, toolName) => {
              const entry: ToolCallInfo = { id: toolCallId, toolName, origin: toolOrigins[toolName] ?? "cesium", status: "pending" };
              setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, toolCalls: [...(m.toolCalls ?? []), entry] } : m));
            },
            onToolCall: (toolCallId, toolName, input) => {
              setMessages((prev) => prev.map((m) => {
                if (m.id !== assistantId) return m;
                const existing = m.toolCalls ?? [];
                const idx = existing.findIndex((tc) => tc.id === toolCallId);
                if (idx === -1) {
                  const entry: ToolCallInfo = { id: toolCallId, toolName, origin: toolOrigins[toolName] ?? "cesium", status: "running", input };
                  return { ...m, toolCalls: [...existing, entry] };
                }
                const updated = existing.slice();
                updated[idx] = { ...updated[idx], status: "running", input };
                return { ...m, toolCalls: updated };
              }));
            },
            onToolResult: (toolCallId, toolName, output) => {
              setMessages((prev) => prev.map((m) => {
                if (m.id !== assistantId) return m;
                const existing = m.toolCalls ?? [];
                const idx = existing.findIndex((tc) => tc.id === toolCallId);
                if (idx === -1) {
                  const entry: ToolCallInfo = { id: toolCallId, toolName, origin: toolOrigins[toolName] ?? "cesium", status: "done", output };
                  return { ...m, toolCalls: [...existing, entry] };
                }
                const updated = existing.slice();
                updated[idx] = { ...updated[idx], status: "done", output };
                return { ...m, toolCalls: updated };
              }));
            },
          });

          setStatus("idle");
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") {
            setMessages((prev) => prev.filter((m) => !(m.id === assistantId && m.content.trim() === "")));
            setStatus("idle");
          } else {
            const message = classifyError(err);
            setError(message);
            setMessages((prev) => prev.filter((m) => m.id !== assistantId));
            setStatus("error");
          }
        } finally {
          if (timeoutRef.current !== null) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
          abortControllerRef.current = null;
          isProcessingRef.current = false;
        }
      })();
    },
    [tools, maxSteps, getViewerContext, streamingTimeoutMs],
  );

  const retry = useCallback(() => {
    const lastMsg = lastUserMessageRef.current;
    if (!lastMsg || isProcessingRef.current) return;
    setMessages((prev) => {
      let removeIdx = -1;
      for (let i = prev.length - 1; i >= 0; i--) { if (prev[i].role === "user") { removeIdx = i; break; } }
      if (removeIdx === -1) return prev;
      return prev.filter((_, i) => i !== removeIdx);
    });
    setError(null);
    setStatus("idle");
    sendMessage(lastMsg);
  }, [sendMessage]);

  return { messages, status, error, sendMessage, abort, retry };
}
