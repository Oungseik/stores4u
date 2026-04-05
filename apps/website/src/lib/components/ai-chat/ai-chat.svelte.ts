import { Chat } from "@ai-sdk/svelte";
import { Context } from "runed";
import { DefaultChatTransport, getToolName, isToolUIPart } from "ai";

type AiChatStateProps = {
  api: string;
  onToolResult?: (toolName: string, output: unknown) => void;
};

class AiChatState {
  isOpen = $state(false);
  inputText = $state("");
  messagesContainer: HTMLDivElement | null = $state(null);
  textareaRef: HTMLTextAreaElement | null = $state(null);

  readonly chat: Chat;

  constructor(private opts: AiChatStateProps) {
    this.chat = new Chat({
      transport: new DefaultChatTransport({
        get api() {
          return opts.api;
        },
      }),
      onFinish: ({ message }) => {
        if (!opts.onToolResult) return;
        for (const part of message.parts) {
          if (isToolUIPart(part) && part.state === "output-available" && part.output) {
            opts.onToolResult(getToolName(part), part.output);
          }
        }
      },
    });
  }

  get isChatBusy() {
    return this.chat.status === "submitted" || this.chat.status === "streaming";
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) setTimeout(() => this.scrollToBottom(), 100);
  }

  handleSubmit(e?: Event) {
    e?.preventDefault();
    if (!this.inputText.trim() || this.isChatBusy) return;
    this.chat.sendMessage({ text: this.inputText.trim() });
    this.inputText = "";
    requestAnimationFrame(() => this.adjustTextareaHeight());
  }

  sendMessage(text: string) {
    if (!text.trim() || this.isChatBusy) return;
    this.chat.sendMessage({ text: text.trim() });
  }

  scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  adjustTextareaHeight() {
    if (this.textareaRef) {
      this.textareaRef.style.height = "auto";
      this.textareaRef.style.height = `${Math.min(this.textareaRef.scrollHeight, 120)}px`;
    }
  }
}

const ctx = new Context<AiChatState>("ai-chat");

export function useAiChat(props: AiChatStateProps) {
  return ctx.set(new AiChatState(props));
}

export function useAiChatChild() {
  return ctx.get();
}
