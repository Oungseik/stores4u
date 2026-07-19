/// <reference types="@sveltejs/kit" />
import type { Logger } from "$lib/server/logger";
import type { Language } from "@repo/config";
import type { R2Bucket } from "@cloudflare/workers-types";
import type { Session, User } from "$lib/server/auth";

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      logger: Logger;
      session?: {
        session: Session;
        user: User;
      } | null;
      language: Language;
    }
    // interface PageData {}
    // interface PageState {}
    interface Platform {
      env: {
        STORAGE: R2Bucket;
      };
    }
  }
}
