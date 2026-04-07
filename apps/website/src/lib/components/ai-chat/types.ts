import type { Chat } from "@ai-sdk/svelte";
import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes, HTMLTextareaAttributes } from "svelte/elements";

export type AiChatRootProps = {
  api: string;
  onToolResult?: (toolName: string, output: unknown) => void;
  children: Snippet;
};

export type AiChatPanelProps = {
  ref?: HTMLDivElement | null;
  class?: string;
  children: Snippet;
};

export type AiChatHeaderProps = {
  title?: string;
  subtitle?: string;
  class?: string;
};

export type AiChatMessagesProps = {
  ref?: HTMLDivElement | null;
  class?: string;
  empty?: Snippet;
  userMessage?: Snippet<[{ text: string }]>;
  assistantMessage?: Snippet<[{ textParts: string[]; toolParts: unknown[] }]>;
  generating?: Snippet;
  toolResult?: Snippet;
};

export type AiChatInputProps = {
  ref?: HTMLTextAreaElement | null;
  placeholder?: string;
  class?: string;
  children?: Snippet;
} & Omit<HTMLTextareaAttributes, "class" | "children" | "value" | "placeholder">;

export type AiChatToggleProps = {
  class?: string;
};

export type AiChatWidgetProps = {
  api: string;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  onToolResult?: (toolName: string, output: unknown) => void;
  children?: Snippet;
};
