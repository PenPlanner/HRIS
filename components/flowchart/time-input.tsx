"use client"

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeInputProps {
  value?: number; // Actual time in minutes
  targetMinutes?: number; // Target/planned time in minutes
  onChange: (minutes: number | undefined) => void;
  disabled?: boolean;
}

export function TimeInput({ value, targetMinutes, onChange, disabled }: TimeInputProps) {
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState(Math.floor((value || 0) / 60));
  const [minutes, setMinutes] = useState((value || 0) % 60);

  const formatTime = (totalMinutes?: number): string => {
    if (!totalMinutes) return "0m";
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const quickTimes = [5, 10, 15, 30, 45, 60, 90, 120];

  const handleQuickTime = (mins: number) => {
    onChange(mins);
    setHours(Math.floor(mins / 60));
    setMinutes(mins % 60);
    setOpen(false);
  };

  const handleCustomTime = () => {
    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes > 0) {
      onChange(totalMinutes);
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCustomTime();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "inline-flex items-center h-5 px-1.5 rounded text-[10px] font-mono transition-colors",
            "hover:bg-gray-100 dark:hover:bg-gray-800",
            value && value > 0
              ? value <= (targetMinutes || Infinity)
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
              : "text-gray-400 dark:text-gray-500",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Clock className="h-3 w-3 mr-1" />
          {formatTime(value)}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-52 p-2"
        align="end"
        side="left"
        sideOffset={5}
      >
        <div className="space-y-2">
          {/* Quick select buttons */}
          <div>
            <p className="text-[9px] font-medium text-gray-500 dark:text-gray-400 mb-1">
              Quick
            </p>
            <div className="grid grid-cols-4 gap-0.5">
              {quickTimes.map((time) => (
                <button
                  key={time}
                  onClick={() => handleQuickTime(time)}
                  className={cn(
                    "h-5 text-[9px] rounded border transition-colors",
                    "hover:bg-blue-50 dark:hover:bg-blue-900/20",
                    value === time
                      ? "bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                      : "border-gray-200 dark:border-gray-700"
                  )}
                >
                  {formatTime(time)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom time input with hours and minutes */}
          <div className="pt-1.5 border-t border-gray-200 dark:border-gray-700">
            <p className="text-[9px] font-medium text-gray-500 dark:text-gray-400 mb-1">
              Custom
            </p>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="23"
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                onKeyDown={handleKeyDown}
                className={cn(
                  "w-9 h-5 px-1 text-[9px] rounded border text-center",
                  "border-gray-200 dark:border-gray-700",
                  "bg-white dark:bg-gray-800",
                  "focus:outline-none focus:ring-1 focus:ring-blue-500"
                )}
                placeholder="0"
              />
              <span className="text-[9px] text-gray-500">h</span>

              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                onKeyDown={handleKeyDown}
                className={cn(
                  "w-9 h-5 px-1 text-[9px] rounded border text-center",
                  "border-gray-200 dark:border-gray-700",
                  "bg-white dark:bg-gray-800",
                  "focus:outline-none focus:ring-1 focus:ring-blue-500"
                )}
                placeholder="0"
              />
              <span className="text-[9px] text-gray-500">m</span>

              <button
                onClick={handleCustomTime}
                className={cn(
                  "h-5 px-2 text-[9px] rounded ml-1",
                  "bg-blue-600 text-white hover:bg-blue-700",
                  "transition-colors"
                )}
              >
                Set
              </button>

              {value && value > 0 && (
                <button
                  onClick={() => {
                    onChange(undefined);
                    setHours(0);
                    setMinutes(0);
                    setOpen(false);
                  }}
                  className={cn(
                    "h-5 px-2 text-[9px] rounded",
                    "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20",
                    "transition-colors"
                  )}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}