import { LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import GlobalSearch from "./GlobalSearch";
import { NotificationDropdown } from "./NotificationDropdown";
import { useAuth } from "@/hooks/useAuth";

export default function TopBar() {
  const { user } = useAuth();

  return (
    <div className="h-16 bg-white border-b gap-2 border-gray-200 px-4 flex items-center justify-between">
      {/* Left side - Sidebar Toggle + Search */}
      <div className="flex items-center gap-2 md:gap-4 flex-1 max-w-2xl">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex-1">
          <GlobalSearch />
        </div>
      </div>

      {/* Right side - Notifications and User Menu */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Notifications */}
        <NotificationDropdown />
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-full">
              <UserAvatar
                user={user as any}
                size="lg"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {(user as any)?.firstName && (user as any)?.lastName
                    ? `${(user as any).firstName} ${(user as any).lastName}`
                    : (user as any)?.email || 'User'
                  }
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {(user as any)?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => window.location.href = '/profile'}
              className="cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => window.location.href = '/settings'}
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => window.location.href = '/api/logout'}
              className="text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}