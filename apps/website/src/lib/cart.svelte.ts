export interface CartItem {
  id: string;
  barcode: string | null;
  name: string;
  priceCents: number;
  quantity: number;
  image: string | null;
}

// Shared cart state for the Point of Sale flow (/cart builds, /checkout reviews).
// ponytail: in-memory only — a full page reload resets it, which is desirable
// for a live POS session (stale carts should not reappear). Persist to
// localStorage only if cashiers actually get burned by mid-sale refreshes.
class CartStore {
  items = $state<CartItem[]>([]);

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
