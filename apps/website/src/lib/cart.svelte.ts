import { PersistedState } from "runed";

export interface CartItem {
  id: string;
  barcode: string | null;
  name: string;
  priceCents: number;
  quantity: number;
  image: string | null;
}

// Shared cart state for the Point of Sale flow (/cart builds, /checkout reviews).
// Persisted to localStorage via runed PersistedState so a mid-sale refresh —
// notably on /checkout — keeps the cart. SSR-safe: the constructor no-ops when
// `window` is undefined, so the server-side singleton stays empty and is never
// mutated.
class CartStore {
  #state = new PersistedState<CartItem[]>("stores4u:cart", []);

  get items(): CartItem[] {
    return this.#state.current;
  }
  set items(value: CartItem[]) {
    this.#state.current = value;
  }

  get totalCents(): number {
    return this.items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  }

  get totalItems(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  add(product: {
    id: string;
    barcode: string | null;
    name: string;
    priceCents: number;
    image: string | null;
  }): void {
    const existing = this.items.find((item) => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.items.push({ ...product, quantity: 1 });
    }
  }

  bump(id: string, delta: number): void {
    const item = this.items.find((i) => i.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) this.remove(id);
  }

  remove(id: string): void {
    this.items = this.items.filter((i) => i.id !== id);
  }

  clear(): void {
    this.items = [];
  }
}

export const cart = new CartStore();
