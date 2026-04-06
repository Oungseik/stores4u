import { Client, Receiver } from "@upstash/qstash";
import {
  BETTER_AUTH_URL,
  QSTASH_CURRENT_SIGNING_KEY,
  QSTASH_NEXT_SIGNING_KEY,
  QSTASH_TOKEN,
  QSTASH_URL,
} from "$env/static/private";

export const qstashClient = new Client({ baseUrl: QSTASH_URL, token: QSTASH_TOKEN });

export const qstashReceiver = new Receiver({
  currentSigningKey: QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: QSTASH_NEXT_SIGNING_KEY,
});

export const baseUrl = BETTER_AUTH_URL.replace(/\/$/, "");
