"use client"

import { useState, useCallback, useMemo, useEffect, useRef, createContext, useContext } from "react";
import Image from "next/image";
import {
  ReactFlow,
  Node,
  Edge,
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
import { FlowchartStep, FlowchartData, generateStepId, parseServiceTimes, getCumulativeServiceTime } from "@/lib/flowchart-data";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Trash2, Edit, Copy, StickyNote, CheckCircle2, Workflow, ArrowRight, ArrowLeft, ArrowLeftRight, Minus, TrendingUp, Zap, User, Users, ChevronDown, ChevronUp, Info, Bug, Timer, Plus, Maximize2, Lock, Unlock, Expand, Loader2, Pencil, Eye, EyeOff, GitCommit } from "lucide-react";
import { cn } from "@/lib/utils";
import { SERVICE_TYPE_COLORS, getIncludedServiceTypes } from "@/lib/service-colors";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getSelectedTechnicians, getActiveTechnicians, getTechnicianById, Technician } from "@/lib/technicians-data";
import { TechnicianSelectModal } from "@/components/technician-select-modal";
import { TechnicianPairSelectModal } from "@/components/technician-pair-select-modal";
import { OfflineStatusIndicator } from "@/components/offline-status-indicator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useGitCommit } from "@/hooks/use-git-commit";
import { parseSIIReference, SIIReference } from "@/lib/sii-documents";
import { getSectionPage } from "@/lib/sii-page-mapping";
import { PDFViewerDialog } from "./pdf-viewer-dialog";

interface FlowchartEditorProps {
  flowchart: FlowchartData;
  steps: FlowchartStep[];
  onStepsChange: (steps: FlowchartStep[]) => void;
  onFlowchartChange?: (flowchart: FlowchartData) => void;
  onEditStep: (step: FlowchartStep) => void;
  onAddStep: () => void;
  onStepClick?: (step: FlowchartStep) => void;
  zoom: number;
  gridSize?: number;
  isEditMode: boolean;
  onToggleEditMode?: () => void;
  setHasUnsavedChanges: (value: boolean) => void;
  selectedServiceType?: string;
  onServiceTypeChange?: (serviceType: string) => void;
  initialEdges?: Edge[];
  onEdgesChange?: (edges: Edge[]) => void;
  hideCompletedSteps?: boolean;
  onToggleHideCompleted?: () => void;
  onRealignToGrid?: () => void;
  freePositioning?: boolean;
  layoutMode?: 'topdown' | 'centered';
  activeStepIds?: string[];
  onOpenTechnicianPairModal?: () => void;
  selectedT1?: Technician | null;
  selectedT2?: Technician | null;
  testCompletionPercent?: number;
  onTestCompletionChange?: (percent: number) => void;
  onTestCompletion?: () => void;
  onClearCache?: () => void;
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

// Create context for active work handler (to avoid React Flow callback issues)
const ActiveWorkContext = createContext<{
  activeWorkSteps: Set<string>;
  handleToggleActiveWork: (stepId: string) => void;
  highlightActiveWorkMode: boolean;
} | null>(null);

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
  isActive?: boolean;
  isActiveWork?: boolean;
  onOpenTechnicianPairModal?: () => void;
  selectedT1?: Technician | null;
  selectedT2?: Technician | null;
  [key: string]: unknown; // Index signature for React Flow compatibility
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

// Custom node component for flowchart steps
interface StepNodeProps extends NodeProps {
  data: StepNodeData;
}

function StepNode({ data, id, positionAbsoluteX, positionAbsoluteY, width, height }: StepNodeProps) {
  const { step, onEdit, onDelete, onDuplicate, onClick, onUpdateStep, isEditMode, selectedServiceType, gridSize, isActive, isActiveWork, onOpenTechnicianPairModal, selectedT1, selectedT2 } = data;

  // Get active work handler and highlight mode from context (avoids React Flow callback issues)
  const activeWorkContext = useContext(ActiveWorkContext);
  const handleToggleActiveWork = activeWorkContext?.handleToggleActiveWork;
  const highlightActiveWorkMode = activeWorkContext?.highlightActiveWorkMode || false;

  // OVERRIDE: Get isActiveWork from context instead of data to ensure it stays updated
  const isActiveWorkFromContext = activeWorkContext?.activeWorkSteps.has(id) || false;

  // Count ALL tasks - MUST be declared before shouldDim
  const completedTasks = step.tasks.filter(t => t.completed).length;
  const totalTasks = step.tasks.length;
  const isComplete = completedTasks === totalTasks && totalTasks > 0;

  // Check if this node should be dimmed (in highlight mode but not active work)
  const shouldDim = highlightActiveWorkMode && !isActiveWorkFromContext && !isComplete;
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingStepName, setEditingStepName] = useState(false);

  // Get selected technicians directly from localStorage (same as info-dropdown)
  const { t1, t2 } = getSelectedTechnicians();

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
    <div
      className="group relative w-full h-full transition-opacity duration-300"
      style={{ opacity: shouldDim ? 0.25 : 1 }}
      onContextMenu={(e) => {
        // Prevent default context menu (right-click menu) on step boxes
        e.preventDefault();
        e.stopPropagation();
      }}
    >
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

      {/* Active Work Label - Above the box (outside Card to avoid overflow clipping) */}
      {/* Only show if active work AND not complete (complete steps turn green and don't need active work label) */}
      {isActiveWorkFromContext && !isComplete && (
        <div className="absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none" style={{ top: '-43px' }}>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 px-3 py-1 rounded shadow-md">
            Active Work
          </span>
        </div>
      )}

