"use client"

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Maximize2, Minimize2, ChevronRight, ChevronLeft, Edit, Eye, Save, Plus, FileDown, FileUp, Wand2, Clock, Trash2, Grid3x3, Users, GraduationCap } from "lucide-react";
import { getAllFlowcharts, FlowchartData, FlowchartStep, saveFlowchart, exportFlowchartJSON, generateStepId, generateTaskId, loadCustomFlowcharts, resetToDefaultLayout } from "@/lib/flowchart-data";
import { SERVICE_TYPE_COLORS, getIncludedServiceTypes, SERVICE_TYPE_LEGEND } from "@/lib/service-colors";
import { FlowchartStep as FlowchartStepComponent } from "@/components/flowchart/flowchart-step";
import { StepDetailDrawer } from "@/components/flowchart/step-detail-drawer";
import { ProgressTracker } from "@/components/flowchart/progress-tracker";
import { FlowchartEditor } from "@/components/flowchart/flowchart-editor";
import { StepEditorDialog } from "@/components/flowchart/step-editor-dialog";
import { FlowchartInfoDropdown } from "@/components/flowchart/flowchart-info-dropdown";
import { extractSIIReferences } from "@/lib/sii-documents";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { OfflineStatusIndicator } from "@/components/offline-status-indicator";
import { TutorialGuide } from "@/components/tutorial-guide";
import { saveCompletedFlowchart, isFlowchartFullyCompleted, getEarliestStartTime } from "@/lib/completed-flowcharts";
import { getSelectedTechnicians, getTechnicianById, getActiveTechnicians, saveSelectedTechnician, Technician } from "@/lib/technicians-data";
import { TechnicianSelectModal } from "@/components/technician-select-modal";
import { TechnicianPairSelectModal } from "@/components/technician-pair-select-modal";
import { FlowchartSearch } from "@/components/flowchart/flowchart-search";
import { RevisionHistoryDialog } from "@/components/flowchart/revision-history-dialog";
import { ServiceTypeSelectionModal } from "@/components/flowchart/service-type-selection-modal";
import { ServiceStartAnimation } from "@/components/service-start-animation";

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
  const [gridSize, setGridSize] = useState(30); // Will be overridden by flowchartData.gridSize if available
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

  // State for WTG number (Wind Turbine Generator number)
  const [wtgNumber, setWtgNumber] = useState<string>("");

  // State for Make Year
  const [makeYear, setMakeYear] = useState<string>("2024");

  // State for technician assignment
  const [selectedT1, setSelectedT1] = useState<Technician | null>(null);
  const [selectedT2, setSelectedT2] = useState<Technician | null>(null);
  const [selectedT3, setSelectedT3] = useState<Technician | null>(null); // Trainee
  const [technicianModalOpen, setTechnicianModalOpen] = useState(false);
  const [technicianModalRole, setTechnicianModalRole] = useState<'T1' | 'T2' | 'T3'>('T1');

  // State for revision history dialog
  const [revisionHistoryOpen, setRevisionHistoryOpen] = useState(false);

  // State for job tracking
  const [jobStarted, setJobStarted] = useState<string | null>(null);
  const [jobFinished, setJobFinished] = useState<string | null>(null);

  // Check if all steps are completed
  useEffect(() => {
    if (!jobStarted || jobFinished) return;

    const allStepsCompleted = steps.every(step => {
      const completedTasks = step.tasks.filter(t => t.completed).length;
      const totalTasks = step.tasks.length;
      return totalTasks > 0 && completedTasks === totalTasks;
    });

    if (allStepsCompleted && steps.length > 0) {
      console.log('[Job Tracking] All steps completed! Marking job as finished.');
      const finishTime = new Date().toISOString();
      setJobFinished(finishTime);
      setToastMessage('🎉 Service Complete! All steps finished.');
      setShowToast(true);
    }
  }, [steps, jobStarted, jobFinished]);

  // State for service type selection modal
  const [serviceTypeModalOpen, setServiceTypeModalOpen] = useState(false);

  // State for technician pair selection modal
  const [technicianPairModalOpen, setTechnicianPairModalOpen] = useState(false);

  // State for service start animation
  const [serviceStartAnimationOpen, setServiceStartAnimationOpen] = useState(false);
  const [selectedServiceTypeForAnimation, setSelectedServiceTypeForAnimation] = useState<string>("");

  // State for active/current steps (steps being worked on)
  const [activeStepIds, setActiveStepIds] = useState<string[]>([]);

  // Auto-hide Progress Tracker when entering Edit Mode
  useEffect(() => {
    if (isEditMode) {
      setShowProgressTracker(false);
    }
  }, [isEditMode]);

  // Load WTG number from localStorage or generate random
  useEffect(() => {
    if (!flowchartData) return;
    const wtgKey = `wtg-number-${flowchartData.id}`;
    const savedWTG = localStorage.getItem(wtgKey);
    if (savedWTG) {
      setWtgNumber(savedWTG);
    } else {
      // Generate random 5-digit WTG number
      const randomWTG = Math.floor(10000 + Math.random() * 90000).toString();
      setWtgNumber(randomWTG);
    }

    // Load Make Year
    const makeYearKey = `make-year-${flowchartData.id}`;
    const savedMakeYear = localStorage.getItem(makeYearKey);
    if (savedMakeYear) {
      setMakeYear(savedMakeYear);
    }
  }, [flowchartData]);

  // Save WTG number to localStorage when changed
  useEffect(() => {
    if (!flowchartData || !wtgNumber) return;
    const wtgKey = `wtg-number-${flowchartData.id}`;
    localStorage.setItem(wtgKey, wtgNumber);
  }, [wtgNumber, flowchartData]);

  // Save Make Year to localStorage when changed
  useEffect(() => {
    if (!flowchartData || !makeYear) return;
    const makeYearKey = `make-year-${flowchartData.id}`;
    localStorage.setItem(makeYearKey, makeYear);
  }, [makeYear, flowchartData]);

  // Load selected technicians from localStorage
  useEffect(() => {
    const { t1, t2 } = getSelectedTechnicians();
    setSelectedT1(t1);
    setSelectedT2(t2);

    // Load T3 (trainee) from localStorage
    const t3Id = localStorage.getItem('flowchart-technician-t3');
    if (t3Id) {
      const t3 = getTechnicianById(t3Id);
      setSelectedT3(t3);
    }
  }, []);

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

    // DEBUG: Log what's in flowchartData
    if (flowchart) {
      console.log('\n=== FLOWCHART DATA LOADED ===');
      console.log('Flowchart ID:', flowchart.id);
      console.log('Steps count:', flowchart.steps.length);
      console.log('Edges exist?', !!flowchart.edges);
      console.log('Edges count:', flowchart.edges?.length || 0);
      console.log('GridSize:', flowchart.gridSize);
      console.log('LayoutMode:', flowchart.layoutMode);
      console.log('First 3 step positions:', flowchart.steps.slice(0, 3).map(s => ({ id: s.id, pos: s.position })));
      if (flowchart.edges && flowchart.edges.length > 0) {
        console.log('First 3 edges:', flowchart.edges.slice(0, 3));
      }
      console.log('=========================\n');

      if (flowchart.gridSize) setGridSize(flowchart.gridSize);
      if (flowchart.layoutMode) setLayoutMode(flowchart.layoutMode);
    }
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
    const defaultLayoutKey = `default-layout-${serviceId}`;
    const savedData = localStorage.getItem(storageKey);
    const defaultLayoutData = localStorage.getItem(defaultLayoutKey);

    console.log('\n=== LOCALSTORAGE CHECK ===');
    console.log('Storage key:', storageKey);
    console.log('Default layout key:', defaultLayoutKey);
    console.log('Has saved data?', !!savedData);
    console.log('Has default layout?', !!defaultLayoutData);
    console.log('========================\n');

    // If no saved data exists, use positions from flowchart-data.ts
    if (!savedData) {
      console.log('✅ No saved data found - using hardcoded positions from flowchart-data.ts');
      console.log('Setting steps count:', flowchartData.steps.length);
      console.log('Setting edges count:', flowchartData.edges?.length || 0);

      // Log ALL step positions in detail
      console.log('\n=== ALL STEP POSITIONS (GRID COORDINATES) ===');
      flowchartData.steps.forEach((step, index) => {
        console.log(`${index + 1}. ${step.id}: { x: ${step.position.x}, y: ${step.position.y} } - ${step.title.split('\n')[0]}`);
      });
      console.log('==========================================\n');

      // Log ALL edges in detail
      console.log('\n=== ALL EDGES ===');
      if (flowchartData.edges && flowchartData.edges.length > 0) {
        flowchartData.edges.forEach((edge, index) => {
          console.log(`${index + 1}. ${edge.id}: ${edge.source} → ${edge.target} (${edge.type})`);
        });
      } else {
        console.log('⚠️ NO EDGES FOUND!');
      }
      console.log('=================\n');

      setSteps(flowchartData.steps);
      setEdges(flowchartData.edges || []);
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

        console.log('\n=== LOADING FROM LOCALSTORAGE ===');
        console.log('Merged steps count:', mergedSteps.length);
        console.log('Edges from localStorage:', parsed.edges?.length || 0);
        console.log('Edges from flowchartData:', flowchartData.edges?.length || 0);

        // IMPORTANT: Use edges from flowchartData if localStorage has empty or no edges
        const finalEdges = (parsed.edges && parsed.edges.length > 0) ? parsed.edges : (flowchartData.edges || []);
        console.log('Final edges count:', finalEdges.length);

        console.log('\nFirst 3 merged step positions:');
        mergedSteps.slice(0, 3).forEach((s, i) => {
          console.log(`  ${i + 1}. ${s.id}: { x: ${s.position.x}, y: ${s.position.y} }`);
        });

        console.log('\n⚠️ IMPORTANT: Positions loaded from localStorage!');
        console.log('If these don\'t match your expected layout, click "Clear Cache" button!');
        console.log('================================\n');

        setSteps(mergedSteps);
        setEdges(finalEdges);
      } catch (e) {
        console.error("Failed to load progress:", e);
        setSteps(flowchartData.steps);
        setEdges(flowchartData.edges || []);
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
          setEdges(defaultLayout.edges || flowchartData.edges || []);
        } catch (e) {
          console.error("Failed to load default layout:", e);
          setSteps(flowchartData.steps);
          setEdges(flowchartData.edges || []);
        }
      } else {
        // No default layout either, use original data
        setSteps(flowchartData.steps);
        setEdges(flowchartData.edges || []);
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

  // Auto-save completed flowchart when all tasks are done
  useEffect(() => {
    if (!flowchartData || steps.length === 0) return;

    // Check if flowchart is fully completed
    if (isFlowchartFullyCompleted(steps)) {
      // Check if already saved (to avoid duplicate saves)
      const savedKey = `flowchart-saved-${flowchartData.id}`;
      if (localStorage.getItem(savedKey)) return; // Already saved

      // Get start time from earliest step
      const startTime = getEarliestStartTime(steps) || new Date().toISOString();

      // Get selected technicians
      const { t1, t2 } = getSelectedTechnicians();

      // Validate WTG number is set before saving
      if (!wtgNumber || wtgNumber.length !== 5) {
        alert("Please enter a 5-digit WTG number before completing the flowchart.");
        return;
      }

      // Save the completed flowchart
      const t1Data = t1 ? {
        id: t1.id,
        name: `${t1.firstName} ${t1.lastName}`,
        initials: t1.initials
      } : undefined;

      const t2Data = t2 ? {
        id: t2.id,
        name: `${t2.firstName} ${t2.lastName}`,
        initials: t2.initials
      } : undefined;

      // For now, bugs will be empty array (bug reporting will be added later)
      const bugs: any[] = [];

      saveCompletedFlowchart(flowchartData, steps, startTime, wtgNumber, bugs, t1Data, t2Data);

      // Mark as saved to avoid duplicates
      localStorage.setItem(savedKey, 'true');

      // Show success message
      setToastMessage("🎉 Flowchart completed and saved!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
  }, [steps, flowchartData]);

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

    let stepJustCompleted = false;
    let completedStepIndex = -1;

    setSteps(prevSteps => {
      const newSteps = prevSteps.map((step, index) => {
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

        // Get technician for this completed step
        let completedBy: string | undefined;
        let completedByInitials: string | undefined;
        if (allSIITasksCompleted && siiTaskIds.length > 0) {
          // First check if there's an assigned technician for this specific step
          if (step.assignedTechnicianId) {
            completedBy = step.assignedTechnicianId;
            completedByInitials = step.assignedTechnicianInitials;
          } else {
            // Fallback to global T1/T2 selection
            const techRole = step.technician === "T1" || step.technician === "both" ? "T1" : "T2";
            const techKey = techRole === "T1" ? 'flowchart-technician-t1' : 'flowchart-technician-t2';
            const techId = localStorage.getItem(techKey);
            if (techId) {
              const { getTechnicianById } = require('@/lib/technicians-data');
              const tech = getTechnicianById(techId);
              if (tech) {
                completedBy = techId;
                completedByInitials = tech.initials;
              }
            }
          }
        }

        // Check if step just became completed
        if (allSIITasksCompleted && siiTaskIds.length > 0 && !step.completedAt) {
          stepJustCompleted = true;
          completedStepIndex = index;
        }

        return {
          ...step,
          tasks: updatedTasks,
          completedAt: allSIITasksCompleted && siiTaskIds.length > 0 ? new Date().toISOString() : undefined,
          completedBy,
          completedByInitials
        };
      });

      // If a step was just completed, activate next step(s)
      if (stepJustCompleted && completedStepIndex >= 0) {
        const nextStepIds = findNextActiveSteps(newSteps, completedStepIndex);
        if (nextStepIds.length > 0) {
          setActiveStepIds(nextStepIds);
        } else {
          // No more steps - check if all steps are completed
          const allStepsCompleted = newSteps.every(s => s.completedAt);
          if (allStepsCompleted && !jobFinished) {
            const finishTime = new Date().toISOString();
            setJobFinished(finishTime);
            setActiveStepIds([]);
            setToastMessage('🎉 Service completed! All steps finished.');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 5000);
          }
        }
      }

      return newSteps;
    });

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

  // Handle step update (e.g., technician assignment)
  const handleStepUpdate = (updatedStep: FlowchartStep) => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === updatedStep.id ? updatedStep : step
      )
    );

    // Update selected step
    setSelectedStep(updatedStep);

    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
  };

  // Handle technician selection from modal
  const handleSelectTechnician = (technician: any) => {
    // Convert from API format to local format
    const localTech: Technician = {
      id: technician.id,
      firstName: technician.first_name,
      lastName: technician.last_name,
      initials: technician.initials,
      email: technician.email,
      isActive: true
    };

    if (technicianModalRole === 'T1') {
      setSelectedT1(localTech);
      saveSelectedTechnician('T1', localTech.id);
    } else if (technicianModalRole === 'T2') {
      setSelectedT2(localTech);
      saveSelectedTechnician('T2', localTech.id);
    } else if (technicianModalRole === 'T3') {
      setSelectedT3(localTech);
      localStorage.setItem('flowchart-technician-t3', localTech.id);
    }
  };

  const openTechnicianModal = (role: 'T1' | 'T2' | 'T3') => {
    setTechnicianModalRole(role);
    setTechnicianModalOpen(true);
  };

  // Find next active steps after completing a step
  const findNextActiveSteps = (allSteps: FlowchartStep[], completedIndex: number): string[] => {
    // If this is the last step, no next steps
    if (completedIndex >= allSteps.length - 1) {
      return [];
    }

    const nextSteps: string[] = [];
    let nextIndex = completedIndex + 1;

    // Get the next step
    const nextStep = allSteps[nextIndex];
    if (!nextStep) return [];

    // Check if already completed, if so skip to next
    if (nextStep.completedAt) {
      return findNextActiveSteps(allSteps, nextIndex);
    }

    nextSteps.push(nextStep.id);

    // Check if there are parallel steps (next step has same position.y or adjacent)
    // Look ahead to see if next step is parallel
    if (nextIndex + 1 < allSteps.length) {
      const potentialParallel = allSteps[nextIndex + 1];
      // If next two steps are at similar Y positions, they're parallel
      const yDiff = Math.abs(nextStep.position.y - potentialParallel.position.y);
      if (yDiff <= 2 && !potentialParallel.completedAt) {
        nextSteps.push(potentialParallel.id);
      }
    }

    return nextSteps;
  };

  // Handle Start Service button click
  const handleStartService = () => {
    // Check if both technicians are assigned
    if (!selectedT1 || !selectedT2) {
      // Open technician pair selection modal
      setTechnicianPairModalOpen(true);
      return;
    }

    // Both technicians assigned - open service type selection modal
    setServiceTypeModalOpen(true);
  };

  // Handle technician pair selection
  const handleTechnicianPairSelect = (t1: any, t2: any) => {
    // Convert from API format to local format
    const localT1: Technician = {
      id: t1.id,
      firstName: t1.first_name,
      lastName: t1.last_name,
      initials: t1.initials,
      email: t1.email,
      isActive: true
    };

    const localT2: Technician = {
      id: t2.id,
      firstName: t2.first_name,
      lastName: t2.last_name,
      initials: t2.initials,
      email: t2.email,
      isActive: true
    };

    // Save selections
    setSelectedT1(localT1);
    setSelectedT2(localT2);
    saveSelectedTechnician('T1', localT1.id);
    saveSelectedTechnician('T2', localT2.id);

    // Open service type selection modal
    setServiceTypeModalOpen(true);
  };

  // Handle service type selection and start job
  const handleServiceTypeStart = (serviceType: string) => {
    // Store service type and show animation
    setSelectedServiceTypeForAnimation(serviceType);
    setServiceStartAnimationOpen(true);
  };

  // Handle animation complete - actually start the service
  const handleAnimationComplete = () => {
    // Close animation
    setServiceStartAnimationOpen(false);

    // Start the job
    const startTime = new Date().toISOString();
    setJobStarted(startTime);

    // Set the selected service type for filtering
    setSelectedServiceType(selectedServiceTypeForAnimation);

    // Find Step 1 (first step) - look for the step with the lowest position
    // Sort steps by position.x to find the leftmost (first) step
    const sortedSteps = [...steps].sort((a, b) => {
      if (a.position.x !== b.position.x) {
        return a.position.x - b.position.x;
      }
      return a.position.y - b.position.y;
    });

    const firstStep = sortedSteps[0];

    if (firstStep) {
      console.log('[handleAnimationComplete] Setting first step as active:', firstStep.id, 'Position:', firstStep.position);
      console.log('[handleAnimationComplete] All steps:', steps.map(s => ({ id: s.id, pos: s.position })));
      // Set first step as active (highlight it)
      setActiveStepIds([firstStep.id]);

      // Small delay to ensure state updates before zooming
      setTimeout(() => {
        console.log('[handleAnimationComplete] Zooming to first step');
        // Zoom camera to Step 1
        if ((window as any).__flowchartZoomToStep) {
          (window as any).__flowchartZoomToStep(firstStep.id);
        }
      }, 100);
    } else {
      console.warn('[handleAnimationComplete] No first step found! Steps:', steps.length);
    }

    // Show success message
    setToastMessage(`🚀 Service started! ${selectedServiceTypeForAnimation} Program`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
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

  // Handle search selection - navigate to step
  const handleSearchSelectStep = (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (step) {
      handleStepClick(step);

      // Zoom to step in React Flow (if available)
      if ((window as any).__flowchartZoomToStep) {
        (window as any).__flowchartZoomToStep(stepId);
      }
    }
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
    // Clear ALL localStorage keys for this flowchart
    const storageKey = `flowchart_${modelId}_${serviceId}`;
    const defaultLayoutKey = `default-layout-${serviceId}`;
    const animationShownKey = `flowchart-animation-shown-${flowchartData.id}`;

    localStorage.removeItem(storageKey);
    localStorage.removeItem(defaultLayoutKey);
    localStorage.removeItem(animationShownKey);

    console.log(`Cleared cache keys: ${storageKey}, ${defaultLayoutKey}, ${animationShownKey}`);

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

  // Export FULL layout data (positions, grid, sizes, edges) for verification
  const handleExportFullLayoutData = () => {
    const gridSize = 30; // Grid size constant

    // Collect all data for each step
    const fullLayoutData = steps.map(step => {
      // Calculate size (use custom heights if available)
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

      const heightPx = CUSTOM_STEP_HEIGHTS[step.id] || (step.tasks.length > 4 ? 450 : 350);
      const widthPx = 370;

      return {
        id: step.id,
        title: step.title.split('\n')[0], // First line only
        position: {
          grid: step.position,  // Grid units
          pixels: {
            x: step.position.x * gridSize,
            y: step.position.y * gridSize
          }
        },
        size: {
          pixels: { width: widthPx, height: heightPx },
          grid: {
            width: Math.ceil(widthPx / gridSize),
            height: Math.ceil(heightPx / gridSize)
          }
        },
        technician: step.technician,
        tasks: step.tasks.length
      };
    });

    // Export edges data
    const edgesData = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle
    }));

    const exportData = {
      flowchart: {
        id: flowchartData?.id,
        model: flowchartData?.model,
        serviceType: flowchartData?.serviceType
      },
      gridSize: gridSize,
      layoutMode: layoutMode || 'centered',
      steps: fullLayoutData,
      edges: edgesData,
      exportedAt: new Date().toISOString()
    };

    // Log to console
    console.log('\n========================================');
    console.log('FULL LAYOUT DATA EXPORT');
    console.log('========================================\n');
    console.log('Grid Size:', gridSize, 'px');
    console.log('Layout Mode:', layoutMode || 'centered');
    console.log('\nSteps Data:');
    console.table(fullLayoutData);
    console.log('\nEdges Data:');
    console.table(edgesData);
    console.log('\nFull JSON:');
    console.log(JSON.stringify(exportData, null, 2));

    // Create a nicely formatted text file
    const fileContent = `
========================================
FULL LAYOUT DATA EXPORT
========================================

Flowchart: ${flowchartData?.model} - ${flowchartData?.serviceType}
Grid Size: ${gridSize}px
Layout Mode: ${layoutMode || 'centered'}
Exported: ${new Date().toLocaleString()}

========================================
STEPS DATA (${fullLayoutData.length} steps)
========================================

${fullLayoutData.map((step, index) => `
${index + 1}. ${step.id}
   Title: ${step.title}
   Technician: ${step.technician}
   Tasks: ${step.tasks}

   Position (Grid):   x: ${step.position.grid.x}, y: ${step.position.grid.y}
   Position (Pixels): x: ${step.position.pixels.x}px, y: ${step.position.pixels.y}px

   Size (Grid):   width: ${step.size.grid.width}, height: ${step.size.grid.height}
   Size (Pixels): width: ${step.size.pixels.width}px, height: ${step.size.pixels.height}px
`).join('\n')}

========================================
EDGES DATA (${edgesData.length} connections)
========================================

${edgesData.map((edge, index) => `
${index + 1}. ${edge.id}
   From: ${edge.source} (${edge.sourceHandle})
   To:   ${edge.target} (${edge.targetHandle})
   Type: ${edge.type}
`).join('\n')}

========================================
FULL JSON DATA
========================================

${JSON.stringify(exportData, null, 2)}

========================================
COPY-PASTE READY: Positions for flowchart-data.ts
========================================

${fullLayoutData.map(step =>
  `      position: { x: ${step.position.grid.x}, y: ${step.position.grid.y} },  // ${step.id}`
).join('\n')}

