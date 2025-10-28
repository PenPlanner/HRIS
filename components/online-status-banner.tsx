"use client"

import { useOnlineStatus } from "@/hooks/use-online-status";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function OnlineStatusBanner() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [mounted, setMounted] = useState(false);

  // Only render on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Don't show anything if online and wasn't recently offline
  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isOnline ? "bg-green-600" : "bg-red-600"
      )}
    >
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-2 text-white text-sm font-medium">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 animate-pulse" />
              <span>You&apos;re back online! Changes will sync automatically</span>
              <RefreshCw className="h-4 w-4 animate-spin" />
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <span>You&apos;re offline - Changes will sync when connection is restored</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
