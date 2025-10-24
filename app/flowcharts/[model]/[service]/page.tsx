"use client"

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Maximize2, Minimize2, ChevronRight, ChevronLeft, ZoomIn, ZoomOut, Edit, Eye, Save, Plus, FileDown, FileUp, Grid3x3, Wand2 } from "lucide-react";
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

  // State for steps (used for both view and edit mode)
  const [steps, setSteps] = useState<FlowchartStep[]>([]);
  const [selectedStep, setSelectedStep] = useState<FlowchartStep | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // State for edit mode
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

    // If no saved data exists, auto-arrange on first load
    if (!savedData) {
      console.log('No saved data found - will auto-arrange on first load');

      // HORIZONTAL LAYOUT: Flow goes LEFT to RIGHT, parallel steps stack VERTICALLY
      // Box width is ~200px, so we need x spacing of ~9 grid units (at 30px grid) for horizontal separation
      // Box height is ~140px, so we need y spacing of ~8 grid units for vertical separation
      const arrangedSteps: FlowchartStep[] = [];
      const standalone4YSteps: FlowchartStep[] = []; // Separate array for 4Y bolts
      let currentCol = 0; // Horizontal position (steps go left to right)
      const COL_SPACING = 9; // 9 * 30px = 270px horizontal spacing (close to 260px)
      const ROW_SPACING = 8; // 8 * 30px = 240px vertical spacing (more separation for stacked boxes)
      const BASELINE_Y = 5; // Start 5 grid units down from top (150px from top)
      let stepNumber = 1; // For automatic step numbering
      let i = 0;

      while (i < flowchartData.steps.length) {
        const currentStep = flowchartData.steps[i];
        const nextStep = flowchartData.steps[i + 1];

        // Check if this is the "4Y bolts" standalone step (ONLY the one with "4Y bolts" in title)
        const is4YOnly = currentStep.title.includes("4Y bolts");

        // Check if current and next steps should be parallel (consecutive T1 & T2)
        const isParallel = nextStep &&
          !is4YOnly &&
          ((currentStep.technician === "T1" && nextStep.technician === "T2") ||
           (currentStep.technician === "T2" && nextStep.technician === "T1"));

        if (is4YOnly) {
          // 4Y bolts - add to separate array, will be placed at bottom later
          standalone4YSteps.push({
            ...currentStep,
            colorCode: "4Y Only"
          });
          console.log(`4Y Only step found - will place at bottom: ${currentStep.title.substring(0, 30)}`);
          i++;
        } else if (isParallel) {
          // Place parallel steps stacked VERTICALLY at same x position
          const leftStep = currentStep.technician === "T1" ? currentStep : nextStep;
          const rightStep = currentStep.technician === "T1" ? nextStep : currentStep;

          arrangedSteps.push({
            ...leftStep,
            position: { x: currentCol, y: BASELINE_Y }, // Top position
            colorCode: `${stepNumber}.1` // e.g., "2.1"
          });
          arrangedSteps.push({
            ...rightStep,
            position: { x: currentCol, y: BASELINE_Y + ROW_SPACING }, // Below, stacked vertically
            colorCode: `${stepNumber}.2` // e.g., "2.2"
          });
          console.log(`Col ${currentCol}: Step ${stepNumber}.1 (top) | ${stepNumber}.2 (bottom)`);

          stepNumber++;
          currentCol += COL_SPACING; // Move to next column
          i += 2; // Skip both steps
        } else {
          // Single step - place at baseline of current column
          arrangedSteps.push({
            ...currentStep,
            position: { x: currentCol, y: BASELINE_Y },
            colorCode: `${stepNumber}` // e.g., "1", "3"
          });
          console.log(`Col ${currentCol}: Step ${stepNumber} - ${currentStep.title.substring(0, 30)}`);

          stepNumber++;
          currentCol += COL_SPACING; // Move to next column
          i++;
        }
      }

      // Place 4Y bolts steps at bottom, separate from main flow
      standalone4YSteps.forEach((step, index) => {
        arrangedSteps.push({
          ...step,
          position: { x: index * COL_SPACING, y: BASELINE_Y + (ROW_SPACING * 3) } // 3 rows below baseline
        });
        console.log(`4Y Only at bottom: x=${index * COL_SPACING}, y=${BASELINE_Y + (ROW_SPACING * 3)}`);
      });

      console.log('First load - auto-arranged steps sequentially');
      setSteps(arrangedSteps);

      // Save the arranged positions
      localStorage.setItem(storageKey, JSON.stringify({
        steps: arrangedSteps,
        lastUpdated: new Date().toISOString()
      }));
      return;
    }

    // Clear old corrupted data (temporary fix)
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Check if data has corrupted positions (all steps at 0,0)
        if (parsed.steps && parsed.steps.length > 1) {
          const allAtZero = parsed.steps.every((s: FlowchartStep) => s.position?.x === 0 && s.position?.y === 0);
          if (allAtZero) {
            console.log('Clearing corrupted localStorage data');
            localStorage.removeItem(storageKey);
            setSteps(flowchartData.steps);
            return;
          }
        }
      } catch (e) {
        // Invalid JSON, clear it
        localStorage.removeItem(storageKey);
      }
    }

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Merge task completion AND positions from localStorage
        const mergedSteps = flowchartData.steps.map((originalStep) => {
          const savedStep = parsed.steps?.find((s: FlowchartStep) => s.id === originalStep.id);
          if (savedStep) {
            return {
              ...originalStep,
              // Use saved position if it exists, otherwise use original
              position: savedStep.position || originalStep.position,
              // Merge task completion status
              tasks: originalStep.tasks.map((originalTask) => {
                const savedTask = savedStep.tasks?.find((t: any) => t.id === originalTask.id);
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

        console.log("Loaded from localStorage with merged positions");
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

  // Auto-layout handler - intelligently arrange steps based on flowchart pattern
  const handleAutoLayout = () => {
    if (!confirm("Auto-arrange all steps based on their sequence? This will reset all positions.")) {
      return;
    }

    console.log("Starting auto-layout with steps:", steps.length);

    // HORIZONTAL LAYOUT: Flow goes LEFT to RIGHT, parallel steps stack VERTICALLY
    // Box width is ~200px, so we need x spacing of ~9 grid units (at 30px grid) for horizontal separation
    // Box height is ~140px, so we need y spacing of ~8 grid units for vertical separation
    const arrangedSteps: FlowchartStep[] = [];
    const standalone4YSteps: FlowchartStep[] = []; // Separate array for 4Y bolts
    let currentCol = 0; // Horizontal position (steps go left to right)
    const COL_SPACING = 9; // 9 * 30px = 270px horizontal spacing (close to 260px)
    const ROW_SPACING = 8; // 8 * 30px = 240px vertical spacing (more separation for stacked boxes)
    const BASELINE_Y = 5; // Start 5 grid units down from top (150px from top)
    let stepNumber = 1; // For automatic step numbering
    let i = 0;

    while (i < steps.length) {
      const currentStep = steps[i];
      const nextStep = steps[i + 1];

      // Check if this is the "4Y bolts" standalone step (ONLY the one with "4Y bolts" in title)
      const is4YOnly = currentStep.title.includes("4Y bolts") || currentStep.colorCode === "4Y Only";

      // Check if current and next steps should be parallel (consecutive T1 & T2)
      const isParallel = nextStep &&
        !is4YOnly &&
        ((currentStep.technician === "T1" && nextStep.technician === "T2") ||
         (currentStep.technician === "T2" && nextStep.technician === "T1"));

      if (is4YOnly) {
        // 4Y bolts - add to separate array, will be placed at bottom later
        standalone4YSteps.push({
          ...currentStep,
          colorCode: "4Y Only"
        });
        console.log(`4Y Only step found - will place at bottom: ${currentStep.title.substring(0, 30)}`);
        i++;
      } else if (isParallel) {
        // Place parallel steps stacked VERTICALLY at same x position
        const leftStep = currentStep.technician === "T1" ? currentStep : nextStep;
        const rightStep = currentStep.technician === "T1" ? nextStep : currentStep;

        arrangedSteps.push({
          ...leftStep,
          position: { x: currentCol, y: BASELINE_Y }, // Top position
          colorCode: `${stepNumber}.1` // e.g., "2.1"
        });
        arrangedSteps.push({
          ...rightStep,
          position: { x: currentCol, y: BASELINE_Y + ROW_SPACING }, // Below, stacked vertically
          colorCode: `${stepNumber}.2` // e.g., "2.2"
        });
        console.log(`Col ${currentCol}: Step ${stepNumber}.1 (top) | ${stepNumber}.2 (bottom)`);

        stepNumber++;
        currentCol += COL_SPACING; // Move to next column
        i += 2; // Skip both steps
      } else {
        // Single step - place at baseline of current column
        arrangedSteps.push({
          ...currentStep,
          position: { x: currentCol, y: BASELINE_Y },
          colorCode: `${stepNumber}` // e.g., "1", "3"
        });
        console.log(`Col ${currentCol}: Step ${stepNumber} - ${currentStep.title.substring(0, 30)}`);

        stepNumber++;
        currentCol += COL_SPACING; // Move to next column
        i++;
      }
    }

    // Place 4Y bolts steps at bottom, separate from main flow
    standalone4YSteps.forEach((step, index) => {
      arrangedSteps.push({
        ...step,
        position: { x: index * COL_SPACING, y: BASELINE_Y + (ROW_SPACING * 3) } // 3 rows below baseline
      });
      console.log(`4Y Only at bottom: x=${index * COL_SPACING}, y=${BASELINE_Y + (ROW_SPACING * 3)}`);
    });

    console.log("Auto-layout complete. New positions:", arrangedSteps.map(s => ({ title: s.title.substring(0, 20), pos: s.position })));

    // IMPORTANT: Save positions to localStorage BEFORE updating state
    // This prevents the load effect from overwriting with original positions
    const storageKey = `flowchart_${modelId}_${serviceId}`;
    const dataToSave = {
      steps: arrangedSteps,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    console.log("Saved new positions to localStorage");

    // Update state with new positions
    setSteps(arrangedSteps);
    setHasUnsavedChanges(true);

    // Remove this flowchart from custom_flowcharts if it exists
    // (so it doesn't override with old saved positions)
    try {
      const customFlowcharts = localStorage.getItem('custom_flowcharts');
      if (customFlowcharts) {
        const parsed = JSON.parse(customFlowcharts);
        if (parsed[serviceId]) {
          delete parsed[serviceId];
          localStorage.setItem('custom_flowcharts', JSON.stringify(parsed));
          console.log("Removed from custom_flowcharts to use new auto-layout positions");
        }
      }
    } catch (e) {
      console.error("Failed to clean custom_flowcharts:", e);
    }

    alert("Layout updated! Click 'Save' to keep these positions permanently.");
  };

  // Edit mode handlers
  const handleSaveFlowchart = () => {
    if (!flowchartData) return;

    const updatedFlowchart: FlowchartData = {
      ...flowchartData,
      steps
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

    setSteps([...steps, newStep]);
    setHasUnsavedChanges(true);
  };

  const handleEditStep = (step: FlowchartStep) => {
    setEditingStep(step);
    setStepEditorOpen(true);
  };

  const handleSaveStep = (updatedStep: FlowchartStep) => {
    setSteps(steps.map(s => s.id === updatedStep.id ? updatedStep : s));
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
      steps
    };

    exportFlowchartJSON(exportData);
  };

  const toggleEditMode = () => {
    if (isEditMode && hasUnsavedChanges) {
      if (!confirm("You have unsaved changes. Do you want to discard them?")) {
        return;
      }
      // Reload steps from flowchartData
      if (flowchartData) {
        setSteps([...flowchartData.steps]);
      }
      setHasUnsavedChanges(false);
    }
    setIsEditMode(!isEditMode);
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
                  onClick={handleAutoLayout}
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Auto-Layout
                </Button>

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

        {/* Flowchart Area - Unified View with Optional Edit Mode */}
        <DndProvider backend={HTML5Backend}>
          <FlowchartEditor
            steps={steps}
            onStepsChange={setSteps}
            onEditStep={handleEditStep}
            onAddStep={handleAddStep}
            onStepClick={handleStepClick}
            zoom={zoom}
            gridSize={gridSize}
            isEditMode={isEditMode}
            setHasUnsavedChanges={setHasUnsavedChanges}
          />
        </DndProvider>
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
