"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  NodeProps,
  Handle,
  Position,
  MarkerType,
  useUpdateNodeInternals,
  useReactFlow,
  ReactFlowProvider,
  NodeResizer,
  ViewportPortal,
  EdgeProps,
  BaseEdge,
  getStraightPath,
} from '@xyflow/react';
import { FlowchartStep, generateStepId, parseServiceTimes, getCumulativeServiceTime } from "@/lib/flowchart-data";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Trash2, Edit, Copy, StickyNote, CheckCircle2, Workflow, ArrowRight, ArrowLeft, ArrowLeftRight, Minus, TrendingUp, Zap, User, Users, ChevronDown, ChevronUp, Info, Bug } from "lucide-react";
import { cn } from "@/lib/utils";
import { SERVICE_TYPE_COLORS, getIncludedServiceTypes } from "@/lib/service-colors";

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
  selectedServiceType?: string;
  initialEdges?: Edge[];
  onEdgesChange?: (edges: Edge[]) => void;
  hideCompletedSteps?: boolean;
  onRealignToGrid?: () => void;
  freePositioning?: boolean;
  layoutMode?: 'topdown' | 'centered';
}

// GRID ALIGNMENT SYSTEM - ENFORCED
// All card dimensions are LOCKED to the 30px grid for perfect handle alignment:
//
// CARD WIDTH: 300px (10 grid units) - ALWAYS FIXED
//
// CARD HEIGHT: Calculated based on task count, rounded UP to nearest 60px + 60px padding
// - Formula: ceil((100 + tasks * 24) / 60) * 60 + 60
// - Examples:
//   * 1-4 tasks  → 240px (8 units)
//   * 5-7 tasks  → 300px (10 units)
//   * 8-11 tasks → 360px (12 units)
//   * 12-15 tasks → 420px (14 units)
//   * 16-19 tasks → 480px (16 units)
// - Extra 60px gives breathing room for content
// - If content overflows, task list scrolls internally
// - Minimum: 240px (8 units), Maximum: 660px (22 units)
//
// SPACING:
// - Horizontal: 14 units (420px) between columns
// - Vertical: 8 units (240px) between rows
//
// RESULT: All connection handles align PERFECTLY to grid dots → straight lines!
const GRID_SIZE = 30; // pixels (LOCKED - do not make configurable)

interface StepNodeData {
  step: FlowchartStep;
  onEdit: (step: FlowchartStep) => void;
  onDelete: (stepId: string) => void;
  onDuplicate: (step: FlowchartStep) => void;
  onClick?: (step: FlowchartStep) => void;
  onUpdateStep: (step: FlowchartStep) => void;
  isEditMode: boolean;
  selectedServiceType?: string;
  gridSize: number;
}

// Custom Horizontal Edge - Always draws a straight horizontal line
function HorizontalEdge({ id, sourceX, sourceY, targetX, targetY, style, markerEnd, markerStart }: EdgeProps) {
  // Force horizontal line by using the average Y position
  const midY = (sourceY + targetY) / 2;

  // Create path data for a straight horizontal line
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY: midY,
    targetX,
    targetY: midY,
  });

  return <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} markerStart={markerStart} />;
}

// Custom Vertical Edge - Always draws a straight vertical line
function VerticalEdge({ id, sourceX, sourceY, targetX, targetY, style, markerEnd, markerStart }: EdgeProps) {
  // Force vertical line by using the average X position
  const midX = (sourceX + targetX) / 2;

  // Create path data for a straight vertical line
  const [edgePath] = getStraightPath({
    sourceX: midX,
    sourceY,
    targetX: midX,
    targetY,
  });

  return <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} markerStart={markerStart} />;
}

// Progress Line Component - Renders in viewport coordinates using ViewportPortal
function ProgressLine({ nodes, steps, selectedServiceType = "1Y" }: { nodes: Node[], steps: FlowchartStep[], selectedServiceType?: string }) {
  if (nodes.length === 0) return null;

  // Helper to format minutes to readable format
  const formatMinutes = (mins: number): string => {
    if (mins === 0) return "0m";
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  // Calculate completion, time info for each step
  const stepsWithData = nodes.map(node => {
    const step = steps.find(s => s.id === node.id);
    if (!step) return null;

    // Count ALL tasks, not just those with reference numbers
    const completedTasks = step.tasks.filter(t => t.completed).length;
    const totalTasks = step.tasks.length;
    const isComplete = completedTasks === totalTasks && totalTasks > 0;
    const completionPercent = totalTasks > 0 ? (completedTasks / totalTasks) : 0;

    // Calculate actual time (sum of all tasks' actualTimeMinutes)
    const actualTime = step.tasks.reduce((sum, task) => sum + (task.actualTimeMinutes || 0), 0);

    // Get planned time based on selected service type (cumulative)
    // First, ensure serviceTimes are parsed if not already
    if (!step.serviceTimes && step.duration) {
      step.serviceTimes = parseServiceTimes(step.duration);
    }

    // Calculate cumulative time for selected service type
    const plannedTime = getCumulativeServiceTime(step.serviceTimes, selectedServiceType) || step.durationMinutes || 0;

    return {
      x: node.position.x + 150, // Center of box (300px width / 2)
      y: node.position.y,
      isComplete,
      completedTasks,
      totalTasks,
      completionPercent,
      actualTime,
      plannedTime,
      step: step,
      id: node.id
    };
  }).filter(Boolean).sort((a, b) => a!.x - b!.x);

  if (stepsWithData.length === 0) return null;

  const first = stepsWithData[0]!;
  const last = stepsWithData[stepsWithData.length - 1]!;

  // Find highest Y position (smallest Y value = highest on screen)
  const highestY = Math.min(...stepsWithData.map(s => s!.y));
  const baseY = highestY - 120; // 120px above highest box for more space

  // Calculate cumulative times for progress visualization
  let cumulativeTargetTime = 0;
  let cumulativeActualTime = 0;
  const stepsWithProgress = stepsWithData.map(stepData => {
    // Only add to target if step has been worked on (has actual time)
    if (stepData!.actualTime > 0) {
      cumulativeTargetTime += stepData!.plannedTime;
    }
    cumulativeActualTime += stepData!.actualTime;

    return {
      ...stepData!,
      cumulativeTargetTime,
      cumulativeActualTime
    } as typeof stepData & {
      cumulativeTargetTime: number;
      cumulativeActualTime: number;
    };
  });

  // Calculate totals
  const totalPlannedTime = stepsWithData.reduce((sum, s) => sum + s!.plannedTime, 0);
  const totalTargetTime = cumulativeTargetTime; // Only steps with actual time
  const totalActualTime = cumulativeActualTime;

  // Calculate total tasks from ALL steps
  const allCompletedTasks = stepsWithData.reduce((sum, s) => sum + s!.completedTasks, 0);
  const allTotalTasks = stepsWithData.reduce((sum, s) => sum + s!.totalTasks, 0);
  const completedSteps = stepsWithData.filter(s => s!.isComplete).length;
  const completionPercent = allTotalTasks > 0 ? (allCompletedTasks / allTotalTasks) * 100 : 0;

  // Calculate X positions for time-based progress
  const totalWidth = last.x - first.x;
  const calculateXFromTime = (time: number) => {
    if (totalPlannedTime === 0) return first.x;
    return first.x + (time / totalPlannedTime) * totalWidth;
  };

  return (
    <svg
      className="pointer-events-none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'visible'
      }}
    >
      <defs>
        {/* Gradients - unique IDs for progress tracker */}
        <linearGradient id="progressTargetGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <linearGradient id="progressActualGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>

        {/* Filter for glow effect */}
        <filter id="progressGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Title and Legend */}
      <g>
        <text
          x={first.x}
          y={baseY - 45}
          fill="#ffffff"
          fontSize="14"
          fontWeight="700"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          Progress Tracker
        </text>

        {/* Legend */}
        <g transform={`translate(${first.x}, ${baseY - 22})`}>
          {/* Target time legend */}
          <line x1="0" y1="0" x2="20" y2="0" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
          <text x="25" y="0" fill="#4b5563" fontSize="10" fontWeight="600" dominantBaseline="middle">
            Target
          </text>

          {/* Actual time legend */}
          <line x1="100" y1="0" x2="120" y2="0" stroke="#eab308" strokeWidth="3" strokeLinecap="round" />
          <text x="125" y="0" fill="#4b5563" fontSize="10" fontWeight="600" dominantBaseline="middle">
            Actual
          </text>

          {/* Over-target legend */}
          <line x1="190" y1="0" x2="210" y2="0" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
          <text x="215" y="0" fill="#4b5563" fontSize="10" fontWeight="600" dominantBaseline="middle">
            Overtime
          </text>

          {/* Completion status */}
          <text x="300" y="0" fill="#6b7280" fontSize="10" fontWeight="600" dominantBaseline="middle">
            {allCompletedTasks}/{allTotalTasks} Tasks ({Math.round(completionPercent)}%) · {completedSteps}/{stepsWithData.length} Steps
          </text>
        </g>
      </g>

      {/* TARGET TIME TRACK (Top line - Green) */}
      <g>
        {/* Background track */}
        <line
          x1={first.x}
          y1={baseY}
          x2={last.x}
          y2={baseY}
          stroke="#e5e7eb"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Target time progress (cumulative for steps with actual time) */}
        {totalTargetTime > 0 && (
          <line
            x1={first.x}
            y1={baseY}
            x2={calculateXFromTime(totalTargetTime)}
            y2={baseY}
            stroke="#10b981"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.9"
            className="transition-all duration-500"
          />
        )}

        {/* End label */}
        <text
          x={last.x + 15}
          y={baseY}
          fill="#10b981"
          fontSize="10"
          fontWeight="700"
          dominantBaseline="middle"
        >
          {formatMinutes(totalTargetTime)}
        </text>
      </g>

      {/* ACTUAL TIME TRACK (Bottom line - Yellow/Red) */}
      <g>
        {/* Background track */}
        <line
          x1={first.x}
          y1={baseY + 20}
          x2={last.x}
          y2={baseY + 20}
          stroke="#e5e7eb"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Actual time progress */}
        {totalActualTime > 0 && (
          <>
            {/* Yellow part (up to target) */}
            <line
              x1={first.x}
              y1={baseY + 20}
              x2={calculateXFromTime(Math.min(totalActualTime, totalTargetTime))}
              y2={baseY + 20}
              stroke="#eab308"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.9"
              className="transition-all duration-500"
            />

            {/* Red part (over target) */}
            {totalActualTime > totalTargetTime && (
              <>
                <line
                  x1={calculateXFromTime(totalTargetTime)}
                  y1={baseY + 20}
                  x2={calculateXFromTime(totalActualTime)}
                  y2={baseY + 20}
                  stroke="#ef4444"
                  strokeWidth="8"
                  strokeLinecap="round"
                  opacity="0.9"
                  className="transition-all duration-500"
                />

                {/* Overtime indicator */}
                <text
                  x={(calculateXFromTime(totalTargetTime) + calculateXFromTime(totalActualTime)) / 2}
                  y={baseY + 38}
                  fill="#ef4444"
                  fontSize="9"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  +{formatMinutes(totalActualTime - totalTargetTime)}
                </text>
              </>
            )}
          </>
        )}

        {/* End label */}
        <text
          x={last.x + 15}
          y={baseY + 20}
          fill={totalActualTime > totalTargetTime ? "#ef4444" : "#eab308"}
          fontSize="10"
          fontWeight="700"
          dominantBaseline="middle"
        >
          {formatMinutes(totalActualTime)}
        </text>
      </g>

    </svg>
  );
}

