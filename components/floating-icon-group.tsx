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

import { useState, useEffect } from "react";
import { Bot, Package, GripVertical } from "lucide-react";
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

export function FloatingIconGroup({ icons, position = 'bottom-right' }: FloatingIconGroupProps) {
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Initialize position from localStorage or defaults
  useEffect(() => {
    const saved = localStorage.getItem('floating-icon-group-position');
    if (saved) {
      try {
        setCurrentPosition(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load icon group position:', e);
        // Set default position based on position prop
        setDefaultPosition();
      }
    } else {
      setDefaultPosition();
    }
  }, []);

  const setDefaultPosition = () => {
    const defaultX = position === 'bottom-right' ? window.innerWidth - 90 : 24;
    const defaultY = window.innerHeight - 180;
    setCurrentPosition({ x: defaultX, y: defaultY });
  };

  // Save position to localStorage when dragging stops
  useEffect(() => {
    if (isDragging) return;
    if (currentPosition.x !== 0 || currentPosition.y !== 0) {
      localStorage.setItem('floating-icon-group-position', JSON.stringify(currentPosition));
    }
  }, [currentPosition, isDragging]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - currentPosition.x,
      y: e.clientY - currentPosition.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setCurrentPosition({
          x: Math.max(0, Math.min(window.innerWidth - 90, e.clientX - dragOffset.x)),
          y: Math.max(0, Math.min(window.innerHeight - 200, e.clientY - dragOffset.y))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Check if we're on right side based on current position
  const isRightSide = currentPosition.x > window.innerWidth / 2;

  return (
    <div
      className="fixed z-50"
      style={{
        left: `${currentPosition.x}px`,
        top: `${currentPosition.y}px`
      }}
    >
      {/* Container with glass morphism effect */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-lg transition-all duration-300 hover:shadow-xl select-none">
        {/* Drag Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            "flex items-center justify-center py-0.5 px-2 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-t-lg transition-colors mb-0.5",
            isDragging ? "cursor-grabbing bg-gray-200/50 dark:bg-gray-700/50" : "cursor-grab"
          )}
          title="Drag to move"
        >
          <GripVertical className="h-2.5 w-2.5 text-gray-400" />
        </div>

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

                {/* Tooltip on hover */}
                <div className={cn(
                  "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none",
                  isRightSide ? "right-full mr-2" : "left-full ml-2"
                )}>
                  <div className="bg-gray-900 dark:bg-gray-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap shadow-xl border border-gray-700">
                    {iconData.label}
                    {/* Arrow pointing to button */}
                    {isRightSide ? (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 border-[4px] border-transparent border-l-gray-900 dark:border-l-gray-800" />
                    ) : (
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-[4px] border-transparent border-r-gray-900 dark:border-r-gray-800" />
                    )}
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
