import { Mastra } from "@mastra/core";
import { shopAssistantSupervisor } from "./supervisors/shop-assistant-supervisor";

export const mastra = new Mastra({
  agents: {
    shopAssistantSupervisor,
  },
});
