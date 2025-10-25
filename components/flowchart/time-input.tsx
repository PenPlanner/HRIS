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
  value?: number; // Time in minutes
  onChange: (minutes: number | undefined) => void;
  disabled?: boolean;
}

export function TimeInput({ value, onChange, disabled }: TimeInputProps) {
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
        <div className="flex items-center gap-1.5 min-w-[140px]">
          <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">Time:</span>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className={cn(
              "h-7 px-2.5 text-xs font-mono gap-1.5 border-dashed min-w-[95px] justify-start",
              value
                ? "text-blue-700 bg-blue-50 border-blue-300 hover:bg-blue-100 hover:border-blue-400"
                : "text-gray-500 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
            )}
          >
            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="flex-1 text-left">{value ? formatTime(value) : "Add time"}</span>
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" side="bottom" sideOffset={8}>
        <Tabs defaultValue="slider" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none border-b h-12 bg-gradient-to-b from-gray-100 to-gray-50 p-1">
            <TabsTrigger
              value="slider"
              className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-semibold transition-all"
            >
              <Gauge className="h-5 w-5" />
              Slider
            </TabsTrigger>
            <TabsTrigger
              value="grid"
              className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-semibold transition-all"
            >
              <Grid3x3 className="h-5 w-5" />
              Quick
            </TabsTrigger>
          </TabsList>

          {/* Circular Slider Tab */}
          <TabsContent value="slider" className="p-4 m-0 min-h-[520px]">
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
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                onClick={() => setOpen(false)}
                className="flex-1 h-9 text-xs"
              >
                Done
              </Button>
              {value && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClear}
                  className="h-9 text-xs"
                >
                  Clear
                </Button>
              )}
            </div>
          </TabsContent>

          {/* Grid/Presets Tab */}
          <TabsContent value="grid" className="p-3 m-0 min-h-[520px] flex flex-col justify-center">
            <div className="space-y-3">
              {/* Header */}
              <div>
                <p className="text-sm font-semibold mb-1">Set Time</p>
                <p className="text-xs text-muted-foreground">How long did this take?</p>
              </div>

              {/* Quick presets */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Quick select:</p>
                <div className="grid grid-cols-4 gap-1">
                  {presets.map((preset) => (
                    <Button
                      key={preset}
                      variant="outline"
                      size="sm"
                      onClick={() => handlePresetClick(preset)}
                      className={cn(
                        "text-xs h-8",
                        value === preset && "bg-blue-100 border-blue-300"
                      )}
                    >
                      {formatTime(preset)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom time input */}
              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground mb-2">Custom time:</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground">Hours</label>
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      value={hours}
                      onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                      className="h-8 text-sm"
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
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={handleCustomSet}
                    className="flex-1 h-8 text-xs"
                  >
                    Set
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
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
