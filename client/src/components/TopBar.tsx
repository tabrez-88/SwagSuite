import { Bell, LogOut, Settings, User, Menu } from "lucide-react";
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
import GlobalSearch from "./GlobalSearch";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/hooks/useSidebar";

export default function TopBar() {
  const { user } = useAuth();
  const { toggleSidebar } = useSidebar();

  return (
    <div className="h-16 bg-white border-b gap-2 border-gray-200 px-4 flex items-center justify-between">
      {/* Left side - Menu Button (mobile) + Search */}
      <div className="flex items-center gap-2 md:gap-4 flex-1 max-w-2xl">
        {/* Hamburger Menu Button - Only visible on mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </Button>

        <div className="flex-1">
          <GlobalSearch />
        </div>
      </div>

      {/* Right side - Notifications and User Menu */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell size={20} />
          <span className="absolute top-1 right-2 h-2 w-2 bg-red-500 rounded-full"></span>
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="sm">
          <Settings size={20} />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
              <UserAvatar
                name={(user as any)?.firstName && (user as any)?.lastName
                  ? `${(user as any).firstName} ${(user as any).lastName}`
                  : (user as any)?.email || 'User'
                }
                size="md"
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
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
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