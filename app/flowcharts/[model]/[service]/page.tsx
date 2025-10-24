"use client"

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Maximize2, Minimize2, ChevronRight, ChevronLeft, ZoomIn, ZoomOut } from "lucide-react";
import { TURBINE_MODELS, FlowchartData, FlowchartStep } from "@/lib/flowchart-data";
import { FlowchartStep as FlowchartStepComponent } from "@/components/flowchart/flowchart-step";
import { StepDetailDrawer } from "@/components/flowchart/step-detail-drawer";
import { ProgressTracker } from "@/components/flowchart/progress-tracker";

export default function FlowchartViewerPage() {
  const params = useParams();
  const router = useRouter();
  const modelId = params.model as string;
  const serviceId = params.service as string;

  // Find the flowchart data
  const flowchartData = useMemo(() => {
    const model = TURBINE_MODELS.find(m => m.id === modelId);
    if (!model) return null;
    return model.flowcharts.find(f => f.id === serviceId);
  }, [modelId, serviceId]);

  // State for UI
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showProgressTracker, setShowProgressTracker] = useState(true);
  const [zoom, setZoom] = useState(100);

  // State for progress tracking
  const [steps, setSteps] = useState<FlowchartStep[]>([]);
  const [selectedStep, setSelectedStep] = useState<FlowchartStep | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
        setSteps(parsed.steps || flowchartData.steps);
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
              <h1 className="text-xl font-bold">{flowchartData.model}</h1>
              <p className="text-sm text-muted-foreground">{flowchartData.serviceType}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
    </div>
  );
}
