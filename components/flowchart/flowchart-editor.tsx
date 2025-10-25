"use client"

import { useState, useCallback, useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { FlowchartStep, generateStepId } from "@/lib/flowchart-data";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Trash2, Edit, Copy, StickyNote, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SERVICE_TYPE_COLORS } from "@/lib/service-colors";

interface FlowchartEditorProps {
  steps: FlowchartStep[];
  onStepsChange: (steps: FlowchartStep[]) => void;
  onEditStep: (step: FlowchartStep) => void;
  onAddStep: () => void;
  onStepClick?: (step: FlowchartStep) => void;
  zoom: number;
  gridSize?: number;
  isEditMode: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
}

const GRID_SIZE = 30; // pixels (default)
const ItemType = "STEP";

interface DraggableStepProps {
  step: FlowchartStep;
  onMove: (stepId: string, x: number, y: number) => void;
  onEdit: (step: FlowchartStep) => void;
  onDelete: (stepId: string) => void;
  onDuplicate: (step: FlowchartStep) => void;
  onClick?: (step: FlowchartStep) => void;
  onUpdateStep: (step: FlowchartStep) => void;
  gridSize: number;
  isEditMode: boolean;
}

function DraggableStep({ step, onMove, onEdit, onDelete, onDuplicate, onClick, onUpdateStep, gridSize, isEditMode }: DraggableStepProps) {
  const completedTasks = step.tasks.filter(t => t.completed).length;
  const totalTasks = step.tasks.length;
  const isComplete = completedTasks === totalTasks && totalTasks > 0;

  // Calculate total notes count from all tasks
  const totalNotesCount = step.tasks.reduce((sum, task) => sum + (task.notes?.length || 0), 0);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemType,
    item: { id: step.id, currentX: step.position.x, currentY: step.position.y },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: isEditMode, // Only draggable in edit mode
  }), [step.id, step.position, isEditMode]);

  const pixelX = step.position.x * gridSize;
  const pixelY = step.position.y * gridSize;

  const handleClick = () => {
    if (!isEditMode && onClick) {
      onClick(step);
    }
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
    <div
      ref={drag as any}
      style={{
        position: "absolute",
        left: `${pixelX}px`,
        top: `${pixelY}px`,
        cursor: isEditMode ? "move" : "pointer",
        opacity: isDragging ? 0.5 : 1,
      }}
      className="group"
      onClick={handleClick}
    >
      {/* Step Label */}
      <div className="text-xs font-semibold text-muted-foreground pl-1 mb-1.5">
        Step {getStepNumber(step.id)}
      </div>

      <Card
        className={cn(
          "relative p-4 w-[300px] min-h-[168px] hover:shadow-lg transition-all border-2 border-gray-700/50",
          isComplete && "ring-2 ring-green-500"
        )}
        style={{
          backgroundColor: `${step.color}15`
        }}
      >
        {/* Action Buttons - Only visible in edit mode */}
        {isEditMode && (
          <div className="absolute -top-2 -right-2 opacity-60 group-hover:opacity-100 transition-opacity flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            className="h-7 w-7 p-0 bg-primary text-primary-foreground shadow-lg"
            onClick={() => onEdit(step)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 w-7 p-0 bg-blue-600 text-white shadow-lg"
            onClick={() => onDuplicate(step)}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 w-7 p-0 bg-red-600 text-white shadow-lg"
            onClick={() => onDelete(step.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        )}

        {/* Technician Badge - Centered at top */}
        <div className="flex justify-center mb-2 -mt-1">
          <div className="flex gap-1">
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
        </div>

        {/* Step Content - Compact task list */}
        <div className="mt-2">
          {/* Task list - compact format - only main tasks with ref numbers */}
          <div className="space-y-0.5 mb-3 pr-10">
            {step.tasks.map((task) => {
              // Only show tasks with reference numbers (e.g., "13.5.1 Description")
              const hasRefNumber = /^\d+\.\d+(\.\d+)*\.?\s/.test(task.description);

              // Skip tasks without reference numbers
              if (!hasRefNumber) return null;

              // Get service type color, using gray for 1Y/12Y for visibility
              const serviceType = task.serviceType || "1Y";
              const badgeColor = (serviceType === '1Y' || serviceType === '12Y')
                ? '#6B7280'
                : SERVICE_TYPE_COLORS[serviceType as keyof typeof SERVICE_TYPE_COLORS] || SERVICE_TYPE_COLORS.default;

              return (
                <div
                  key={task.id}
                  className="flex items-center gap-1.5 text-[11px] py-0.5 pl-0 pr-2 rounded-sm overflow-hidden"
                  style={{
                    backgroundColor: `${badgeColor}10`
                  }}
                >
                  <div
                    style={{ backgroundColor: badgeColor }}
                    className="px-2 py-1 flex items-center justify-center flex-shrink-0 self-stretch"
                  >
                    <span className="text-[9px] font-mono font-bold text-white">
                      {serviceType}
                    </span>
                  </div>
                  <span className={cn(
                    "font-semibold line-clamp-1 flex-1",
                    task.completed ? "line-through text-gray-400" : "text-white"
                  )}>
                    {task.description}
                  </span>
                  {task.completed && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Section - Duration & Progress */}
          <div className="pt-2 border-t border-gray-700/30 space-y-2">
            {/* Duration and Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-300 font-medium">{step.duration}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {totalNotesCount > 0 && (
                  <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 rounded-md px-2 py-0.5">
                    <StickyNote className="h-3 w-3 text-amber-400" />
                    <span className="text-xs font-semibold text-amber-300">{totalNotesCount}</span>
                  </div>
                )}
                {isComplete && (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {completedTasks}/{totalTasks} completed
                </span>
                <span className="text-xs font-semibold text-gray-300">
                  {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`,
                    backgroundColor: isComplete ? '#4ade80' : step.color
                  }}
                />
              </div>
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
  onStepClick,
  zoom,
  gridSize = GRID_SIZE,
  isEditMode,
  setHasUnsavedChanges
}: FlowchartEditorProps) {
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Snap to grid helper
  const snapToGrid = useCallback((pixels: number): number => {
    return Math.round(pixels / gridSize);
  }, [gridSize]);

  const handleDrop = useCallback((item: { id: string; currentX: number; currentY: number }, monitor: any) => {
    if (!isEditMode) return; // Only allow drops in edit mode

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
    setHasUnsavedChanges(true);
  }, [steps, onStepsChange, gridSize, isEditMode, setHasUnsavedChanges, snapToGrid]);

  const [, drop] = useDrop(() => ({
    accept: ItemType,
    drop: isEditMode ? handleDrop : undefined,
  }), [handleDrop, isEditMode]);

  const handleDelete = (stepId: string) => {
    if (confirm("Are you sure you want to delete this step?")) {
      onStepsChange(steps.filter(s => s.id !== stepId));
      setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
  };

  const handleUpdateStep = (updatedStep: FlowchartStep) => {
    const updatedSteps = steps.map(s =>
      s.id === updatedStep.id ? updatedStep : s
    );
    onStepsChange(updatedSteps);
    setHasUnsavedChanges(true);
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

  const content = (
    <div
      ref={isEditMode ? (drop as any) : null}
      className="relative overflow-auto bg-gray-50 dark:bg-gray-900 w-full h-full"
      style={{
        backgroundImage: isEditMode ? `
          linear-gradient(to right, rgba(100,100,255,0.15) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(100,100,255,0.15) 1px, transparent 1px)
        ` : undefined,
        backgroundSize: isEditMode ? `${gridSize}px ${gridSize}px` : undefined,
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
              onClick={onStepClick}
              onUpdateStep={handleUpdateStep}
              gridSize={gridSize}
              isEditMode={isEditMode}
            />
          ))}

          {/* Helper text when empty */}
          {steps.length === 0 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-muted-foreground mb-4">No steps yet. Click &quot;Add Step&quot; to begin.</p>
              <Button onClick={onAddStep}>Add First Step</Button>
            </div>
          )}
        </div>
    </div>
  );

  return content;
}
