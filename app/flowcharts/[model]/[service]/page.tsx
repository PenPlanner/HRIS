"use client"

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Maximize2, Minimize2, ChevronRight, ChevronLeft, ZoomIn, ZoomOut, Edit, Eye, Save, Plus, FileDown, FileUp, Grid3x3 } from "lucide-react";
import { getAllFlowcharts, FlowchartData, FlowchartStep, saveFlowchart, exportFlowchartJSON, generateStepId, generateTaskId, loadCustomFlowcharts } from "@/lib/flowchart-data";
import { FlowchartStep as FlowchartStepComponent } from "@/components/flowchart/flowchart-step";
import { StepDetailDrawer } from "@/components/flowchart/step-detail-drawer";
import { ProgressTracker } from "@/components/flowchart/progress-tracker";
import { FlowchartEditor } from "@/components/flowchart/flowchart-editor";
import { StepEditorDialog } from "@/components/flowchart/step-editor-dialog";

// Dynamically import PDFImportDialog to avoid SSR issues with pdfjs-dist
const PDFImportDialog = dynamic(
  () => import("@/components/flowchart/pdf-import-dialog").then(mod => mod.PDFImportDialog),
  { ssr: false }
);

export default function FlowchartViewerPage() {
  const params = useParams();
  const router = useRouter();
  const modelId = params.model as string;
  const serviceId = params.service as string;

  // All state declarations first
  const [flowchartData, setFlowchartData] = useState<FlowchartData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showProgressTracker, setShowProgressTracker] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [isEditMode, setIsEditMode] = useState(false);
  const [gridSize, setGridSize] = useState(30);

  // State for progress tracking (view mode only)
  const [steps, setSteps] = useState<FlowchartStep[]>([]);
  const [selectedStep, setSelectedStep] = useState<FlowchartStep | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // State for edit mode (separate from view mode progress)
  const [editSteps, setEditSteps] = useState<FlowchartStep[]>([]);
  const [editingStep, setEditingStep] = useState<FlowchartStep | null>(null);
  const [stepEditorOpen, setStepEditorOpen] = useState(false);
  const [pdfImportOpen, setPdfImportOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load flowchart data
  useEffect(() => {
    const allModels = getAllFlowcharts();
    const model = allModels.find(m => m.id === modelId);
    if (!model) {
      setFlowchartData(null);
      return;
    }
    const flowchart = model.flowcharts.find(f => f.id === serviceId);
    setFlowchartData(flowchart || null);
  }, [modelId, serviceId]);

  // Calculate grid dimensions and connections
  const gridInfo = useMemo(() => {
    if (!flowchartData) return { rows: 0, cols: 0, minY: 0, maxY: 0, connections: [] };

    const positions = flowchartData.steps.map(s => s.position);
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));
    const maxX = Math.max(...positions.map(p => p.x));

    // Calculate connections between steps (arrows)
    const connections: Array<{from: number, to: number}> = [];
    for (let i = 0; i < flowchartData.steps.length - 1; i++) {
      connections.push({ from: i, to: i + 1 });
    }

    return {
      rows: maxY - minY + 1,
      cols: maxX + 1,
      minY,
      maxY,
      connections
    };
  }, [flowchartData]);

  // Load progress from localStorage
  useEffect(() => {
    if (!flowchartData) return;

    const storageKey = `flowchart_${modelId}_${serviceId}`;
    const savedData = localStorage.getItem(storageKey);

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // ALWAYS use original positions from flowchartData
        // Only merge task completion status from localStorage
        const mergedSteps = flowchartData.steps.map((originalStep) => {
          const savedStep = parsed.steps?.find((s: FlowchartStep) => s.id === originalStep.id);
          if (savedStep && savedStep.tasks) {
            // Keep ALL original step data (including position)
            // Only update task completion status
            return {
              ...originalStep,
              tasks: originalStep.tasks.map((originalTask) => {
                const savedTask = savedStep.tasks.find((t) => t.id === originalTask.id);
                if (savedTask) {
                  // Only copy completion-related fields
                  return {
                    ...originalTask,
                    completed: savedTask.completed,
                    completedAt: savedTask.completedAt,
                    startTime: savedTask.startTime,
                    endTime: savedTask.endTime
                  };
                }
                return originalTask;
              })
            };
          }
          return originalStep;
        });
        setSteps(mergedSteps);
      } catch (e) {
        console.error("Failed to load progress:", e);
        setSteps(flowchartData.steps);
      }
    } else {
      setSteps(flowchartData.steps);
    }
  }, [flowchartData, modelId, serviceId]);

  // Save progress to localStorage
  useEffect(() => {
    if (!flowchartData || steps.length === 0) return;

    const storageKey = `flowchart_${modelId}_${serviceId}`;
    const dataToSave = {
      steps,
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  }, [steps, modelId, serviceId, flowchartData]);

  // Calculate progress metrics
  const progressMetrics = useMemo(() => {
    const completedSteps = steps.filter(step =>
      step.tasks.every(task => task.completed)
    ).length;

    const totalTasks = steps.reduce((sum, step) => sum + step.tasks.length, 0);
    const completedTasks = steps.reduce((sum, step) =>
      sum + step.tasks.filter(task => task.completed).length, 0
    );

    return {
      completedSteps,
      totalSteps: steps.length,
      completedTasks,
      totalTasks
    };
  }, [steps]);

  // Handle task toggle
  const handleTaskToggle = (taskId: string) => {
    if (!selectedStep) return;

    setSteps(prevSteps =>
      prevSteps.map(step => {
        if (step.id !== selectedStep.id) return step;

        return {
          ...step,
          tasks: step.tasks.map(task => {
            if (task.id !== taskId) return task;

            return {
              ...task,
              completed: !task.completed,
              completedAt: !task.completed ? new Date().toISOString() : undefined
            };
          })
        };
      })
    );

    // Update selected step
    setSelectedStep(prev => {
      if (!prev) return null;
      return {
        ...prev,
        tasks: prev.tasks.map(task => {
          if (task.id !== taskId) return task;
          return {
            ...task,
            completed: !task.completed,
            completedAt: !task.completed ? new Date().toISOString() : undefined
          };
        })
      };
    });
  };

  // Handle step click
  const handleStepClick = (step: FlowchartStep) => {
    const updatedStep = steps.find(s => s.id === step.id) || step;
    setSelectedStep(updatedStep);
    setDrawerOpen(true);
  };

  // Handle reset progress
  const handleResetProgress = () => {
    if (!flowchartData) return;

    const confirmed = window.confirm("Are you sure you want to reset all progress? This cannot be undone.");
    if (!confirmed) return;

    // Reset all state
    setSteps(flowchartData.steps);

    // Clear localStorage
    const storageKey = `flowchart_${modelId}_${serviceId}`;
    localStorage.removeItem(storageKey);
  };

  // Edit mode handlers
  const handleSaveFlowchart = () => {
    if (!flowchartData) return;

    const updatedFlowchart: FlowchartData = {
      ...flowchartData,
      steps: editSteps
    };

    saveFlowchart(updatedFlowchart);
    setHasUnsavedChanges(false);

    // Reload flowchartData after save
    const allModels = getAllFlowcharts();
    const model = allModels.find(m => m.id === modelId);
    if (model) {
      const flowchart = model.flowcharts.find(f => f.id === serviceId);
      if (flowchart) {
        setFlowchartData(flowchart);
        setEditSteps([...flowchart.steps]);
      }
    }

    alert("Flowchart saved successfully!");
  };

  const handleAddStep = () => {
    const newStep: FlowchartStep = {
      id: generateStepId(),
      title: "New Step",
      duration: "60m",
      durationMinutes: 60,
      color: "#2196F3",
      colorCode: "New",
      technician: "both",
      position: { x: 0, y: 0 },
      tasks: [
        {
          id: generateTaskId(),
          description: "Task 1",
          completed: false
        }
      ]
    };

    setEditSteps([...editSteps, newStep]);
    setHasUnsavedChanges(true);
  };

  const handleEditStep = (step: FlowchartStep) => {
    setEditingStep(step);
    setStepEditorOpen(true);
  };

  const handleSaveStep = (updatedStep: FlowchartStep) => {
    setEditSteps(editSteps.map(s => s.id === updatedStep.id ? updatedStep : s));
    setHasUnsavedChanges(true);
  };

  const handleStepsChange = (newSteps: FlowchartStep[]) => {
    setEditSteps(newSteps);
    setHasUnsavedChanges(true);
  };

  const handlePDFImport = (importedFlowchart: FlowchartData) => {
    // Save the imported flowchart
    saveFlowchart(importedFlowchart);

    // Navigate to the new flowchart
    const newModelId = importedFlowchart.model.toLowerCase().replace(/\s+/g, "-");
    router.push(`/flowcharts/${newModelId}/${importedFlowchart.id}`);
  };

  const handleExportFlowchart = () => {
    if (!flowchartData) return;

    const exportData: FlowchartData = {
      ...flowchartData,
      steps: isEditMode ? editSteps : steps
    };

    exportFlowchartJSON(exportData);
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      // Exiting edit mode
      if (hasUnsavedChanges) {
        if (!confirm("You have unsaved changes. Do you want to discard them?")) {
          return;
        }
        setHasUnsavedChanges(false);
      }
      setIsEditMode(false);
    } else {
      // Entering edit mode - always start fresh from flowchartData
      if (flowchartData) {
        const freshSteps = [...flowchartData.steps];
        console.log("Entering edit mode with steps:", freshSteps.map(s => ({
          id: s.id,
          title: s.title.substring(0, 20),
          position: s.position
        })));
        setEditSteps(freshSteps);
      }
      setHasUnsavedChanges(false);
      setIsEditMode(true);
    }
  };

  if (!flowchartData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Flowchart not found</p>
          <Button onClick={() => router.push("/flowcharts")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Flowcharts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between bg-background">
          <div className="flex items-center gap-4">
            {!isFullscreen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/flowcharts")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{flowchartData.model}</h1>
                {flowchartData.isCustom && (
                  <Badge variant="secondary">Custom</Badge>
                )}
                {hasUnsavedChanges && isEditMode && (
                  <Badge variant="destructive">Unsaved</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{flowchartData.serviceType}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Edit Mode Controls */}
            {isEditMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddStep}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>

                {/* Grid Size Selector */}
                <div className="flex items-center gap-2 border rounded-md px-3 py-1">
                  <Grid3x3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Grid:</span>
                  <Select value={gridSize.toString()} onValueChange={(v) => setGridSize(Number(v))}>
                    <SelectTrigger className="h-7 w-[70px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20px</SelectItem>
                      <SelectItem value="30">30px</SelectItem>
                      <SelectItem value="40">40px</SelectItem>
                      <SelectItem value="50">50px</SelectItem>
                      <SelectItem value="60">60px</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPdfImportOpen(true)}
                >
                  <FileUp className="h-4 w-4 mr-2" />
                  Import PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportFlowchart}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveFlowchart}
                  disabled={!hasUnsavedChanges}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleEditMode}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Mode
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleEditMode}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Mode
              </Button>
            )}

            {/* Zoom Controls */}
            {!isEditMode && (
            <div className="flex items-center gap-1 border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                disabled={zoom <= 50}
                className="h-8 px-2"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs font-mono px-2 min-w-[50px] text-center">{zoom}%</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.min(150, zoom + 10))}
                disabled={zoom >= 150}
                className="h-8 px-2"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProgressTracker(!showProgressTracker)}
            >
              {showProgressTracker ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Flowchart Area */}
        {isEditMode ? (
          // Edit Mode - Show Editor
          <DndProvider backend={HTML5Backend}>
            <FlowchartEditor
              steps={editSteps}
              onStepsChange={handleStepsChange}
              onEditStep={handleEditStep}
              onAddStep={handleAddStep}
              zoom={zoom}
              gridSize={gridSize}
            />
          </DndProvider>
        ) : (
          // View Mode - Show Normal Flowchart
          <div
          className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-4"
          onWheel={(e) => {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              const delta = e.deltaY;
              if (delta < 0) {
                setZoom(Math.min(150, zoom + 5));
              } else {
                setZoom(Math.max(50, zoom - 5));
              }
            }
          }}
        >
          <div
            className="relative flex gap-6 items-center"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
              padding: '20px',
              minWidth: 'max-content'
            }}
          >
            {/* Group steps by x position (column) */}
            {Array.from({ length: gridInfo.cols }, (_, colIndex) => {
              const stepsInColumn = steps.filter(s => s.position.x === colIndex);
              if (stepsInColumn.length === 0) return null;

              // Sort by y position
              stepsInColumn.sort((a, b) => a.position.y - b.position.y);

              return (
                <div key={`col-${colIndex}`} className="flex flex-col gap-4">
                  {stepsInColumn.map((step) => {
                    const stepTasks = step.tasks;
                    const completedTaskCount = stepTasks.filter(t => t.completed).length;

                    return (
                      <FlowchartStepComponent
                        key={step.id}
                        step={step}
                        onClick={() => handleStepClick(step)}
                        completedTasks={completedTaskCount}
                        totalTasks={stepTasks.length}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        )}
      </div>

      {/* Progress Tracker Sidebar */}
      {showProgressTracker && (
        <div className="w-64 border-l bg-background overflow-y-auto">
          <div className="p-4">
            <ProgressTracker
              flowchart={flowchartData}
              completedSteps={progressMetrics.completedSteps}
              totalSteps={progressMetrics.totalSteps}
              completedTasks={progressMetrics.completedTasks}
              totalTasks={progressMetrics.totalTasks}
              elapsedTime="00:00:00"
              onResetProgress={handleResetProgress}
            />
          </div>
        </div>
      )}

      {/* Step Detail Drawer */}
      <StepDetailDrawer
        step={selectedStep}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onTaskToggle={handleTaskToggle}
        onStartStep={() => {}}
        onCompleteStep={() => setDrawerOpen(false)}
        isStepRunning={false}
        stepStartTime={null}
        elapsedTime="00:00:00"
      />

      {/* Step Editor Dialog */}
      <StepEditorDialog
        step={editingStep}
        open={stepEditorOpen}
        onOpenChange={setStepEditorOpen}
        onSave={handleSaveStep}
      />

      {/* PDF Import Dialog */}
      <PDFImportDialog
        open={pdfImportOpen}
        onOpenChange={setPdfImportOpen}
        onImport={handlePDFImport}
      />
    </div>
  );
}
