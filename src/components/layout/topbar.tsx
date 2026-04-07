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
import { LogOut, User } from "lucide-react";

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
    <header className="sticky top-0 z-30 h-16 bg-white border-b flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-3">
        {user?.role && (
          <Badge variant="secondary" className="bg-srsf-purple-100 text-srsf-purple-700">
            {user.role.name}
          </Badge>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 hover:opacity-80">
            <Avatar className="w-8 h-8 bg-srsf-green-500">
              <AvatarFallback className="bg-srsf-green-500 text-white text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden sm:inline">
              {user?.full_name || user?.email}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="gap-2">
              <User className="w-4 h-4" />
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut} className="gap-2 text-red-600">
              <LogOut className="w-4 h-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
