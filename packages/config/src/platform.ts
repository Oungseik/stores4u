export const SOCIAL_PLATFORMS = ["FACEBOOK", "TIKTOK", "VIBER", "TELEGRAM"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const PLATFORM_CONFIG: Record<
  SocialPlatform,
  {
    name: string;
    description: string;
    color: string;
    bgColor: string;
    icon: string;
  }
> = {
  FACEBOOK: {
    name: "Facebook",
    description:
      "Connect your Facebook Page to post updates, promotions, and product announcements directly to your audience.",
    color: "#1877F2",
    bgColor: "bg-[#1877F2]/10",
    icon: "facebook",
  },
  TIKTOK: {
    name: "TikTok",
    description:
      "Link your TikTok Business account to share short-form video content and reach younger demographics.",
    color: "#000000",
    bgColor: "bg-black/10",
    icon: "tiktok",
  },
  VIBER: {
    name: "Viber",
    description:
      "Integrate with Viber to send messages and updates directly to your customers through chat.",
    color: "#7360F2",
    bgColor: "bg-[#7360F2]/10",
    icon: "viber",
  },
  TELEGRAM: {
    name: "Telegram",
    description:
      "Connect your Telegram channel or bot to broadcast messages and engage with your community.",
    color: "#26A5E4",
    bgColor: "bg-[#26A5E4]/10",
    icon: "telegram",
  },
};
