import { createTool } from "@mastra/core/tools";
import { fillFormOutputSchema, shopFormAiSchema } from "$lib/types/shop-form";

export const fillShopFormTool = createTool({
  id: "fillShopForm",
  description:
    "Fill the shop setup form with the collected information. Call this tool once you have gathered all the required information from the user.",
  inputSchema: shopFormAiSchema,
  outputSchema: fillFormOutputSchema,
  execute: async (inputData) => {
    return {
      success: true,
      message: "Form has been filled with the provided shop information.",
      fields: inputData,
    };
  },
});
