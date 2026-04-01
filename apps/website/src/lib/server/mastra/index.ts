import { Mastra } from "@mastra/core";
import { shopSetupAgent } from "./shop-setup-agent";

export const mastra = new Mastra({
  agents: { shopSetupAgent },
});
