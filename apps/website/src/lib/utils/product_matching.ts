/**
 * Normalize a product name for matching.
 * - Lowercase
 * - Remove parentheses/brackets: ()[]{}
 * - Collapse multiple spaces
 * - Trim
 *
 * Does NOT strip Burmese or other non-ASCII characters.
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[(){}\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface MatchableProduct {
  id: string;
  name: string;
}

export interface MatchResult {
  productId: string;
  productName: string;
}

/**
 * Match extracted invoice item names against products using normalized exact matching.
 * Optionally includes product aliases for secondary matching.
 *
 * Matching cascade: product name → aliases → no match.
 *
 * Returns a Map of original item name → match result (or null if no match).
 */
export function matchItems(
  itemNames: string[],
  products: MatchableProduct[],
  aliasesByProductId?: Map<string, string[]>,
): Map<string, MatchResult | null> {
  const productLookup = new Map<string, MatchableProduct>();

  // Product names take priority — added first, not overwritten by aliases
  for (const product of products) {
    productLookup.set(normalize(product.name), product);
  }

  // Aliases fill gaps — only set if no product name already claims that normalized key
  if (aliasesByProductId) {
    const productById = new Map(products.map((p) => [p.id, p]));
    for (const [productId, aliases] of aliasesByProductId) {
      const product = productById.get(productId);
      if (!product) continue;
      for (const alias of aliases) {
        const key = normalize(alias);
        if (!productLookup.has(key)) {
          productLookup.set(key, product);
        }
      }
    }
  }

  const results = new Map<string, MatchResult | null>();
  for (const name of itemNames) {
    const normalized = normalize(name);
    const matched = productLookup.get(normalized);
    if (matched) {
      results.set(name, { productId: matched.id, productName: matched.name });
    } else {
      results.set(name, null);
    }
  }
  return results;
}
