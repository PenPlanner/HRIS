"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, RotateCcw, Users } from "lucide-react";
import { FlowchartData } from "@/lib/flowchart-data";

interface ProgressTrackerProps {
  flowchart: FlowchartData;
  completedSteps: number;
  totalSteps: number;
  completedTasks: number;
  totalTasks: number;
  elapsedTime: string;
  onResetProgress: () => void;
}

export function ProgressTracker({
  flowchart,
  completedSteps,
  totalSteps,
  completedTasks,
  totalTasks,
  elapsedTime,
  onResetProgress
}: ProgressTrackerProps) {
  const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const taskProgressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

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


        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
            <p className="text-[10px] text-blue-600 mb-0.5">Estimated</p>
            <p className="text-sm font-bold text-blue-700">{flowchart.totalTime}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-2">
            <p className="text-[10px] text-green-600 mb-0.5">Complete</p>
            <p className="text-sm font-bold text-green-700">{Math.round(progressPercent)}%</p>
          </div>
        </div>

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
