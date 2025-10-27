"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, CheckCircle2 } from "lucide-react";
import { FlowchartStep, FlowchartData } from "@/lib/flowchart-data";
import { cn } from "@/lib/utils";

interface ServiceTypeSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (serviceType: string) => void;
  steps: FlowchartStep[];
  makeYear: string;
  flowchartData?: FlowchartData;
}

// Service type options
const SERVICE_TYPES = [
  { value: "1Y", label: "1 Year Service", yearsOld: 1, color: "from-blue-500 to-blue-600" },
  { value: "2Y", label: "2 Year Service", yearsOld: 2, color: "from-green-500 to-green-600" },
  { value: "3Y", label: "3 Year Service", yearsOld: 3, color: "from-yellow-500 to-yellow-600" },
  { value: "4Y", label: "4 Year Service", yearsOld: 4, color: "from-orange-500 to-orange-600" },
  { value: "5Y", label: "5 Year Service", yearsOld: 5, color: "from-red-500 to-red-600" },
  { value: "10Y", label: "10 Year Service", yearsOld: 10, color: "from-purple-500 to-purple-600" },
];

export function ServiceTypeSelectionModal({
  open,
  onOpenChange,
  onStart,
  steps,
  makeYear,
  flowchartData
}: ServiceTypeSelectionModalProps) {
  const [selectedServiceType, setSelectedServiceType] = useState<string | null>(null);

  // Auto-highlight service type based on makeYear
  useEffect(() => {
    if (!open || !makeYear) return;

    const currentYear = new Date().getFullYear();
    const turbineYear = parseInt(makeYear);

    if (isNaN(turbineYear)) return;

    const yearsOld = currentYear - turbineYear;

    // Find matching service type
    const matchingService = SERVICE_TYPES.find(s => s.yearsOld === yearsOld);
    if (matchingService) {
      setSelectedServiceType(matchingService.value);
    } else {
      // Default to closest service type
      setSelectedServiceType(null);
    }
  }, [open, makeYear]);

  // Calculate total target time from flowchartData
  // flowchartData.totalMinutes is the total work hours for 2 technicians (e.g., 2280 = 38h)
  let totalHours = 0;
  let totalMinutes = 0;

  if (flowchartData?.totalMinutes) {
    // totalMinutes already includes work for 2 technicians (e.g., 2280 minutes = 38 hours)
    totalHours = Math.floor(flowchartData.totalMinutes / 60);
    totalMinutes = flowchartData.totalMinutes % 60;

    console.log('[ServiceTypeModal] Total Minutes:', flowchartData.totalMinutes, 'Display:', totalHours + 'h ' + totalMinutes + 'm');
  } else {
    // Fallback: calculate from steps (downtime × 2 for 2 technicians)
    const downtimeMinutes = steps.reduce((sum, step) => {
      return sum + (step.durationMinutes || 0);
    }, 0);
    const totalTargetMinutes = downtimeMinutes * 2;
    totalHours = Math.floor(totalTargetMinutes / 60);
    totalMinutes = totalTargetMinutes % 60;
  }

  const handleStart = () => {
    if (selectedServiceType) {
      onStart(selectedServiceType);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-green-600" />
            Start Service Program
          </DialogTitle>
          <DialogDescription className="text-sm">
            Select the service type for this turbine
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Auto-highlight indicator */}
          {makeYear && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <span className="text-blue-900 dark:text-blue-100">
                  Turbine Year: <span className="font-bold">{makeYear}</span>
                  {selectedServiceType && (
                    <span className="ml-2">
                      → Auto-selected: <span className="font-bold">{selectedServiceType}</span>
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Service type grid */}
          <div className="grid grid-cols-2 gap-3">
            {SERVICE_TYPES.map((serviceType) => (
              <button
                key={serviceType.value}
                onClick={() => setSelectedServiceType(serviceType.value)}
                className={cn(
                  "relative p-4 rounded-lg border-2 transition-all duration-200",
                  selectedServiceType === serviceType.value
                    ? "border-green-500 bg-green-50 dark:bg-green-950 shadow-lg scale-105"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md"
                )}
              >
                {/* Selected indicator */}
                {selectedServiceType === serviceType.value && (
                  <div className="absolute -top-2 -right-2 h-6 w-6 bg-green-600 rounded-full flex items-center justify-center shadow-md">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                )}

                {/* Service badge */}
                <div className={cn(
                  "inline-block px-3 py-1 rounded-md text-white font-bold text-sm mb-2 bg-gradient-to-r",
                  serviceType.color
                )}>
                  {serviceType.value}
                </div>

                {/* Service label */}
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {serviceType.label}
                </p>
              </button>
            ))}
          </div>

          {/* Total target time overview */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  Total Target Time
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-purple-900 dark:text-purple-100">
                {totalHours > 0 && <span>{totalHours}h </span>}
                {totalMinutes > 0 && <span>{totalMinutes}m</span>}
              </div>
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
              {steps.length} steps • Tested target time (2 technicians)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={!selectedServiceType}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
          >
            <Zap className="h-4 w-4 mr-2" />
            Start Service
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
