import { defineRelations } from "drizzle-orm";
import {
  account,
  invitation,
  member,
  organization,
  session,
  user,
  verification,
} from "./auth.schema";
import { shopInfo } from "./shop-info.schema";

export const relations = defineRelations(
  { user, session, account, verification, organization, member, invitation, shopInfo },
  (r) => ({
    user: {
      sessions: r.many.session(),
      accounts: r.many.account(),
      members: r.many.member(),
    },
    session: {
      user: r.one.user({ from: r.session.userId, to: r.user.id }),
    },
    account: {
      user: r.one.user({ from: r.account.userId, to: r.user.id }),
    },
    verification: {},
    organization: {
      members: r.many.member(),
      shopInfo: r.one.shopInfo({ from: r.organization.id, to: r.shopInfo.organizationId }),
      invitations: r.many.invitation(),
    },
    member: {
      organization: r.one.organization({ from: r.member.organizationId, to: r.organization.id }),
      user: r.one.user({ from: r.member.userId, to: r.user.id }),
    },
    invitation: {
      organization: r.one.organization({
        from: r.invitation.organizationId,
        to: r.organization.id,
      }),
      inviter: r.one.user({ from: r.invitation.inviterId, to: r.user.id }),
    },
    shopInfo: {
      organization: r.one.organization({ from: r.shopInfo.organizationId, to: r.organization.id }),
    },
  }),
);
