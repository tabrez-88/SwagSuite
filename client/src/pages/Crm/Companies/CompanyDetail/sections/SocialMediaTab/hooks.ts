import {
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  ExternalLink,
} from "lucide-react";
import React from "react";

export function useSocialMediaTab() {
  const getSocialMediaIcon = (platform: string) => {
    switch (platform) {
      case "linkedin":
        return React.createElement(Linkedin, { className: "h-4 w-4" });
      case "twitter":
        return React.createElement(Twitter, { className: "h-4 w-4" });
      case "facebook":
        return React.createElement(Facebook, { className: "h-4 w-4" });
      case "instagram":
        return React.createElement(Instagram, { className: "h-4 w-4" });
      default:
        return React.createElement(ExternalLink, { className: "h-4 w-4" });
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "linkedin":
        return "text-blue-600";
      case "twitter":
        return "text-sky-500";
      case "facebook":
        return "text-blue-700";
      case "instagram":
        return "text-pink-600";
      default:
        return "text-gray-600";
    }
  };

  return { getSocialMediaIcon, getPlatformColor };
}
