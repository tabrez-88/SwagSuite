import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface UserAvatarProps {
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImageUrl?: string;
  } | null;
  name?: string; // For non-user entities like companies
  imageUrl?: string; // For non-user entities
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showTooltip?: boolean;
}

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

export function UserAvatar({ user, name, imageUrl, size = "md", className = "" }: UserAvatarProps) {
  const getInitials = () => {
    if (!user) {
      // Fallback to name prop (for companies, etc.)
      if (name) {
        return name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "?";
      }
      return "?";
    }

    // Try firstName + lastName first
    if (user.firstName || user.lastName) {
      const firstInitial = user.firstName?.[0] || "";
      const lastInitial = user.lastName?.[0] || "";
      return `${firstInitial}${lastInitial}`.toUpperCase() || "?";
    }

    // Fall back to email first letter
    if (user.email) {
      return user.email[0].toUpperCase();
    }

    return "?";
  };

  const getDisplayName = () => {
    if (!user) return name || "User";
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.email || name || "User";
  };

  const getImageUrl = () => {
    if (user?.profileImageUrl) return user.profileImageUrl;
    return imageUrl;
  };

  const sizeClass = sizeClasses[size];
  const displayImage = getImageUrl();

  return (
    <Avatar className={`${sizeClass} ${className}`}>
      {displayImage && (
        <AvatarImage
          src={displayImage}
          alt={getDisplayName()}
        />
      )}
      <AvatarFallback className="bg-gradient-to-br from-blue-200 to-blue-300 text-blue-600 font-semibold">
        {user || name ? getInitials() : <User className="h-1/2 w-1/2" />}
      </AvatarFallback>
    </Avatar>
  );
}