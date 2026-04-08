"use client";

import { useUser } from "@/hooks/use-user";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, ChevronDown } from "lucide-react";

export function Topbar() {
  const { user, signOut } = useUser();

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/60 flex items-center justify-between px-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div />
      <div className="flex items-center gap-4">
        {user?.role && (
          <Badge
            variant="secondary"
            className="bg-srsf-purple-50 text-srsf-purple-700 border border-srsf-purple-200 font-medium text-xs px-2.5 py-0.5"
          >
            {user.role.name}
          </Badge>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full py-1.5 px-2 hover:bg-gray-100 transition-colors">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-srsf-green-500 text-white text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-gray-700 hidden sm:inline">
              {user?.full_name || user?.email}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:inline" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem className="gap-2 text-gray-500 text-xs py-2">
              <User className="w-3.5 h-3.5" />
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={signOut}
              className="gap-2 text-red-600 py-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
