import type { UIMessage } from "@ai-sdk/svelte";
import type { Snippet } from "svelte";
import type { HTMLTextareaAttributes } from "svelte/elements";

export type InitialMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
};

export type AiChatRootProps = {
  api: string;
  chatId?: string;
  initialMessages?: InitialMessage[];
  onSend?: (input: { text: string; messageCount: number }) => Promise<string | void> | void;
  onFinish?: (input: { message: UIMessage }) => Promise<void> | void;
  onToolResult?: (toolName: string, output: unknown) => void;
  children: Snippet;
};

export type AiChatMessagesProps = {
  class?: string;
  empty?: Snippet;
  userMessage?: Snippet<[{ text: string }]>;
  assistantMessage?: Snippet<[{ textParts: string[]; toolParts: unknown[] }]>;
  generating?: Snippet;
};

export type AiChatInputProps = {
  placeholder?: string;
  class?: string;
  children?: Snippet;
} & Omit<HTMLTextareaAttributes, "class" | "children" | "value" | "placeholder">;

export type AiChatSendButtonProps = {
  class?: string;
  children?: Snippet;
};

export type AiChatFooterProps = {
  text?: string;
  class?: string;
};

export type AiChatFloatingContainerProps = {
  class?: string;
  children: Snippet;
};

export type AiChatFloatingHeaderProps = {
  title?: string;
  subtitle?: string;
  class?: string;
};

export type AiChatFloatingToggleProps = {
  class?: string;
};

export type AiChatFullPageContainerProps = {
  class?: string;
  children: Snippet;
};

export type AiChatWidgetProps = {
  api: string;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  onToolResult?: (toolName: string, output: unknown) => void;
  children?: Snippet;
};
