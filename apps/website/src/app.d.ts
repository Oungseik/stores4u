/// <reference types="@sveltejs/kit" />
import type { Logger } from "$lib/server/logger";
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
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}
