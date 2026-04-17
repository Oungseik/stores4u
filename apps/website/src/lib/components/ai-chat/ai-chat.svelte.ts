import { Chat, type UIMessage } from "@ai-sdk/svelte";
import { DefaultChatTransport, convertFileListToFileUIParts, getToolName, isToolUIPart } from "ai";
import { Context } from "runed";

import type { InitialMessage } from "./types";

type AiChatStateOpts = {
  api: string;
  chatId?: string;
  initialMessages?: InitialMessage[];
  onSend?: (input: {
    text: string;
    messageCount: number;
    files?: File[];
  }) => Promise<string | void> | void;
  onFinish?: (input: { message: UIMessage }) => Promise<void> | void;
  onToolResult?: (toolName: string, output: unknown) => void;
  maxFiles?: number;
};

class AiChatState {
  inputText = $state("");
  textareaRef: HTMLTextAreaElement | null = $state(null);
  messagesContainer: HTMLDivElement | null = $state(null);
  pendingFiles: File[] = $state([]);
  pendingPreviewUrls: string[] = $state([]);
  hasFileDropZone = $state(false);

  private _chat: Chat | null = $state(null);
  private maxFiles: number;

  constructor(private opts: AiChatStateOpts) {
    this.maxFiles = opts.maxFiles ?? 5;
    if (opts.chatId) {
      this._chat = this.createChat(opts.chatId, opts.initialMessages ?? []);
    }
  }

  get chat(): Chat | null {
    return this._chat;
  }

  get isChatBusy(): boolean {
    if (!this._chat) return false;
    return this._chat.status === "submitted" || this._chat.status === "streaming";
  }

  get hasChat(): boolean {
    return this._chat !== null;
  }

  get isNearBottom(): boolean {
    if (!this.messagesContainer) return true;
    const { scrollTop, scrollHeight, clientHeight } = this.messagesContainer;
    return scrollHeight - scrollTop - clientHeight < 250;
  }

  addFiles(files: File[]) {
    const remaining = this.maxFiles - this.pendingFiles.length;
    const toAdd = files.slice(0, remaining);
    for (const file of toAdd) {
      const url = URL.createObjectURL(file);
      this.pendingPreviewUrls.push(url);
      this.pendingFiles.push(file);
    }
  }

  removeFile(index: number) {
    const url = this.pendingPreviewUrls[index];
    if (url) URL.revokeObjectURL(url);
    this.pendingFiles = this.pendingFiles.filter((_, i) => i !== index);
    this.pendingPreviewUrls = this.pendingPreviewUrls.filter((_, i) => i !== index);
  }

  clearPendingFiles() {
    for (const url of this.pendingPreviewUrls) {
      URL.revokeObjectURL(url);
    }
    this.pendingFiles = [];
    this.pendingPreviewUrls = [];
  }

  private async convertToUIParts(
    files: File[],
  ): Promise<Array<{ type: "file"; mediaType: string; url: string }>> {
    const dt = new DataTransfer();
    for (const file of files) {
      dt.items.add(file);
    }
    return convertFileListToFileUIParts(dt.files);
  }

  async handleSubmit(e?: Event) {
    e?.preventDefault();
    const text = this.inputText.trim();
    if (!text || this.isChatBusy) return;

    const currentCount = this._chat?.messages.length ?? 0;
    const pendingFiles = [...this.pendingFiles];

    const result = await this.opts.onSend?.({
      text,
      messageCount: currentCount,
      files: pendingFiles.length > 0 ? pendingFiles : undefined,
    });

    if (!this._chat) {
      const chatId = typeof result === "string" ? result : crypto.randomUUID();
      this._chat = this.createChat(chatId, []);
    }

    if (pendingFiles.length > 0) {
      const fileUIParts = await this.convertToUIParts(pendingFiles);
      this._chat.sendMessage({ text, files: fileUIParts });
    } else {
      this._chat.sendMessage({ text });
    }

    this.inputText = "";
    this.clearPendingFiles();
    requestAnimationFrame(() => this.adjustTextareaHeight());
  }

  async stop() {
    await this._chat?.stop();
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

  private createChat(chatId: string, initialMessages: InitialMessage[]): Chat {
    const messages: UIMessage[] = initialMessages.map((m) => ({
      id: m.id,
      role: m.role,
      parts:
        m.images && m.images.length > 0
          ? [
              ...m.images.map((img) => ({
                type: "file" as const,
                mediaType: img.mimeType,
                url: img.url,
              })),
              { type: "text" as const, text: m.content },
            ]
          : [{ type: "text" as const, text: m.content }],
    }));

    return new Chat({
      id: chatId,
      messages,
      transport: new DefaultChatTransport({
        api: this.opts.api,
      }),
      onFinish: async ({ message }) => {
        if (this.opts.onToolResult) {
          for (const part of message.parts) {
            if (isToolUIPart(part) && part.state === "output-available" && part.output) {
              this.opts.onToolResult(getToolName(part), part.output);
            }
          }
        }
        if (this.opts.onFinish) {
          await this.opts.onFinish({ message });
        }
      },
    });
  }
}

const ctx = new Context<AiChatState>("ai-chat");

export function useAiChat(props: AiChatStateOpts) {
  return ctx.set(new AiChatState(props));
}

export function useAiChatChild() {
  return ctx.get();
}