// Custom node component for flowchart steps
function StepNode({ data, id, positionAbsoluteX, positionAbsoluteY, width, height }: NodeProps<StepNodeData>) {
  const { step, onEdit, onDelete, onDuplicate, onClick, onUpdateStep, isEditMode, selectedServiceType, gridSize } = data;
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingStepName, setEditingStepName] = useState(false);

  // Count ALL tasks
  const completedTasks = step.tasks.filter(t => t.completed).length;
  const totalTasks = step.tasks.length;
  const isComplete = completedTasks === totalTasks && totalTasks > 0;

  // Calculate total notes count from all tasks
  const totalNotesCount = step.tasks.reduce((sum, task) => sum + (task.notes?.length || 0), 0);

  // Calculate grid-aligned height based on task count
  // Each task row is ~24px, plus header/footer ~100px
  // Round UP to nearest 60px (2 grid units) + add 60px extra padding for breathing room
  const calculateGridHeight = () => {
    // Count ALL tasks (including indented ones)
    const totalTasks = step.tasks.length;

    // Base height: 100px for header + footer
    // Each task: ~24px
    const estimatedHeight = 100 + (totalTasks * 24);

    // Round UP to nearest 60px
    const gridAlignedHeight = Math.ceil(estimatedHeight / 60) * 60;

    // Add 60px (2 grid units) for extra breathing room
    const heightWithPadding = gridAlignedHeight + 60;

    // Minimum 240px (was 180), maximum 660px (was 600)
    return Math.max(240, Math.min(660, heightWithPadding));
  };

  const cardHeight = calculateGridHeight();

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
    <div className="group relative w-full h-full">
      {/* Resize handles - only visible in edit mode */}
      {isEditMode && (
        <NodeResizer
          color="#f59e0b"
          isVisible={isEditMode}
          minWidth={250}
          minHeight={200}
          maxWidth={600}
          maxHeight={800}
          handleStyle={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#f59e0b',
            border: '2px solid white',
          }}
        />
      )}

      {/* Connection handles - always present, styled differently in edit vs view mode */}
      <>
        {/* Top handles - 20px outside the card */}
        <Handle type="target" position={Position.Top} id="top-target"
          className={cn(
            "!w-4 !h-4 transition-all",
            isEditMode ? "!cursor-crosshair hover:!scale-125 !bg-blue-500 !border-2 !border-white !shadow-lg" : "!opacity-0 !pointer-events-none"
          )}
          style={{
            top: '-20px',
            left: isEditMode ? 'calc(50% - 20px)' : '50%'
          }}
          isConnectable={isEditMode} />
        <Handle type="source" position={Position.Top} id="top-source"
          className={cn(
            "!w-4 !h-4 transition-all",
            isEditMode ? "!cursor-crosshair hover:!scale-125 !bg-green-500 !border-2 !border-white !shadow-lg" : "!opacity-0 !pointer-events-none"
          )}
          style={{
            top: '-20px',
            left: isEditMode ? 'calc(50% + 20px)' : '50%'
          }}
          isConnectable={isEditMode} />

        {/* Bottom handles - 20px outside the card */}
        <Handle type="target" position={Position.Bottom} id="bottom-target"
          className={cn(
            "!w-4 !h-4 transition-all",
            isEditMode ? "!cursor-crosshair hover:!scale-125 !bg-blue-500 !border-2 !border-white !shadow-lg" : "!opacity-0 !pointer-events-none"
          )}
          style={{
            bottom: '-20px',
            left: isEditMode ? 'calc(50% - 20px)' : '50%'
          }}
          isConnectable={isEditMode} />
        <Handle type="source" position={Position.Bottom} id="bottom-source"
          className={cn(
            "!w-4 !h-4 transition-all",
            isEditMode ? "!cursor-crosshair hover:!scale-125 !bg-green-500 !border-2 !border-white !shadow-lg" : "!opacity-0 !pointer-events-none"
          )}
          style={{
            bottom: '-20px',
            left: isEditMode ? 'calc(50% + 20px)' : '50%'
          }}
          isConnectable={isEditMode} />

        {/* Left handles - 20px outside the card */}
        <Handle type="target" position={Position.Left} id="left-target"
          className={cn(
            "!w-4 !h-4 transition-all",
            isEditMode ? "!cursor-crosshair hover:!scale-125 !bg-blue-500 !border-2 !border-white !shadow-lg" : "!opacity-0 !pointer-events-none"
          )}
          style={{
            left: '-20px',
            top: isEditMode ? 'calc(50% - 20px)' : '50%'
          }}
          isConnectable={isEditMode} />
        <Handle type="source" position={Position.Left} id="left-source"
          className={cn(
            "!w-4 !h-4 transition-all",
            isEditMode ? "!cursor-crosshair hover:!scale-125 !bg-green-500 !border-2 !border-white !shadow-lg" : "!opacity-0 !pointer-events-none"
          )}
          style={{
            left: '-20px',
            top: isEditMode ? 'calc(50% + 20px)' : '50%'
          }}
          isConnectable={isEditMode} />

        {/* Right handles - 20px outside the card */}
        <Handle type="target" position={Position.Right} id="right-target"
          className={cn(
            "!w-4 !h-4 transition-all",
            isEditMode ? "!cursor-crosshair hover:!scale-125 !bg-blue-500 !border-2 !border-white !shadow-lg" : "!opacity-0 !pointer-events-none"
          )}
          style={{
            right: '-20px',
            top: isEditMode ? 'calc(50% - 20px)' : '50%'
          }}
          isConnectable={isEditMode} />
        <Handle type="source" position={Position.Right} id="right-source"
          className={cn(
            "!w-4 !h-4 transition-all",
            isEditMode ? "!cursor-crosshair hover:!scale-125 !bg-green-500 !border-2 !border-white !shadow-lg" : "!opacity-0 !pointer-events-none"
          )}
          style={{
            right: '-20px',
            top: isEditMode ? 'calc(50% + 20px)' : '50%'
          }}
          isConnectable={isEditMode} />
      </>

      <Card
        className={cn(
          "relative p-4 w-full h-full hover:shadow-lg transition-all border-2 flex flex-col overflow-auto",
          step.id === "step-4y-bolts"
            ? "border-yellow-500 border-[3px]"
            : isComplete
              ? "border-green-500 border-[3px] shadow-green-500/50 shadow-xl"
              : "border-gray-700/50"
        )}
        style={{
          backgroundColor: isComplete ? `rgba(34, 197, 94, 0.1)` : `${step.color}15`,
        }}
      >
        {/* Step Label - Inside card, top left with checkmark if complete */}
        <div className="absolute top-2 left-3 text-xs font-semibold flex items-center gap-1">
          {isComplete && <span className="text-green-500 text-base">✓</span>}
          {isEditMode && editingStepName ? (
            <input
              type="text"
              defaultValue={getStepNumber(step.id)}
              autoFocus
              onBlur={(e) => {
                // Update step id based on new name
                const newName = e.target.value.trim();
                if (newName && newName !== getStepNumber(step.id)) {
                  const newId = `step-${newName.toLowerCase().replace(/\./g, '-')}`;
                  onUpdateStep({ ...step, id: newId });
                }
                setEditingStepName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
                if (e.key === 'Escape') {
                  setEditingStepName(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-700 px-2 py-0.5 rounded border border-blue-500 text-xs font-semibold text-foreground w-24"
            />
          ) : isEditMode ? (
            <span
              className="text-muted-foreground cursor-text hover:bg-blue-500/20 px-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                setEditingStepName(true);
              }}
            >
              Step {getStepNumber(step.id)}
            </span>
          ) : (
            <span className="text-muted-foreground">
              Step {getStepNumber(step.id)}
            </span>
          )}
        </div>

        {/* Action Buttons - Inside card, top right - Only visible in edit mode */}
        {isEditMode && (
          <div className="absolute top-2 right-2 opacity-60 group-hover:opacity-100 transition-opacity flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            className="h-7 w-7 p-0 bg-primary text-primary-foreground shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(step);
            }}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 w-7 p-0 bg-blue-600 text-white shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(step);
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 w-7 p-0 bg-red-600 text-white shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(step.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        )}

        {/* Technician Badge - Centered below Step label */}
        <div className="flex justify-center mb-2 mt-5 flex-shrink-0">
          <div className="flex gap-1">
            {step.technician === "both" ? (
              <>
                <Badge variant="secondary" className="text-xs bg-blue-500/90 text-white border-0 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  T1
                </Badge>
                <Badge variant="secondary" className="text-xs bg-purple-500/90 text-white border-0 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  T2
                </Badge>
              </>
            ) : step.technician === "T1" ? (
              <Badge variant="secondary" className="text-xs bg-blue-500/90 text-white border-0 flex items-center gap-1">
                <User className="h-3 w-3" />
                T1
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs bg-purple-500/90 text-white border-0 flex items-center gap-1">
                <User className="h-3 w-3" />
                T2
              </Badge>
            )}
          </div>
        </div>

        {/* Step Content - Task list with scroll if needed */}
        <div className="flex-1 flex flex-col min-h-0 mt-2">
          {/* Task list - compact format - scrollable if overflow */}
          <div
            className="flex-1 overflow-y-auto space-y-0.5 mb-3 pr-2 scrollbar-thin"
            onWheel={(e) => {
              // Stop propagation to prevent React Flow from zooming
              e.stopPropagation();
            }}
          >
            {step.tasks.map((task) => {
              // Check if task is indented (sub-task)
              const isIndented = task.isIndented || false;

              // Filter by service type if a filter is selected (not in edit mode)
              if (!isEditMode && selectedServiceType && selectedServiceType !== "all") {
                const taskServiceType = task.serviceType || "All";
                const includedTypes = getIncludedServiceTypes(selectedServiceType);

                // Skip this task if its service type is not in the included types
                if (!includedTypes.includes(taskServiceType)) {
                  return null;
                }
              }

              // Get service type color
              const serviceType = task.serviceType || "All";
              const badgeColor = SERVICE_TYPE_COLORS[serviceType as keyof typeof SERVICE_TYPE_COLORS] || SERVICE_TYPE_COLORS.default;

              // Split reference number and description
              // Matches patterns like: "13.5.1.Lift", "13.5.1 Lift", "3.5.1-4.71 ResQ", "6.5.2.11 Visual"
              // Note: \.? matches optional trailing dot but doesn't include it in capture group
              const refMatch = task.description.match(/^(\d+(?:\.\d+)*(?:-\d+(?:\.\d+)*)*)\.?\s*(.+)$/);
              const hasRefNumber = refMatch !== null;
              const refNumber = refMatch ? refMatch[1] : '';
              const description = refMatch ? refMatch[2] : task.description;

              return (
                <div
                  key={task.id}
                  className={cn(
                    "grid items-center gap-1.5 text-[11px] py-0.5 pl-0 pr-2 rounded-sm overflow-hidden group/task",
                    "grid-cols-[auto_95px_1fr_auto]",
                    isIndented && "ml-6 text-muted-foreground"
                  )}
                  style={{
                    backgroundColor: !isIndented ? `${badgeColor}10` : 'transparent'
                  }}
                >
                  {!isIndented && (
                    isEditMode ? (
                      <select
                        value={serviceType}
                        onChange={(e) => {
                          const updatedStep = {
                            ...step,
                            tasks: step.tasks.map(t =>
                              t.id === task.id ? { ...t, serviceType: e.target.value } : t
                            )
                          };
                          onUpdateStep(updatedStep);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ backgroundColor: badgeColor }}
                        className="px-2 py-1 text-[9px] font-mono font-bold text-white border-0 cursor-pointer hover:opacity-80 flex-shrink-0 w-[42px]"
                      >
                        <option value="All" style={{ backgroundColor: SERVICE_TYPE_COLORS.All, color: 'white' }}>All</option>
                        <option value="1Y" style={{ backgroundColor: SERVICE_TYPE_COLORS["1Y"], color: 'white' }}>1Y</option>
                        <option value="2Y" style={{ backgroundColor: SERVICE_TYPE_COLORS["2Y"], color: 'white' }}>2Y</option>
                        <option value="3Y" style={{ backgroundColor: SERVICE_TYPE_COLORS["3Y"], color: 'white' }}>3Y</option>
                        <option value="4Y" style={{ backgroundColor: SERVICE_TYPE_COLORS["4Y"], color: 'white' }}>4Y</option>
                        <option value="5Y" style={{ backgroundColor: SERVICE_TYPE_COLORS["5Y"], color: 'white' }}>5Y</option>
                        <option value="6Y" style={{ backgroundColor: SERVICE_TYPE_COLORS["6Y"], color: 'white' }}>6Y</option>
                        <option value="7Y" style={{ backgroundColor: SERVICE_TYPE_COLORS["7Y"], color: 'black' }}>7Y</option>
                        <option value="10Y" style={{ backgroundColor: SERVICE_TYPE_COLORS["10Y"], color: 'black' }}>10Y</option>
                        <option value="12Y" style={{ backgroundColor: SERVICE_TYPE_COLORS["12Y"], color: 'white' }}>12Y</option>
                      </select>
                    ) : (
                      <div
                        style={{ backgroundColor: badgeColor }}
                        className="px-2 py-1 flex items-center justify-center flex-shrink-0 self-stretch w-[42px]"
                      >
                        <span className="text-[9px] font-mono font-bold text-white">
                          {serviceType}
                        </span>
                      </div>
                    )
                  )}
                  {isEditMode && editingTaskId === task.id ? (
                    <input
                      type="text"
                      defaultValue={task.description}
                      autoFocus
                      onBlur={(e) => {
                        const newDesc = e.target.value.trim();
                        if (newDesc && newDesc !== task.description) {
                          const updatedStep = {
                            ...step,
                            tasks: step.tasks.map(t =>
                              t.id === task.id ? { ...t, description: newDesc } : t
                            )
                          };
                          onUpdateStep(updatedStep);
                        }
                        setEditingTaskId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                        if (e.key === 'Escape') {
                          setEditingTaskId(null);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-white dark:bg-gray-700 px-2 py-0.5 rounded border border-blue-500 text-xs text-foreground"
                    />
                  ) : isEditMode ? (
                    hasRefNumber ? (
                      <>
                        <span className="font-semibold text-white font-mono cursor-text hover:bg-blue-500/20 px-1 rounded" onClick={(e) => {
                          e.stopPropagation();
                          setEditingTaskId(task.id);
                        }}>
                          {refNumber}
                        </span>
                        <span className={cn("font-semibold text-white cursor-text hover:bg-blue-500/20 px-1 rounded", task.completed && "line-through text-gray-400")} onClick={(e) => {
                          e.stopPropagation();
                          setEditingTaskId(task.id);
                        }}>
                          {description}
                        </span>
                      </>
                    ) : (
                      <>
                        <span></span>
                        <span
                          className={cn(
                            !isIndented ? "font-semibold" : "font-normal",
                            task.completed ? "line-through text-gray-400" : "text-white",
                            "cursor-text hover:bg-blue-500/20 px-1 rounded"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTaskId(task.id);
                          }}
                        >
                          {task.description}
                        </span>
                      </>
                    )
                  ) : (
                    hasRefNumber ? (
                      <>
                        <span className="font-semibold text-white font-mono">
                          {refNumber}
                        </span>
                        <span className={cn("font-semibold text-white line-clamp-1", task.completed && "line-through text-gray-400")}>
                          {description}
                        </span>
                      </>
                    ) : (
                      <>
                        <span></span>
                        <span
                          className={cn(
                            !isIndented ? "font-semibold" : "font-normal",
                            "line-clamp-1",
                            task.completed ? "line-through text-gray-400" : "text-white"
                          )}
                        >
                          {task.description}
                        </span>
                      </>
                    )
                  )}
                  {task.completed && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Section - Duration & Progress - Fixed at bottom */}
          <div className="pt-2 border-t border-gray-700/30 space-y-2 flex-shrink-0">
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

            {/* Debug Info - Position and Size (Edit Mode Only) */}
            {isEditMode && (
              <div className="mt-2 pt-2 border-t border-gray-700/50 text-xs text-gray-400 font-mono space-y-0.5">
                <div className="flex justify-between">
                  <span>Position:</span>
                  <span className="text-blue-400">X: {Math.round(positionAbsoluteX || step.position.x * gridSize)}, Y: {Math.round(positionAbsoluteY || step.position.y * gridSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Size:</span>
                  <span className="text-amber-400">W: {Math.round(width || 300)}, H: {Math.round(height || cardHeight)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Grid:</span>
                  <span className="text-green-400">X: {Math.round((positionAbsoluteX || step.position.x * gridSize) / gridSize)}, Y: {Math.round((positionAbsoluteY || step.position.y * gridSize) / gridSize)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

// Custom heights for specific steps (for this flowchart layout)
// These are specific to the current flowchart and not part of the import/export
const CUSTOM_STEP_HEIGHTS: Record<string, number> = {
  "step-1": 290,
  "step-2-1": 450,
  "step-2-2": 420,
  "step-3": 450,
  "step-4": 660,
  "step-5-1": 510,
  "step-5-2": 800,
  "step-6": 320,
  "step-7": 480,
  "step-8-1": 420,
  "step-8-2": 420,
  "step-9-1": 350,
  "step-9-2": 420,
  "step-10": 420,
  "step-4y-bolts": 350
};

// Inner component that uses React Flow hooks
function FlowchartEditorInner({
  steps,
  onStepsChange,
  onEditStep,
  onAddStep,
  onStepClick,
  zoom,
  gridSize = GRID_SIZE,
  isEditMode,
  setHasUnsavedChanges,
  selectedServiceType,
  initialEdges = [],
  onEdgesChange: onEdgesChangeProp,
  hideCompletedSteps = false,
  onRealignToGrid,
  freePositioning = false,
  layoutMode = 'topdown'
}: FlowchartEditorProps) {
  // Filter steps based on hideCompletedSteps
  const displayedSteps = useMemo(() => {
    if (!hideCompletedSteps || isEditMode) return steps;

    return steps.filter(step => {
      // Count ALL tasks
      const completedTasks = step.tasks.filter(t => t.completed).length;
      const totalTasks = step.tasks.length;
      const isComplete = completedTasks === totalTasks && totalTasks > 0;

      return !isComplete; // Only show incomplete steps
    });
  }, [steps, hideCompletedSteps, isEditMode]);

  // Define handlers first before using them in useMemo
  const handleDelete = useCallback((stepId: string) => {
    if (confirm("Are you sure you want to delete this step?")) {
      onStepsChange(steps.filter(s => s.id !== stepId));
      setHasUnsavedChanges(true);
    }
  }, [steps, onStepsChange, setHasUnsavedChanges]);

  const handleDuplicate = useCallback((step: FlowchartStep) => {
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
  }, [steps, onStepsChange, setHasUnsavedChanges]);

  const handleUpdateStep = useCallback((updatedStep: FlowchartStep) => {
    const updatedSteps = steps.map(s =>
      s.id === updatedStep.id ? updatedStep : s
    );
    onStepsChange(updatedSteps);
    setHasUnsavedChanges(true);
  }, [steps, onStepsChange, setHasUnsavedChanges]);

  // Convert FlowchartStep[] to React Flow nodes
  const initialNodes: Node<StepNodeData>[] = useMemo(() => displayedSteps.map(step => {
    // Standard dimensions: 370px width
    // Use custom height if defined, otherwise use default based on task count
    const totalTasks = step.tasks.length;
    const initialHeight = CUSTOM_STEP_HEIGHTS[step.id] ?? (totalTasks > 4 ? 450 : 350);
    const initialWidth = 370;

    return {
      id: step.id,
      type: 'stepNode',
      position: { x: step.position.x * gridSize, y: step.position.y * gridSize },
      style: { width: initialWidth, height: initialHeight },
      data: {
        step,
        onEdit: onEditStep,
        onDelete: handleDelete,
        onDuplicate: handleDuplicate,
        onClick: onStepClick,
        onUpdateStep: handleUpdateStep,
        isEditMode,
        selectedServiceType,
        gridSize,
      },
      draggable: isEditMode,
    };
  }), [displayedSteps, gridSize, isEditMode, selectedServiceType, handleDelete, handleDuplicate, handleUpdateStep, onEditStep, onStepClick]);

  // Initialize edges (connections) - load from props
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const hasLoadedInitialEdges = useRef(false);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  // NOW we can use useUpdateNodeInternals because we're inside ReactFlowProvider
  const updateNodeInternals = useUpdateNodeInternals();

  // Re-align all nodes to grid - Auto-layout with intelligent positioning (TOP-DOWN)
  const handleRealignToGridTopDown = useCallback(() => {
    // Parse step number from ID (e.g., "step-2-1" -> {major: 2, minor: 1})
    const parseStepId = (stepId: string): { major: number; minor?: number; original: string; is4YBolts: boolean } => {
      // Handle special cases - 4Y bolts should be in column 10
      if (stepId === "step-4y-bolts") return { major: 10, original: stepId, is4YBolts: true };

      const idPart = stepId.replace('step-', '');
      const parts = idPart.split('-').map(p => parseInt(p)).filter(n => !isNaN(n));

      return {
        major: parts[0] || 0,
        minor: parts[1],
        original: stepId,
        is4YBolts: false
      };
    };

    // Separate 4Y bolts from regular steps
    const boltsStep = steps.find(s => s.id === "step-4y-bolts");
    const regularSteps = steps.filter(s => s.id !== "step-4y-bolts");

    // Group regular steps by major number (column)
    const stepsByColumn = new Map<number, typeof steps>();
    regularSteps.forEach(step => {
      const parsed = parseStepId(step.id);
      if (!stepsByColumn.has(parsed.major)) {
        stepsByColumn.set(parsed.major, []);
      }
      stepsByColumn.get(parsed.major)!.push(step);
    });

    // Sort columns
    const sortedColumns = Array.from(stepsByColumn.keys()).sort((a, b) => a - b);

    // Layout constants (in grid units)
    const START_X_GRID = 1; // Starting X position (1 grid unit = 30px)
    const START_Y_GRID = 5; // Starting Y position (5 grid units = 150px) - room for progress tracker
    const SPACING_GRID = 4; // Spacing between boxes (4 grid units = 120px)

    // Standard box dimensions
    const calculateBoxWidth = (step: FlowchartStep): number => {
      return 370; // Standard width for all boxes
    };

    // Calculate box height based on task count (in pixels)
    const calculateBoxHeight = (step: FlowchartStep): number => {
      // Use custom height if defined, otherwise use default based on task count
      if (CUSTOM_STEP_HEIGHTS[step.id]) {
        return CUSTOM_STEP_HEIGHTS[step.id];
      }

      const totalTasks = step.tasks.length;
      // 450px if more than 4 tasks, 350px if 4 or fewer
      return totalTasks > 4 ? 450 : 350;
    };

    // First pass: Calculate widths and heights for all steps (in grid units)
    const stepDimensions = new Map<string, { widthGrid: number; heightGrid: number; widthPx: number; heightPx: number }>();
    steps.forEach(step => {
      const widthPx = calculateBoxWidth(step);
      const heightPx = calculateBoxHeight(step);
      stepDimensions.set(step.id, {
        widthGrid: Math.ceil(widthPx / gridSize), // Convert to grid units
        heightGrid: Math.ceil(heightPx / gridSize),
        widthPx: widthPx,
        heightPx: heightPx
      });
    });

    // Calculate max width for each column (in grid units)
    const columnWidthsGrid = new Map<number, number>();
    sortedColumns.forEach((colNum) => {
      const stepsInColumn = stepsByColumn.get(colNum)!;
      const maxWidthGrid = Math.max(...stepsInColumn.map(s => stepDimensions.get(s.id)!.widthGrid));
      columnWidthsGrid.set(colNum, maxWidthGrid);
    });

    // Calculate positions for all steps (in grid units)
    const newPositions = new Map<string, { xGrid: number; yGrid: number; widthPx: number; heightPx: number }>();

    sortedColumns.forEach((colNum, colIndex) => {
      const stepsInColumn = stepsByColumn.get(colNum)!;

      // Sort steps in column by minor number
      stepsInColumn.sort((a, b) => {
        const aMinor = parseStepId(a.id).minor ?? 0;
        const bMinor = parseStepId(b.id).minor ?? 0;
        return aMinor - bMinor;
      });

      // Calculate X position for this column based on previous columns' widths (in grid units)
      let xPosGrid = START_X_GRID;
      for (let i = 0; i < colIndex; i++) {
        const prevColNum = sortedColumns[i];
        const prevColWidthGrid = columnWidthsGrid.get(prevColNum)!;
        xPosGrid += prevColWidthGrid + SPACING_GRID;
      }

      // Position steps vertically in this column (in grid units)
      let currentYGrid = START_Y_GRID;
      stepsInColumn.forEach((step) => {
        const dimensions = stepDimensions.get(step.id)!;

        newPositions.set(step.id, {
          xGrid: xPosGrid,
          yGrid: currentYGrid,
          widthPx: dimensions.widthPx,
          heightPx: dimensions.heightPx
        });

        // Move down for next parallel step (box height + spacing in grid units)
        currentYGrid += dimensions.heightGrid + SPACING_GRID;
      });
    });

    // Position 4Y Bolts under Step 10
    if (boltsStep) {
      const step10 = regularSteps.find(s => s.id === "step-10");
      if (step10) {
        const step10Pos = newPositions.get(step10.id);
        const boltsDimensions = stepDimensions.get(boltsStep.id);

        if (step10Pos && boltsDimensions) {
          // Place 4Y bolts at same X as step-10, but 4 grid units below
          newPositions.set(boltsStep.id, {
            xGrid: step10Pos.xGrid,
            yGrid: step10Pos.yGrid + stepDimensions.get(step10.id)!.heightGrid + SPACING_GRID,
            widthPx: boltsDimensions.widthPx,
            heightPx: boltsDimensions.heightPx
          });
        }
      }
    }

    // Update nodes with new positions (convert grid units to pixels for React Flow)
    setNodes((nds) =>
      nds.map((node) => {
        const newPos = newPositions.get(node.id);
        if (newPos) {
          return {
            ...node,
            position: {
              x: newPos.xGrid * gridSize,
              y: newPos.yGrid * gridSize
            },
            style: { ...node.style, width: newPos.widthPx, height: newPos.heightPx }
          };
        }
        return node;
      })
    );

    // Update step positions in parent state (already in grid units)
    const layoutSteps = steps.map(step => {
      const newPos = newPositions.get(step.id);
      if (newPos) {
        return {
          ...step,
          position: {
            x: newPos.xGrid,
            y: newPos.yGrid
          }
        };
      }
      return step;
    });
    onStepsChange(layoutSteps);

    // AUTO-GENERATE EDGES based on technician flow
    const generateEdges = (): Edge[] => {
      const newEdges: Edge[] = [];

      sortedColumns.forEach((colNum, colIndex) => {
        // Skip if this is the last column
        if (colIndex >= sortedColumns.length - 1) return;

        const currentSteps = stepsByColumn.get(colNum)!;
        const nextColNum = sortedColumns[colIndex + 1];
        const nextSteps = stepsByColumn.get(nextColNum)!;

        // Check if current column or next column has parallel steps
        const currentColHasParallel = currentSteps.length > 1;
        const nextColHasParallel = nextSteps.length > 1;

        currentSteps.forEach((currentStep) => {
          const currentTech = currentStep.technician;

          nextSteps.forEach((nextStep) => {
            const nextTech = nextStep.technician;

            // Determine if we should connect these steps
            let shouldConnect = false;

            if (currentTech === "both") {
              // "both" connects to all next steps
              shouldConnect = true;
            } else if (nextTech === "both") {
              // All current steps connect to "both"
              shouldConnect = true;
            } else if (currentTech === nextTech) {
              // T1 → T1, T2 → T2
              shouldConnect = true;
            }

            if (shouldConnect) {
              // Use 'horizontal' for:
              // 1. Solo-to-solo connections
              // 2. Parallel-to-parallel connections where they have same minor number (same position: 8.1→9.1, 8.2→9.2)
              // Use 'smoothstep' for diagonal/vertical connections (different positions)

              const isSoloToSolo = !currentColHasParallel && !nextColHasParallel;

              // Check if parallel steps are in same position (same minor number)
              const currentMinor = parseStepId(currentStep.id).minor ?? 0;
              const nextMinor = parseStepId(nextStep.id).minor ?? 0;
              const isSamePosition = currentMinor === nextMinor;

              const isHorizontal = isSoloToSolo || (currentColHasParallel && nextColHasParallel && isSamePosition);

              newEdges.push({
                id: `edge-${currentStep.id}-${nextStep.id}`,
                source: currentStep.id,
                target: nextStep.id,
                sourceHandle: 'right-source',
                targetHandle: 'left-target',
                type: isHorizontal ? 'horizontal' : 'smoothstep',
                animated: false,
                style: { stroke: '#6366f1', strokeWidth: 2.5 },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: '#6366f1',
                }
              });
            }
          });
        });
      });

      // Add dotted edge from step-10 to 4Y bolts
      if (boltsStep) {
        const step10 = regularSteps.find(s => s.id === "step-10");
        if (step10) {
          newEdges.push({
            id: `edge-step-10-4y-bolts`,
            source: step10.id,
            target: boltsStep.id,
            sourceHandle: 'bottom-source',
            targetHandle: 'top-target',
            type: 'straight',
            animated: false,
            style: {
              stroke: '#eab308',
              strokeWidth: 2.5,
              strokeDasharray: '5,5' // Dotted line
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#eab308',
            }
          });
        }
      }

      return newEdges;
    };

    // Set the auto-generated edges
    const autoEdges = generateEdges();
    setEdges(autoEdges);

    setHasUnsavedChanges(true);
  }, [setNodes, setEdges, steps, onStepsChange, setHasUnsavedChanges, gridSize]);

  // Re-align all nodes to grid - CENTER-BASED layout (parallels expand from center)
  const handleRealignToGridCentered = useCallback(() => {
    // Parse step number from ID (e.g., "step-2-1" -> {major: 2, minor: 1})
    const parseStepId = (stepId: string): { major: number; minor?: number; original: string; is4YBolts: boolean } => {
      // Handle special cases - 4Y bolts should be in column 10
      if (stepId === "step-4y-bolts") return { major: 10, original: stepId, is4YBolts: true };

      const idPart = stepId.replace('step-', '');
      const parts = idPart.split('-').map(p => parseInt(p)).filter(n => !isNaN(n));

      return {
        major: parts[0] || 0,
        minor: parts[1],
        original: stepId,
        is4YBolts: false
      };
    };

    // Separate 4Y bolts from regular steps
    const boltsStep = steps.find(s => s.id === "step-4y-bolts");
    const regularSteps = steps.filter(s => s.id !== "step-4y-bolts");

    // Group regular steps by major number (column)
    const stepsByColumn = new Map<number, typeof steps>();
    regularSteps.forEach(step => {
      const parsed = parseStepId(step.id);
      if (!stepsByColumn.has(parsed.major)) {
        stepsByColumn.set(parsed.major, []);
      }
      stepsByColumn.get(parsed.major)!.push(step);
    });

    // Sort columns
    const sortedColumns = Array.from(stepsByColumn.keys()).sort((a, b) => a - b);

    // Layout constants (in grid units)
    const START_X_GRID = 1; // Starting X position
    const CENTER_Y_GRID = 15; // Center Y position for the layout
    const SPACING_GRID = 4; // Spacing between boxes

    // Standard box dimensions
    const calculateBoxWidth = (step: FlowchartStep): number => {
      return 370; // Standard width for all boxes
    };

    // Calculate box height based on task count (in pixels)
    const calculateBoxHeight = (step: FlowchartStep): number => {
      // Use custom height if defined, otherwise use default based on task count
      if (CUSTOM_STEP_HEIGHTS[step.id]) {
        return CUSTOM_STEP_HEIGHTS[step.id];
      }

      const totalTasks = step.tasks.length;
      // 450px if more than 4 tasks, 350px if 4 or fewer
      return totalTasks > 4 ? 450 : 350;
    };

    // Calculate dimensions for all steps
    const stepDimensions = new Map<string, { widthGrid: number; heightGrid: number; widthPx: number; heightPx: number }>();
    steps.forEach(step => {
      const widthPx = calculateBoxWidth(step);
      const heightPx = calculateBoxHeight(step);
      stepDimensions.set(step.id, {
        widthGrid: Math.ceil(widthPx / gridSize),
        heightGrid: Math.ceil(heightPx / gridSize),
        widthPx: widthPx,
        heightPx: heightPx
      });
    });

    // Calculate max width for each column
    const columnWidthsGrid = new Map<number, number>();
    sortedColumns.forEach((colNum) => {
      const stepsInColumn = stepsByColumn.get(colNum)!;
      const maxWidthGrid = Math.max(...stepsInColumn.map(s => stepDimensions.get(s.id)!.widthGrid));
      columnWidthsGrid.set(colNum, maxWidthGrid);
    });

    // Calculate positions for all steps (CENTER-BASED)
    const newPositions = new Map<string, { xGrid: number; yGrid: number; widthPx: number; heightPx: number }>();

    sortedColumns.forEach((colNum, colIndex) => {
      const stepsInColumn = stepsByColumn.get(colNum)!;

      // Sort steps in column by minor number
      stepsInColumn.sort((a, b) => {
        const aMinor = parseStepId(a.id).minor ?? 0;
        const bMinor = parseStepId(b.id).minor ?? 0;
        return aMinor - bMinor;
      });

      // Calculate X position for this column
      let xPosGrid = START_X_GRID;
      for (let i = 0; i < colIndex; i++) {
        const prevColNum = sortedColumns[i];
        const prevColWidthGrid = columnWidthsGrid.get(prevColNum)!;
        xPosGrid += prevColWidthGrid + SPACING_GRID;
      }

      // CENTER-BASED VERTICAL DISTRIBUTION
      // Calculate total height needed for all steps in column
      const totalHeightGrid = stepsInColumn.reduce((sum, step) => {
        return sum + stepDimensions.get(step.id)!.heightGrid + SPACING_GRID;
      }, 0) - SPACING_GRID; // Remove last spacing

      // Start Y position so that all steps are centered around CENTER_Y_GRID
      let currentYGrid = CENTER_Y_GRID - (totalHeightGrid / 2);

      stepsInColumn.forEach((step) => {
        const dimensions = stepDimensions.get(step.id)!;

        newPositions.set(step.id, {
          xGrid: xPosGrid,
          yGrid: Math.round(currentYGrid), // Round to avoid half-grid positions
          widthPx: dimensions.widthPx,
          heightPx: dimensions.heightPx
        });

        // Move down for next parallel step
        currentYGrid += dimensions.heightGrid + SPACING_GRID;
      });
    });

    // Position 4Y Bolts under Step 10
    if (boltsStep) {
      const step10 = regularSteps.find(s => s.id === "step-10");
      if (step10) {
        const step10Pos = newPositions.get(step10.id);
        const boltsDimensions = stepDimensions.get(boltsStep.id);

        if (step10Pos && boltsDimensions) {
          // Place 4Y bolts at same X as step-10, but 4 grid units below
          newPositions.set(boltsStep.id, {
            xGrid: step10Pos.xGrid,
            yGrid: step10Pos.yGrid + stepDimensions.get(step10.id)!.heightGrid + SPACING_GRID,
            widthPx: boltsDimensions.widthPx,
            heightPx: boltsDimensions.heightPx
          });
        }
      }
    }

    // Update nodes with new positions
    setNodes((nds) =>
      nds.map((node) => {
        const newPos = newPositions.get(node.id);
        if (newPos) {
          return {
            ...node,
            position: {
              x: newPos.xGrid * gridSize,
              y: newPos.yGrid * gridSize
            },
            style: { ...node.style, width: newPos.widthPx, height: newPos.heightPx }
          };
        }
        return node;
      })
    );

    // Update step positions in parent state
    const layoutSteps = steps.map(step => {
      const newPos = newPositions.get(step.id);
      if (newPos) {
        return {
          ...step,
          position: {
            x: newPos.xGrid,
            y: newPos.yGrid
          }
        };
      }
      return step;
    });
    onStepsChange(layoutSteps);

    // AUTO-GENERATE EDGES based on technician flow (same as topdown)
    const generateEdges = (): Edge[] => {
      const newEdges: Edge[] = [];

      sortedColumns.forEach((colNum, colIndex) => {
        if (colIndex >= sortedColumns.length - 1) return;

        const currentSteps = stepsByColumn.get(colNum)!;
        const nextColNum = sortedColumns[colIndex + 1];
        const nextSteps = stepsByColumn.get(nextColNum)!;

        // Check if current column or next column has parallel steps
        const currentColHasParallel = currentSteps.length > 1;
        const nextColHasParallel = nextSteps.length > 1;

        currentSteps.forEach((currentStep) => {
          const currentTech = currentStep.technician;

          nextSteps.forEach((nextStep) => {
            const nextTech = nextStep.technician;

            let shouldConnect = false;

            if (currentTech === "both") {
              shouldConnect = true;
            } else if (nextTech === "both") {
              shouldConnect = true;
            } else if (currentTech === nextTech) {
              shouldConnect = true;
            }

            if (shouldConnect) {
              // Use 'horizontal' for:
              // 1. Solo-to-solo connections
              // 2. Parallel-to-parallel connections where they have same minor number (same position: 8.1→9.1, 8.2→9.2)
              // Use 'smoothstep' for diagonal/vertical connections (different positions)

              const isSoloToSolo = !currentColHasParallel && !nextColHasParallel;

              // Check if parallel steps are in same position (same minor number)
              const currentMinor = parseStepId(currentStep.id).minor ?? 0;
              const nextMinor = parseStepId(nextStep.id).minor ?? 0;
              const isSamePosition = currentMinor === nextMinor;

              const isHorizontal = isSoloToSolo || (currentColHasParallel && nextColHasParallel && isSamePosition);

              newEdges.push({
                id: `edge-${currentStep.id}-${nextStep.id}`,
                source: currentStep.id,
                target: nextStep.id,
                sourceHandle: 'right-source',
                targetHandle: 'left-target',
                type: isHorizontal ? 'horizontal' : 'smoothstep',
                animated: false,
                style: { stroke: '#6366f1', strokeWidth: 2.5 },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: '#6366f1',
                }
              });
            }
          });
        });
      });

      // Add dotted edge from step-10 to 4Y bolts
      if (boltsStep) {
        const step10 = regularSteps.find(s => s.id === "step-10");
        if (step10) {
          newEdges.push({
            id: `edge-step-10-4y-bolts`,
            source: step10.id,
            target: boltsStep.id,
            sourceHandle: 'bottom-source',
            targetHandle: 'top-target',
            type: 'straight',
            animated: false,
            style: {
              stroke: '#eab308',
              strokeWidth: 2.5,
              strokeDasharray: '5,5' // Dotted line
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#eab308',
            }
          });
        }
      }

      return newEdges;
    };

    const autoEdges = generateEdges();
    setEdges(autoEdges);

    setHasUnsavedChanges(true);
  }, [setNodes, setEdges, steps, onStepsChange, setHasUnsavedChanges, gridSize]);

  // Main handler that delegates to the appropriate layout function
  const handleRealignToGrid = useCallback(() => {
    if (layoutMode === 'centered') {
      handleRealignToGridCentered();
    } else {
      handleRealignToGridTopDown();
    }
  }, [layoutMode, handleRealignToGridCentered, handleRealignToGridTopDown]);

  // Expose realign function to parent
  useEffect(() => {
    if (onRealignToGrid) {
      // Create a reference that can be called from parent
      (window as any).__flowchartRealignToGrid = handleRealignToGrid;
    }
    return () => {
      delete (window as any).__flowchartRealignToGrid;
    };
  }, [handleRealignToGrid, onRealignToGrid]);

  // Update node DATA only (not positions) when steps/props change
  // This prevents boxes from jumping when clicking edges
  useEffect(() => {
    setNodes((nds) => {
      const existingNodeIds = new Set(nds.map(n => n.id));
      const newStepIds = new Set(displayedSteps.map(s => s.id));

      // Update existing nodes (keep their positions)
      const updatedNodes = nds
        .filter(node => newStepIds.has(node.id)) // Remove deleted/hidden steps
        .map((node) => {
          const step = displayedSteps.find((s) => s.id === node.id);
          if (!step) return node;

          // Only update data and draggable state, KEEP existing position
          return {
            ...node,
            data: {
              step,
              onEdit: onEditStep,
              onDelete: handleDelete,
              onDuplicate: handleDuplicate,
              onClick: onStepClick,
              onUpdateStep: handleUpdateStep,
              isEditMode,
              selectedServiceType,
              gridSize,
            },
            draggable: isEditMode,
          };
        });

      // Add new nodes (with initial positions from steps)
      const newNodes = displayedSteps
        .filter(step => !existingNodeIds.has(step.id))
        .map(step => {
          // Calculate initial height based on ALL tasks
          const totalTasks = step.tasks.length;
          const estimatedHeight = 100 + (totalTasks * 24);
          const gridAlignedHeight = Math.ceil(estimatedHeight / 60) * 60;
          const heightWithPadding = gridAlignedHeight + 60;
          const initialHeight = Math.max(240, Math.min(660, heightWithPadding));

          return {
            id: step.id,
            type: 'stepNode',
            position: { x: step.position.x * gridSize, y: step.position.y * gridSize },
            style: { width: 300, height: initialHeight },
            data: {
              step,
              onEdit: onEditStep,
              onDelete: handleDelete,
              onDuplicate: handleDuplicate,
              onClick: onStepClick,
              onUpdateStep: handleUpdateStep,
              isEditMode,
              selectedServiceType,
              gridSize,
            },
            draggable: isEditMode,
          };
        });

      return [...updatedNodes, ...newNodes];
    });

    // CRITICAL: Update node internals after DOM has rendered
    // This is required when using multiple handles per node
    setTimeout(() => {
      displayedSteps.forEach((step) => {
        updateNodeInternals(step.id);
      });
    }, 0);
  }, [displayedSteps, isEditMode, selectedServiceType, handleDelete, handleDuplicate, handleUpdateStep, onEditStep, onStepClick, gridSize, updateNodeInternals, setNodes]);

  // Handle node drag end - update step positions
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);

    // Only update parent state when drag ENDS (not during drag)
    const dragEndChanges = changes.filter((c: any) => c.type === 'position' && c.dragging === false);

    if (dragEndChanges.length > 0 && isEditMode) {
      // Use setTimeout to defer state update until after render cycle
      setTimeout(() => {
        // Extract position updates directly from the changes
        const positionUpdates = new Map<string, { x: number; y: number }>();

        dragEndChanges.forEach((change: any) => {
          if (change.position) {
            positionUpdates.set(change.id, {
              x: Math.round(change.position.x / gridSize),
              y: Math.round(change.position.y / gridSize)
            });
          }
        });

        // Update steps with new positions
        const updatedSteps = steps.map(step => {
          const newPosition = positionUpdates.get(step.id);
          if (newPosition) {
            return { ...step, position: newPosition };
          }
          return step;
        });

        // Check if any positions actually changed
        const hasChanges = updatedSteps.some((step, i) =>
          step.position.x !== steps[i].position.x ||
          step.position.y !== steps[i].position.y
        );

        if (hasChanges) {
          onStepsChange(updatedSteps);
          setHasUnsavedChanges(true);
        }
      }, 0);
    }
  }, [onNodesChange, isEditMode, steps, onStepsChange, setHasUnsavedChanges, gridSize]);

  // Handle connection creation
  const onConnect = useCallback((connection: Connection) => {
    if (isEditMode) {
      setEdges((eds) => addEdge({
        ...connection,
        type: 'smoothstep', // Use smooth 90-degree bends
        animated: false, // Solid line, not animated
        style: { stroke: '#6366f1', strokeWidth: 2.5 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#6366f1',
        }
      }, eds));
      setHasUnsavedChanges(true);
    }
  }, [isEditMode, setHasUnsavedChanges]);

  // Auto-update edge colors based on source step completion status
  useEffect(() => {
    setEdges((currentEdges) =>
      currentEdges.map((edge) => {
        const sourceStep = steps.find(s => s.id === edge.source);
        if (!sourceStep) return edge;

        // Count ALL tasks
        const completedTasks = sourceStep.tasks.filter(t => t.completed).length;
        const totalTasks = sourceStep.tasks.length;
        const isSourceComplete = completedTasks === totalTasks && totalTasks > 0;

        // Only auto-update if edge doesn't have custom color (still has default blue)
        const isDefaultColor = !edge.style?.stroke || edge.style.stroke === '#6366f1';

        if (isSourceComplete && isDefaultColor) {
          return {
            ...edge,
            style: { ...(edge.style || {}), stroke: '#10b981', strokeWidth: edge.style?.strokeWidth || 2.5 },
            markerEnd: edge.markerEnd ? { ...edge.markerEnd, color: '#10b981' } : undefined,
            markerStart: edge.markerStart ? { ...edge.markerStart, color: '#10b981' } : undefined,
            label: edge.label || '✓',
            labelStyle: { fill: '#fff', fontWeight: 700, fontSize: 14 },
            labelBgStyle: { fill: '#10b981', fillOpacity: 0.95 },
            labelBgPadding: [6, 10] as [number, number],
            labelBgBorderRadius: 6,
          };
        }

        return edge;
      })
    );
  }, [steps, setEdges]);

  // Handle edge changes (deletion, etc.)
  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChange(changes);
    if (isEditMode) {
      setHasUnsavedChanges(true);
    }
  }, [onEdgesChange, isEditMode, setHasUnsavedChanges]);

  // Load initialEdges only once when data is loaded from localStorage
  useEffect(() => {
    if (initialEdges.length > 0 && !hasLoadedInitialEdges.current) {
      // Filter out invalid edges (those with null/undefined source/target/handles)
      const validEdges = initialEdges.filter(edge => {
        const isValid = edge.source && edge.target && edge.sourceHandle && edge.targetHandle;
        return isValid;
      });
      setEdges(validEdges);
      hasLoadedInitialEdges.current = true;
    }
  }, [initialEdges]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync edges to parent component whenever they change
  useEffect(() => {
    onEdgesChangeProp?.(edges);
  }, [edges]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle node click to open detail drawer
  const handleNodeClick = useCallback((_event: any, node: Node<StepNodeData>) => {
    if (!isEditMode && onStepClick) {
      onStepClick(node.data.step);
    }
  }, [isEditMode, onStepClick]);

  // Handle edge click to show style menu
  const handleEdgeClick = useCallback((_event: any, edge: Edge) => {
    if (isEditMode) {
      setSelectedEdge(edge);
    }
  }, [isEditMode]);

  // Update edge style
  const updateEdgeStyle = useCallback((edgeId: string, type: 'straight' | 'smoothstep' | 'step' | 'default' | 'simplebezier' | 'horizontal' | 'vertical') => {
    setEdges((eds) => eds.map(edge => {
      if (edge.id === edgeId) {
        return {
          ...edge,
          type,
        };
      }
      return edge;
    }));
    setHasUnsavedChanges(true);
  }, [setEdges, setHasUnsavedChanges]);

  // Update edge arrow markers
  const updateEdgeArrows = useCallback((edgeId: string, arrowType: 'none' | 'end' | 'start' | 'both') => {
    setEdges((eds) => eds.map(edge => {
      if (edge.id === edgeId) {
        const color = edge.style?.stroke || '#6366f1';
        return {
          ...edge,
          markerStart: arrowType === 'start' || arrowType === 'both'
            ? { type: MarkerType.ArrowClosed, color }
            : undefined,
          markerEnd: arrowType === 'end' || arrowType === 'both'
            ? { type: MarkerType.ArrowClosed, color }
            : undefined,
        };
      }
      return edge;
    }));
    setHasUnsavedChanges(true);
  }, [setEdges, setHasUnsavedChanges]);

  // Toggle edge animation
  const toggleEdgeAnimation = useCallback((edgeId: string) => {
    setEdges((eds) => eds.map(edge => {
      if (edge.id === edgeId) {
        return {
          ...edge,
          animated: !edge.animated,
        };
      }
      return edge;
    }));
    setHasUnsavedChanges(true);
  }, [setEdges, setHasUnsavedChanges]);

  // Update edge color
  const updateEdgeColor = useCallback((edgeId: string, color: string) => {
    setEdges((eds) => eds.map(edge => {
      if (edge.id === edgeId) {
        return {
          ...edge,
          style: { ...(edge.style || {}), stroke: color },
          markerStart: edge.markerStart ? { ...edge.markerStart, color } : undefined,
          markerEnd: edge.markerEnd ? { ...edge.markerEnd, color } : undefined,
        };
      }
      return edge;
    }));
    setHasUnsavedChanges(true);
  }, [setEdges, setHasUnsavedChanges]);

  // Update edge width
  const updateEdgeWidth = useCallback((edgeId: string, width: number) => {
    setEdges((eds) => eds.map(edge => {
      if (edge.id === edgeId) {
        return {
          ...edge,
          style: { ...(edge.style || {}), strokeWidth: width },
        };
      }
      return edge;
    }));
    setHasUnsavedChanges(true);
  }, [setEdges, setHasUnsavedChanges]);

  // Update edge line style (solid, dashed, dotted)
  const updateEdgeLineStyle = useCallback((edgeId: string, lineStyle: 'solid' | 'dashed' | 'dotted') => {
    setEdges((eds) => eds.map(edge => {
      if (edge.id === edgeId) {
        const dashArray = lineStyle === 'dashed' ? '5 5' : lineStyle === 'dotted' ? '2 4' : undefined;
        return {
          ...edge,
          style: { ...(edge.style || {}), strokeDasharray: dashArray },
        };
      }
      return edge;
    }));
    setHasUnsavedChanges(true);
  }, [setEdges, setHasUnsavedChanges]);

  // Update edge label
  const updateEdgeLabel = useCallback((edgeId: string, label: string) => {
    setEdges((eds) => eds.map(edge => {
      if (edge.id === edgeId) {
        return {
          ...edge,
          label: label || undefined,
          labelStyle: label ? { fill: '#fff', fontWeight: 600, fontSize: 12 } : undefined,
          labelBgStyle: label ? { fill: '#6366f1', fillOpacity: 0.9 } : undefined,
          labelBgPadding: label ? [4, 8] as [number, number] : undefined,
          labelBgBorderRadius: label ? 4 : undefined,
        };
      }
      return edge;
    }));
    setHasUnsavedChanges(true);
  }, [setEdges, setHasUnsavedChanges]);

  // Update edge animation duration
  const updateEdgeAnimationDuration = useCallback((edgeId: string, duration: number) => {
    setEdges((eds) => eds.map(edge => {
      if (edge.id === edgeId) {
        return {
          ...edge,
          style: { ...(edge.style || {}), animationDuration: `${duration}s` },
        };
      }
      return edge;
    }));
    setHasUnsavedChanges(true);
  }, [setEdges, setHasUnsavedChanges]);

  // Define custom node types
  const nodeTypes = useMemo(() => ({ stepNode: StepNode }), []);
  const edgeTypes = useMemo(() => ({
    horizontal: HorizontalEdge,
    vertical: VerticalEdge
  }), []);

  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.5}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: zoom / 100 }}
        nodesDraggable={isEditMode}
        nodesConnectable={isEditMode}
        edgesReconnectable={isEditMode}
        snapToGrid={isEditMode && !freePositioning}
        snapGrid={[gridSize, gridSize]}
        connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
        onPaneClick={() => setSelectedEdge(null)}
        // Touch device support
        panOnDrag={!isEditMode ? [1, 2] : [1, 2]}
        panOnScroll={true}
        zoomOnPinch={true}
        preventScrolling={true}
        // Use drag-to-connect (default), not click-to-connect
        // connectOnClick can cause conflicts with handle interactions
      >
        {isEditMode && (
          <>
            <Background variant={BackgroundVariant.Dots} gap={gridSize} size={1} color="#6366f1" />
            <Controls />
          </>
        )}

        {/* Progress Line - Shows overall completion across all steps */}
        {!isEditMode && (
          <ViewportPortal>
            <ProgressLine nodes={nodes} steps={steps} selectedServiceType={selectedServiceType} />
          </ViewportPortal>
        )}
      </ReactFlow>

      {/* Legend & Guide */}
      <div className={cn("absolute right-4 z-50 max-w-sm", isEditMode ? "bottom-16" : "bottom-16")}>
        <div className="bg-black/90 text-white rounded-lg overflow-hidden">
          {/* Toggle Button */}
          <button
            onClick={() => setIsLegendOpen(!isLegendOpen)}
            className="w-full px-4 py-2 flex items-center justify-between hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="font-bold text-sm">Legend & Guide</span>
            </div>
            {isLegendOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>

          {/* Content */}
          {isLegendOpen && (
            <div className="px-4 pb-3 text-xs space-y-3">
              {/* Service Types */}
              <div>
                <div className="font-semibold text-blue-300 mb-1.5">Service Types:</div>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { code: "All", label: "All Intervals" },
                    { code: "1Y", label: "1 Year" },
                    { code: "2Y", label: "2 Year" },
                    { code: "3Y", label: "3 Year" },
                    { code: "4Y", label: "4 Year" },
                    { code: "5Y", label: "5 Year" },
                    { code: "6Y", label: "6 Year" },
                    { code: "7Y", label: "7 Year" },
                    { code: "10Y", label: "10 Year" },
                    { code: "12Y", label: "12 Year" },
                  ].map(({ code, label }) => (
                    <div key={code} className="flex items-center gap-1.5">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: SERVICE_TYPE_COLORS[code as keyof typeof SERVICE_TYPE_COLORS] }}
                      />
                      <span className="text-[10px]">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Icons */}
              <div className="border-t border-white/20 pt-2">
                <div className="font-semibold text-amber-300 mb-1.5">Icons:</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-blue-400" />
                    <span>Technician (T1/T2)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    <span>Task Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-3 w-3 text-amber-400" />
                    <span>Has Notes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span>Time Duration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bug className="h-3 w-3 text-red-400" />
                    <span>Report Bug/Issue</span>
                  </div>
                </div>
              </div>

              {/* Edit Mode Guide */}
              {isEditMode && (
                <div className="border-t border-white/20 pt-2">
                  <div className="font-semibold text-green-300 mb-1.5">Edit Mode:</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-blue-400">🔵</span>
                      <span>Blue = Target (incoming)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-green-400">🟢</span>
                      <span>Green = Source (outgoing)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-400">🟡</span>
                      <span>Orange = Resize handles</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      Drag Green → Blue to connect
                    </div>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="border-t border-white/20 pt-2 text-[10px] text-gray-400">
                Steps: {nodes.length} | Connections: {edges.length}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edge style selector - Enhanced menu */}
      {isEditMode && selectedEdge && (
        <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-blue-500 p-4 z-50 min-w-[320px] max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Connection Settings</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedEdge(null)}
              className="h-6 w-6 p-0"
            >
              ✕
            </Button>
          </div>

          {/* Line Shape */}
          <div className="space-y-2 mb-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Line Shape</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={selectedEdge.type === 'smoothstep' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateEdgeStyle(selectedEdge.id, 'smoothstep')}
                className="justify-start gap-2 text-xs"
              >
                <Workflow className="h-3 w-3" />
                Smooth 90°
              </Button>
              <Button
                variant={selectedEdge.type === 'step' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateEdgeStyle(selectedEdge.id, 'step')}
                className="justify-start gap-2 text-xs"
              >
                <TrendingUp className="h-3 w-3" />
                Sharp 90°
              </Button>
              <Button
                variant={selectedEdge.type === 'straight' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateEdgeStyle(selectedEdge.id, 'straight')}
                className="justify-start gap-2 text-xs"
              >
                <Minus className="h-3 w-3" />
                Straight
              </Button>
              <Button
                variant={selectedEdge.type === 'horizontal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateEdgeStyle(selectedEdge.id, 'horizontal')}
                className="justify-start gap-2 text-xs"
              >
                <ArrowRight className="h-3 w-3" />
                Horizontal
              </Button>
              <Button
                variant={selectedEdge.type === 'vertical' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateEdgeStyle(selectedEdge.id, 'vertical')}
                className="justify-start gap-2 text-xs"
              >
                <ArrowRight className="h-3 w-3 rotate-90" />
                Vertical
              </Button>
              <Button
                variant={selectedEdge.type === 'default' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateEdgeStyle(selectedEdge.id, 'default')}
                className="justify-start gap-2 text-xs"
              >
                <Workflow className="h-3 w-3" />
                Bezier
              </Button>
              <Button
                variant={selectedEdge.type === 'simplebezier' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateEdgeStyle(selectedEdge.id, 'simplebezier')}
                className="justify-start gap-2 text-xs col-span-2"
              >
                <Workflow className="h-3 w-3" />
                Simple Bezier
              </Button>
            </div>
          </div>

          {/* Arrow Direction */}
          <div className="space-y-2 mb-4 pt-3 border-t">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Arrow Direction</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={!selectedEdge.markerStart && !selectedEdge.markerEnd ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateEdgeArrows(selectedEdge.id, 'none')}
                className="justify-start gap-2"
              >
                <Minus className="h-4 w-4" />
                No Arrow
              </Button>
              <Button
                variant={!selectedEdge.markerStart && selectedEdge.markerEnd ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateEdgeArrows(selectedEdge.id, 'end')}
                className="justify-start gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                End →
              </Button>
              <Button
                variant={selectedEdge.markerStart && !selectedEdge.markerEnd ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateEdgeArrows(selectedEdge.id, 'start')}
                className="justify-start gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                ← Start
              </Button>
              <Button
                variant={selectedEdge.markerStart && selectedEdge.markerEnd ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateEdgeArrows(selectedEdge.id, 'both')}
                className="justify-start gap-2"
              >
                <ArrowLeftRight className="h-4 w-4" />
                ↔ Both
              </Button>
            </div>
          </div>

          {/* Animation */}
          <div className="space-y-2 mb-4 pt-3 border-t">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Animation</p>
            <Button
              variant={selectedEdge.animated ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleEdgeAnimation(selectedEdge.id)}
              className="w-full justify-start gap-2"
            >
              <Zap className="h-4 w-4" />
              {selectedEdge.animated ? 'Animated (ON)' : 'Animated (OFF)'}
            </Button>
          </div>

          {/* Color */}
          <div className="space-y-2 mb-4 pt-3 border-t">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Color</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { color: '#6366f1', name: 'Blue' },
                { color: '#10b981', name: 'Green' },
                { color: '#ef4444', name: 'Red' },
                { color: '#f59e0b', name: 'Orange' },
                { color: '#8b5cf6', name: 'Purple' },
                { color: '#ec4899', name: 'Pink' },
                { color: '#6b7280', name: 'Gray' },
                { color: '#ffffff', name: 'White' },
              ].map(({ color, name }) => (
                <button
                  key={color}
                  onClick={() => updateEdgeColor(selectedEdge.id, color)}
                  className={cn(
                    "h-8 w-full rounded border-2 transition-all hover:scale-110",
                    selectedEdge.style?.stroke === color ? "ring-2 ring-offset-2 ring-blue-500" : "border-gray-300"
                  )}
                  style={{ backgroundColor: color }}
                  title={name}
                />
              ))}
            </div>
          </div>

          {/* Width */}
          <div className="space-y-2 mb-4 pt-3 border-t">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Line Width</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={selectedEdge.style?.strokeWidth === 1.5 ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateEdgeWidth(selectedEdge.id, 1.5)}
                className="justify-center text-xs"
              >
                Thin
              </Button>
              <Button
                variant={selectedEdge.style?.strokeWidth === 2.5 || !selectedEdge.style?.strokeWidth ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateEdgeWidth(selectedEdge.id, 2.5)}
                className="justify-center text-xs"
              >
                Normal
              </Button>
              <Button
                variant={selectedEdge.style?.strokeWidth === 4 ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateEdgeWidth(selectedEdge.id, 4)}
                className="justify-center text-xs"
              >
                Thick
              </Button>
            </div>
          </div>

          {/* Line Style (NEW) */}
          <div className="space-y-2 mb-4 pt-3 border-t">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Line Style</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={!selectedEdge.style?.strokeDasharray ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateEdgeLineStyle(selectedEdge.id, 'solid')}
                className="justify-center text-xs"
              >
                Solid
              </Button>
              <Button
                variant={selectedEdge.style?.strokeDasharray === '5 5' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateEdgeLineStyle(selectedEdge.id, 'dashed')}
                className="justify-center text-xs"
              >
                Dashed
              </Button>
              <Button
                variant={selectedEdge.style?.strokeDasharray === '2 4' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateEdgeLineStyle(selectedEdge.id, 'dotted')}
                className="justify-center text-xs"
              >
                Dotted
              </Button>
            </div>
          </div>

          {/* Label (NEW) */}
          <div className="space-y-2 mb-4 pt-3 border-t">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Label</p>
            <input
              type="text"
              placeholder="Add label text..."
              defaultValue={selectedEdge.label as string || ''}
              onChange={(e) => updateEdgeLabel(selectedEdge.id, e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          {/* Animation Speed (NEW) - Only show when animated */}
          {selectedEdge.animated && (
            <div className="space-y-2 mb-4 pt-3 border-t">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Animation Speed</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={selectedEdge.style?.animationDuration === '0.5s' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateEdgeAnimationDuration(selectedEdge.id, 0.5)}
                  className="justify-center text-xs"
                >
                  Fast
                </Button>
                <Button
                  variant={!selectedEdge.style?.animationDuration || selectedEdge.style?.animationDuration === '1s' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateEdgeAnimationDuration(selectedEdge.id, 1)}
                  className="justify-center text-xs"
                >
                  Normal
                </Button>
                <Button
                  variant={selectedEdge.style?.animationDuration === '2s' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateEdgeAnimationDuration(selectedEdge.id, 2)}
                  className="justify-center text-xs"
                >
                  Slow
                </Button>
              </div>
            </div>
          )}

          {/* Delete */}
          <div className="pt-3 border-t">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setEdges((eds) => eds.filter(e => e.id !== selectedEdge.id));
                setHasUnsavedChanges(true);
                setSelectedEdge(null);
              }}
              className="w-full gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Connection
            </Button>
          </div>
        </div>
      )}

      {/* Helper text when empty */}
      {steps.length === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10">
          <p className="text-muted-foreground mb-4">No steps yet. Click &quot;Add Step&quot; to begin.</p>
          <Button onClick={onAddStep}>Add First Step</Button>
        </div>
      )}
    </div>
  );
}

// Wrapper component that provides React Flow context
export function FlowchartEditor(props: FlowchartEditorProps) {
  return (
    <ReactFlowProvider>
      <FlowchartEditorInner {...props} />
    </ReactFlowProvider>
  );
}
