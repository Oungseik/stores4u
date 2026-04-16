import Root from "./ai-chat.svelte";
import Footer from "./ai-chat-footer.svelte";
import Input from "./ai-chat-input.svelte";
import Messages from "./ai-chat-messages.svelte";
import SendButton from "./ai-chat-send-button.svelte";
import FloatingContainer from "./floating/ai-chat-floating-container.svelte";
import FloatingHeader from "./floating/ai-chat-floating-header.svelte";
import FloatingToggle from "./floating/ai-chat-floating-toggle.svelte";
import FullPageContainer from "./fullpage/ai-chat-fullpage-container.svelte";
import Widget from "./ai-chat-widget.svelte";

export type {
  AiChatWidgetProps,
  AiChatRootProps,
  AiChatMessagesProps,
  AiChatInputProps,
  AiChatSendButtonProps,
  AiChatFooterProps,
  AiChatFloatingContainerProps,
  AiChatFloatingHeaderProps,
  AiChatFloatingToggleProps,
  AiChatFullPageContainerProps,
  InitialMessage,
} from "./types.js";

export {
  Root,
  Root as AiChat,
  Footer,
  Footer as AiChatFooter,
  Input,
  Input as AiChatInput,
  Messages,
  Messages as AiChatMessages,
  SendButton,
  SendButton as AiChatSendButton,
  FloatingContainer,
  FloatingContainer as AiChatFloatingContainer,
  FloatingHeader,
  FloatingHeader as AiChatFloatingHeader,
  FloatingToggle,
  FloatingToggle as AiChatFloatingToggle,
  FullPageContainer,
  FullPageContainer as AiChatFullPageContainer,
  Widget,
  Widget as AiChatWidget,
};
