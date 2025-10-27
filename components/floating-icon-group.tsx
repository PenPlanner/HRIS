/**
 * FloatingIconGroup Component
 *
 * A unified, scalable icon group module for displaying floating action buttons.
 * Perfect for grouping utility actions like AI Guide, Version Info, Settings, etc.
 *
 * Usage:
 * ```tsx
 * <FloatingIconGroup
 *   position="bottom-left"
 *   icons={[
 *     defaultFloatingIcons.aiGuide(() => setShowHelp(true)),
 *     defaultFloatingIcons.version(() => setShowVersion(true)),
 *     // Add more icons here as needed
 *   ]}
 * />
 * ```
 *
 * Adding new icons:
 * 1. Import the icon from lucide-react
 * 2. Add it to defaultFloatingIcons with a gradient and onClick handler
 * 3. Add it to the icons array in the component
 */

"use client"

import { Bot, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingIcon {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  gradient: string;
}

interface FloatingIconGroupProps {
  icons: FloatingIcon[];
  position?: 'bottom-left' | 'bottom-right';
}

export function FloatingIconGroup({ icons }: FloatingIconGroupProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Container with glass morphism effect */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-lg transition-all duration-300 hover:shadow-xl select-none">

        <div className="flex flex-col gap-1">
          {icons.map((iconData, index) => (
            <div key={iconData.id} className="relative">
              <Button
                onClick={iconData.onClick}
                className={cn(
                  "h-[22px] w-[22px] p-0 rounded-md shadow-sm transition-all duration-300 hover:scale-125 hover:shadow-lg relative group",
                  "hover:ring-2 hover:ring-white/50 hover:ring-offset-1",
                  iconData.gradient
                )}
                title={iconData.label}
              >
                <div className="relative">
                  {iconData.icon}
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm bg-white/30" />
                </div>

                {/* Tooltip on hover - always to the left since we're on the right side */}
                <div className="absolute top-1/2 -translate-y-1/2 right-full mr-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                  <div className="bg-gray-900 dark:bg-gray-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap shadow-xl border border-gray-700">
                    {iconData.label}
                    {/* Arrow pointing to button */}
                    <div className="absolute left-full top-1/2 -translate-y-1/2 border-[4px] border-transparent border-l-gray-900 dark:border-l-gray-800" />
                  </div>
                </div>
              </Button>

              {/* Subtle divider between icons (except last one) */}
              {index < icons.length - 1 && (
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent my-0.5 mx-1" />
              )}
            </div>
          ))}
        </div>

        {/* Small indicator at bottom showing this is a grouped module */}
        <div className="mt-1 pt-1 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-center gap-0.5">
            {icons.map((_, idx) => (
              <div
                key={idx}
                className="h-0.5 w-0.5 rounded-full bg-gray-400 dark:bg-gray-600 transition-all group-hover:bg-blue-500"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Preset configurations for commonly used icons
export const defaultFloatingIcons = {
  aiGuide: (onClick: () => void): FloatingIcon => ({
    id: 'ai-guide',
    icon: <Bot className="h-3 w-3 text-white" />,
    label: 'AI Guide & Help',
    onClick,
    gradient: 'bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
  }),

  version: (onClick: () => void): FloatingIcon => ({
    id: 'version',
    icon: <Package className="h-3 w-3 text-white" />,
    label: 'Version Info',
    onClick,
    gradient: 'bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
  })
};

// Export type for external use
export type { FloatingIcon };
