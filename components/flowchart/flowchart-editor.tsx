"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import ReactFlow, {
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
} from 'reactflow';
import { FlowchartStep, generateStepId } from "@/lib/flowchart-data";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Trash2, Edit, Copy, StickyNote, CheckCircle2, Workflow, ArrowRight, TrendingUp } from "lucide-react";
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
}

const GRID_SIZE = 30; // pixels (default) - matches box width 300px / 10 = 30px

interface StepNodeData {
  step: FlowchartStep;
  onEdit: (step: FlowchartStep) => void;
  onDelete: (stepId: string) => void;
  onDuplicate: (step: FlowchartStep) => void;
  onClick?: (step: FlowchartStep) => void;
  onUpdateStep: (step: FlowchartStep) => void;
  isEditMode: boolean;
  selectedServiceType?: string;
}

// Custom node component for flowchart steps
function StepNode({ data }: NodeProps<StepNodeData>) {
  const { step, onEdit, onDelete, onDuplicate, onClick, onUpdateStep, isEditMode, selectedServiceType } = data;

  const completedTasks = step.tasks.filter(t => t.completed).length;
  const totalTasks = step.tasks.length;
  const isComplete = completedTasks === totalTasks && totalTasks > 0;

  // Calculate total notes count from all tasks
  const totalNotesCount = step.tasks.reduce((sum, task) => sum + (task.notes?.length || 0), 0);

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
    <div className="group">
      {/* Connection handles - always rendered but only visible in edit mode */}
      <>
        {/* Top handles - both target and source */}
        <Handle
          type="target"
          position={Position.Top}
          id="top-target"
          className={cn(
            "!w-4 !h-4 !cursor-crosshair transition-all",
            isEditMode ? "!bg-blue-500 !border-2 !border-white" : "!opacity-0"
          )}
          isConnectable={isEditMode}
        />
        <Handle
          type="source"
          position={Position.Top}
          id="top-source"
          className={cn(
            "!w-4 !h-4 !cursor-crosshair transition-all",
            isEditMode ? "!bg-blue-500 !border-2 !border-white" : "!opacity-0"
          )}
          isConnectable={isEditMode}
        />

        {/* Bottom handles - both target and source */}
        <Handle
          type="target"
          position={Position.Bottom}
          id="bottom-target"
          className={cn(
            "!w-4 !h-4 !cursor-crosshair transition-all",
            isEditMode ? "!bg-blue-500 !border-2 !border-white" : "!opacity-0"
          )}
          isConnectable={isEditMode}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom-source"
          className={cn(
            "!w-4 !h-4 !cursor-crosshair transition-all",
            isEditMode ? "!bg-blue-500 !border-2 !border-white" : "!opacity-0"
          )}
          isConnectable={isEditMode}
        />

        {/* Left handles - both target and source */}
        <Handle
          type="target"
          position={Position.Left}
          id="left-target"
          className={cn(
            "!w-4 !h-4 !cursor-crosshair transition-all",
            isEditMode ? "!bg-blue-500 !border-2 !border-white" : "!opacity-0"
          )}
          isConnectable={isEditMode}
        />
        <Handle
          type="source"
          position={Position.Left}
          id="left-source"
          className={cn(
            "!w-4 !h-4 !cursor-crosshair transition-all",
            isEditMode ? "!bg-blue-500 !border-2 !border-white" : "!opacity-0"
          )}
          isConnectable={isEditMode}
        />

        {/* Right handles - both target and source */}
        <Handle
          type="target"
          position={Position.Right}
          id="right-target"
          className={cn(
            "!w-4 !h-4 !cursor-crosshair transition-all",
            isEditMode ? "!bg-blue-500 !border-2 !border-white" : "!opacity-0"
          )}
          isConnectable={isEditMode}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right-source"
          className={cn(
            "!w-4 !h-4 !cursor-crosshair transition-all",
            isEditMode ? "!bg-blue-500 !border-2 !border-white" : "!opacity-0"
          )}
          isConnectable={isEditMode}
        />
      </>

      {/* Step Label */}
      <div className="text-xs font-semibold text-muted-foreground pl-1 mb-1.5">
        Step {getStepNumber(step.id)}
      </div>

      <Card
        className={cn(
          "relative p-4 w-[300px] min-h-[168px] hover:shadow-lg transition-all border-2",
          step.id === "step-4y-bolts"
            ? "border-yellow-500 border-[3px]"
            : "border-gray-700/50",
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
              // Only show tasks with reference numbers (e.g., "1. Description" or "13.5.1 Description")
              const hasRefNumber = /^\d+\.(\d+(\.\d+)*\.?)?\s/.test(task.description);

              // Skip tasks without reference numbers
              if (!hasRefNumber) return null;

              // Filter by service type if a filter is selected (not in edit mode)
              if (!isEditMode && selectedServiceType && selectedServiceType !== "all") {
                const taskServiceType = task.serviceType || "1Y";
                const includedTypes = getIncludedServiceTypes(selectedServiceType);

                // Skip this task if its service type is not in the included types
                if (!includedTypes.includes(taskServiceType)) {
                  return null;
                }
              }

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
  setHasUnsavedChanges,
  selectedServiceType,
  initialEdges = [],
  onEdgesChange: onEdgesChangeProp
}: FlowchartEditorProps) {
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
  const initialNodes: Node<StepNodeData>[] = useMemo(() => steps.map(step => ({
    id: step.id,
    type: 'stepNode',
    position: { x: step.position.x * gridSize, y: step.position.y * gridSize },
    data: {
      step,
      onEdit: onEditStep,
      onDelete: handleDelete,
      onDuplicate: handleDuplicate,
      onClick: onStepClick,
      onUpdateStep: handleUpdateStep,
      isEditMode,
      selectedServiceType,
    },
    draggable: isEditMode,
  })), [steps, gridSize, isEditMode, selectedServiceType, handleDelete, handleDuplicate, handleUpdateStep, onEditStep, onStepClick]);

  // Initialize edges (connections) - load from props
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const hasLoadedInitialEdges = useRef(false);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  // Update nodes when steps or selectedHandle change
  useMemo(() => {
    const newNodes: Node<StepNodeData>[] = steps.map(step => ({
      id: step.id,
      type: 'stepNode',
      position: { x: step.position.x * gridSize, y: step.position.y * gridSize },
      data: {
        step,
        onEdit: onEditStep,
        onDelete: handleDelete,
        onDuplicate: handleDuplicate,
        onClick: onStepClick,
        onUpdateStep: handleUpdateStep,
        isEditMode,
        selectedServiceType,
      },
      draggable: isEditMode,
    }));
    setNodes(newNodes);
  }, [steps, isEditMode, selectedServiceType, handleDelete, handleDuplicate, handleUpdateStep, onEditStep, onStepClick, gridSize, setNodes]);

  // Handle node drag end - update step positions
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);

    // Update step positions when drag ends
    const dragEndChange = changes.find((c: any) => c.type === 'position' && c.dragging === false);
    if (dragEndChange && isEditMode) {
      setNodes((nds) => {
        const updatedSteps = nds.map(node => {
          const step = steps.find(s => s.id === node.id);
          if (step && node.position) {
            return {
              ...step,
              position: {
                x: Math.round(node.position.x / gridSize),
                y: Math.round(node.position.y / gridSize)
              }
            };
          }
          return step!;
        });
        onStepsChange(updatedSteps);
        setHasUnsavedChanges(true);
        return nds;
      });
    }
  }, [onNodesChange, isEditMode, steps, onStepsChange, setHasUnsavedChanges, gridSize, setNodes]);

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
      console.log('FlowchartEditor: loading initialEdges:', initialEdges.length);
      // Filter out invalid edges (those with null/undefined source/target/handles)
      const validEdges = initialEdges.filter(edge => {
        const isValid = edge.source && edge.target && edge.sourceHandle && edge.targetHandle;
        if (!isValid) {
          console.warn('FlowchartEditor: invalid edge:', edge);
        }
        return isValid;
      });
      if (validEdges.length !== initialEdges.length) {
        console.warn('FlowchartEditor: filtered out invalid edges:', initialEdges.length - validEdges.length);
      }
      setEdges(validEdges);
      hasLoadedInitialEdges.current = true;
    }
  }, [initialEdges]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync edges to parent component whenever they change
  useEffect(() => {
    console.log('FlowchartEditor: edges changed:', edges.length);
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
  const updateEdgeStyle = useCallback((edgeId: string, type: 'straight' | 'smoothstep' | 'step' | 'default') => {
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
    setSelectedEdge(null);
  }, [setEdges, setHasUnsavedChanges]);

  // Define custom node types
  const nodeTypes = useMemo(() => ({ stepNode: StepNode }), []);

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
        minZoom={0.5}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: zoom / 100 }}
        nodesDraggable={isEditMode}
        nodesConnectable={isEditMode}
        edgesUpdatable={isEditMode}
        edgesFocusable={isEditMode}
        elementsSelectable={isEditMode}
        snapToGrid={isEditMode}
        snapGrid={[gridSize, gridSize]}
        connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
        onPaneClick={() => setSelectedEdge(null)}
      >
        {isEditMode && (
          <>
            <Background variant={BackgroundVariant.Dots} gap={gridSize} size={1} color="#6366f1" />
            <Controls />
          </>
        )}
      </ReactFlow>

      {/* Debug info */}
      {isEditMode && (
        <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs p-2 rounded z-50">
          Edges: {edges.length} | Nodes: {nodes.length}
        </div>
      )}

      {/* Edge style selector */}
      {isEditMode && selectedEdge && (
        <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-blue-500 p-4 z-50 min-w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Line Style</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedEdge(null)}
              className="h-6 w-6 p-0"
            >
              ✕
            </Button>
          </div>

          <div className="space-y-2">
            <Button
              variant={selectedEdge.type === 'smoothstep' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateEdgeStyle(selectedEdge.id, 'smoothstep')}
              className="w-full justify-start gap-2"
            >
              <Workflow className="h-4 w-4" />
              Smooth Bends (90°)
            </Button>

            <Button
              variant={selectedEdge.type === 'step' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateEdgeStyle(selectedEdge.id, 'step')}
              className="w-full justify-start gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Sharp Bends (90°)
            </Button>

            <Button
              variant={selectedEdge.type === 'straight' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateEdgeStyle(selectedEdge.id, 'straight')}
              className="w-full justify-start gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              Straight Line
            </Button>

            <Button
              variant={selectedEdge.type === 'default' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateEdgeStyle(selectedEdge.id, 'default')}
              className="w-full justify-start gap-2"
            >
              <Copy className="h-4 w-4" />
              Curved Line
            </Button>
          </div>

          <div className="mt-3 pt-3 border-t">
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
