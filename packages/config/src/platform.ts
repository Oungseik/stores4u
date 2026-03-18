export interface SocialPlatform {
  id: string;
  platform: "facebook" | "tiktok" | "viber" | "telegram";
  name: string;
  isConnected: boolean;
  connectedAccount?: {
    name: string;
    avatar?: string;
    pageName?: string;
    connectedAt: Date;
  };
  permissions: {
    autoPostProducts: boolean;
    manualPosting: boolean;
    postPromotions: boolean;
    postOrderUpdates: boolean;
  };
}

export type PlatformType = "facebook" | "tiktok" | "viber" | "telegram";

export const PLATFORM_CONFIG: Record<
  PlatformType,
  {
    name: string;
    description: string;
    color: string;
    bgColor: string;
    icon: string;
  }
> = {
  facebook: {
    name: "Facebook",
    description:
      "Connect your Facebook Page to post updates, promotions, and product announcements directly to your audience.",
    color: "#1877F2",
    bgColor: "bg-[#1877F2]/10",
    icon: "facebook",
  },
  tiktok: {
    name: "TikTok",
    description:
      "Link your TikTok Business account to share short-form video content and reach younger demographics.",
    color: "#000000",
    bgColor: "bg-black/10",
    icon: "tiktok",
  },
  viber: {
    name: "Viber",
    description:
      "Integrate with Viber to send messages and updates directly to your customers through chat.",
    color: "#7360F2",
    bgColor: "bg-[#7360F2]/10",
    icon: "viber",
  },
  telegram: {
    name: "Telegram",
    description:
      "Connect your Telegram channel or bot to broadcast messages and engage with your community.",
    color: "#26A5E4",
    bgColor: "bg-[#26A5E4]/10",
    icon: "telegram",
  },
};
