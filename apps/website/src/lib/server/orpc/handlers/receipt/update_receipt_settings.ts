import { z } from "zod";
import { db, receiptSettings } from "$lib/server/db";
import { os, ownerMiddleware, shopMiddleware } from "$lib/server/orpc/base";

const input = z.object({
  paperWidth: z.enum(["58", "80"]),
  showLogo: z.boolean(),
  showAddress: z.boolean(),
  showState: z.boolean(),
  showCountry: z.boolean(),
  showPhone: z.boolean(),
  showEmail: z.boolean(),
  footerText: z.string().max(500),
});

export const updateReceiptSettingsHandler = os
  .input(input)
  .use(ownerMiddleware)
  .use(shopMiddleware)
  .handler(async ({ input }) => {
    const now = new Date();

    await db
      .insert(receiptSettings)
      .values({
        id: "default",
        paperWidth: input.paperWidth,
        showLogo: input.showLogo,
        showAddress: input.showAddress,
        showState: input.showState,
        showCountry: input.showCountry,
        showPhone: input.showPhone,
        showEmail: input.showEmail,
        footerText: input.footerText,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: receiptSettings.id,
        set: {
          paperWidth: input.paperWidth,
          showLogo: input.showLogo,
          showAddress: input.showAddress,
          showState: input.showState,
          showCountry: input.showCountry,
          showPhone: input.showPhone,
          showEmail: input.showEmail,
          footerText: input.footerText,
          updatedAt: now,
        },
      });

    return { success: true };
  });
