"use client"

import { FlowchartStep as FlowchartStepType } from "@/lib/flowchart-data";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlowchartStepProps {
  step: FlowchartStepType;
  onClick: () => void;
  completedTasks: number;
  totalTasks: number;
}

export function FlowchartStep({ step, onClick, completedTasks, totalTasks }: FlowchartStepProps) {
  const isComplete = completedTasks === totalTasks && totalTasks > 0;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Get service type description from colorCode
  const getServiceTypeDescription = (colorCode: string): string => {
    const match = colorCode.match(/(\d+)([YM])/);
    if (!match) return ''; // Don't show description for non-service colorCodes like "2.1"

    const [, number, unit] = match;
    if (unit === 'Y') return `${number} year${number !== '1' ? 's' : ''}`;
    if (unit === 'M') return `${number} month${number !== '1' ? 's' : ''}`;
    return '';
  };

  // Calculate total actual time from all tasks
  const totalActualMinutes = step.tasks.reduce((sum, task) => sum + (task.actualTimeMinutes || 0), 0);

  // Calculate total notes count from all tasks
  const totalNotesCount = step.tasks.reduce((sum, task) => sum + (task.notes?.length || 0), 0);

  // Format time
  const formatTime = (minutes: number): string => {
    if (minutes === 0) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Format title lines - make lines with ref numbers bold, clean leading chars
  const formatTitleLine = (line: string): { text: string; isBold: boolean } => {
    // Remove leading dots, spaces, or special chars
    let cleanLine = line.trimStart().replace(/^[.\s-]+/, '');

    // Capitalize first letter if not already
    if (cleanLine.length > 0) {
      cleanLine = cleanLine.charAt(0).toUpperCase() + cleanLine.slice(1);
    }

    // Check if line starts with a reference number (e.g., "13.5.1", "2.7.2.3")
    const hasRefNumber = /^\d+(\.\d+)+/.test(cleanLine);

    return {
      text: cleanLine,
      isBold: hasRefNumber
    };
  };

  // Extract step number from step.id (e.g., "step-2-1" -> "2.1", "step-1" -> "1")
  const getStepNumber = (stepId: string): string => {
    // Handle special cases like "step-4y-bolts"
    if (stepId === "step-4y-bolts") return "4Y Bolts";

    // Remove "step-" prefix
    const idPart = stepId.replace('step-', '');

    // Convert hyphens to dots (e.g., "2-1" -> "2.1")
    return idPart.replace(/-/g, '.');
  };

  return (
    <div className="flex flex-col gap-1.5">
      {/* Step Label */}
      <div className="text-xs font-semibold text-muted-foreground pl-1">
        Step {getStepNumber(step.id)}
      </div>

      {/* Card */}
      <Card
        className={cn(
          "relative cursor-pointer hover:shadow-lg transition-all p-4 w-[300px] min-h-[168px]",
          isComplete && "ring-2 ring-green-500"
        )}
        style={{
          backgroundColor: `${step.color}15`,
          borderLeft: `4px solid ${step.color}`
        }}
        onClick={onClick}
      >
      {/* Top badges - Technicians only */}
      <div className="absolute top-2 right-2 flex gap-1">
        {step.technician === "both" ? (
          <>
            <div className="bg-blue-500/90 px-2.5 py-1 rounded-md">
              <span className="text-xs font-bold text-white">T1</span>
            </div>
            <div className="bg-purple-500/90 px-2.5 py-1 rounded-md">
              <span className="text-xs font-bold text-white">T2</span>
            </div>
          </>
        ) : step.technician === "T1" ? (
          <div className="bg-blue-500/90 px-2.5 py-1 rounded-md">
            <span className="text-xs font-bold text-white">T1</span>
          </div>
        ) : (
          <div className="bg-purple-500/90 px-2.5 py-1 rounded-md">
            <span className="text-xs font-bold text-white">T2</span>
          </div>
        )}
      </div>

      {/* Step Content - Compact task list */}
      <div className="mt-6">
        <div className="space-y-0.5 mb-3 pr-10">
          {step.title.split('\n').map((line, index) => {
            const { text } = formatTitleLine(line);
            if (!text) return null;

            // Check if this line has a reference number (e.g., "13.5.1", "11.5.1.")
            const hasRefNumber = /^\d+\.\d+(\.\d+)*\.?\s/.test(text);

            return (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-1.5 text-[11px] py-0.5 pl-0 pr-2 rounded-sm overflow-hidden",
                  !hasRefNumber && "ml-6 text-muted-foreground"
                )}
                style={{
                  backgroundColor: hasRefNumber ? `${step.color}10` : 'transparent'
                }}
              >
                {hasRefNumber && (
                  <div
                    style={{ backgroundColor: step.color }}
                    className="px-2 py-1 flex items-center justify-center flex-shrink-0 self-stretch"
                  >
                    <span className="text-[9px] font-mono font-bold text-white">
                      {step.colorCode}
                    </span>
                  </div>
                )}
                <span className={cn(hasRefNumber ? "font-semibold" : "font-normal", "line-clamp-1 text-white")}>
                  {text}
                </span>
              </div>
            );
          })}
        </div>

        {/* Duration - Planned vs Actual */}
        <div className="space-y-0.5 mb-2">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            <span>Planned: {step.duration}</span>
          </div>
          {totalActualMinutes > 0 && (
            <div className="flex items-center gap-1 text-[10px]">
              <Clock className="h-2.5 w-2.5 text-green-600" />
              <span className={cn(
                "font-semibold",
                totalActualMinutes <= step.durationMinutes ? "text-green-600" : "text-red-600"
              )}>
                Actual: {formatTime(totalActualMinutes)}
              </span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">
              {completedTasks}/{totalTasks} tasks
            </span>
            <div className="flex items-center gap-1">
              {totalNotesCount > 0 && (
                <div className="flex items-center gap-0.5 bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5">
                  <StickyNote className="h-2.5 w-2.5 text-amber-600" />
                  <span className="text-[9px] font-semibold text-amber-700">{totalNotesCount}</span>
                </div>
              )}
              {isComplete && (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              )}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: step.color
              }}
            />
          </div>
        </div>
      </div>
      </Card>
    </div>
  );
}
