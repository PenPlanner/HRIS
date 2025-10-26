"use client"

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock, Grid3x3, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { CircularTimeSlider } from "./circular-time-slider";

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

  // Common time presets in minutes
  const presets = [5, 10, 15, 30, 45, 60, 90, 120];

  const formatTime = (totalMinutes?: number): string => {
    if (!totalMinutes) return "–";

    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const handlePresetClick = (minutes: number) => {
    onChange(minutes);
    setOpen(false);
  };

  const handleCustomSet = () => {
    const totalMinutes = hours * 60 + minutes;
    onChange(totalMinutes || undefined);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(undefined);
    setHours(0);
    setMinutes(0);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn(
            "h-7 px-2.5 text-xs font-mono gap-1.5 min-w-[80px] justify-start",
            value
              ? value <= (targetMinutes || Infinity)
                ? "text-green-700 bg-green-50 border-green-300 hover:bg-green-100 hover:border-green-400 hover:text-green-800"
                : "text-red-700 bg-red-50 border-red-300 hover:bg-red-100 hover:border-red-400 hover:text-red-800"
              : "text-gray-700 bg-white border-gray-300 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-900"
          )}
        >
          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="flex-1 text-left">{value ? formatTime(value) : "Log time"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end" side="bottom" sideOffset={8}>
        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none border-b h-10 bg-gradient-to-b from-gray-100 to-gray-50 p-1">
            <TabsTrigger
              value="grid"
              className="gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-semibold transition-all text-xs"
            >
              <Grid3x3 className="h-4 w-4" />
              Quick
            </TabsTrigger>
            <TabsTrigger
              value="slider"
              className="gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-semibold transition-all text-xs"
            >
              <Gauge className="h-4 w-4" />
              Slider
            </TabsTrigger>
          </TabsList>

          {/* Circular Slider Tab */}
          <TabsContent value="slider" className="p-3 m-0 min-h-[320px]">
            <CircularTimeSlider
              value={value || 0}
              onChange={(minutes) => {
                onChange(minutes);
                setHours(Math.floor(minutes / 60));
                setMinutes(minutes % 60);
              }}
              maxMinutes={180}
              step={5}
            />
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={() => setOpen(false)}
                className="flex-1 h-8 text-xs"
              >
                Done
              </Button>
              {value && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClear}
                  className="h-8 text-xs"
                >
                  Clear
                </Button>
              )}
            </div>
          </TabsContent>

          {/* Grid/Presets Tab */}
          <TabsContent value="grid" className="p-3 m-0">
            <div className="space-y-2.5">
              {/* Quick presets */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Quick select:</p>
                <div className="grid grid-cols-4 gap-1">
                  {presets.map((preset) => (
                    <Button
                      key={preset}
                      variant="outline"
                      size="sm"
                      onClick={() => handlePresetClick(preset)}
                      className={cn(
                        "text-xs h-7",
                        value === preset && "bg-blue-100 border-blue-300"
                      )}
                    >
                      {formatTime(preset)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom time input */}
              <div className="border-t pt-2.5">
                <p className="text-xs text-muted-foreground mb-1.5">Custom:</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground">Hours</label>
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      value={hours}
                      onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground">Minutes</label>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={minutes}
                      onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={handleCustomSet}
                    className="flex-1 h-7 text-xs"
                  >
                    Set
                  </Button>
                  {value && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleClear}
                      className="h-7 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
