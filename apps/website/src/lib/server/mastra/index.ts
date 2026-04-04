import { Mastra } from "@mastra/core";
import { invoiceExtractionAgent } from "./invoice-extraction-agent";
import { invoiceVerificationAgent } from "./invoice-verification-agent";
import { shopAssistantAgent } from "./shop-assistant-agent";
import { shopSetupAgent } from "./shop-setup-agent";

export const mastra = new Mastra({
  agents: {
    shopSetupAgent,
    invoiceVerificationAgent,
    invoiceExtractionAgent,
    shopAssistantAgent,
  },
});
