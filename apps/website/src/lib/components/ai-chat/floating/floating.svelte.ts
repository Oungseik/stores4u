import { Context } from "runed";

class FloatingState {
  isOpen = $state(false);

  toggle() {
    this.isOpen = !this.isOpen;
  }

  open() {
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
  }
}

const floatingCtx = new Context<FloatingState>("ai-chat-floating");

export function useFloatingState() {
  return floatingCtx.set(new FloatingState());
}

export function useFloatingChild() {
  return floatingCtx.get();
}
