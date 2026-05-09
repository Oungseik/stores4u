import { defineRelations } from "drizzle-orm";
import { account, session, shop, socialConnection, twoFactor, user } from "./auth.schema";
import { shopInfo } from "./shop-info.schema";

export const relations = defineRelations(
  {
    user,
    session,
    account,
    twoFactor,
    shop,
    socialConnection,
    shopInfo,
  },
  (r) => ({
    user: {
      sessions: r.many.session(),
      accounts: r.many.account(),
      twoFactors: r.many.twoFactor(),
      shops: r.many.shop(),
    },
    session: {
      user: r.one.user({ from: r.session.userId, to: r.user.id }),
    },
    account: {
      user: r.one.user({ from: r.account.userId, to: r.user.id }),
    },
    twoFactor: {
      user: r.one.user({ from: r.twoFactor.userId, to: r.user.id }),
    },
    shop: {
      user: r.one.user({ from: r.shop.userId, to: r.user.id }),
      socialConnections: r.many.socialConnection(),
      shopInfo: r.one.shopInfo({ from: r.shop.shopInfoId, to: r.shopInfo.id }),
    },
    socialConnection: {
      shop: r.one.shop({ from: r.socialConnection.shopId, to: r.shop.id }),
    },
    shopInfo: {
      shop: r.one.shop({ from: r.shopInfo.id, to: r.shop.shopInfoId }),
    },
  }),
);
