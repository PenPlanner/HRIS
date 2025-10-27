"use client"

import { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface ServiceStartAnimationProps {
  open: boolean;
  onComplete: () => void;
  serviceType: string;
  wtgNumber: string;
  t1Name: string;
  t2Name: string;
}

export function ServiceStartAnimation({
  open,
  onComplete,
  serviceType,
  wtgNumber,
  t1Name,
  t2Name
}: ServiceStartAnimationProps) {
  useEffect(() => {
    if (!open) return;

    // Complete after 2 seconds
    const timeout = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(timeout);
    };
  }, [open, onComplete]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md backdrop-blur-md bg-white/95 dark:bg-gray-900/95"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          {/* Loading spinner */}
          <div className="relative">
            <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
            <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-blue-200 dark:border-blue-800" />
          </div>

          {/* Loading text */}
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Loading...
            </p>
            <p className="text-sm text-muted-foreground">
              {serviceType} Service • WTG {wtgNumber}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
