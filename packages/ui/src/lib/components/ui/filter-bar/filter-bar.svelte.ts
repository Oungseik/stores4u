import { Context } from "runed";
import type { ReadableBoxedValues } from "svelte-toolbelt";

type FilterBarStateProps = ReadableBoxedValues<{
  hasFilters: boolean;
  onReset: () => void;
}>;

class FilterBarState {
  constructor(readonly opts: FilterBarStateProps) {}
}

const ctx = new Context<FilterBarState>("filter-bar");

export function useFilterBar(props: FilterBarStateProps) {
  return ctx.set(new FilterBarState(props));
}

export function useFilterBarChild() {
  return ctx.get();
}
