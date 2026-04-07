import type { DateValue } from "@internationalized/date";
import type { Component, Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes, HTMLInputAttributes } from "svelte/elements";

export type FilterBarDateRange = {
  start: DateValue | null;
  end: DateValue | null;
};

export type FilterBadge = {
  label: string;
  value: string;
  onRemove: () => void;
};

export type FilterBarRootProps = {
  ref?: HTMLDivElement | null;
  hasFilters?: boolean;
  onReset?: () => void;
  children: Snippet;
  class?: string;
};

export type FilterBarSearchProps = {
  ref?: HTMLInputElement | null;
  value?: string;
  placeholder?: string;
  class?: string;
} & Omit<HTMLInputAttributes, "value" | "placeholder" | "class" | "children">;

export type FilterBarResetProps = {
  ref?: HTMLButtonElement | null;
  class?: string;
} & Omit<HTMLButtonAttributes, "class" | "children">;

export type FilterBarBadgesProps = {
  ref?: HTMLDivElement | null;
  badges: FilterBadge[];
  class?: string;
};

export type FilterBarDatePickerProps = {
  ref?: HTMLButtonElement | null;
  value?: FilterBarDateRange;
  onValueChange?: (value: FilterBarDateRange) => void;
  placeholder?: string;
  numberOfMonths?: number;
  class?: string;
};

export type FilterBarCheckboxGroupItem<T> = {
  value: T;
  label: string;
  count?: number;
};

export type FilterBarCheckboxGroupProps<T> = {
  ref?: HTMLButtonElement | null;
  value?: T[];
  onValueChange?: (value: T[]) => void;
  items?: FilterBarCheckboxGroupItem<T>[];
  placeholder?: string;
  label?: string;
  class?: string;
};

export type FilterBarDropdownItem<T> = {
  value: T;
  label: string;
  count?: number;
};

export type FilterBarDropdownProps<T> = {
  ref?: HTMLButtonElement | null;
  value?: T | null;
  onValueChange?: (value: T | null) => void;
  items?: FilterBarDropdownItem<T>[];
  placeholder?: string;
  label?: string;
  class?: string;
};

export type FilterBarEmptyStateProps = {
  ref?: HTMLDivElement | null;
  icon?: Component<{ class?: string }>;
  title: string;
  emptyMessage: string;
  filteredMessage: string;
  children?: Snippet;
  class?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "class" | "children">;
