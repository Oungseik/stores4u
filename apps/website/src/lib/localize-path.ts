import type { ResolvedPathname } from "$app/types";
import { localizeHref } from "$lib/paraglide/runtime";

export const localizePath = (href: string): ResolvedPathname =>
  localizeHref(href.startsWith("/") && !href.startsWith("//") ? href : "/") as ResolvedPathname;
