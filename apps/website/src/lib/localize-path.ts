import { localizeHref } from "$lib/paraglide/runtime";

export const localizePath = (href: string) =>
  localizeHref(href.startsWith("/") && !href.startsWith("//") ? href : "/");