      <Card
        className={cn(
          "relative p-4 w-full h-full hover:shadow-lg transition-all flex flex-col overflow-auto",
          step.id === "step-4y-bolts"
            ? "border-yellow-500 border-[3px]"
            : isComplete
              ? "border-green-500 border-[3px] shadow-green-500/50 shadow-xl"
              : isActiveWorkFromContext
                ? "ring-4 ring-blue-500 ring-offset-2 shadow-2xl shadow-blue-500/30 border-blue-500 border-[4px]"
                : isActive
                  ? "border-blue-500 border-[4px] shadow-xl shadow-blue-500/50 ring-4 ring-blue-300/50"
                  : "border-gray-700/50 border-2"
        )}
        style={{
          backgroundColor: isComplete
            ? `rgba(34, 197, 94, 0.1)`
            : isActiveWorkFromContext
              ? `rgba(59, 130, 246, 0.2)`
              : isActive
                ? `rgba(59, 130, 246, 0.1)`
                : `${step.color}15`,
          ...(isComplete ? {} : isActiveWorkFromContext ? {
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.4), 0 0 60px rgba(59, 130, 246, 0.2)',
          } : isActive ? {
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: '4px',
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(59, 130, 246, 0.3)',
          } : {})
        }}
      >
      {/* Active Work Toggle - Top right corner (show for all steps, even completed) */}
      {!isEditMode && (
        <button
          data-active-work-button="true"
          onClick={(e) => {
            console.log('🔵 Active Work button clicked! step.id:', step.id);
            console.log('🔵 handleToggleActiveWork exists?', typeof handleToggleActiveWork);
            e.stopPropagation();
            e.preventDefault();
            if (handleToggleActiveWork) {
              console.log('🔵 Calling handleToggleActiveWork...');
              handleToggleActiveWork(step.id);
            } else {
              console.error('🔵 handleToggleActiveWork is undefined!');
            }
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          className={cn(
            "absolute top-2 right-2 z-20 rounded-md transition-all duration-200",
            "hover:scale-110 active:scale-95",
            "flex items-center justify-center",
            isActiveWorkFromContext
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50"
              : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-400 hover:text-white"
          )}
          style={{
            width: '28px',
            height: '28px',
            padding: '4px'
          }}
          title={isActiveWorkFromContext ? "Remove from Active Work" : "Mark as Active Work"}
        >
          {isActiveWorkFromContext ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <div className="w-3 h-3 border-2 border-current rounded-sm" />
          )}
        </button>
      )}

        {/* Step Label - Center aligned at top with checkmark if complete */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold flex items-center gap-1">
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
              className="bg-white dark:bg-gray-700 px-2 py-0.5 rounded border border-blue-500 text-[10px] font-bold text-foreground w-24"
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

        {/* Technician Badge - Centered below Step label - Click to assign T1/T2 for job */}
        <div className="flex justify-center mb-2 mt-5 flex-shrink-0">
          <div className="flex gap-1 items-center relative">
            {step.technician === "both" ? (
              <>
                <div
                  className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  onClick={() => onOpenTechnicianPairModal?.()}
                  title="Click to assign T1 and T2 for the job"
                >
                  <User className="h-3 w-3" />
                  T1{t1?.initials ? `: ${t1.initials}` : ''}
                </div>
                <div
                  className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  onClick={() => onOpenTechnicianPairModal?.()}
                  title="Click to assign T1 and T2 for the job"
                >
                  <User className="h-3 w-3" />
                  T2{t2?.initials ? `: ${t2.initials}` : ''}
                </div>
              </>
            ) : (
              <div
                className={cn(
                  "text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors",
                  step.technician === "T1" ? "bg-blue-500 hover:bg-blue-600" : "bg-purple-500 hover:bg-purple-600"
                )}
                onClick={() => onOpenTechnicianPairModal?.()}
                title="Click to assign T1 and T2 for the job"
              >
                <User className="h-3 w-3" />
                {step.technician === "T1"
                  ? `T1${t1?.initials ? `: ${t1.initials}` : ''}`
                  : `T2${t2?.initials ? `: ${t2.initials}` : ''}`}
              </div>
            )}

            {/* T3 Badge - Only show if T3 is assigned for this specific step */}
            {step.t3Id && (
              <div
                className="bg-amber-500 text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"
                title="T3 tekniker för detta steg"
              >
                <User className="h-3 w-3" />
                T3: {step.t3Initials || getTechnicianById(step.t3Id)?.initials || ''}
              </div>
            )}
          </div>
        </div>

        {/* Step Content - Task list with scroll if needed */}
        <div className="flex-1 flex flex-col min-h-0 mt-2">
          {/* Task list - compact format - scrollable if overflow */}
          <div
            className="flex-1 overflow-y-auto mb-3 pr-2 scrollbar-thin flex flex-col"
            style={{ gap: `${step.displaySettings?.taskSpacing ?? 0.5}rem` }}
            onWheel={(e) => {
              // Stop propagation to prevent React Flow from zooming
              e.stopPropagation();
            }}
          >
            {step.tasks.map((task) => {
              // Check if task is indented (sub-task)
              const isIndented = task.isIndented || false;

              // Check if task matches service type filter (for strike-through styling)
              const serviceType = task.serviceType || "All";
              const taskServiceType = task.serviceType || "All";
              let isTaskIrrelevant = false;

              if (!isEditMode && selectedServiceType && selectedServiceType !== "all" && selectedServiceType !== "") {
                const includedTypes = getIncludedServiceTypes(selectedServiceType);
                // Mark as irrelevant if it doesn't match the selected service type
                isTaskIrrelevant = !includedTypes.includes(taskServiceType);
              }

              // Get service type color - explicit check for "All" or missing serviceType to ensure purple color
              const isExtTask = !task.serviceType || task.serviceType === "All";
              const badgeColor = isExtTask
                ? "#A855F7" // Purple for Ext
                : (SERVICE_TYPE_COLORS[serviceType as keyof typeof SERVICE_TYPE_COLORS] || SERVICE_TYPE_COLORS.default);

              // Split reference number and description
              // Matches patterns like: "13.5.1.Lift", "13.5.1 Lift", "3.5.1-4.71 ResQ", "6.5.2.11 Visual"
              // Note: \.? matches optional trailing dot but doesn't include it in capture group
              const refMatch = task.description.match(/^(\d+(?:\.\d+)*(?:-\d+(?:\.\d+)*)*)\.?\s*(.+)$/);
              const hasRefNumber = refMatch !== null;
              const refNumber = refMatch ? refMatch[1] : '';
              const description = refMatch ? refMatch[2] : task.description;

              // Get display settings with defaults
              const displaySettings = {
                fontSize: step.displaySettings?.fontSize ?? 11,
                taskSpacing: step.displaySettings?.taskSpacing ?? 0.5,
                referenceColumnWidth: step.displaySettings?.referenceColumnWidth ?? 0 // 0 = auto
              };

              return (
                <div
                  key={task.id}
                  className={cn(
                    "grid items-center py-0.5 pl-0 pr-2 rounded-sm overflow-hidden group/task",
                    isIndented && "ml-6 text-muted-foreground"
                  )}
                  style={{
                    backgroundColor: !isIndented ? `${badgeColor}10` : 'transparent',
                    gap: `${displaySettings.taskSpacing}rem`,
                    fontSize: `${displaySettings.fontSize}px`,
                    gridTemplateColumns: displaySettings.referenceColumnWidth === 0
                      ? 'auto auto 1fr auto'
                      : `auto ${displaySettings.referenceColumnWidth}px 1fr auto`
                  }}
                >
                  {!isIndented && (
                    isEditMode ? (
                      <Select
                        value={serviceType}
                        onValueChange={(value) => {
                          const updatedStep = {
                            ...step,
                            tasks: step.tasks.map(t =>
                              t.id === task.id ? { ...t, serviceType: value } : t
                            )
                          };
                          onUpdateStep(updatedStep);
                        }}
                      >
                        <SelectTrigger
                          className="h-6 w-[50px] px-1.5 py-0 text-[9px] font-mono font-bold text-white border-0 flex-shrink-0"
                          style={{ backgroundColor: badgeColor }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="min-w-[100px]">
                          <SelectItem value="1Y" className="text-xs font-mono font-bold">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-5 rounded" style={{ backgroundColor: SERVICE_TYPE_COLORS["1Y"] }}></div>
                              <span>1Y</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="2Y" className="text-xs font-mono font-bold">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-5 rounded" style={{ backgroundColor: SERVICE_TYPE_COLORS["2Y"] }}></div>
                              <span>2Y</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="3Y" className="text-xs font-mono font-bold">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-5 rounded" style={{ backgroundColor: SERVICE_TYPE_COLORS["3Y"] }}></div>
                              <span>3Y</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="4Y" className="text-xs font-mono font-bold">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-5 rounded" style={{ backgroundColor: SERVICE_TYPE_COLORS["4Y"] }}></div>
                              <span>4Y</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="5Y" className="text-xs font-mono font-bold">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-5 rounded" style={{ backgroundColor: SERVICE_TYPE_COLORS["5Y"] }}></div>
                              <span>5Y</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="6Y" className="text-xs font-mono font-bold">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-5 rounded" style={{ backgroundColor: SERVICE_TYPE_COLORS["6Y"] }}></div>
                              <span>6Y</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="7Y" className="text-xs font-mono font-bold">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-5 rounded" style={{ backgroundColor: SERVICE_TYPE_COLORS["7Y"] }}></div>
                              <span>7Y</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="10Y" className="text-xs font-mono font-bold">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-5 rounded" style={{ backgroundColor: SERVICE_TYPE_COLORS["10Y"] }}></div>
                              <span>10Y</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="12Y" className="text-xs font-mono font-bold">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-5 rounded" style={{ backgroundColor: SERVICE_TYPE_COLORS["12Y"] }}></div>
                              <span>12Y</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="All" className="text-xs font-mono font-bold">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-5 rounded" style={{ backgroundColor: SERVICE_TYPE_COLORS.All }}></div>
                              <span>Ext</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div
                        style={{ backgroundColor: badgeColor }}
                        className="px-2 py-1 flex items-center justify-center flex-shrink-0 self-stretch w-[42px]"
                      >
                        <span className="text-[9px] font-mono font-bold text-white">
                          {serviceType === "All" ? "Ext" : serviceType}
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
                        <span className="font-semibold text-white font-mono cursor-text hover:bg-blue-500/20 rounded" onClick={(e) => {
                          e.stopPropagation();
                          setEditingTaskId(task.id);
                        }}>
                          {refNumber}
                        </span>
                        <span className={cn("font-semibold text-white cursor-text hover:bg-blue-500/20 rounded", (task.completed || isTaskIrrelevant) && "line-through text-gray-400")} onClick={(e) => {
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
                            (task.completed || isTaskIrrelevant) ? "line-through text-gray-400" : "text-white",
                            "cursor-text hover:bg-blue-500/20 rounded"
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
                        <span className={cn("font-semibold text-white line-clamp-1", (task.completed || isTaskIrrelevant) && "line-through text-gray-400")}>
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
                            (task.completed || isTaskIrrelevant) ? "line-through text-gray-400" : "text-white"
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
            {/* Service Time Summary */}
            {step.duration && (() => {
              const serviceTimes = parseServiceTimes(step.duration);
              const hasAdditionalTimes = Object.entries(serviceTimes).some(([key, minutes]) => key !== "1Y" && minutes > 0);

              // Helper function to format time compactly
              const formatTime = (totalMinutes: number) => {
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
                if (hours > 0) return `${hours}h`;
                return `${minutes}m`;
              };

              return (
                <div className="space-y-1.5">
                  {/* Base Time (1Y) */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-400">Base (1Y):</span>
                      <span className="text-xs font-bold text-gray-200">
                        {formatTime(serviceTimes["1Y"])}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {totalNotesCount > 0 && (
                        <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 rounded-md px-2 py-0.5">
                          <StickyNote className="h-3 w-3 text-amber-400" />
                          <span className="text-xs font-semibold text-amber-300">{totalNotesCount}</span>
                        </div>
                      )}
                      {isComplete && (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                          {step.completedByInitials && (
                            <div className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold text-white",
                              step.technician === "T1" ? "bg-blue-500" : "bg-purple-500"
                            )}>
                              {step.completedByInitials}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Additional Times */}
                  {hasAdditionalTimes && (
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-xs text-gray-400">Additional:</span>
                      {Object.entries(serviceTimes)
                        .filter(([key, minutes]) => key !== "1Y" && minutes > 0)
                        .map(([serviceType, minutes]) => (
                          <div
                            key={serviceType}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-white text-xs font-medium"
                            style={{ backgroundColor: SERVICE_TYPE_COLORS[serviceType as keyof typeof SERVICE_TYPE_COLORS] }}
                          >
                            <span>{serviceType}:</span>
                            <span>+{formatTime(minutes)}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })()}

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

// Info Card Node Data Interface
interface InfoCardNodeData {
  flowchart: FlowchartData;
  onUpdateFlowchart: (updates: Partial<FlowchartData>) => void;
  isEditMode: boolean;
  selectedServiceType?: string;
  onServiceTypeChange?: (serviceType: string) => void;
  [key: string]: unknown; // Index signature for React Flow compatibility
}

// Custom node component for info card
interface InfoCardNodeProps extends NodeProps {
  data: InfoCardNodeData;
}

function InfoCardNode({ data }: InfoCardNodeProps) {
  const { flowchart, onUpdateFlowchart, isEditMode, selectedServiceType = "all", onServiceTypeChange } = data;
  const [editingModel, setEditingModel] = useState(false);
  const [editingTechnicians, setEditingTechnicians] = useState(false);
  const [editingTotalMinutes, setEditingTotalMinutes] = useState(false);


  // Format minutes to H:M format with minutes in parentheses (e.g., "38:00h (2280m)")
  const formatTimeWithMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}h (${minutes}m)`;
  };

  // Calculate duration from totalMinutes and number of technicians
  const durationMinutes = Math.round(flowchart.totalMinutes / flowchart.technicians);
  const totalTimeFormatted = formatTimeWithMinutes(flowchart.totalMinutes);
  const downtimeFormatted = formatTimeWithMinutes(durationMinutes);

  return (
    <div className="group relative" style={{ pointerEvents: 'all' }}>
      <Card className="w-[350px] shadow-lg border-2">
        <CardHeader className="pb-3 bg-blue-600">
          {isEditMode && editingModel ? (
            <input
              type="text"
              defaultValue={flowchart.model}
              autoFocus
              onBlur={(e) => {
                const newModel = e.target.value.trim();
                if (newModel && newModel !== flowchart.model) {
                  onUpdateFlowchart({ model: newModel });
                }
                setEditingModel(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
                if (e.key === 'Escape') {
                  setEditingModel(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white px-2 py-1 rounded border border-blue-300 text-base font-bold text-gray-900 w-full"
            />
          ) : (
            <CardTitle
              className={cn(
                "text-base font-bold text-white",
                isEditMode && "cursor-pointer hover:bg-blue-700 rounded px-2 py-1"
              )}
              onClick={() => isEditMode && setEditingModel(true)}
            >
              {flowchart.model}
            </CardTitle>
          )}
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {/* Info Table */}
          <div className="space-y-2 text-sm">
            <div className="border-b pb-2">
              <div className="flex items-center gap-2 font-semibold mb-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span>No. of Technicians</span>
              </div>
              <div className="flex items-center gap-2 ml-6">
                {isEditMode && editingTechnicians ? (
                  <input
                    type="number"
                    defaultValue={flowchart.technicians}
                    autoFocus
                    min="1"
                    max="10"
                    onBlur={(e) => {
                      const newTechnicians = parseInt(e.target.value);
                      if (!isNaN(newTechnicians) && newTechnicians > 0 && newTechnicians !== flowchart.technicians) {
                        onUpdateFlowchart({ technicians: newTechnicians });
                      }
                      setEditingTechnicians(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                      if (e.key === 'Escape') {
                        setEditingTechnicians(false);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white px-2 py-1 rounded border border-blue-500 text-sm font-bold text-gray-900 w-20"
                  />
                ) : flowchart.technicians === 2 ? (
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      isEditMode && "cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5"
                    )}
                    onClick={() => isEditMode && setEditingTechnicians(true)}
                  >
                    <div className="flex items-center gap-1 bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                      <Users className="h-3 w-3" />
                      <span>T1</span>
                    </div>
                    <div className="flex items-center gap-1 bg-purple-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                      <Users className="h-3 w-3" />
                      <span>T2</span>
                    </div>
                  </div>
                ) : (
                  <span
                    className={cn(
                      "font-bold",
                      isEditMode && "cursor-pointer hover:bg-gray-100 rounded px-2 py-1"
                    )}
                    onClick={() => isEditMode && setEditingTechnicians(true)}
                  >
                    {flowchart.technicians}
                  </span>
                )}
              </div>
            </div>

            <div className="border-b pb-2">
              <div className="flex items-center gap-2 font-semibold mb-1">
                <Timer className="h-4 w-4 text-green-600" />
                <span className="text-xs">Total time for all techs in turbine</span>
              </div>
              {isEditMode && editingTotalMinutes ? (
                <input
                  type="number"
                  defaultValue={flowchart.totalMinutes}
                  autoFocus
                  min="1"
                  onBlur={(e) => {
                    const newTotalMinutes = parseInt(e.target.value);
                    if (!isNaN(newTotalMinutes) && newTotalMinutes > 0 && newTotalMinutes !== flowchart.totalMinutes) {
                      onUpdateFlowchart({ totalMinutes: newTotalMinutes });
                    }
                    setEditingTotalMinutes(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                    if (e.key === 'Escape') {
                      setEditingTotalMinutes(false);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white px-2 py-1 rounded border border-blue-500 text-sm font-bold text-gray-900 w-full ml-6"
                />
              ) : (
                <div
                  className={cn(
                    "font-bold ml-6 text-sm",
                    isEditMode && "cursor-pointer hover:bg-gray-100 rounded px-2 py-1 inline-block"
                  )}
                  onClick={() => isEditMode && setEditingTotalMinutes(true)}
                >
                  {totalTimeFormatted}
                </div>
              )}
            </div>

            <div className="border-b pb-2">
              <div className="flex items-center gap-2 font-semibold mb-1">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-xs">Total downtime of turbine</span>
              </div>
              <div className="font-bold ml-6 text-sm">{downtimeFormatted}</div>
            </div>

            {/* Actual Time Tracking */}
            <div>
              <div className="flex items-center gap-2 font-semibold mb-1">
                <Zap className="h-4 w-4 text-yellow-600" />
                <span className="text-xs">Actual Time Logged</span>
              </div>
              <div className="ml-6">
                <div className="font-bold text-sm">
                  {(() => {
                    // Calculate total actual time from all tasks
                    const totalActualMinutes = flowchart.steps.reduce((sum, step) => {
                      return sum + step.tasks.reduce((taskSum, task) =>
                        taskSum + (task.actualTimeMinutes || 0), 0
                      );
                    }, 0);

                    // Calculate difference from target
                    const targetMinutes = flowchart.totalMinutes;
                    const differenceMinutes = totalActualMinutes - targetMinutes;
                    const isAhead = differenceMinutes < 0; // Negative means ahead (under target)
                    const absDifferenceMinutes = Math.abs(differenceMinutes);

                    return (
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          totalActualMinutes > 0 && targetMinutes > 0
                            ? (isAhead ? "text-green-600" : "text-red-600")
                            : "text-gray-600"
                        )}>
                          {formatTimeWithMinutes(totalActualMinutes)}
                        </span>
                        {totalActualMinutes > 0 && targetMinutes > 0 && differenceMinutes !== 0 && (
                          <span className={cn(
                            "text-xs font-bold",
                            isAhead ? "text-green-600" : "text-red-600"
                          )}>
                            ({isAhead ? "-" : "+"}{Math.floor(absDifferenceMinutes / 60)}h {absDifferenceMinutes % 60}m)
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Service Type Legend / Filter */}
          <div className="pt-3 border-t nodrag">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600">Service Filter</span>
              {selectedServiceType !== "all" && selectedServiceType !== "" && onServiceTypeChange && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onServiceTypeChange("all");
                  }}
                  className="h-6 px-2 text-xs nodrag"
                >
                  Reset
                </Button>
              )}
            </div>
            <div className="grid grid-cols-5 gap-2 nodrag">
              {/* First row: 1Y/12Y, 2Y, 3Y, 4Y, 5Y */}
              {["1Y", "2Y", "3Y", "4Y", "5Y"].map((serviceType) => {
                const isActive = selectedServiceType === serviceType;
                return (
                  <div
                    key={serviceType}
                    className={cn(
                      "flex items-center justify-center px-2 py-1.5 rounded font-bold text-xs transition-all nodrag",
                      onServiceTypeChange && "cursor-pointer hover:scale-105 hover:shadow-md",
                      isActive && "ring-4 ring-blue-500 ring-offset-2 scale-105"
                    )}
                    style={{
                      backgroundColor: SERVICE_TYPE_COLORS[serviceType as keyof typeof SERVICE_TYPE_COLORS],
                      color: "white"
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onServiceTypeChange?.(serviceType);
                    }}
                  >
                    {serviceType === "1Y" ? "1Y/12Y" : serviceType}
                  </div>
                );
              })}
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2 nodrag">
              {/* Second row: 6Y, 7Y, 10Y, External */}
              {[
                { code: "6Y", label: "6Y", textColor: "white" },
                { code: "7Y", label: "7Y", textColor: "black" },
                { code: "10Y", label: "10Y", textColor: "black" },
                { code: "All", label: "External", textColor: "white" }
              ].map(({ code, label, textColor }) => {
                const isActive = selectedServiceType === code;
                return (
                  <div
                    key={code}
                    className={cn(
                      "flex items-center justify-center px-2 py-1.5 rounded font-bold text-xs transition-all nodrag",
                      onServiceTypeChange && "cursor-pointer hover:scale-105 hover:shadow-md",
                      isActive && "ring-4 ring-blue-500 ring-offset-2 scale-105"
                    )}
                    style={{
                      backgroundColor: SERVICE_TYPE_COLORS[code as keyof typeof SERVICE_TYPE_COLORS],
                      color: textColor
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onServiceTypeChange?.(code);
                    }}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Logo node component - displays Flowy logo (draggable in edit mode)
interface LogoNodeData extends Record<string, unknown> {
  isEditMode: boolean;
}

interface LogoNodeProps extends NodeProps {
  data: LogoNodeData;
}

function LogoNode({ data }: LogoNodeProps) {
  const { isEditMode } = data;

  return (
    <div
      className="relative w-full h-full flex items-center justify-center pointer-events-auto"
      onContextMenu={(e) => {
        // Prevent default context menu (right-click menu) on logo
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="relative w-full h-full flex items-center justify-center p-6">
        <div className={`hover:scale-105 transition-transform duration-500 ${isEditMode ? 'cursor-move' : 'cursor-pointer'}`}>
          <Image
            src="/brand/flowy-dev-mode2.png"
            alt="Flowy Logo"
            width={300}
            height={150}
            className="w-full h-auto drop-shadow-2xl opacity-80"
            priority
          />
        </div>
      </div>
      {isEditMode && (
        <div className="absolute top-2 right-2 bg-blue-500/80 text-white text-xs px-2 py-1 rounded">
          Logo (Draggable)
        </div>
      )}
    </div>
  );
}

// Commit hash node component (draggable in edit mode)
interface CommitNodeData extends Record<string, unknown> {
  isEditMode: boolean;
}

interface CommitNodeProps extends NodeProps {
  data: CommitNodeData;
}

function CommitNode({ data }: CommitNodeProps) {
  const { isEditMode } = data;
  const [isOpen, setIsOpen] = useState(false);
  const { latestCommit: latest, allCommits, loading, error } = useGitCommit({ refreshInterval: 30000 });

  const commits = allCommits;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className={`relative opacity-30 hover:opacity-100 transition-opacity duration-300 group pointer-events-auto ${isEditMode ? 'cursor-move' : 'cursor-pointer'}`}>
          <div className="flex items-center gap-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${error ? 'bg-red-400' : loading ? 'bg-yellow-400' : 'bg-green-400'} animate-pulse`} />
            <p className="text-[10px] text-slate-400 font-mono">
              {error ? 'Error' : loading ? 'Loading...' : latest?.hash || 'N/A'}
            </p>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            <p className="text-[10px] text-slate-500 font-mono">
              {error ? 'Failed to load' : loading ? '' : latest?.date || ''}
            </p>
          </div>
          {isEditMode && (
            <div className="absolute -top-6 left-0 bg-green-500/80 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">
              Commit Hash (Draggable)
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[500px] max-h-[70vh] overflow-y-auto p-3 bg-slate-900/95 backdrop-blur-sm border-slate-700"
        align="start"
        side="top"
        sideOffset={5}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700">
            <GitCommit className="h-4 w-4 text-green-400" />
            <h3 className="text-sm font-semibold text-white">Recent Commits</h3>
            {loading && <Loader2 className="h-3 w-3 animate-spin text-slate-400" />}
          </div>

          {commits.length === 0 && !loading && (
            <p className="text-xs text-slate-400">No commits found</p>
          )}

          {commits.map((commit, index) => (
            <div
              key={commit.hash}
              className={cn(
                "p-2 rounded-md transition-colors hover:bg-slate-800/50",
                index === 0 && "bg-green-900/20 border border-green-700/30"
              )}
            >
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    index === 0 ? "bg-green-400 animate-pulse" : "bg-slate-500"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-xs font-mono text-green-400">{commit.hash}</code>
                    <span className="text-[10px] text-slate-500">{commit.relativeTime}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{commit.message}</p>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">{commit.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
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
  flowchart,
  steps,
  onStepsChange,
  onFlowchartChange,
  onEditStep,
  onAddStep,
  onStepClick,
  zoom,
  gridSize = GRID_SIZE,
  isEditMode,
  onToggleEditMode,
  setHasUnsavedChanges,
  selectedServiceType,
  onServiceTypeChange,
  initialEdges = [],
  onEdgesChange: onEdgesChangeProp,
  hideCompletedSteps = false,
  onToggleHideCompleted,
  onRealignToGrid,
  freePositioning = false,
  layoutMode = 'centered',
  activeStepIds = [],
  onOpenTechnicianPairModal,
  selectedT1,
  selectedT2,
  testCompletionPercent = 0,
  onTestCompletionChange,
  onTestCompletion,
  onClearCache
}: FlowchartEditorProps) {
  // Get React Flow instance to access fitView and zoom functions
  const { fitView, zoomIn, zoomOut, setCenter, getNode } = useReactFlow();

  // Filter steps based on hideCompletedSteps and selectedServiceType
  const displayedSteps = useMemo(() => {
    let filteredSteps = steps;

    // Note: We no longer filter steps by service type - instead we use strike-through styling
    // on irrelevant tasks within the step rendering

    // Filter by completion status
    if (hideCompletedSteps && !isEditMode) {
      filteredSteps = filteredSteps.filter(step => {
        // Count ALL tasks
        const completedTasks = step.tasks.filter(t => t.completed).length;
        const totalTasks = step.tasks.length;
        const isComplete = completedTasks === totalTasks && totalTasks > 0;

        return !isComplete; // Only show incomplete steps
      });
    }

    return filteredSteps;
  }, [steps, hideCompletedSteps, isEditMode, selectedServiceType]);

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

  const handleUpdateFlowchart = useCallback((updates: Partial<FlowchartData>) => {
    const updatedFlowchart = { ...flowchart, ...updates };
    if (onFlowchartChange) {
      onFlowchartChange(updatedFlowchart);
    }
    setHasUnsavedChanges(true);
  }, [flowchart, onFlowchartChange, setHasUnsavedChanges]);

  // Active work steps (multiple steps can be active at once) - MUST be before useMemo
  const [activeWorkSteps, setActiveWorkSteps] = useState<Set<string>>(new Set());

  // Highlight Active Work mode - dims non-active work steps
  const [highlightActiveWorkMode, setHighlightActiveWorkMode] = useState(false);

  // Step navigation state
  const [showStepNavigation, setShowStepNavigation] = useState(false);
  const [stepNavMode, setStepNavMode] = useState<'all' | 'active' | 'remaining'>('all');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showStepInfoModal, setShowStepInfoModal] = useState(false);
  const [stepInfoModalPosition, setStepInfoModalPosition] = useState({ x: 0, y: 0 });
  const [pageNumberInput, setPageNumberInput] = useState('');

  // PDF Viewer state (for direct PDF opening from navigation modal)
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState('');
  const [selectedPdfTitle, setSelectedPdfTitle] = useState('');
  const [selectedPdfPage, setSelectedPdfPage] = useState(1);

  // Get filtered steps based on navigation mode
  const navigationSteps = useMemo(() => {
    if (stepNavMode === 'all') {
      return displayedSteps;
    } else if (stepNavMode === 'active') {
      return displayedSteps.filter(step => activeWorkSteps.has(step.id));
    } else {
      // remaining = incomplete steps
      return displayedSteps.filter(step => {
        const completedTasks = step.tasks.filter(t => t.completed).length;
        const totalTasks = step.tasks.length;
        return completedTasks < totalTasks;
      });
    }
  }, [displayedSteps, stepNavMode, activeWorkSteps]);

  // Handler for long-press to toggle active work state
  const handleToggleActiveWork = useCallback((stepId: string) => {
    console.log('🟢 handleToggleActiveWork called with stepId:', stepId);

    // ALLOW toggling active work even for completed steps
    // This is useful when using test completion slider
    setActiveWorkSteps(prev => {
      const newSet = new Set(prev);
      console.log('🟢 Current activeWorkSteps:', Array.from(prev));
      if (newSet.has(stepId)) {
        console.log('🟢 Removing stepId from active work');
        newSet.delete(stepId);
      } else {
        console.log('🟢 Adding stepId to active work');
        newSet.add(stepId);
      }
      console.log('🟢 New activeWorkSteps:', Array.from(newSet));
      return newSet;
    });
  }, []);

  // Automatically remove completed steps from activeWorkSteps
  // DISABLED: This was causing issues with test completion slider
  // Let users manually remove steps from active work instead
  // useEffect(() => {
  //   setActiveWorkSteps(prev => {
  //     const newSet = new Set(prev);
  //     let hasChanges = false;

  //     // Check each step in activeWorkSteps
  //     prev.forEach(stepId => {
  //       const step = displayedSteps.find(s => s.id === stepId);
  //       if (step) {
  //         const completedTasks = step.tasks.filter(t => t.completed).length;
  //         const totalTasks = step.tasks.length;
  //         const isComplete = completedTasks === totalTasks && totalTasks > 0;

  //         if (isComplete) {
  //           console.log('🟢 Auto-removing completed step from active work:', stepId);
  //           newSet.delete(stepId);
  //           hasChanges = true;
  //         }
  //       }
  //     });

  //     return hasChanges ? newSet : prev;
  //   });
  // }, [displayedSteps]);

  // Convert FlowchartStep[] to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    const stepNodes: Node<StepNodeData>[] = displayedSteps.map(step => {
      // Standard dimensions: 370px width
      // Use custom height if defined, otherwise use default based on task count
      const totalTasks = step.tasks.length;
      const initialHeight = CUSTOM_STEP_HEIGHTS[step.id] ?? (totalTasks > 4 ? 450 : 350);
      const initialWidth = 370;

      const isActive = activeStepIds.includes(step.id);

      // Add a version key to force re-render when technicians change
      const techVersion = `${selectedT1?.id || 'none'}-${selectedT2?.id || 'none'}`;

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
          isActive,
          isActiveWork: activeWorkSteps.has(step.id),
          onOpenTechnicianPairModal,
          selectedT1,
          selectedT2,
          techVersion, // Force re-render key
        },
        draggable: isEditMode,
      };
    });

    // Add logo and commit hash nodes (draggable in edit mode)
    // Logo positioned to the left of Step 1 (Step 1 is at x: 1*gridSize = 30, y: 2*gridSize = 60)
    const logoNode: Node<LogoNodeData> = {
      id: 'flowy-logo',
      type: 'logoNode',
      position: { x: -350, y: 20 },
      style: { width: 450, height: 300 },  // 50% större (från 300x200)
      data: { isEditMode },
      draggable: isEditMode,
      selectable: isEditMode,
      connectable: false,
    };

    // Commit hash positioned precisely below the PREVIEW badge
    const commitNode: Node<CommitNodeData> = {
      id: 'commit-hash',
      type: 'commitNode',
      position: { x: -125, y: 215 },  // 5px under PREVIEW-badgen
      style: { width: 120, height: 40 },
      data: { isEditMode },
      draggable: isEditMode,
      selectable: isEditMode,
      connectable: false,
    };

    // Info card is now a dropdown at the top - no longer a node in the flowchart
    return [logoNode, commitNode, ...stepNodes];
  }, [displayedSteps, gridSize, isEditMode, selectedServiceType, handleDelete, handleDuplicate, handleUpdateStep, onEditStep, onStepClick, flowchart, handleUpdateFlowchart, activeStepIds, onOpenTechnicianPairModal, selectedT1, selectedT2, activeWorkSteps, handleToggleActiveWork]);

  // Initialize edges (connections) - load from props
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const hasLoadedInitialEdges = useRef(false);
  const hasFitViewOnMount = useRef(false);  // Track if fitView has been called
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  // NOW we can use useUpdateNodeInternals because we're inside ReactFlowProvider
  const updateNodeInternals = useUpdateNodeInternals();

  // Update nodes when initialNodes changes (e.g., when technicians change, activeWorkSteps, etc.)
  // initialNodes already includes selectedT1 and selectedT2 in the data, so this is sufficient
  useEffect(() => {
    console.log('🟣 useEffect triggered - updating nodes from initialNodes');
    console.log('🟣 activeWorkSteps:', Array.from(activeWorkSteps));

    // Log a sample node to see if onLongPress is there
    const sampleNode = initialNodes.find(n => n.type === 'stepNode');
    if (sampleNode) {
      console.log('🟣 Sample node data.onLongPress:', typeof sampleNode.data.onLongPress);
      console.log('🟣 Sample node data.isActiveWork:', sampleNode.data.isActiveWork);
    }

    // Create completely new array reference and new object references for each node
    // to force React Flow to recognize the change
    const timestamp = Date.now();
    const forcedNodes = initialNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        _forceUpdate: timestamp,
      }
    }));

    setNodes(forcedNodes);

    // Force React Flow to re-render nodes after state update
    setTimeout(() => {
      forcedNodes.forEach((node) => {
        if (node.type === 'stepNode') {
          updateNodeInternals(node.id);
        }
      });
    }, 50);
  }, [initialNodes, setNodes, updateNodeInternals, selectedT1, selectedT2]);

  // Update nodes when activeStepIds or activeWorkSteps changes
  // DISABLED: This is redundant because initialNodes already includes activeWorkSteps
  // Having two useEffects updating nodes simultaneously causes race conditions
  // useEffect(() => {

  //   setNodes((currentNodes) => {
  //     const updated = currentNodes.map((node) => {
  //       if (node.type === 'stepNode') {
  //         const isActive = activeStepIds.includes(node.id);
  //         const isActiveWork = activeWorkSteps.has(node.id);
  //         if (isActive !== node.data.isActive || isActiveWork !== node.data.isActiveWork) {
  //           return {
  //             ...node,
  //             data: {
  //               ...node.data,
  //               isActive,
  //               isActiveWork
  //             }
  //           };
  //         }
  //       }
  //       return node;
  //     });
  //     return updated;
  //   });

  //   // Force React Flow to re-render the updated nodes
  //   activeStepIds.forEach((nodeId) => {
  //     updateNodeInternals(nodeId);
  //   });
  //   // Also update active work nodes
  //   activeWorkSteps.forEach((nodeId) => {
  //     updateNodeInternals(nodeId);
  //   });
  // }, [activeStepIds, activeWorkSteps, setNodes, updateNodeInternals]);


  // Track if auto-layout has been triggered
  const autoLayoutTriggered = useRef(false);

  // Check if this is the first visit to this flowchart
  const isFirstVisit = useRef<boolean>(false);
  useEffect(() => {
    const storageKey = `flowchart-animation-shown-${flowchart.id}`;
    const hasSeenAnimation = localStorage.getItem(storageKey);
    isFirstVisit.current = !hasSeenAnimation && layoutMode === 'centered';
  }, [flowchart.id, layoutMode]);

  // Overlay state with progress steps
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);

  // Viewport lock state
  const [isViewportLocked, setIsViewportLocked] = useState(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Step navigation dropdown state
  const [selectedStepForNav, setSelectedStepForNav] = useState<string>("");

  // Auto-reset dropdown after 5 seconds
  useEffect(() => {
    if (selectedStepForNav) {
      const timer = setTimeout(() => {
        setSelectedStepForNav("");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [selectedStepForNav]);

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        // Error attempting to enable fullscreen
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        // Error attempting to exit fullscreen
      });
    }
  }, []);

  // Listen for fullscreen changes (e.g., user pressing ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);


  // TEMPORARILY DISABLED: Enter fullscreen when loading overlay shows
  // useEffect(() => {
  //   if (showLoadingOverlay) {
  //     // Request fullscreen
  //     if (document.documentElement.requestFullscreen) {
  //       document.documentElement.requestFullscreen().catch((err) => {
  //         console.log('Fullscreen request denied:', err);
  //       });
  //     }
  //   } else {
  //     // Exit fullscreen when overlay closes
  //     if (document.fullscreenElement && document.exitFullscreen) {
  //       document.exitFullscreen().catch((err) => {
  //         console.log('Exit fullscreen failed:', err);
  //       });
  //     }
  //   }
  // }, [showLoadingOverlay]);

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
    const SPACING_GRID = 3; // Horizontal spacing between columns (3 grid units = 90px for nodes)
    const PARALLEL_SPACING_GRID = 1.5; // Vertical spacing for parallel boxes from center
    const STEP1_START_Y_GRID = 2; // Step 1 starts here

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

    // STEP 1 BECOMES THE CENTER REFERENCE
    // Calculate center point as the middle of Step 1
    const step1 = steps.find(s => s.id === "step-1");
    const step1Height = step1 ? stepDimensions.get(step1.id)!.heightGrid : 10;
    const CENTER_Y_GRID = STEP1_START_Y_GRID + (step1Height / 2);

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
      // If column has only ONE box, center it at CENTER_Y_GRID
      // If column has multiple boxes (parallels), use spacing from center line

      if (stepsInColumn.length === 1) {
        // Single box - center it directly at CENTER_Y_GRID
        const step = stepsInColumn[0];
        const dimensions = stepDimensions.get(step.id)!;

        let yPos;
        if (step.id === "step-1") {
          // Step 1 is placed at the fixed starting position
          yPos = STEP1_START_Y_GRID;
        } else {
          // All other single boxes: center their middle at CENTER_Y_GRID
          yPos = CENTER_Y_GRID - (dimensions.heightGrid / 2);
        }

        newPositions.set(step.id, {
          xGrid: xPosGrid,
          yGrid: Math.round(yPos),
          widthPx: dimensions.widthPx,
          heightPx: dimensions.heightPx
        });
      } else {
        // Multiple boxes - use above/below logic with equal spacing from center
        const boxesAbove: typeof steps = [];
        const boxesBelow: typeof steps = [];

        stepsInColumn.forEach((step) => {
          const parsed = parseStepId(step.id);
          const minor = parsed.minor ?? 1; // Default to 1 if no minor number

          if (minor % 2 === 1) {
            // Odd minor numbers go above center
            boxesAbove.push(step);
          } else {
            // Even minor numbers go below center
            boxesBelow.push(step);
          }
        });

        // Place boxes above center (going upward from center)
        let currentYAbove = CENTER_Y_GRID - PARALLEL_SPACING_GRID; // Start just above center with spacing
        boxesAbove.reverse().forEach((step) => {
          const dimensions = stepDimensions.get(step.id)!;

          // Place box so its bottom edge is at currentYAbove
          const yPos = currentYAbove - dimensions.heightGrid;

          newPositions.set(step.id, {
            xGrid: xPosGrid,
            yGrid: Math.round(yPos),
            widthPx: dimensions.widthPx,
            heightPx: dimensions.heightPx
          });

          // Move up for next box (subtract height + spacing)
          currentYAbove = yPos - PARALLEL_SPACING_GRID;
        });

        // Place boxes below center (going downward from center)
        let currentYBelow = CENTER_Y_GRID + PARALLEL_SPACING_GRID; // Start just below center with spacing
        boxesBelow.forEach((step) => {
          const dimensions = stepDimensions.get(step.id)!;

          newPositions.set(step.id, {
            xGrid: xPosGrid,
            yGrid: Math.round(currentYBelow),
            widthPx: dimensions.widthPx,
            heightPx: dimensions.heightPx
          });

          // Move down for next box (add height + spacing)
          currentYBelow += dimensions.heightGrid + PARALLEL_SPACING_GRID;
        });
      }
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

  // Zoom to specific step function with smart zoom based on node size
  const handleZoomToStep = useCallback((stepId: string) => {
    const node = getNode(stepId);
    if (!node) return;

    // Get node dimensions - use actual rendered dimensions if available
    const nodeWidth = node.measured?.width || node.width || 300;
    const nodeHeight = node.measured?.height || node.height || 200;

    // Calculate zoom level based on node size
    // Zoomed in 1 level from previous (-0.2 adjustment)
    const maxDimension = Math.max(nodeWidth, nodeHeight);
    let targetZoom = 1.0; // Was 0.8
    if (maxDimension > 600) {
      targetZoom = 0.6; // Was 0.4
    } else if (maxDimension > 400) {
      targetZoom = 0.8; // Was 0.6
    }

    // Center on the MIDDLE of the node (position + half width/height)
    const centerX = node.position.x + nodeWidth / 2;
    const centerY = node.position.y + nodeHeight / 2;

    setCenter(centerX, centerY, { zoom: targetZoom, duration: 600 });
  }, [getNode, setCenter]);

  // Step navigation handlers (must be AFTER handleZoomToStep)
  const handlePreviousStep = useCallback(() => {
    if (navigationSteps.length === 0) return;
    const newIndex = currentStepIndex === 0 ? navigationSteps.length - 1 : currentStepIndex - 1;
    setCurrentStepIndex(newIndex);
    const targetStep = navigationSteps[newIndex];
    if (targetStep) {
      handleZoomToStep(targetStep.id);

      // Show info modal to the right of the step
      const node = getNode(targetStep.id);
      if (node) {
        const nodeWidth = node.measured?.width || node.width || 300;
        setStepInfoModalPosition({
          x: node.position.x + nodeWidth + 20,
          y: node.position.y
        });
        setShowStepInfoModal(true);
      }
    }
  }, [currentStepIndex, navigationSteps, handleZoomToStep, getNode]);

  const handleNextStep = useCallback(() => {
    if (navigationSteps.length === 0) return;
    const newIndex = currentStepIndex === navigationSteps.length - 1 ? 0 : currentStepIndex + 1;
    setCurrentStepIndex(newIndex);
    const targetStep = navigationSteps[newIndex];
    if (targetStep) {
      handleZoomToStep(targetStep.id);

      // Show info modal to the right of the step
      const node = getNode(targetStep.id);
      if (node) {
        const nodeWidth = node.measured?.width || node.width || 300;
        setStepInfoModalPosition({
          x: node.position.x + nodeWidth + 20,
          y: node.position.y
        });
        setShowStepInfoModal(true);
      }
    }
  }, [currentStepIndex, navigationSteps, handleZoomToStep, getNode]);

  // Handler for jumping to specific step by page number
  const handleJumpToPage = useCallback((pageNumber: number) => {
    if (navigationSteps.length === 0) return;

    const index = pageNumber - 1; // Convert to 0-based index
    if (index < 0 || index >= navigationSteps.length) return;

    setCurrentStepIndex(index);
    const targetStep = navigationSteps[index];
    if (targetStep) {
      handleZoomToStep(targetStep.id);
      const node = getNode(targetStep.id);
      if (node) {
        const nodeWidth = node.measured?.width || node.width || 300;
        setStepInfoModalPosition({
          x: node.position.x + nodeWidth + 20,
          y: node.position.y
        });
        setShowStepInfoModal(true);
      }
    }
    setPageNumberInput(''); // Clear input after jump
  }, [navigationSteps, handleZoomToStep, getNode]);

  // Keyboard navigation - Arrow keys
  useEffect(() => {
    if (!showStepNavigation || isEditMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePreviousStep();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextStep();
      } else if (e.key === 'Escape') {
        setShowStepInfoModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showStepNavigation, isEditMode, handlePreviousStep, handleNextStep]);

  // Expose realign functions to parent
  useEffect(() => {
    if (onRealignToGrid) {
      // Expose both layout functions directly
      (window as any).__flowchartRealignToGrid = handleRealignToGrid;
      (window as any).__flowchartRealignToGridTopDown = handleRealignToGridTopDown;
      (window as any).__flowchartRealignToGridCentered = handleRealignToGridCentered;
    }
    // Always expose zoom to step function
    (window as any).__flowchartZoomToStep = handleZoomToStep;

    return () => {
      delete (window as any).__flowchartRealignToGrid;
      delete (window as any).__flowchartRealignToGridTopDown;
      delete (window as any).__flowchartRealignToGridCentered;
      delete (window as any).__flowchartZoomToStep;
    };
  }, [handleRealignToGrid, handleRealignToGridTopDown, handleRealignToGridCentered, handleZoomToStep, onRealignToGrid]);

  // Update node DATA only (not positions) when steps/props change
  // This prevents boxes from jumping when clicking edges
  useEffect(() => {
    setNodes((nds) => {
      const existingNodeIds = new Set(nds.map(n => n.id));
      const newStepIds = new Set(displayedSteps.map(s => s.id));

      // Update existing nodes (keep their positions)
      const updatedNodes = nds
        .filter(node => newStepIds.has(node.id) || node.id === 'flowy-logo' || node.id === 'commit-hash') // Keep valid step nodes + logo/commit
        .map((node) => {
          // Keep logo and commit nodes with updated properties
          if (node.id === 'flowy-logo') {
            return {
              ...node,
              style: { width: 450, height: 300 },  // 50% större
              data: {
                ...node.data,
                isEditMode,
              },
              draggable: isEditMode,
            };
          }
          if (node.id === 'commit-hash') {
            return {
              ...node,
              style: { width: 120, height: 40 },
              data: {
                ...node.data,
                isEditMode,
              },
              draggable: isEditMode,
            };
          }

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

          const isActive = activeStepIds.includes(step.id);

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
              isActive,
              onOpenTechnicianPairModal,
              selectedT1,
              selectedT2,
            },
            draggable: isEditMode,
          };
        });

      // Add logo and commit nodes if they don't exist yet
      const hasLogo = updatedNodes.some(n => n.id === 'flowy-logo');
      const hasCommit = updatedNodes.some(n => n.id === 'commit-hash');

      const additionalNodes = [];
      if (!hasLogo) {
        additionalNodes.push({
          id: 'flowy-logo',
          type: 'logoNode',
          position: { x: -350, y: 20 },
          style: { width: 450, height: 300 },  // 50% större (från 300x200)
          data: { isEditMode },
          draggable: isEditMode,
          selectable: isEditMode,
          connectable: false,
        });
      }
      if (!hasCommit) {
        additionalNodes.push({
          id: 'commit-hash',
          type: 'commitNode',
          position: { x: -125, y: 215 },  // 5px under PREVIEW-badgen
          style: { width: 120, height: 40 },
          data: { isEditMode },
          draggable: isEditMode,
          selectable: isEditMode,
          connectable: false,
        });
      }

      // Info card is now a dropdown - no longer needed as a node
      return [...updatedNodes, ...newNodes, ...additionalNodes];
    });

    // CRITICAL: Update node internals after DOM has rendered
    // This is required when using multiple handles per node
    setTimeout(() => {
      displayedSteps.forEach((step) => {
        updateNodeInternals(step.id);
      });
    }, 0);
  }, [displayedSteps, isEditMode, selectedServiceType, handleDelete, handleDuplicate, handleUpdateStep, onEditStep, onStepClick, gridSize, updateNodeInternals, setNodes, flowchart, handleUpdateFlowchart]);

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
            markerEnd: edge.markerEnd && typeof edge.markerEnd === 'object' ? { ...edge.markerEnd, color: '#10b981' } : edge.markerEnd,
            markerStart: edge.markerStart && typeof edge.markerStart === 'object' ? { ...edge.markerStart, color: '#10b981' } : edge.markerStart,
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

  // Load initialEdges
  useEffect(() => {
    if (initialEdges.length > 0 && !hasLoadedInitialEdges.current) {
      const validEdges = initialEdges.filter(edge => {
        const isValid = edge.source && edge.target && edge.sourceHandle && edge.targetHandle;
        return isValid;
      });
      setEdges(validEdges);
      hasLoadedInitialEdges.current = true;
    }
  }, [initialEdges]); // eslint-disable-line react-hooks/exhaustive-deps

  // Note: Edges to/from hidden steps are automatically hidden by ReactFlow
  // No need to manually filter edges - ReactFlow handles this for us

  // SIMPLE: Auto-run centered layout on mount (once) with animated progress
  useEffect(() => {
    if (layoutMode === 'centered' && !autoLayoutTriggered.current && steps.length > 0) {
      autoLayoutTriggered.current = true;

      // Only show animation on first visit
      if (isFirstVisit.current) {
        // TEMPORARILY DISABLED: Loading overlay animation
        // setShowLoadingOverlay(true);

        // Run layout immediately
        handleRealignToGridCentered();

        // TESTING: Disable all camera movements to see if layout is correct from start
        // // Fit view after layout
        // setTimeout(() => {
        //   console.log('   Fitting view...');
        //   fitView({ padding: 0.15, duration: 600, maxZoom: 0.85, minZoom: 0.5 });
        // }, 100);

        // Zoom to first step after layout
        setTimeout(() => {
          const firstStep = steps.find(s => s.id.includes('step-1') || s.position.x === 0);
          if (firstStep) {
            const nodeId = firstStep.id;
            fitView({
              nodes: [{ id: nodeId }],
              duration: 2000,
              maxZoom: 0.9,
              minZoom: 0.6,
              padding: 0.4
            });
          }
        }, 500);

        // Mark animation as shown immediately
        localStorage.setItem(`flowchart-animation-shown-${flowchart.id}`, 'true');
      } else {
        // No animation, just run layout
        handleRealignToGridCentered();
        // TESTING: Also disable for non-first-visit
        // setTimeout(() => {
        //   fitView({ padding: 0.15, duration: 600, maxZoom: 0.85, minZoom: 0.5 });
        // }, 100);
      }
    }
  }, [layoutMode, steps.length, handleRealignToGridCentered, fitView, flowchart.id, steps]);

  // Sync edges to parent component whenever they change
  useEffect(() => {
    onEdgesChangeProp?.(edges);
  }, [edges]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle node click to open detail drawer
  // Simple click handler - just open drawer
  const handleNodeClick = useCallback((event: any, node: Node<StepNodeData>) => {
    console.log('🔴 handleNodeClick triggered', event.target);

    // Check if click came from Active Work button
    const target = event.target as HTMLElement;
    if (target.closest('[data-active-work-button]')) {
      console.log('🔴 Click came from Active Work button - ignoring');
      return;
    }

    // Only handle clicks on step nodes, not info card nodes
    if (!isEditMode && onStepClick && node.type === 'stepNode' && node.data.step) {
      console.log('🔴 Opening drawer for step:', node.data.step.id);
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
          markerStart: edge.markerStart && typeof edge.markerStart === 'object' ? { ...edge.markerStart, color } : edge.markerStart,
          markerEnd: edge.markerEnd && typeof edge.markerEnd === 'object' ? { ...edge.markerEnd, color } : edge.markerEnd,
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
  const nodeTypes = useMemo(() => ({
    stepNode: StepNode,
    logoNode: LogoNode,
    commitNode: CommitNode
    // infoCardNode removed - now using dropdown component instead
  }), []);
  const edgeTypes = useMemo(() => ({
    horizontal: HorizontalEdge,
    vertical: VerticalEdge
  }), []);

  return (
    <ActiveWorkContext.Provider value={{ activeWorkSteps, handleToggleActiveWork, highlightActiveWorkMode }}>
      <div className="w-full h-full bg-gray-50 dark:bg-gray-900 relative">
      {/* TEMPORARILY DISABLED: Animated Loading Overlay - Fullscreen */}
      {/* {showLoadingOverlay && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/80 backdrop-blur-md">
          <div className="bg-white/95 dark:bg-gray-900/95 rounded-lg p-8 shadow-2xl">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
                <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-blue-200 dark:border-blue-800" />
              </div>

              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Loading...
                </p>
                <p className="text-sm text-muted-foreground">
                  {flowchart.model}
                </p>
              </div>
            </div>
          </div>
        </div>
      )} */}

      <ReactFlow
        nodes={nodes as any}
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
        // Don't set defaultViewport for centered layout - let fitView handle it
        defaultViewport={layoutMode === 'centered' ? undefined : { x: 0, y: 0, zoom: zoom / 100 }}
        nodesDraggable={isEditMode}
        nodesConnectable={isEditMode}
        edgesReconnectable={isEditMode}
        snapToGrid={isEditMode && !freePositioning}
        snapGrid={[gridSize, gridSize]}
        connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
        onPaneClick={() => {
          setSelectedEdge(null);
          setShowStepInfoModal(false);
        }}
        proOptions={{ hideAttribution: true }}
        // Touch device support with viewport lock
        panOnDrag={isViewportLocked ? false : (!isEditMode ? [1, 2] : [1, 2])}
        panOnScroll={false}
        zoomOnPinch={isViewportLocked ? false : true}
        zoomOnScroll={isViewportLocked ? false : true}
        zoomOnDoubleClick={isViewportLocked ? false : true}
        preventScrolling={true}
        // Use drag-to-connect (default), not click-to-connect
        // connectOnClick can cause conflicts with handle interactions
      >
        {isEditMode && (
          <Background variant={BackgroundVariant.Dots} gap={gridSize} size={1} color="#6366f1" />
        )}

        {/* Custom horizontal zoom controls at bottom */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-gray-800/10 hover:bg-gray-800/80 backdrop-blur-md border border-gray-600/10 hover:border-gray-600/50 rounded-lg p-1 shadow-lg transition-all duration-300 group">
          <button
            onClick={() => zoomIn({ duration: 200 })}
            className="h-8 w-8 flex items-center justify-center bg-transparent hover:bg-gray-600/70 text-white/40 group-hover:text-white hover:text-white rounded transition-all duration-300 border-0"
            title="Zoom In"
          >
            <Plus className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-gray-600/20 group-hover:bg-gray-600/50 mx-0.5 transition-all duration-300" />

          <button
            onClick={() => zoomOut({ duration: 200 })}
            className="h-8 w-8 flex items-center justify-center bg-transparent hover:bg-gray-600/70 text-white/40 group-hover:text-white hover:text-white rounded transition-all duration-300 border-0"
            title="Zoom Out"
          >
            <Minus className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-gray-600/20 group-hover:bg-gray-600/50 mx-0.5 transition-all duration-300" />

          <button
            onClick={() => fitView({ padding: 0.15, duration: 400 })}
            className="h-8 w-8 flex items-center justify-center bg-transparent hover:bg-gray-600/70 text-white/40 group-hover:text-white hover:text-white rounded transition-all duration-300 border-0"
            title="Fit View"
          >
            <Maximize2 className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-gray-600/20 group-hover:bg-gray-600/50 mx-0.5 transition-all duration-300" />

          <button
            onClick={toggleFullscreen}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded transition-all duration-300 border-0",
              isFullscreen
                ? "bg-blue-600/80 hover:bg-blue-700/80 text-white"
                : "bg-transparent hover:bg-gray-600/70 text-white/40 group-hover:text-white hover:text-white"
            )}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            <Expand className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-gray-600/20 group-hover:bg-gray-600/50 mx-0.5 transition-all duration-300" />

          <button
            onClick={() => setIsViewportLocked(!isViewportLocked)}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded transition-all duration-300 border-0",
              isViewportLocked
                ? "bg-orange-600/80 hover:bg-orange-700/80 text-white"
                : "bg-transparent hover:bg-gray-600/70 text-white/40 group-hover:text-white hover:text-white"
            )}
            title={isViewportLocked ? "Unlock Viewport" : "Lock Viewport"}
          >
            {isViewportLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </button>

          <div className="w-px h-6 bg-gray-600/20 group-hover:bg-gray-600/50 mx-0.5 transition-all duration-300" />

          <button
            onClick={onToggleEditMode}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded transition-all duration-300 border-0",
              isEditMode
                ? "bg-green-600/80 hover:bg-green-700/80 text-white"
                : "bg-transparent hover:bg-gray-600/70 text-white/40 group-hover:text-white hover:text-white"
            )}
            title={isEditMode ? "Exit Edit Mode" : "Enter Edit Mode"}
          >
            <Pencil className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-gray-600/20 group-hover:bg-gray-600/50 mx-0.5 transition-all duration-300" />

          {/* Step Navigation Dropdown */}
          <Select
            value=""
            onValueChange={(value) => {
              handleZoomToStep(value);
            }}
          >
            <SelectTrigger className="h-8 w-44 bg-transparent hover:bg-gray-600/70 border-0 text-white/40 group-hover:text-white hover:text-white text-xs transition-all duration-300">
              <SelectValue placeholder="Jump to step..." />
            </SelectTrigger>
            <SelectContent className="max-h-[400px] bg-gray-800/95 backdrop-blur-md border-gray-700/50">
              {displayedSteps.map((step) => {
                // Extract step number from id (e.g. "step-1" -> "1", "step-2-1" -> "2.1")
                const stepNumber = step.id.replace('step-', '').replace(/-/g, '.');

                // Get step title (first line only)
                const stepTitle = step.title.split('\n')[0];

                // Calculate target duration
                const targetDurationMinutes = step.durationMinutes || 0;
                const targetHours = Math.floor(targetDurationMinutes / 60);
                const targetMins = targetDurationMinutes % 60;
                const targetDurationText = targetHours > 0 ? `${targetHours}h ${targetMins}m` : `${targetMins}m`;

                // Calculate actual time spent
                const actualMinutes = step.tasks.reduce((sum, task) => sum + (task.actualTimeMinutes || 0), 0);
                const actualHours = Math.floor(actualMinutes / 60);
                const actualMins = actualMinutes % 60;
                const actualTimeText = actualHours > 0 ? `${actualHours}h ${actualMins}m` : `${actualMins}m`;

                // Count completed and total tasks
                const completedTasks = step.tasks.filter(t => t.completed).length;
                const totalTasks = step.tasks?.length || 0;
                const isComplete = completedTasks === totalTasks && totalTasks > 0;
                const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                // Check if overtime
                const isOvertime = actualMinutes > targetDurationMinutes && targetDurationMinutes > 0;
                const isAhead = actualMinutes < targetDurationMinutes && actualMinutes > 0;

                return (
                  <SelectItem
                    key={step.id}
                    value={step.id}
                    className={cn(
                      "text-xs hover:bg-gray-700/50 cursor-pointer group/item",
                      isComplete && "bg-green-900/20 hover:bg-green-900/30"
                    )}
                  >
                    <div className="flex flex-col gap-1.5 py-1.5 w-full">
                      {/* Step number and title with completion badge */}
                      <div className="flex items-center gap-2">
                        {isComplete && <span className="text-green-400 text-sm">✓</span>}
                        <span className="font-bold text-white">Step {stepNumber}</span>
                        <span className="text-gray-300 truncate max-w-[180px]">{stepTitle}</span>
                      </div>

                      {/* Progress bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-700/50 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              isComplete ? "bg-green-500" : "bg-blue-500"
                            )}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className={cn(
                          "text-[9px] font-bold min-w-[35px] text-right",
                          isComplete ? "text-green-400" : "text-gray-400"
                        )}>
                          {completedTasks}/{totalTasks}
                        </span>
                      </div>

                      {/* Metadata row */}
                      <div className="flex items-center gap-2 text-[10px] flex-wrap">
                        {/* Technician badges */}
                        <div className="flex items-center gap-1">
                          {step.technician === "both" ? (
                            <>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white bg-blue-500">T1</span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white bg-purple-500">T2</span>
                            </>
                          ) : (
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[9px] font-bold text-white",
                              step.technician === "T1" ? "bg-blue-500" : "bg-purple-500"
                            )}>
                              {step.technician}
                            </span>
                          )}
                        </div>

                        {/* Target duration */}
                        <span className="text-gray-400">Target: {targetDurationText}</span>

                        {/* Actual time spent with color coding */}
                        {actualMinutes > 0 && (
                          <span className={cn(
                            "font-semibold",
                            isOvertime ? "text-red-400" : isAhead ? "text-green-400" : "text-blue-400"
                          )}>
                            Actual: {actualTimeText}
                          </span>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* View Mode Filters - Only show in view mode */}
          {!isEditMode && (
            <>
              <div className="w-px h-6 bg-gray-600/20 group-hover:bg-gray-600/50 mx-0.5 transition-all duration-300" />

              {/* Hide Completed Steps */}
              <button
                onClick={onToggleHideCompleted}
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded transition-all duration-300 border-0",
                  hideCompletedSteps
                    ? "bg-green-600/80 hover:bg-green-700/80 text-white"
                    : "bg-transparent hover:bg-gray-600/70 text-white/40 group-hover:text-white hover:text-white"
                )}
                title={hideCompletedSteps ? "Show Completed Steps" : "Hide Completed Steps"}
              >
                <CheckCircle2 className="h-4 w-4" />
              </button>

              {/* Focus Active Work */}
              <button
                onClick={() => {
                  console.log('👁️ Active Work Filter clicked!');
                  console.log('👁️ activeWorkSteps.size:', activeWorkSteps.size);
                  console.log('👁️ highlightActiveWorkMode:', highlightActiveWorkMode);
                  if (activeWorkSteps.size > 0) {
                    console.log('👁️ Toggling highlight mode to:', !highlightActiveWorkMode);
                    setHighlightActiveWorkMode(!highlightActiveWorkMode);
                  } else {
                    console.log('👁️ No active work steps - button disabled');
                  }
                }}
                disabled={activeWorkSteps.size === 0}
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded transition-all duration-300 border-0",
                  activeWorkSteps.size === 0
                    ? "opacity-30 cursor-not-allowed text-white/20"
                    : highlightActiveWorkMode
                      ? "bg-blue-600/80 hover:bg-blue-700/80 text-white"
                      : "bg-transparent hover:bg-gray-600/70 text-white/40 group-hover:text-white hover:text-white"
                )}
                title={
                  activeWorkSteps.size === 0
                    ? "Mark steps as Active Work to use this filter"
                    : highlightActiveWorkMode
                      ? "Show All Steps"
                      : "Focus on Active Work"
                }
              >
                {highlightActiveWorkMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>

              {/* Step Navigation Toggle */}
              <button
                onClick={() => setShowStepNavigation(!showStepNavigation)}
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded transition-all duration-300 border-0",
                  showStepNavigation
                    ? "bg-gray-600/80 hover:bg-gray-700/80 text-white"
                    : "bg-transparent hover:bg-gray-600/70 text-white/40 group-hover:text-white hover:text-white"
                )}
                title={showStepNavigation ? "Hide Step Navigation" : "Show Step Navigation"}
              >
                {showStepNavigation ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>

              {/* Offline Status */}
              <OfflineStatusIndicator flowchart={flowchart} steps={steps} side="top" />

              {/* Divider - Separate regular tools from dev tools */}
              <div className="w-px h-6 bg-gray-600/30 group-hover:bg-gray-600/60 mx-1 transition-all duration-300" />

              {/* Dev Tools Section */}
              {/* Test Completion Slider */}
              <div className="flex items-center gap-1.5 bg-gray-600/10 hover:bg-gray-600/20 px-2 py-1 rounded transition-all duration-300">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={testCompletionPercent}
                  onChange={(e) => onTestCompletionChange?.(Number(e.target.value))}
                  className="w-16 h-1 bg-gray-600/30 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: 'rgba(255, 255, 255, 0.6)' }}
                  title="Test completion percentage"
                />
                <button
                  onClick={() => onTestCompletion?.()}
                  className="h-6 px-1.5 text-[10px] font-medium text-white/40 hover:text-white hover:bg-gray-600/20 rounded transition-colors"
                  title={`Complete ${testCompletionPercent}% of tasks`}
                >
                  Test {testCompletionPercent}%
                </button>
              </div>

              {/* Clear Cache */}
              <button
                onClick={() => {
                  console.log('Clear Cache clicked, onClearCache:', typeof onClearCache);
                  onClearCache?.();
                }}
                disabled={!onClearCache}
                className="h-8 w-8 flex items-center justify-center rounded transition-all duration-300 border-0 bg-transparent hover:bg-gray-600/70 text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                title="Clear Cache"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Step Navigation Panel - Compact */}
        {!isEditMode && showStepNavigation && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-gray-800/10 backdrop-blur-md border border-gray-600/10 rounded-lg px-2 py-1.5 shadow-2xl transition-all duration-300 bg-gray-800/80 border-gray-600/50">
            {/* Mode Selector - Compact color dots */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setStepNavMode('all');
                  setCurrentStepIndex(0);
                }}
                className={cn(
                  "h-6 w-6 rounded transition-all duration-300",
                  stepNavMode === 'all'
                    ? "bg-gray-500 ring-2 ring-white/60"
                    : "bg-gray-600/40 hover:bg-gray-500/60"
                )}
                title="All steps"
              />
              <button
                onClick={() => {
                  setStepNavMode('active');
                  setCurrentStepIndex(0);
                }}
                className={cn(
                  "h-6 w-6 rounded transition-all duration-300",
                  stepNavMode === 'active'
                    ? "bg-blue-500 ring-2 ring-white/60"
                    : "bg-blue-600/40 hover:bg-blue-500/60",
                  activeWorkSteps.size === 0 && "opacity-30 cursor-not-allowed"
                )}
                title="Active work steps"
                disabled={activeWorkSteps.size === 0}
              />
              <button
                onClick={() => {
                  setStepNavMode('remaining');
                  setCurrentStepIndex(0);
                }}
                className={cn(
                  "h-6 w-6 rounded transition-all duration-300",
                  stepNavMode === 'remaining'
                    ? "bg-yellow-400 ring-2 ring-white/60"
                    : "bg-yellow-500/40 hover:bg-yellow-400/60"
                )}
                title="Remaining steps"
              />
            </div>

            <div className="w-px h-5 bg-white/20" />

            {/* Navigation Controls - Compact */}
            <button
              onClick={handlePreviousStep}
              disabled={navigationSteps.length === 0}
              className="h-7 w-7 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Previous step"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="px-2 text-[11px] font-medium text-white/80 min-w-[45px] text-center">
              {navigationSteps.length > 0 ? `${currentStepIndex + 1}/${navigationSteps.length}` : '0/0'}
            </div>

            <button
              onClick={handleNextStep}
              disabled={navigationSteps.length === 0}
              className="h-7 w-7 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next step"
            >
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="w-px h-5 bg-white/20" />

            {/* Page Number Input */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={pageNumberInput}
                onChange={(e) => setPageNumberInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const pageNum = parseInt(pageNumberInput);
                    if (!isNaN(pageNum)) {
                      handleJumpToPage(pageNum);
                    }
                  }
                }}
                placeholder="#"
                disabled={navigationSteps.length === 0}
                className="h-7 w-12 bg-white/10 border border-white/20 rounded text-white text-[11px] text-center placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/40 focus:bg-white/15 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Jump to step number"
                min="1"
                max={navigationSteps.length}
              />
              <button
                onClick={() => {
                  const pageNum = parseInt(pageNumberInput);
                  if (!isNaN(pageNum)) {
                    handleJumpToPage(pageNum);
                  }
                }}
                disabled={navigationSteps.length === 0 || !pageNumberInput}
                className="h-7 px-2 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-medium transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Go to step"
              >
                Go
              </button>
            </div>
          </div>
        )}

        {/* Step Info Modal - Appears to the right of current step */}
        {!isEditMode && showStepInfoModal && navigationSteps.length > 0 && navigationSteps[currentStepIndex] && (
          <ViewportPortal>
            <div
              className="absolute z-20 pointer-events-auto"
              style={{
                left: `${stepInfoModalPosition.x}px`,
                top: `${stepInfoModalPosition.y}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gray-800/95 backdrop-blur-md border border-gray-600/50 rounded-lg shadow-2xl p-4 w-[280px] animate-in fade-in slide-in-from-left-2 duration-300">
                {(() => {
                  const step = navigationSteps[currentStepIndex];
                  const completedTasks = step.tasks.filter(t => t.completed).length;
                  const totalTasks = step.tasks.length;
                  const isComplete = completedTasks === totalTasks && totalTasks > 0;

                  // Calculate target duration
                  const targetMinutes = step.durationMinutes || 0;
                  const targetHours = Math.floor(targetMinutes / 60);
                  const targetMins = targetMinutes % 60;
                  const targetDurationText = targetHours > 0 ? `${targetHours}h ${targetMins}m` : `${targetMins}m`;

                  // Calculate actual time spent
                  const actualMinutes = step.tasks.reduce((sum, task) => sum + (task.actualTimeMinutes || 0), 0);
                  const actualHours = Math.floor(actualMinutes / 60);
                  const actualMins = actualMinutes % 60;
                  const actualTimeText = actualHours > 0 ? `${actualHours}h ${actualMins}m` : `${actualMins}m`;

                  // Calculate time variance
                  const isOvertime = actualMinutes > targetMinutes && targetMinutes > 0;
                  const isAhead = actualMinutes < targetMinutes && actualMinutes > 0;
                  const varianceMinutes = Math.abs(actualMinutes - targetMinutes);
                  const varianceHours = Math.floor(varianceMinutes / 60);
                  const varianceMins = varianceMinutes % 60;
                  const varianceText = varianceHours > 0 ? `${varianceHours}h ${varianceMins}m` : `${varianceMins}m`;

                  // Count notes and bugs
                  const totalNotes = step.tasks.reduce((sum, task) => sum + (task.notes?.length || 0), 0);
                  const bugs = step.bugs || [];

                  return (
                    <>
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-white font-bold text-sm flex-1">
                          {step.title.split('\n')[0]}
                        </h3>
                        <button
                          onClick={() => setShowStepInfoModal(false)}
                          className="text-white/60 hover:text-white transition-colors ml-2"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Progress */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-400">Progress</span>
                          <span className="text-xs font-bold text-white">{completedTasks}/{totalTasks}</span>
                        </div>
                        <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              isComplete ? "bg-green-500" : "bg-blue-500"
                            )}
                            style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Time Info */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">Target Time</span>
                          <span className="text-xs font-medium text-white">{targetDurationText}</span>
                        </div>
                        {actualMinutes > 0 && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-400">Actual Time</span>
                              <span className={cn(
                                "text-xs font-medium",
                                isOvertime ? "text-red-400" : isAhead ? "text-green-400" : "text-blue-400"
                              )}>
                                {actualTimeText}
                              </span>
                            </div>
                            {targetMinutes > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">Variance</span>
                                <span className={cn(
                                  "text-xs font-bold",
                                  isOvertime ? "text-red-400" : "text-green-400"
                                )}>
                                  {isOvertime ? '+' : '-'}{varianceText}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Notes & Bugs */}
                      {(totalNotes > 0 || bugs.length > 0) && (
                        <div className="mt-3 pt-3 border-t border-gray-700/50 space-y-2">
                          {totalNotes > 0 && (
                            <div className="flex items-center gap-2">
                              <StickyNote className="h-3.5 w-3.5 text-yellow-400" />
                              <span className="text-xs text-gray-300">{totalNotes} note{totalNotes > 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {bugs.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Bug className="h-3.5 w-3.5 text-red-400" />
                              <span className="text-xs text-gray-300">{bugs.length} bug report{bugs.length > 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Task Documents - Compact list */}
                      {step.tasks && step.tasks.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-700/50">
                          <div className="space-y-1 max-h-[200px] overflow-y-auto">
                            {step.tasks.map((task, idx) => {
                              // Extract section reference from task description (e.g., "5.2.1.1")
                              const sectionMatch = task.description.match(/^([\d.]+)/);
                              const sectionRef = sectionMatch ? sectionMatch[1] : null;

                              return (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    // Parse SII reference and open PDF directly
                                    const ref = parseSIIReference(task.description);
                                    if (ref) {
                                      const page = getSectionPage(ref.documentNumber, ref.section);
                                      console.log('📄 Direct PDF open from nav modal:', {
                                        documentNumber: ref.documentNumber,
                                        section: ref.section,
                                        calculatedPage: page,
                                        pdfPath: ref.documentPath
                                      });
                                      setSelectedPdfUrl(ref.documentPath);
                                      setSelectedPdfTitle(`Doc ${ref.documentNumber}: ${ref.documentTitle} - § ${ref.section}`);
                                      setSelectedPdfPage(page);
                                      setPdfViewerOpen(true);
                                    }

                                    // Close the info modal
                                    setShowStepInfoModal(false);
                                  }}
                                  className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 transition-colors text-left group"
                                  title={sectionRef ? `Jump to § ${sectionRef} in PDF` : 'Open task'}
                                >
                                  <span className="text-[10px] font-mono text-blue-400 flex-shrink-0">
                                    {sectionRef ? `§ ${sectionRef}` : task.id.split('-').pop()}
                                  </span>
                                  <span className="text-[11px] text-gray-300 truncate flex-1 group-hover:text-white">
                                    {task.description.replace(/^[\d.]+\s*/, '')}
                                  </span>
                                  <svg className="h-3 w-3 text-red-400/60 group-hover:text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                                  </svg>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </ViewportPortal>
        )}

      </ReactFlow>

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

      {/* PDF Viewer Dialog for direct opening from navigation modal */}
      <PDFViewerDialog
        open={pdfViewerOpen}
        onOpenChange={setPdfViewerOpen}
        pdfUrl={selectedPdfUrl}
        title={selectedPdfTitle}
        initialPage={selectedPdfPage}
      />
      </div>
    </ActiveWorkContext.Provider>
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
