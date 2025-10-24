"use client"

import { FlowchartStep as FlowchartStepType } from "@/lib/flowchart-data";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock } from "lucide-react";
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

  return (
    <Card
      className={cn(
        "relative cursor-pointer hover:shadow-lg transition-all p-3 w-[200px] min-h-[140px]",
        isComplete && "ring-2 ring-green-500"
      )}
      style={{
        backgroundColor: `${step.color}15`,
        borderLeft: `4px solid ${step.color}`
      }}
      onClick={onClick}
    >
      {/* Technician Badge */}
      <div className="absolute top-2 right-2 flex gap-1">
        {step.technician === "both" ? (
          <>
            <Badge variant="secondary" className="text-xs bg-blue-500/90 text-white border-0">T1</Badge>
            <Badge variant="secondary" className="text-xs bg-purple-500/90 text-white border-0">T2</Badge>
          </>
        ) : step.technician === "T1" ? (
          <Badge variant="secondary" className="text-xs bg-blue-500/90 text-white border-0">T1</Badge>
        ) : (
          <Badge variant="secondary" className="text-xs bg-purple-500/90 text-white border-0">T2</Badge>
        )}
      </div>

      {/* Step Content */}
      <div className="mt-4">
        <div className="mb-1">
          <Badge
            style={{ backgroundColor: step.color, color: 'white' }}
            className="text-[10px] font-mono px-1 py-0"
          >
            {step.colorCode}
          </Badge>
        </div>
        <h3 className="font-bold text-xs leading-tight mb-2 pr-10 whitespace-pre-line line-clamp-4">
          {step.title}
        </h3>

        {/* Duration */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2">
          <Clock className="h-2.5 w-2.5" />
          <span>{step.duration}</span>
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">
              {completedTasks}/{totalTasks} tasks
            </span>
            {isComplete && (
              <CheckCircle2 className="h-3 w-3 text-green-500" />
            )}
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
  );
}
