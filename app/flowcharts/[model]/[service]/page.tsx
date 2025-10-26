"use client"

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Maximize2, Minimize2, ChevronRight, ChevronLeft, ZoomIn, ZoomOut, Edit, Eye, Save, Plus, FileDown, FileUp, Wand2, Clock, Trash2, Grid3x3 } from "lucide-react";
import { getAllFlowcharts, FlowchartData, FlowchartStep, saveFlowchart, exportFlowchartJSON, generateStepId, generateTaskId, loadCustomFlowcharts } from "@/lib/flowchart-data";
import { SERVICE_TYPE_COLORS, getIncludedServiceTypes, SERVICE_TYPE_LEGEND } from "@/lib/service-colors";
import { FlowchartStep as FlowchartStepComponent } from "@/components/flowchart/flowchart-step";
import { StepDetailDrawer } from "@/components/flowchart/step-detail-drawer";
import { ProgressTracker } from "@/components/flowchart/progress-tracker";
import { FlowchartEditor } from "@/components/flowchart/flowchart-editor";
import { StepEditorDialog } from "@/components/flowchart/step-editor-dialog";
import { extractSIIReferences } from "@/lib/sii-documents";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { OfflineStatusIndicator } from "@/components/offline-status-indicator";

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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [hideCompletedSteps, setHideCompletedSteps] = useState(false);

  // State for steps (used for both view and edit mode)
  const [steps, setSteps] = useState<FlowchartStep[]>([]);
  const [edges, setEdges] = useState<any[]>([]); // React Flow edges
  const [selectedStep, setSelectedStep] = useState<FlowchartStep | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // State for edit mode
  const [editingStep, setEditingStep] = useState<FlowchartStep | null>(null);
  const [stepEditorOpen, setStepEditorOpen] = useState(false);
  const [pdfImportOpen, setPdfImportOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // State for time reminder dialog
  const [timeReminderOpen, setTimeReminderOpen] = useState(false);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [pendingTimeMinutes, setPendingTimeMinutes] = useState<number | undefined>(undefined);

  // State for service type filtering
  const [selectedServiceType, setSelectedServiceType] = useState<string>("all");

  // State for free positioning (disables grid snap)
  const [freePositioning, setFreePositioning] = useState(false);

  // State for layout mode
  const [layoutMode, setLayoutMode] = useState<'topdown' | 'centered'>('centered');

  // Auto-hide Progress Tracker when entering Edit Mode
  useEffect(() => {
    if (isEditMode) {
      setShowProgressTracker(false);
    }
  }, [isEditMode]);

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
      // Box width is 300px (10 grid units), so we need x spacing of 14 grid units (420px) for horizontal separation
      // Box height is 180px (6 grid units), so we need y spacing of 8 grid units (240px) for vertical separation
      const arrangedSteps: FlowchartStep[] = [];
      const standalone4YSteps: FlowchartStep[] = []; // Separate array for 4Y bolts
      let currentCol = 0; // Horizontal position (steps go left to right)
      const COL_SPACING = 14; // 14 * 30px = 420px horizontal spacing (for 300px wide cards)
      const ROW_SPACING = 8; // 8 * 30px = 240px vertical spacing (for 180px tall cards)
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
        edges: [],
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

        // VERSION CHECK: Verify task counts match
        // If saved data has different number of tasks, clear it and use fresh data
        console.log('=== VERSION CHECK START ===');
        console.log('Checking localStorage key:', storageKey);
        let taskCountMismatch = false;
        for (const originalStep of flowchartData.steps) {
          const savedStep = parsed.steps?.find((s: FlowchartStep) => s.id === originalStep.id);
          console.log(`Step ${originalStep.id}: saved=${savedStep?.tasks?.length || 'N/A'}, current=${originalStep.tasks.length}`);
          if (savedStep && savedStep.tasks?.length !== originalStep.tasks.length) {
            console.log(`❌ MISMATCH for ${originalStep.id}: saved=${savedStep.tasks?.length}, current=${originalStep.tasks.length}`);
            taskCountMismatch = true;
            break;
          }
        }

        if (taskCountMismatch) {
          console.log('🔥 Clearing outdated localStorage data due to task count mismatch');
          localStorage.removeItem(storageKey);
          setSteps(flowchartData.steps);
          console.log('✅ Using fresh data from code');
          return;
        }
        console.log('✅ Task counts match, using localStorage data');
        console.log('=== VERSION CHECK END ===');

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
        setEdges(parsed.edges || []);
      } catch (e) {
        console.error("Failed to load progress:", e);
        setSteps(flowchartData.steps);
        setEdges([]);
      }
    } else {
      // No saved data, check if there's a default layout saved
      const defaultLayoutKey = `default-layout-${flowchartData.id}`;
      const defaultLayoutData = localStorage.getItem(defaultLayoutKey);

      if (defaultLayoutData) {
        try {
          const defaultLayout = JSON.parse(defaultLayoutData);
          console.log('=== LOADING DEFAULT LAYOUT ===');
          console.log('Positions:', defaultLayout.positions?.length || 0);
          console.log('Connections:', defaultLayout.edges?.length || 0);

          // Apply default positions to steps
          const stepsWithDefaultPositions = flowchartData.steps.map((step) => {
            const savedPosition = defaultLayout.positions?.find((p: any) => p.id === step.id);
            if (savedPosition) {
              return { ...step, position: savedPosition.position };
            }
            return step;
          });

          setSteps(stepsWithDefaultPositions);
          setEdges(defaultLayout.edges || []);
        } catch (e) {
          console.error("Failed to load default layout:", e);
          setSteps(flowchartData.steps);
          setEdges([]);
        }
      } else {
        // No default layout either, use original data
        setSteps(flowchartData.steps);
        setEdges([]);
      }
    }
  }, [flowchartData, modelId, serviceId]);

  // Save progress to localStorage
  useEffect(() => {
    if (!flowchartData || steps.length === 0) return;

    const storageKey = `flowchart_${modelId}_${serviceId}`;
    const dataToSave = {
      steps,
      edges,
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  }, [steps, edges, modelId, serviceId, flowchartData]);


  // Calculate progress metrics
  const progressMetrics = useMemo(() => {
    const completedSteps = steps.filter(step =>
      step.tasks.every(task => task.completed)
    ).length;

    const totalTasks = steps.reduce((sum, step) => sum + step.tasks.length, 0);
    const completedTasks = steps.reduce((sum, step) =>
      sum + step.tasks.filter(task => task.completed).length, 0
    );

    // Calculate total actual time from all tasks (in seconds for compatibility with ProgressTracker)
    const totalActualTimeMinutes = steps.reduce((stepSum, step) => {
      const stepTasksTime = step.tasks.reduce((taskSum, task) => {
        return taskSum + (task.actualTimeMinutes || 0);
      }, 0);
      return stepSum + stepTasksTime;
    }, 0);

    const totalActualTimeSeconds = totalActualTimeMinutes * 60;

    return {
      completedSteps,
      totalSteps: steps.length,
      completedTasks,
      totalTasks,
      totalActualTimeSeconds
    };
  }, [steps]);

  // Handle task toggle
  const handleTaskToggle = (taskId: string) => {
    if (!selectedStep) return;

    // Find the task being toggled
    const task = selectedStep.tasks.find(t => t.id === taskId);
    if (!task) return;

    // If checking off a task (completing it) and no time is logged, show reminder
    if (!task.completed && !task.actualTimeMinutes) {
      setPendingTaskId(taskId);
      setTimeReminderOpen(true);
      return;
    }

    // Proceed with toggle
    performTaskToggle(taskId);
  };

  // Perform the actual task toggle
  const performTaskToggle = (taskId: string) => {
    if (!selectedStep) return;

    setSteps(prevSteps =>
      prevSteps.map(step => {
        if (step.id !== selectedStep.id) return step;

        const updatedTasks = step.tasks.map(task => {
          if (task.id !== taskId) return task;

          return {
            ...task,
            completed: !task.completed,
            completedAt: !task.completed ? new Date().toISOString() : undefined
          };
        });

        // Check only SII tasks
        const siiReferences = extractSIIReferences(updatedTasks);
        const siiTaskIds = siiReferences.map(ref =>
          updatedTasks.find(t => t.description.trim().startsWith(ref.fullReference))?.id
        ).filter(Boolean);

        // Check if all SII tasks are completed
        const allSIITasksCompleted = updatedTasks
          .filter(task => siiTaskIds.includes(task.id))
          .every(task => task.completed);

        return {
          ...step,
          tasks: updatedTasks,
          completedAt: allSIITasksCompleted && siiTaskIds.length > 0 ? new Date().toISOString() : undefined
        };
      })
    );

    // Update selected step
    setSelectedStep(prev => {
      if (!prev) return null;

      const updatedTasks = prev.tasks.map(task => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          completed: !task.completed,
          completedAt: !task.completed ? new Date().toISOString() : undefined
        };
      });

      // Check only SII tasks
      const siiReferences = extractSIIReferences(updatedTasks);
      const siiTaskIds = siiReferences.map(ref =>
        updatedTasks.find(t => t.description.trim().startsWith(ref.fullReference))?.id
      ).filter(Boolean);

      // Check if all SII tasks are completed
      const allSIITasksCompleted = updatedTasks
        .filter(task => siiTaskIds.includes(task.id))
        .every(task => task.completed);

      return {
        ...prev,
        tasks: updatedTasks,
        completedAt: allSIITasksCompleted && siiTaskIds.length > 0 ? new Date().toISOString() : undefined
      };
    });
  };

  // Handle task time change
  const handleTaskTimeChange = (taskId: string, minutes: number | undefined) => {
    setSteps(prevSteps =>
      prevSteps.map(step => ({
        ...step,
        tasks: step.tasks.map(task =>
          task.id === taskId
            ? { ...task, actualTimeMinutes: minutes }
            : task
        )
      }))
    );

    // Update selected step
    setSelectedStep(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        tasks: prev.tasks.map(task =>
          task.id === taskId
            ? { ...task, actualTimeMinutes: minutes }
            : task
        )
      };
    });
  };

  // Handle task service type change
  const handleTaskServiceTypeChange = (taskId: string, serviceType: string) => {
    setSteps(prevSteps =>
      prevSteps.map(step => ({
        ...step,
        tasks: step.tasks.map(task =>
          task.id === taskId
            ? { ...task, serviceType }
            : task
        )
      }))
    );

    // Update selected step
    setSelectedStep(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        tasks: prev.tasks.map(task =>
          task.id === taskId
            ? { ...task, serviceType }
            : task
        )
      };
    });

    setHasUnsavedChanges(true);
  };

  // Handle task description change
  const handleTaskDescriptionChange = (taskId: string, description: string) => {
    setSteps(prevSteps =>
      prevSteps.map(step => ({
        ...step,
        tasks: step.tasks.map(task =>
          task.id === taskId
            ? { ...task, description }
            : task
        )
      }))
    );

    // Update selected step
    setSelectedStep(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        tasks: prev.tasks.map(task =>
          task.id === taskId
            ? { ...task, description }
            : task
        )
      };
    });

    setHasUnsavedChanges(true);
  };

  // Handle task indent toggle
  const handleTaskIndentToggle = (taskId: string, isIndented: boolean) => {
    setSteps(prevSteps =>
      prevSteps.map(step => ({
        ...step,
        tasks: step.tasks.map(task =>
          task.id === taskId
            ? { ...task, isIndented }
            : task
        )
      }))
    );

    // Update selected step
    setSelectedStep(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        tasks: prev.tasks.map(task =>
          task.id === taskId
            ? { ...task, isIndented }
            : task
        )
      };
    });

    setHasUnsavedChanges(true);
  };

  const handleTaskNotesChange = (taskId: string, note: string) => {
    const newNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      note
    };

    setSteps(prevSteps =>
      prevSteps.map(step => ({
        ...step,
        tasks: step.tasks.map(task =>
          task.id === taskId
            ? { ...task, notes: [...(task.notes || []), newNote] }
            : task
        )
      }))
    );

    // Update selected step
    setSelectedStep(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        tasks: prev.tasks.map(task =>
          task.id === taskId
            ? { ...task, notes: [...(task.notes || []), newNote] }
            : task
        )
      };
    });
  };

  const handleTaskNoteEdit = (taskId: string, noteId: string, newText: string) => {
    const editTimestamp = new Date().toISOString();

    setSteps(prevSteps =>
      prevSteps.map(step => ({
        ...step,
        tasks: step.tasks.map(task => {
          if (task.id !== taskId) return task;

          const updatedNotes = task.notes?.map(note => {
            if (note.id !== noteId) return note;

            const currentVersion = note.edits ? note.edits.length + 1 : 1;
            const newEdit = {
              timestamp: editTimestamp,
              version: currentVersion + 1
            };

            return {
              ...note,
              note: newText,
              edits: [...(note.edits || []), newEdit]
            };
          });

          return { ...task, notes: updatedNotes };
        })
      }))
    );

    // Update selected step
    setSelectedStep(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        tasks: prev.tasks.map(task => {
          if (task.id !== taskId) return task;

          const updatedNotes = task.notes?.map(note => {
            if (note.id !== noteId) return note;

            const currentVersion = note.edits ? note.edits.length + 1 : 1;
            const newEdit = {
              timestamp: editTimestamp,
              version: currentVersion + 1
            };

            return {
              ...note,
              note: newText,
              edits: [...(note.edits || []), newEdit]
            };
          });

          return { ...task, notes: updatedNotes };
        })
      };
    });
  };

  const handleTaskNoteDelete = (taskId: string, noteId: string) => {
    setSteps(prevSteps =>
      prevSteps.map(step => ({
        ...step,
        tasks: step.tasks.map(task =>
          task.id === taskId
            ? { ...task, notes: task.notes?.filter(note => note.id !== noteId) }
            : task
        )
      }))
    );

    // Update selected step
    setSelectedStep(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        tasks: prev.tasks.map(task =>
          task.id === taskId
            ? { ...task, notes: task.notes?.filter(note => note.id !== noteId) }
            : task
        )
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

  // Clear cache and reload page
  const handleClearCache = () => {
    const confirmed = window.confirm(
      "Clear all cached data for this flowchart?\n\n" +
      "This will:\n" +
      "- Remove all progress and time logs\n" +
      "- Reset all step positions\n" +
      "- Reload the page to fresh state\n\n" +
      "This cannot be undone."
    );
    if (!confirmed) return;

    // Clear localStorage for this flowchart
    const storageKey = `flowchart_${modelId}_${serviceId}`;
    localStorage.removeItem(storageKey);

    // Reload the page to fresh state
    window.location.reload();
  };

  // Auto-layout handler - intelligently arrange steps based on flowchart pattern
  const handleAutoLayout = () => {
    if (!confirm("Auto-arrange all steps based on their sequence? This will reset all positions.")) {
      return;
    }

    console.log("Starting auto-layout with steps:", steps.length);

    // HORIZONTAL LAYOUT: Flow goes LEFT to RIGHT, parallel steps stack VERTICALLY
    // Box width is 300px (10 grid units), so we need x spacing of 14 grid units (420px) for horizontal separation
    // Box height is 180px (6 grid units), so we need y spacing of 8 grid units (240px) for vertical separation
    const arrangedSteps: FlowchartStep[] = [];
    const standalone4YSteps: FlowchartStep[] = []; // Separate array for 4Y bolts
    let currentCol = 0; // Horizontal position (steps go left to right)
    const COL_SPACING = 14; // 14 * 30px = 420px horizontal spacing (for 300px wide cards)
    const ROW_SPACING = 8; // 8 * 30px = 240px vertical spacing (for 180px tall cards)
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
      edges: edges, // Keep existing edges
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
      color: SERVICE_TYPE_COLORS.default,
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

  // Export TypeScript code to update flowchart-data.ts permanently
  const handleExportToCode = () => {
    // Generate TypeScript code for positions
    const positionCode = steps.map(step => {
      return `      // ${step.title}\n      position: { x: ${step.position.x}, y: ${step.position.y} },`;
    }).join('\n');

    const edgesCode = JSON.stringify(edges, null, 2);

    const fullCode = `
// ==========================================
// COPY THIS TO lib/flowchart-data.ts
// ==========================================

// 1. Update each step's position in the steps array:
${positionCode}

// 2. Add this edges array to FlowchartData interface if not exists:
// defaultEdges?: Edge[];

// 3. Add this to the flowchart data object (${flowchartData?.id}):
defaultEdges: ${edgesCode}

// ==========================================
// INSTRUCTIONS:
// 1. Open lib/flowchart-data.ts
// 2. Find the flowchart: ${flowchartData?.id}
// 3. Replace each step's position with the values above
// 4. Add the defaultEdges array to the data object
// ==========================================
`;

    console.log(fullCode);

    // Copy to clipboard
    navigator.clipboard.writeText(fullCode).then(() => {
      alert('✅ TypeScript code copied to clipboard!\n\nCheck the console for full code.\n\nPaste it into lib/flowchart-data.ts to make positions permanent.');
    });
  };

  // Save current layout (positions + connections) as default
  const handleSaveAsDefaultLayout = () => {
    const defaultLayoutKey = `default-layout-${flowchartData?.id}`;

    const defaultLayout = {
      positions: steps.map(step => ({
        id: step.id,
        position: step.position
      })),
      edges: edges,
      savedAt: new Date().toISOString()
    };

    localStorage.setItem(defaultLayoutKey, JSON.stringify(defaultLayout));

    console.log('=== SAVED AS DEFAULT LAYOUT ===');
    console.log('Positions:', defaultLayout.positions.length);
    console.log('Connections:', defaultLayout.edges.length);

    alert(`✅ Default layout saved!\n\n${defaultLayout.positions.length} positions\n${defaultLayout.edges.length} connections\n\nThis will load automatically next time!`);
  };

  // Export positions only (for sharing layouts)
  const handleExportPositions = () => {
    const positions = steps.map(step => ({
      id: step.id,
      title: step.title,
      position: step.position
    }));

    // Log to console
    console.log('=== FLOWCHART POSITIONS ===');
    console.table(positions);
    console.log('JSON:', JSON.stringify(positions, null, 2));

    // Download as JSON file
    const dataStr = JSON.stringify(positions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${flowchartData?.id || 'flowchart'}-positions.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert('Positions exported! Check console for details.');
  };

  // Import positions from JSON file
  const handleImportPositions = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedPositions = JSON.parse(event.target?.result as string);

          // Apply positions to matching steps
          const updatedSteps = steps.map(step => {
            const importedPos = importedPositions.find((p: any) => p.id === step.id);
            if (importedPos) {
              return { ...step, position: importedPos.position };
            }
            return step;
          });

          setSteps(updatedSteps);
          setHasUnsavedChanges(true);

          console.log('=== IMPORTED POSITIONS ===');
          console.table(importedPositions);

          alert(`Positions imported successfully for ${importedPositions.length} steps!`);
        } catch (err) {
          alert('Failed to import positions. Please check the file format.');
          console.error('Import error:', err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Re-align all boxes to grid
  const handleRealignToGrid = () => {
    if ((window as any).__flowchartRealignToGrid) {
      (window as any).__flowchartRealignToGrid();

      // Show brief confirmation toast
      setToastMessage("Boxes re-aligned to grid!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const toggleEditMode = () => {
    // Auto-save when leaving edit mode
    if (isEditMode && hasUnsavedChanges && flowchartData) {
      const updatedFlowchart: FlowchartData = {
        ...flowchartData,
        steps
      };
      saveFlowchart(updatedFlowchart);
      setHasUnsavedChanges(false);

      // Show brief confirmation toast (auto-dismiss after 3 seconds)
      setToastMessage("Changes saved automatically!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
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
        {!isFullscreen && (
        <div className="border-b px-6 py-4 bg-background">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
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
                </div>
                <p className="text-sm text-muted-foreground">{flowchartData.serviceType}</p>
              </div>
            </div>
          </div>

          {/* Controls row - wraps to multiple lines */}
          <div className="flex flex-wrap items-center gap-2">
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
                  variant="outline"
                  size="sm"
                  onClick={handleExportToCode}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-300"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Layout as Centered
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300"
                    >
                      <Grid3x3 className="h-4 w-4 mr-2" />
                      Auto Layout
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2">
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setLayoutMode('topdown');
                          // Call the specific layout function directly
                          if ((window as any).__flowchartRealignToGridTopDown) {
                            (window as any).__flowchartRealignToGridTopDown();
                            setToastMessage("Applied Top-Down layout!");
                            setShowToast(true);
                            setTimeout(() => setShowToast(false), 2000);
                          }
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-sm text-left rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                          layoutMode === 'topdown' && "bg-blue-50 dark:bg-blue-950 text-blue-600 font-medium"
                        )}
                      >
                        Top-Down
                      </button>
                      <button
                        onClick={() => {
                          setLayoutMode('centered');
                          // Call the specific layout function directly
                          if ((window as any).__flowchartRealignToGridCentered) {
                            (window as any).__flowchartRealignToGridCentered();
                            setToastMessage("Applied Centered layout!");
                            setShowToast(true);
                            setTimeout(() => setShowToast(false), 2000);
                          }
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-sm text-left rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                          layoutMode === 'centered' && "bg-blue-50 dark:bg-blue-950 text-blue-600 font-medium"
                        )}
                      >
                        Centered
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Free Positioning Toggle */}
                <label className="flex items-center gap-2 border rounded-md px-3 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={freePositioning}
                    onChange={(e) => setFreePositioning(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs font-medium text-muted-foreground">Free Position</span>
                </label>

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
              <>
                {/* Service Type Filter */}
                <div className="flex items-center gap-2 border rounded-md px-3 py-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Service Filter:</span>
                  <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                    <SelectTrigger className="h-7 w-[100px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tasks</SelectItem>
                      <SelectItem value="1Y">1Y Only</SelectItem>
                      <SelectItem value="2Y">Up to 2Y</SelectItem>
                      <SelectItem value="3Y">Up to 3Y</SelectItem>
                      <SelectItem value="4Y">Up to 4Y</SelectItem>
                      <SelectItem value="5Y">Up to 5Y</SelectItem>
                      <SelectItem value="6Y">Up to 6Y</SelectItem>
                      <SelectItem value="7Y">Up to 7Y</SelectItem>
                      <SelectItem value="10Y">Up to 10Y</SelectItem>
                      <SelectItem value="12Y">Up to 12Y</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Hide Completed Steps Toggle */}
                <label className="flex items-center gap-2 border rounded-md px-3 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={hideCompletedSteps}
                    onChange={(e) => setHideCompletedSteps(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-xs font-medium text-muted-foreground">Hide Completed</span>
                </label>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleEditMode}
                >
                  <Edit className="h-4 w-4 mr-2" />
                Edit Mode
              </Button>
              </>
            )}

            {/* Clear Cache Button - Available in both modes */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>

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

            {/* Offline Status Indicator */}
            <OfflineStatusIndicator />

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
        )}

        {/* Fullscreen Mode - Minimal header with just exit button */}
        {isFullscreen && (
          <div className="absolute top-4 right-4 z-50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(false)}
              className="bg-gray-800/90 hover:bg-gray-700 text-white border-gray-600 shadow-lg"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Flowchart Area - Unified View with Optional Edit Mode */}
        <div className="flex-1 overflow-hidden">
          <FlowchartEditor
            flowchart={flowchartData}
            steps={steps}
            onStepsChange={setSteps}
            onEditStep={handleEditStep}
            onAddStep={handleAddStep}
            onStepClick={handleStepClick}
            zoom={zoom}
            gridSize={gridSize}
            isEditMode={isEditMode}
            setHasUnsavedChanges={setHasUnsavedChanges}
            selectedServiceType={selectedServiceType}
            onServiceTypeChange={setSelectedServiceType}
            initialEdges={edges}
            onEdgesChange={setEdges}
            hideCompletedSteps={hideCompletedSteps}
            onRealignToGrid={handleRealignToGrid}
            freePositioning={freePositioning}
            layoutMode={layoutMode}
          />
        </div>
      </div>

      {/* Progress Tracker Sidebar */}
      {showProgressTracker && !isFullscreen && (
        <div className="w-64 border-l bg-background overflow-y-auto">
          <div className="p-4 space-y-4">
            <ProgressTracker
              flowchart={flowchartData}
              steps={steps}
              completedSteps={progressMetrics.completedSteps}
              totalSteps={progressMetrics.totalSteps}
              completedTasks={progressMetrics.completedTasks}
              totalTasks={progressMetrics.totalTasks}
              elapsedTime="00:00:00"
              totalActualTimeSeconds={progressMetrics.totalActualTimeSeconds}
              onResetProgress={handleResetProgress}
            />
          </div>
        </div>
      )}

      {/* Step Detail Drawer */}
      <StepDetailDrawer
        step={selectedStep}
        flowchartId={flowchartData?.id || ''}
        flowchartName={`${flowchartData?.model || ''} - ${flowchartData?.serviceType || ''}`}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onTaskToggle={handleTaskToggle}
        onStartStep={() => {}}
        onCompleteStep={() => setDrawerOpen(false)}
        isStepRunning={false}
        stepStartTime={null}
        selectedServiceType={selectedServiceType}
        elapsedTime="00:00:00"
        onTaskTimeChange={handleTaskTimeChange}
        onTaskNotesChange={handleTaskNotesChange}
        onTaskNoteEdit={handleTaskNoteEdit}
        onTaskNoteDelete={handleTaskNoteDelete}
        onTaskServiceTypeChange={handleTaskServiceTypeChange}
        onTaskDescriptionChange={handleTaskDescriptionChange}
        onTaskIndentToggle={handleTaskIndentToggle}
        isEditMode={isEditMode}
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

      {/* Time Reminder Dialog */}
      <AlertDialog
        open={timeReminderOpen}
        onOpenChange={(open) => {
          setTimeReminderOpen(open);
          if (!open) {
            setPendingTaskId(null);
            setPendingTimeMinutes(undefined);
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md p-4 gap-3">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <AlertDialogTitle className="text-lg">Logga tid för aktivitet</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm leading-relaxed mb-2">
              Du har inte loggat tid för denna aktivitet. Vill du logga tid nu?
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Time Selection */}
          <div className="space-y-3">
            {/* Selected Time Display */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-3">
              <div className="text-center">
                <p className="text-xs text-blue-600 font-medium mb-1">Tid för aktivitet</p>
                <div className="text-2xl font-bold font-mono text-blue-900">
                  {pendingTimeMinutes ? (
                    <>
                      {Math.floor(pendingTimeMinutes / 60) > 0 && (
                        <span>{Math.floor(pendingTimeMinutes / 60)}h </span>
                      )}
                      {pendingTimeMinutes % 60 > 0 && (
                        <span>{pendingTimeMinutes % 60}m</span>
                      )}
                      {!pendingTimeMinutes && <span>–</span>}
                    </>
                  ) : (
                    <span className="text-gray-400">–</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5 px-0.5">Vanliga tider:</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[5, 10, 15, 30, 45, 60, 90, 120].map((minutes) => {
                  const hours = Math.floor(minutes / 60);
                  const mins = minutes % 60;
                  const label = hours > 0 ? (mins > 0 ? `${hours}h ${mins}m` : `${hours}h`) : `${mins}m`;

                  return (
                    <button
                      key={minutes}
                      onClick={() => setPendingTimeMinutes(minutes)}
                      className={cn(
                        "px-2 py-1.5 text-xs font-medium rounded-md border-2 transition-all",
                        pendingTimeMinutes === minutes
                          ? "bg-blue-100 border-blue-400 text-blue-900 shadow-sm"
                          : "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Time Input */}
            <div className="pt-2 border-t">
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5 px-0.5">Egen tid:</p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground block mb-1">Timmar</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={Math.floor((pendingTimeMinutes || 0) / 60)}
                    onChange={(e) => {
                      const hours = parseInt(e.target.value) || 0;
                      const minutes = (pendingTimeMinutes || 0) % 60;
                      setPendingTimeMinutes(hours * 60 + minutes);
                    }}
                    className="w-full px-2 py-1.5 text-center text-base font-mono border-2 border-gray-200 rounded-md focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground block mb-1">Minuter</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={(pendingTimeMinutes || 0) % 60}
                    onChange={(e) => {
                      const hours = Math.floor((pendingTimeMinutes || 0) / 60);
                      const minutes = parseInt(e.target.value) || 0;
                      setPendingTimeMinutes(hours * 60 + minutes);
                    }}
                    className="w-full px-2 py-1.5 text-center text-base font-mono border-2 border-gray-200 rounded-md focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <AlertDialogFooter className="gap-1.5 sm:gap-1.5 flex-col sm:flex-row mt-2">
            <AlertDialogCancel
              onClick={() => {
                setPendingTaskId(null);
                setPendingTimeMinutes(undefined);
                setTimeReminderOpen(false);
              }}
              className="sm:flex-1 h-9 text-sm"
            >
              Avbryt
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingTaskId) {
                  // Save time if provided, then toggle
                  if (pendingTimeMinutes) {
                    handleTaskTimeChange(pendingTaskId, pendingTimeMinutes);
                  }
                  performTaskToggle(pendingTaskId);
                }
                setPendingTaskId(null);
                setPendingTimeMinutes(undefined);
                setTimeReminderOpen(false);
              }}
              className="sm:flex-1 bg-gray-500 hover:bg-gray-600 h-9 text-sm"
            >
              Hoppa över
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                if (pendingTaskId && pendingTimeMinutes) {
                  // Save time and toggle
                  handleTaskTimeChange(pendingTaskId, pendingTimeMinutes);
                  performTaskToggle(pendingTaskId);
                  setPendingTaskId(null);
                  setPendingTimeMinutes(undefined);
                  setTimeReminderOpen(false);
                }
              }}
              className="sm:flex-1 bg-green-600 hover:bg-green-700 h-9 text-sm"
              disabled={!pendingTimeMinutes}
            >
              Spara & klar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toast Notification */}
      {showToast && (
        <div
          className="fixed bottom-6 right-6 z-[9999] transition-all duration-500 ease-in-out"
          style={{
            animation: 'slideInUp 0.3s ease-out, fadeOut 0.5s ease-in 2.5s forwards'
          }}
        >
          <div className="bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-green-300/50 backdrop-blur-sm">
            <div className="text-2xl animate-bounce">✅</div>
            <div className="font-semibold text-lg">{toastMessage}</div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(20px);
          }
        }
      `}</style>
    </div>
  );
}
