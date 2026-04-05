import Root from "./ai-chat.svelte";
import Header from "./ai-chat-header.svelte";
import Input from "./ai-chat-input.svelte";
import Messages from "./ai-chat-messages.svelte";
import Panel from "./ai-chat-panel.svelte";
import Toggle from "./ai-chat-toggle.svelte";
import Widget from "./ai-chat-widget.svelte";

export type { AiChatWidgetProps } from "./types.js";

export {
  Header,
  Header as AiChatHeader,
  Input,
  Input as AiChatInput,
  Messages,
  Messages as AiChatMessages,
  Panel,
  Panel as AiChatPanel,
  Root,
  Root as AiChat,
  Toggle,
  Toggle as AiChatToggle,
  Widget,
  Widget as AiChatWidget,
};
