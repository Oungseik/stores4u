import { Client, Receiver } from "@upstash/qstash";
import {
  QSTASH_CURRENT_SIGNING_KEY,
  QSTASH_NEXT_SIGNING_KEY,
  QSTASH_TOKEN,
} from "$env/static/private";
import { BETTER_AUTH_URL } from "$env/static/private";

export const qstashClient = new Client({ token: QSTASH_TOKEN });

export const qstashReceiver = new Receiver({
  currentSigningKey: QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: QSTASH_NEXT_SIGNING_KEY,
});

export const baseUrl = BETTER_AUTH_URL.replace(/\/$/, "");