========================================
`;

    // Download as text file
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${flowchartData?.id || 'flowchart'}-full-layout-data.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Copy JSON to clipboard
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2)).then(() => {
      alert(`✅ Full layout data exported!\n\n📄 File downloaded: ${link.download}\n📋 JSON copied to clipboard\n\n${fullLayoutData.length} steps\n${edgesData.length} edges\n\nCheck console for detailed tables.`);
    }).catch(() => {
      alert(`✅ Full layout data exported!\n\n📄 File downloaded: ${link.download}\n\n${fullLayoutData.length} steps\n${edgesData.length} edges\n\nCheck console for detailed tables.`);
    });
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
        {/* Header - Two Row Layout */}
        {!isFullscreen && (
        <div className="border-b px-4 py-2 bg-background/95 backdrop-blur-sm">
          {/* Row 1: Main controls */}
          <div className="flex items-center justify-between gap-3">
            {/* Left: Back button + Title + All fields */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/flowcharts")}
                className="h-8 px-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-bold">{flowchartData.model}</h1>
                {flowchartData.isCustom && (
                  <Badge variant="secondary" className="text-xs h-5">Custom</Badge>
                )}

                {/* Service Program and Revision on same line */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Service Program ·</span>
                  <button
                    onClick={() => setRevisionHistoryOpen(true)}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline decoration-dotted underline-offset-2 hover:decoration-solid"
                  >
                    Rev.{flowchartData.revisionDate.split('/')[0].replace(/^0+/, '')}
                  </button>
                </div>
              </div>

              {/* Divider - minimal space */}
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-0.5" />

              {/* Right group: WTG, Year, Assign, Search */}
              <div className="flex items-center gap-3">
                {/* WTG Number Input */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground font-medium">WTG:</span>
                  <input
                    type="text"
                    value={wtgNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                      setWtgNumber(value);
                    }}
                    placeholder="00000"
                    maxLength={5}
                    className="w-16 h-6 px-2 text-xs font-mono border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  />
                </div>

                {/* Year Input */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground font-medium">Year:</span>
                  <input
                    type="text"
                    value={makeYear}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setMakeYear(value);
                    }}
                    placeholder="2024"
                    maxLength={4}
                    className="w-14 h-6 px-2 text-xs font-mono border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  />
                </div>

                {/* Technician Assignment */}
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <button
                    onClick={() => openTechnicianModal('T1')}
                    className={cn(
                      "h-6 px-2 text-xs font-bold rounded border transition-colors whitespace-nowrap",
                      selectedT1
                        ? "bg-blue-50 dark:bg-blue-950 text-blue-600 border-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900"
                        : "bg-background border-border hover:bg-accent"
                    )}
                  >
                    {selectedT1 ? `T1: ${selectedT1.initials}` : 'T1'}
                  </button>
                  <span className="text-muted-foreground">/</span>
                  <button
                    onClick={() => openTechnicianModal('T2')}
                    className={cn(
                      "h-6 px-2 text-xs font-bold rounded border transition-colors whitespace-nowrap",
                      selectedT2
                        ? "bg-purple-50 dark:bg-purple-950 text-purple-600 border-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900"
                        : "bg-background border-border hover:bg-accent"
                    )}
                  >
                    {selectedT2 ? `T2: ${selectedT2.initials}` : 'T2'}
                  </button>
                  <span className="text-muted-foreground">/</span>
                  <button
                    onClick={() => openTechnicianModal('T3')}
                    className={cn(
                      "h-6 px-2 text-xs font-bold rounded border transition-colors whitespace-nowrap flex items-center gap-1",
                      selectedT3
                        ? "bg-orange-50 dark:bg-orange-950 text-orange-600 border-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900"
                        : "bg-background border-border hover:bg-accent"
                    )}
                  >
                    <GraduationCap className="h-3 w-3" />
                    {selectedT3 ? `T3: ${selectedT3.initials}` : 'T3'}
                  </button>
                </div>

                {/* Search */}
                <div className="w-64">
                  <FlowchartSearch
                    steps={steps}
                    onSelectStep={handleSearchSelectStep}
                  />
                </div>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-1.5">
              {/* Edit Mode Controls */}
              {isEditMode && (
                <>
                  <Button variant="outline" size="sm" onClick={handleAddStep} className="h-8">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-xs">Add</span>
                  </Button>

                  <Button variant="outline" size="sm" onClick={() => setPdfImportOpen(true)} className="h-8">
                    <FileUp className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-xs">Import</span>
                  </Button>

                  <Button variant="outline" size="sm" onClick={handleExportFlowchart} className="h-8">
                    <FileDown className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-xs">Export</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportToCode}
                    className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-300"
                  >
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-xs">Save Layout</span>
                  </Button>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300"
                      >
                        <Grid3x3 className="h-3.5 w-3.5 mr-1.5" />
                        <span className="text-xs">Layout</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-2">
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            setLayoutMode('topdown');
                            if ((window as any).__flowchartRealignToGridTopDown) {
                              (window as any).__flowchartRealignToGridTopDown();
                              setToastMessage("Top-Down layout applied!");
                              setShowToast(true);
                              setTimeout(() => setShowToast(false), 2000);
                            }
                          }}
                          className={cn(
                            "w-full px-2 py-1.5 text-xs text-left rounded hover:bg-gray-100 dark:hover:bg-gray-800",
                            layoutMode === 'topdown' && "bg-blue-50 dark:bg-blue-950 text-blue-600 font-medium"
                          )}
                        >
                          Top-Down
                        </button>
                        <button
                          onClick={() => {
                            setLayoutMode('centered');
                            if ((window as any).__flowchartRealignToGridCentered) {
                              (window as any).__flowchartRealignToGridCentered();
                              setToastMessage("Centered layout applied!");
                              setShowToast(true);
                              setTimeout(() => setShowToast(false), 2000);
                            }
                          }}
                          className={cn(
                            "w-full px-2 py-1.5 text-xs text-left rounded hover:bg-gray-100 dark:hover:bg-gray-800",
                            layoutMode === 'centered' && "bg-blue-50 dark:bg-blue-950 text-blue-600 font-medium"
                          )}
                        >
                          Centered
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Button variant="outline" size="sm" onClick={toggleEditMode} className="h-8">
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-xs">View</span>
                  </Button>
                </>
              )}

              {/* Divider */}
              <div className="h-5 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

              {/* Offline Status */}
              <OfflineStatusIndicator flowchart={flowchartData} steps={steps} />

              {/* Edit button in view mode */}
              {!isEditMode && (
                <Button variant="outline" size="sm" onClick={toggleEditMode} className="h-8">
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs">Edit</span>
                </Button>
              )}

              {/* Fullscreen */}
              <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)} className="h-8 w-8 p-0">
                {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          {/* Row 2: Start Service button or Job Tracking Display + Controls */}
          {!isEditMode && (
            <div className="flex items-center gap-3 ml-1 mt-1">
              {!jobStarted ? (
                /* Before Service Start */
                <Button
                  onClick={handleStartService}
                  size="sm"
                  className="h-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md"
                >
                  <span className="text-xs font-semibold">Start Service</span>
                </Button>
              ) : !jobFinished ? (
                /* Service In Progress */
                <>
                  <Button
                    size="sm"
                    disabled
                    className="h-6 bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-md cursor-default opacity-100"
                  >
                    <span className="text-xs font-semibold">In Progress</span>
                  </Button>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md">
                    <span className="text-xs text-muted-foreground">Started:</span>
                    <span className="text-xs font-mono font-semibold">
                      {new Date(jobStarted).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' '}
                      {new Date(jobStarted).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {selectedServiceType && selectedServiceType !== 'all' && (
                    <div className="px-2 py-1 bg-purple-50 dark:bg-purple-950 border border-purple-300 dark:border-purple-700 rounded-md">
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{selectedServiceType}</span>
                    </div>
                  )}
                </>
              ) : (
                /* Service Completed */
                <>
                  <Button
                    size="sm"
                    disabled
                    className="h-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md cursor-default opacity-100"
                  >
                    <span className="text-xs font-semibold">✓ Completed</span>
                  </Button>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md">
                    <span className="text-xs text-muted-foreground">Started:</span>
                    <span className="text-xs font-mono font-semibold">
                      {new Date(jobStarted).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' '}
                      {new Date(jobStarted).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-950 border border-green-300 dark:border-green-700 rounded-md">
                    <span className="text-xs text-green-700 dark:text-green-300">Finished:</span>
                    <span className="text-xs font-mono font-semibold text-green-700 dark:text-green-300">
                      {new Date(jobFinished).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' '}
                      {new Date(jobFinished).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {selectedServiceType && selectedServiceType !== 'all' && (
                    <div className="px-2 py-1 bg-purple-50 dark:bg-purple-950 border border-purple-300 dark:border-purple-700 rounded-md">
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{selectedServiceType}</span>
                    </div>
                  )}
                </>
              )}

              {/* Push controls to the right */}
              <div className="flex items-center gap-2 ml-auto">
                {/* Hide Completed Steps Toggle */}
                <label className="flex items-center gap-1.5 border rounded-md px-2 py-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors h-6">
                  <input
                    type="checkbox"
                    checked={hideCompletedSteps}
                    onChange={(e) => setHideCompletedSteps(e.target.checked)}
                    className="w-3 h-3 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-xs font-medium text-muted-foreground">Hide Done</span>
                </label>

                {/* Clear Cache */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearCache}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 dark:hover:bg-red-950"
                  title="Clear Cache"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
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
        <div className="flex-1 overflow-hidden relative">
          {/* Info Legend Dropdown - Top Left */}
          <FlowchartInfoDropdown flowchart={flowchartData} steps={steps} />

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
            activeStepIds={activeStepIds}
          />
        </div>
      </div>

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
        onStepUpdate={handleStepUpdate}
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

      {/* Tutorial Guide */}
      <TutorialGuide />

      {/* Technician Selection Modal (for individual selection from header) */}
      <TechnicianSelectModal
        open={technicianModalOpen}
        onOpenChange={setTechnicianModalOpen}
        onSelect={handleSelectTechnician}
        title={technicianModalRole === 'T1' ? "Select Technician 1" : technicianModalRole === 'T2' ? "Select Technician 2" : "Select Trainee (T3)"}
        currentSelection={technicianModalRole === 'T1' ? selectedT1 : technicianModalRole === 'T2' ? selectedT2 : selectedT3}
      />

      {/* Technician Pair Selection Modal (for Start Service) */}
      <TechnicianPairSelectModal
        open={technicianPairModalOpen}
        onOpenChange={setTechnicianPairModalOpen}
        onSelect={handleTechnicianPairSelect}
        currentT1={selectedT1}
        currentT2={selectedT2}
      />

      {/* Revision History Dialog */}
      {flowchartData && (
        <RevisionHistoryDialog
          open={revisionHistoryOpen}
          onOpenChange={setRevisionHistoryOpen}
          currentRevision={flowchartData.revisionDate}
          modelName={flowchartData.model}
        />
      )}

      {/* Service Type Selection Modal */}
      <ServiceTypeSelectionModal
        open={serviceTypeModalOpen}
        onOpenChange={setServiceTypeModalOpen}
        onStart={handleServiceTypeStart}
        steps={steps}
        makeYear={makeYear}
        flowchartData={flowchartData}
      />

      {/* Service Start Animation */}
      <ServiceStartAnimation
        open={serviceStartAnimationOpen}
        onComplete={handleAnimationComplete}
        serviceType={selectedServiceTypeForAnimation}
        wtgNumber={wtgNumber}
        t1Name={selectedT1 ? selectedT1.initials : "T1"}
        t2Name={selectedT2 ? selectedT2.initials : "T2"}
      />

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
