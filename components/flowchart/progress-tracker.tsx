"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, RotateCcw, Users } from "lucide-react";
import { FlowchartData, FlowchartStep } from "@/lib/flowchart-data";
import { AllNotesDialog } from "./all-notes-dialog";

interface ProgressTrackerProps {
  flowchart: FlowchartData;
  steps: FlowchartStep[];
  completedSteps: number;
  totalSteps: number;
  completedTasks: number;
  totalTasks: number;
  elapsedTime: string;
  totalActualTimeSeconds?: number; // Total actual time from all step timers
  onResetProgress: () => void;
}

export function ProgressTracker({
  flowchart,
  steps,
  completedSteps,
  totalSteps,
  completedTasks,
  totalTasks,
  elapsedTime,
  totalActualTimeSeconds = 0,
  onResetProgress
}: ProgressTrackerProps) {
  const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const taskProgressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Format minutes to human readable format (e.g., "1h 30m" or "45m")
  const formatTime = (totalMinutes: number): string => {
    if (totalMinutes === 0) return "0m";
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  // Format duration string like "2280m" to "38h" or "38h 0m"
  const formatDuration = (duration: string): string => {
    const match = duration.match(/(\d+)m/);
    if (!match) return duration;

    const totalMinutes = parseInt(match[1]);
    return formatTime(totalMinutes);
  };

  // Convert actual time from seconds to minutes
  const totalActualTimeMinutes = Math.floor(totalActualTimeSeconds / 60);

  // Calculate target duration in minutes
  const targetDurationMinutes = flowchart.totalMinutes;
  const isUnderTarget = totalActualTimeMinutes <= targetDurationMinutes;
  const timeDifferenceMinutes = Math.abs(totalActualTimeMinutes - targetDurationMinutes);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Progress</span>
          <Button variant="ghost" size="sm" onClick={onResetProgress} className="h-7 px-2">
            <RotateCcw className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {/* Turbine Info */}
        <div>
          <h3 className="font-bold text-sm">{flowchart.model}</h3>
          <p className="text-xs text-muted-foreground">{flowchart.serviceType}</p>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-2.5 w-2.5" />
              <span>{flowchart.technicians} Techs</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              <span>{flowchart.duration}</span>
            </div>
          </div>
        </div>

        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">Overall Progress</span>
            <span className="text-xs text-muted-foreground">
              {completedSteps}/{totalSteps}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Tasks Progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">Tasks</span>
            <span className="text-xs text-muted-foreground">
              {completedTasks}/{totalTasks}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${taskProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Total Time Counter */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-semibold text-blue-900">Total Actual Time</span>
          </div>

          <div className="space-y-2">
            {/* Actual Time Display */}
            <div className="bg-white rounded-md p-2 border border-blue-100">
              <p className="text-[10px] text-blue-600 mb-0.5">Actual Time</p>
              <p className="text-lg font-bold font-mono text-blue-900">{formatTime(totalActualTimeMinutes)}</p>
            </div>

            {/* Target vs Actual Comparison */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Target:</span>
                <span className="font-mono font-medium">{formatDuration(flowchart.totalTime)}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Difference:</span>
                <span className={`font-mono font-medium ${isUnderTarget ? 'text-green-600' : 'text-red-600'}`}>
                  {isUnderTarget ? '✓ ' : '⚠ '}
                  {isUnderTarget ? '-' : '+'}{formatTime(timeDifferenceMinutes)}
                </span>
              </div>

              {/* Progress bar showing time used vs target */}
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    isUnderTarget ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (totalActualTimeMinutes / targetDurationMinutes) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
            <p className="text-[10px] text-blue-600 mb-0.5">Estimated</p>
            <p className="text-sm font-bold text-blue-700">{formatDuration(flowchart.totalTime)}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-2">
            <p className="text-[10px] text-green-600 mb-0.5">Complete</p>
            <p className="text-sm font-bold text-green-700">{Math.round(taskProgressPercent)}%</p>
          </div>
        </div>

        {/* All Notes Collection */}
        <AllNotesDialog steps={steps} />

        {/* Status */}
        {progressPercent === 100 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-bold text-green-700">Service Complete!</p>
              <p className="text-xs text-green-600">All steps finished</p>
            </div>
          </div>
        )}

        {/* Reference Info */}
        <div className="pt-3 border-t space-y-0.5">
          <p className="text-[10px] text-muted-foreground">
            <span className="font-medium">SIF:</span> {flowchart.optimizedSIF}
          </p>
          <p className="text-[10px] text-muted-foreground">
            <span className="font-medium">Ref:</span> {flowchart.referenceDocument}
          </p>
          <p className="text-[10px] text-muted-foreground">
            <span className="font-medium">Rev:</span> {flowchart.revisionDate}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
