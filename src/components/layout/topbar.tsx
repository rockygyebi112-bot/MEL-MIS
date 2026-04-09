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
    <header className="sticky top-0 z-30 h-14 bg-card/80 backdrop-blur-md border-b border-border/50 flex items-center justify-between px-4 sm:px-6 lg:px-10 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div />
      <div className="flex items-center gap-3">
        {user?.role && (
          <Badge
            variant="secondary"
            className="bg-srsf-purple-50 text-srsf-purple-700 border border-srsf-purple-200 font-medium text-[11px] px-2.5 py-0.5 tracking-wide"
          >
            {user.role.name}
          </Badge>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full py-1 px-1.5 hover:bg-muted transition-colors outline-none">
            <Avatar className="size-8">
              <AvatarFallback className="bg-srsf-green-500 text-white text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground/80 hidden sm:inline">
              {user?.full_name || user?.email}
            </span>
            <ChevronDown className="size-3.5 text-muted-foreground hidden sm:inline" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem className="gap-2 text-muted-foreground text-xs py-2">
              <User className="size-3.5" />
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={signOut}
              className="gap-2 text-destructive py-2"
            >
              <LogOut className="size-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
