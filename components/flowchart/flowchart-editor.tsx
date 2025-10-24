"use client"

import { useState, useCallback, useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { FlowchartStep, generateStepId } from "@/lib/flowchart-data";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Trash2, Edit, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlowchartEditorProps {
  steps: FlowchartStep[];
  onStepsChange: (steps: FlowchartStep[]) => void;
  onEditStep: (step: FlowchartStep) => void;
  onAddStep: () => void;
  zoom: number;
  gridSize?: number;
}

const GRID_SIZE = 60; // pixels
const ItemType = "STEP";

interface DraggableStepProps {
  step: FlowchartStep;
  onMove: (stepId: string, x: number, y: number) => void;
  onEdit: (step: FlowchartStep) => void;
  onDelete: (stepId: string) => void;
  onDuplicate: (step: FlowchartStep) => void;
  gridSize: number;
}

function DraggableStep({ step, onMove, onEdit, onDelete, onDuplicate, gridSize }: DraggableStepProps) {
  const completedTasks = step.tasks.filter(t => t.completed).length;
  const totalTasks = step.tasks.length;
  const isComplete = completedTasks === totalTasks && totalTasks > 0;

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemType,
    item: { id: step.id, currentX: step.position.x, currentY: step.position.y },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [step.id, step.position]);

  const pixelX = step.position.x * gridSize;
  const pixelY = step.position.y * gridSize;

  return (
    <div
      ref={drag}
      style={{
        position: "absolute",
        left: `${pixelX}px`,
        top: `${pixelY}px`,
        cursor: "move",
        opacity: isDragging ? 0.5 : 1,
      }}
      className="group"
    >
      <Card
        className={cn(
          "relative p-3 w-[200px] min-h-[140px] hover:shadow-lg transition-all",
          isComplete && "ring-2 ring-green-500"
        )}
        style={{
          backgroundColor: `${step.color}15`,
          borderLeft: `4px solid ${step.color}`
        }}
      >
        {/* Action Buttons - Show on hover */}
        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            className="h-7 w-7 p-0 bg-white shadow"
            onClick={() => onEdit(step)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 w-7 p-0 bg-white shadow"
            onClick={() => onDuplicate(step)}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 w-7 p-0 bg-white shadow text-red-600"
            onClick={() => onDelete(step.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

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
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`,
                  backgroundColor: step.color
                }}
              />
            </div>
          </div>
        </div>

        {/* Grid Position Indicator */}
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          ({step.position.x}, {step.position.y})
        </div>
      </Card>
    </div>
  );
}

export function FlowchartEditor({
  steps,
  onStepsChange,
  onEditStep,
  onAddStep,
  zoom,
  gridSize = GRID_SIZE
}: FlowchartEditorProps) {
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Snap to grid helper
  const snapToGrid = (pixels: number): number => {
    return Math.round(pixels / gridSize);
  };

  const handleDrop = useCallback((item: { id: string; currentX: number; currentY: number }, monitor: any) => {
    const delta = monitor.getDifferenceFromInitialOffset();
    if (!delta) return;

    // Calculate new position in pixels
    const newPixelX = (item.currentX * gridSize) + delta.x;
    const newPixelY = (item.currentY * gridSize) + delta.y;

    // Snap to grid
    const newGridX = Math.max(0, snapToGrid(newPixelX));
    const newGridY = Math.max(-10, snapToGrid(newPixelY)); // Allow negative Y for vertical spacing

    // Update step position
    const updatedSteps = steps.map(step =>
      step.id === item.id
        ? { ...step, position: { x: newGridX, y: newGridY } }
        : step
    );

    onStepsChange(updatedSteps);
  }, [steps, onStepsChange, gridSize]);

  const [, drop] = useDrop(() => ({
    accept: ItemType,
    drop: handleDrop,
  }), [handleDrop]);

  const handleDelete = (stepId: string) => {
    if (confirm("Are you sure you want to delete this step?")) {
      onStepsChange(steps.filter(s => s.id !== stepId));
    }
  };

  const handleDuplicate = (step: FlowchartStep) => {
    const newStep: FlowchartStep = {
      ...step,
      id: generateStepId(),
      position: {
        x: step.position.x + 1,
        y: step.position.y
      },
      tasks: step.tasks.map(t => ({ ...t, completed: false, startTime: undefined, endTime: undefined }))
    };
    onStepsChange([...steps, newStep]);
  };

  // Calculate canvas size
  const canvasWidth = Math.max(
    ...steps.map(s => s.position.x),
    10
  ) * gridSize + gridSize * 5;

  const canvasHeight = Math.max(
    ...steps.map(s => s.position.y),
    Math.abs(Math.min(...steps.map(s => s.position.y), 0)),
    10
  ) * gridSize + gridSize * 5;

  // Adjust for negative Y positions
  const minY = Math.min(...steps.map(s => s.position.y), 0);
  const offsetY = Math.abs(minY) * gridSize;

  return (
    <div
      ref={drop}
      className="relative overflow-auto bg-gray-50 dark:bg-gray-900 w-full h-full"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
        `,
        backgroundSize: `${gridSize}px ${gridSize}px`,
      }}
    >
        <div
          className="relative"
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            minWidth: "100%",
            minHeight: "100%",
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
            paddingTop: `${offsetY}px`
          }}
        >
          {steps.map((step) => (
            <DraggableStep
              key={step.id}
              step={{
                ...step,
                position: {
                  x: step.position.x,
                  y: step.position.y + Math.abs(minY)
                }
              }}
              onMove={(id, x, y) => {
                const updatedSteps = steps.map(s =>
                  s.id === id
                    ? { ...s, position: { x, y: y - Math.abs(minY) } }
                    : s
                );
                onStepsChange(updatedSteps);
              }}
              onEdit={onEditStep}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              gridSize={gridSize}
            />
          ))}

          {/* Helper text when empty */}
          {steps.length === 0 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-muted-foreground mb-4">No steps yet. Click "Add Step" to begin.</p>
              <Button onClick={onAddStep}>Add First Step</Button>
            </div>
          )}
        </div>
    </div>
  );
}
