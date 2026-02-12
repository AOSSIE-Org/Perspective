"use client";

import { useRouter, usePathname } from "next/navigation";
import { User, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

export default function ProfileMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Check authentication status on mount and pathname change
  useEffect(() => {
    const checkAuth = () => {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (token) {
        setIsAuthenticated(true);
        // Robust base64url decoding for JWT payload
        try {
          const part = token.split(".")[1];
          if (part) {
            // base64url -> base64 (replace - and _ then pad)
            let b64 = part.replace(/-/g, "+").replace(/_/g, "/");
            while (b64.length % 4 !== 0) b64 += "=";
            const json = decodeURIComponent(
              atob(b64)
                .split("")
                .map(c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
                .join("")
            );
            const payload = JSON.parse(json);
            setUserEmail(payload.sub || "");
          } else {
            setUserEmail("");
          }
        } catch (e) {
          setUserEmail("");
        }
      } else {
        setIsAuthenticated(false);
        setUserEmail("");
      }
    };

    checkAuth();
  }, [pathname]);

  const handleLogout = () => {
    // Remove token cookie
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const secureFlag = isSecure ? '; Secure' : '';
    document.cookie = `token=; Path=/; Max-Age=0; SameSite=Lax${secureFlag}`;
    setIsAuthenticated(false);
    setUserEmail("");

    toast({
      title: "Logged out successfully",
      description: "You've been logged out of your account.",
      variant: "success",
    });

    router.push("/");
  };

  // Don't show on login page
  if (pathname?.startsWith("/login")) {
    return null;
  }

  // If not authenticated, show login button
  if (!isAuthenticated) {
    return (
      <button
        onClick={() => router.push("/login")}
        aria-label="Go to login"
        className="inline-flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
      >
        <User className="w-4 h-4 md:w-5 md:h-5" />
      </button>
    );
  }

  // If authenticated, show dropdown menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="User menu"
          className="inline-flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <User className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">My Account</p>
            {userEmail && (
              <p className="text-xs leading-none text-muted-foreground truncate">
                {userEmail}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
