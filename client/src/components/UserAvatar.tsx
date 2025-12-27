import { User } from "lucide-react";

interface UserAvatarProps {
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
    imageUrl?: string;
  };
  name?: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function UserAvatar({ user, name, imageUrl, size = "md", className = "" }: UserAvatarProps) {
  const displayName = user?.name || name || user?.email || "";
  const displayImage = user?.avatar || user?.imageUrl || imageUrl;
  
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm", 
    lg: "w-10 h-10 text-base"
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (displayImage) {
    return (
      <div className={`${sizeClasses[size]} ${className} rounded-full overflow-hidden bg-gray-100 flex items-center justify-center`}>
        <img 
          src={displayImage} 
          alt={displayName || "User"} 
          className="w-full h-full object-cover"
          onError={(e) => {
            // Hide image and show fallback initials if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<span class="font-medium text-gray-600">${getInitials(displayName)}</span>`;
            }
          }}
        />
      </div>
    );
  }

  // Show initials if we have a name, otherwise show user icon
  if (displayName) {
    return (
      <div className={`${sizeClasses[size]} ${className} rounded-full bg-gray-200 flex items-center justify-center`}>
        <span className="font-medium text-blue-800">{getInitials(displayName)}</span>
      </div>
    );
  }

  // Default user icon
  return (
    <div className={`${sizeClasses[size]} ${className} rounded-full bg-gray-100 flex items-center justify-center`}>
      <User className="w-1/2 h-1/2 text-gray-400" />
    </div>
  );
}