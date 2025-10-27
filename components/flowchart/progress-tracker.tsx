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

  // Format minutes to H M format (e.g., "1H 30M" or "45M")
  const formatTime = (totalMinutes: number): string => {
    if (totalMinutes === 0) return "0M";
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) return `${minutes}M`;
    if (minutes === 0) return `${hours}H`;
    return `${hours}H ${minutes}M`;
  };

  // Format duration string like "2280m" to "38H" or "38H 0M"
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
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Progress</span>
          <Button variant="ghost" size="sm" onClick={onResetProgress} className="h-8 px-3">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 text-base">
        {/* Turbine Info */}
        <div>
          <h3 className="font-bold text-base">{flowchart.model}</h3>
          <p className="text-sm text-muted-foreground">{flowchart.serviceType}</p>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>{flowchart.technicians} Techs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{flowchart.duration}</span>
            </div>
          </div>
        </div>

        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedSteps}/{totalSteps}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Tasks Progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium">Tasks</span>
            <span className="text-sm text-muted-foreground">
              {completedTasks}/{totalTasks}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${taskProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Total Time Counter */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">Total Actual Time</span>
          </div>

          <div className="space-y-3">
            {/* Actual Time Display */}
            <div className="bg-white rounded-md p-3 border border-blue-100">
              <p className="text-xs text-blue-600 mb-1">Actual Time</p>
              <p className="text-2xl font-bold font-mono text-blue-900">{formatTime(totalActualTimeMinutes)}</p>
            </div>

            {/* Target vs Actual Comparison */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Target:</span>
                <span className="font-mono font-medium">{formatDuration(flowchart.totalTime)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Difference:</span>
                <span className={`font-mono font-medium ${isUnderTarget ? 'text-green-600' : 'text-red-600'}`}>
                  {isUnderTarget ? '✓ ' : '⚠ '}
                  {isUnderTarget ? '-' : '+'}{formatTime(timeDifferenceMinutes)}
                </span>
              </div>

              {/* Progress bar showing time used vs target */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mt-3">
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
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-600 mb-1">Estimated</p>
            <p className="text-base font-bold text-blue-700">{formatDuration(flowchart.totalTime)}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-600 mb-1">Complete</p>
            <p className="text-base font-bold text-green-700">{Math.round(taskProgressPercent)}%</p>
          </div>
        </div>

        {/* All Notes Collection */}
        <AllNotesDialog steps={steps} />

        {/* Status */}
        {progressPercent === 100 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-5 flex items-center gap-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-bold text-base text-green-700">Service Complete!</p>
              <p className="text-sm text-green-600">All steps finished</p>
            </div>
          </div>
        )}

        {/* Reference Info */}
        <div className="pt-4 border-t space-y-1">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">SIF:</span> {flowchart.optimizedSIF}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Ref:</span> {flowchart.referenceDocument}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Rev:</span> {flowchart.revisionDate}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
