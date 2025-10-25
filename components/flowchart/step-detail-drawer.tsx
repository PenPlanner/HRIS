"use client"

import { FlowchartStep, FlowchartTask, TaskNote } from "@/lib/flowchart-data";
import { extractSIIReferences, groupReferencesByDocument, openSIIDocument, SIIReference } from "@/lib/sii-documents";
import { getSectionPage } from "@/lib/sii-page-mapping";
import { getIncludedServiceTypes, SERVICE_TYPE_COLORS } from "@/lib/service-colors";
import type { PDFMetadata } from "@/lib/pdf-metadata";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Clock, CheckCircle2, FileText, Image as ImageIcon, PlayCircle, X, ExternalLink, BookOpen, Info, Pencil, Save } from "lucide-react";
import { BugReportDialog } from "../bug-report/bug-report-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { PDFViewerDialog } from "./pdf-viewer-dialog";
import { TimeInput } from "./time-input";
import { TaskNotes } from "./task-notes";
import { Clock as ClockIcon } from "lucide-react";

interface StepDetailDrawerProps {
  step: FlowchartStep | null;
  flowchartId: string;
  flowchartName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskToggle: (taskId: string) => void;
  onStartStep: () => void;
  onCompleteStep: () => void;
  isStepRunning: boolean;
  stepStartTime: string | null;
  elapsedTime: string;
  onTaskTimeChange: (taskId: string, minutes: number | undefined) => void;
  onTaskNotesChange: (taskId: string, note: string) => void;
  onTaskNoteEdit: (taskId: string, noteId: string, newText: string) => void;
  onTaskNoteDelete: (taskId: string, noteId: string) => void;
  onTaskServiceTypeChange?: (taskId: string, serviceType: string) => void;
  selectedServiceType?: string;
  isEditMode?: boolean;
}

export function StepDetailDrawer({
  step,
  flowchartId,
  flowchartName,
  open,
  onOpenChange,
  onTaskToggle,
  onStartStep,
  onCompleteStep,
  isStepRunning,
  stepStartTime,
  elapsedTime,
  onTaskTimeChange,
  onTaskNotesChange,
  onTaskNoteEdit,
  onTaskNoteDelete,
  onTaskServiceTypeChange,
  selectedServiceType = "all",
  isEditMode = false
}: StepDetailDrawerProps) {
  // State for "Show All" toggle
  const [showAllTasks, setShowAllTasks] = useState(false);

  // Filter tasks based on selected service type
  const filteredTasks = useMemo(() => {
    if (!step) return [];

    // If "Show All" is enabled, return all tasks
    if (showAllTasks) return step.tasks;

    // If service filter is "all", return all tasks
    if (selectedServiceType === "all") return step.tasks;

    const includedTypes = getIncludedServiceTypes(selectedServiceType);
    return step.tasks.filter(task => {
      // If task has no serviceType, include it (base service)
      if (!task.serviceType) return true;
      // Check if task's serviceType is in the included types
      return includedTypes.includes(task.serviceType);
    });
  }, [step, selectedServiceType, showAllTasks]);

  // Extract SII references from filtered task descriptions
  const siiReferences = useMemo(() => step ? extractSIIReferences(filteredTasks) : [], [filteredTasks, step]);
  const groupedReferences = useMemo(() => groupReferencesByDocument(siiReferences), [siiReferences]);

  // Count only tasks that have SII references (the ones that are actually displayed/checkable)
  const siiTasks = useMemo(() => {
    if (!step) return [];
    return siiReferences.map(ref =>
      filteredTasks.find(task => task.description.trim().startsWith(ref.fullReference))
    ).filter(Boolean) as FlowchartTask[];
  }, [siiReferences, filteredTasks, step]);

  const completedTasks = siiTasks.filter(t => t.completed).length;
  const totalTasks = siiTasks.length;
  const isComplete = completedTasks === totalTasks && totalTasks > 0;

  // State for PDF metadata
  const [pdfMetadata, setPdfMetadata] = useState<Map<number, PDFMetadata>>(new Map());
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // State for PDF viewer
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState("");
  const [selectedPdfTitle, setSelectedPdfTitle] = useState("");
  const [selectedPdfPage, setSelectedPdfPage] = useState(1);

  // Calculate total actual time from filtered tasks (in minutes)
  const totalStepTimeMinutes = useMemo(() => {
    if (!step) return 0;
    return filteredTasks.reduce((sum, task) => sum + (task.actualTimeMinutes || 0), 0);
  }, [filteredTasks, step]);

  // Format minutes to human readable format (e.g., "1h 30m" or "45m")
  const formatTime = (totalMinutes: number): string => {
    if (totalMinutes === 0) return "0m";
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  // Format duration target from string like "150m" or "60m" to "2h 30m" or "1h"
  const formatDurationTarget = (duration: string): string => {
    // Extract number from duration string (e.g., "150m" -> 150)
    const match = duration.match(/(\d+)m/);
    if (!match) return duration; // Return as-is if format doesn't match

    const totalMinutes = parseInt(match[1]);
    return formatTime(totalMinutes);
  };

  // Load PDF metadata when modal opens
  useEffect(() => {
    if (!open || siiReferences.length === 0) return;

    const loadMetadata = async () => {
      setLoadingMetadata(true);
      const metadata = new Map<number, PDFMetadata>();

      try {
        // Dynamically import PDF metadata extractor (client-side only)
        const { extractPDFMetadata } = await import('@/lib/pdf-metadata');

        // Get unique document numbers
        const docNumbers = Array.from(new Set(siiReferences.map(ref => ref.documentNumber)));

        // Load metadata for each document
        await Promise.all(
          docNumbers.map(async (docNum) => {
            const ref = siiReferences.find(r => r.documentNumber === docNum);
            if (ref) {
              try {
                const meta = await extractPDFMetadata(ref.documentPath);
                if (meta) {
                  metadata.set(docNum, meta);
                }
              } catch (error) {
                console.error(`Failed to load metadata for doc ${docNum}:`, error);
              }
            }
          })
        );
      } catch (error) {
        console.error('Failed to load PDF metadata module:', error);
      }

      setPdfMetadata(metadata);
      setLoadingMetadata(false);
    };

    loadMetadata();
  }, [open, siiReferences]);

  // Helper to find the task that matches a SII reference
  const findTaskForReference = (reference: SIIReference): FlowchartTask | undefined => {
    if (!step) return undefined;
    return filteredTasks.find(task => task.description.trim().startsWith(reference.fullReference));
  };

  // Open PDF viewer with specific section
  const openPdfViewer = (reference: SIIReference) => {
    const page = getSectionPage(reference.documentNumber, reference.section);
    setSelectedPdfUrl(reference.documentPath);
    setSelectedPdfTitle(`Doc ${reference.documentNumber}: ${reference.documentTitle} - § ${reference.section}`);
    setSelectedPdfPage(page);
    setPdfViewerOpen(true);
  };

  // Guard against null step
  if (!step) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Loading</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">
            Step {step.colorCode} Details
          </DialogTitle>
          <div className="flex items-start justify-between gap-4">
            {/* Left side - Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {step.technician === "both" ? (
                  <>
                    <div className="bg-blue-500/90 px-3 py-1 rounded-md">
                      <span className="text-xs font-bold text-white">T1</span>
                    </div>
                    <div className="bg-purple-500/90 px-3 py-1 rounded-md">
                      <span className="text-xs font-bold text-white">T2</span>
                    </div>
                  </>
                ) : step.technician === "T1" ? (
                  <div className="bg-blue-500/90 px-3 py-1 rounded-md">
                    <span className="text-xs font-bold text-white">T1</span>
                  </div>
                ) : (
                  <div className="bg-purple-500/90 px-3 py-1 rounded-md">
                    <span className="text-xs font-bold text-white">T2</span>
                  </div>
                )}
              </div>

              {/* Service Filter Toggle */}
              {selectedServiceType !== "all" && (
                <div className="mb-3 flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <Info className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                  <span className="text-xs text-blue-700">
                    Showing tasks for {selectedServiceType} service
                  </span>
                  <label className="ml-auto flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={showAllTasks}
                      onCheckedChange={(checked) => setShowAllTasks(checked === true)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-xs text-blue-700 font-medium">Show All Tasks</span>
                  </label>
                </div>
              )}

              {/* Tasks as vertical list - separated by status */}
              <div className="space-y-3">
                {(() => {
                  const tasks = step.title.split('\n').map((task, idx) => {
                    const taskMatch = task.match(/^([\d.]+)\s+(.+)$/);
                    if (!taskMatch) return null;
                    const [, ref, desc] = taskMatch;
                    const taskObj = filteredTasks.find(t => t.description.startsWith(ref));

                    // Skip this task if it's not in filteredTasks (means it was filtered out)
                    if (!taskObj) return null;

                    const isCompleted = taskObj?.completed || false;
                    const siiRef = siiReferences.find(r => r.fullReference === ref || ref.startsWith(r.fullReference));

                    return { idx, ref, desc, taskObj, isCompleted, siiRef };
                  }).filter((t): t is NonNullable<typeof t> => t !== null);

                  const inProgressTasks = tasks.filter(t => !t.isCompleted);
                  const completedTasks = tasks.filter(t => t.isCompleted);

                  return (
                    <>
                      {/* In Progress Section */}
                      {inProgressTasks.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                            In Progress
                          </p>
                          {(() => {
                            // Group tasks by service type
                            const groupedByService = inProgressTasks.reduce((acc, task) => {
                              const serviceType = task.taskObj?.serviceType || '1Y';
                              if (!acc[serviceType]) {
                                acc[serviceType] = [];
                              }
                              acc[serviceType].push(task);
                              return acc;
                            }, {} as Record<string, typeof inProgressTasks>);

                            return (
                              <div className="space-y-3">
                                {Object.entries(groupedByService)
                                  .sort(([a], [b]) => {
                                    // Sort by service type (1Y, 2Y, 3Y, etc.)
                                    const aNum = parseInt(a) || 999;
                                    const bNum = parseInt(b) || 999;
                                    return aNum - bNum;
                                  })
                                  .map(([serviceType, tasks]) => (
                                    <div key={serviceType} className="space-y-1">
                                      {tasks.map(({ idx, ref, desc, taskObj, siiRef }) => {
                                        const hasReferenceNumber = /^\d+\.\d+(\.\d+)*\.?$/.test(ref);

                                        return (
                                          <div
                                            key={idx}
                                            className={cn(
                                              "flex items-center gap-2 text-sm py-1.5 pr-3 rounded-md overflow-hidden",
                                              !hasReferenceNumber && "ml-6",
                                              (serviceType === '1Y' || serviceType === '12Y') ? "pl-2" : "pl-0"
                                            )}
                                            style={{
                                              backgroundColor: serviceType === '1Y' || serviceType === '12Y'
                                                ? 'rgba(156, 163, 175, 0.15)'
                                                : `${SERVICE_TYPE_COLORS[serviceType as keyof typeof SERVICE_TYPE_COLORS] || SERVICE_TYPE_COLORS.default}08`
                                            }}
                                          >
                                            <div
                                              style={{
                                                backgroundColor: (serviceType === '1Y' || serviceType === '12Y')
                                                  ? '#6B7280'
                                                  : SERVICE_TYPE_COLORS[serviceType as keyof typeof SERVICE_TYPE_COLORS] || SERVICE_TYPE_COLORS.default
                                              }}
                                              className="px-3 py-2 flex items-center justify-center flex-shrink-0 self-stretch"
                                            >
                                              <span className="text-[10px] font-mono font-bold text-white">
                                                {serviceType}
                                              </span>
                                            </div>
                                            {siiRef ? (
                                              <button
                                                onClick={() => openPdfViewer(siiRef)}
                                                className="font-mono text-xs text-blue-600 font-medium flex-shrink-0 hover:text-blue-800 hover:underline cursor-pointer"
                                                title={`View PDF at section ${siiRef.section}`}
                                              >
                                                {ref}
                                              </button>
                                            ) : (
                                              <span className={cn(
                                                "text-xs flex-shrink-0",
                                                hasReferenceNumber ? "font-mono text-blue-600 font-medium" : "text-muted-foreground"
                                              )}>
                                                {ref}
                                              </span>
                                            )}
                                            <span className="flex-1">{desc}</span>

                                            {/* Service Type Editor - Only in edit mode for tasks with reference numbers */}
                                            {hasReferenceNumber && isEditMode && taskObj && (
                                              <Popover>
                                                <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-6 px-2 text-[10px] font-mono ml-2 flex-shrink-0"
                                                    style={{
                                                      backgroundColor: taskObj.serviceType ? (SERVICE_TYPE_COLORS[taskObj.serviceType as keyof typeof SERVICE_TYPE_COLORS] || SERVICE_TYPE_COLORS.default) : 'white',
                                                      color: taskObj.serviceType ? 'white' : 'black',
                                                      borderColor: taskObj.serviceType ? 'transparent' : '#ccc'
                                                    }}
                                                  >
                                                    {taskObj.serviceType || 'Set Type'}
                                                    <Pencil className="h-2.5 w-2.5 ml-1" />
                                                  </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-72" onClick={(e) => e.stopPropagation()}>
                                                  <ServiceTypeSelector
                                                    currentType={taskObj.serviceType}
                                                    onSelect={(type) => {
                                                      if (onTaskServiceTypeChange) {
                                                        onTaskServiceTypeChange(taskObj.id, type);
                                                      }
                                                    }}
                                                  />
                                                </PopoverContent>
                                              </Popover>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ))}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Completed Section */}
                      {completedTasks.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600 mb-1.5">
                            Completed
                          </p>
                          {(() => {
                            // Group completed tasks by service type
                            const groupedByService = completedTasks.reduce((acc, task) => {
                              const serviceType = task.taskObj?.serviceType || '1Y';
                              if (!acc[serviceType]) {
                                acc[serviceType] = [];
                              }
                              acc[serviceType].push(task);
                              return acc;
                            }, {} as Record<string, typeof completedTasks>);

                            return (
                              <div className="space-y-3">
                                {Object.entries(groupedByService)
                                  .sort(([a], [b]) => {
                                    // Sort by service type (1Y, 2Y, 3Y, etc.)
                                    const aNum = parseInt(a) || 999;
                                    const bNum = parseInt(b) || 999;
                                    return aNum - bNum;
                                  })
                                  .map(([serviceType, tasks]) => (
                                    <div key={serviceType} className="space-y-1">
                                      {tasks.map(({ idx, ref, desc, taskObj, siiRef }) => {
                                        const hasReferenceNumber = /^\d+\.\d+(\.\d+)*\.?$/.test(ref);

                                        return (
                                          <div
                                            key={idx}
                                            className={cn(
                                              "flex items-center gap-2 text-sm py-1.5 pr-3 rounded-md overflow-hidden",
                                              !hasReferenceNumber && "ml-6",
                                              (serviceType === '1Y' || serviceType === '12Y') ? "pl-2" : "pl-0"
                                            )}
                                            style={{
                                              backgroundColor: serviceType === '1Y' || serviceType === '12Y'
                                                ? 'rgba(156, 163, 175, 0.2)'
                                                : 'rgba(134, 239, 172, 0.15)'
                                            }}
                                          >
                                            <div
                                              style={{
                                                backgroundColor: (serviceType === '1Y' || serviceType === '12Y')
                                                  ? '#6B7280'
                                                  : SERVICE_TYPE_COLORS[serviceType as keyof typeof SERVICE_TYPE_COLORS] || SERVICE_TYPE_COLORS.default
                                              }}
                                              className="px-3 py-2 flex items-center justify-center flex-shrink-0 opacity-90 self-stretch"
                                            >
                                              <span className="text-[10px] font-mono font-bold text-white">
                                                {serviceType}
                                              </span>
                                            </div>
                                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                            {siiRef ? (
                                              <button
                                                onClick={() => openPdfViewer(siiRef)}
                                                className="font-mono text-xs text-white/90 font-medium flex-shrink-0 hover:text-white hover:underline cursor-pointer line-through"
                                                title={`View PDF at section ${siiRef.section}`}
                                              >
                                                {ref}
                                              </button>
                                            ) : (
                                              <span className={cn(
                                                "text-xs flex-shrink-0 line-through text-white/90",
                                                hasReferenceNumber && "font-mono font-medium"
                                              )}>
                                                {ref}
                                              </span>
                                            )}
                                            <span className="line-through flex-1 text-white/80">{desc}</span>

                                            {/* Service Type Editor - Only in edit mode for tasks with reference numbers */}
                                            {hasReferenceNumber && isEditMode && taskObj && (
                                              <Popover>
                                                <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-6 px-2 text-[10px] font-mono ml-2 flex-shrink-0 opacity-70"
                                                    style={{
                                                      backgroundColor: taskObj.serviceType ? (SERVICE_TYPE_COLORS[taskObj.serviceType as keyof typeof SERVICE_TYPE_COLORS] || SERVICE_TYPE_COLORS.default) : 'white',
                                                      color: taskObj.serviceType ? 'white' : 'black',
                                                      borderColor: taskObj.serviceType ? 'transparent' : '#ccc'
                                                    }}
                                                  >
                                                    {taskObj.serviceType || 'Set Type'}
                                                    <Pencil className="h-2.5 w-2.5 ml-1" />
                                                  </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-72" onClick={(e) => e.stopPropagation()}>
                                                  <ServiceTypeSelector
                                                    currentType={taskObj.serviceType}
                                                    onSelect={(type) => {
                                                      if (onTaskServiceTypeChange) {
                                                        onTaskServiceTypeChange(taskObj.id, type);
                                                      }
                                                    }}
                                                  />
                                                </PopoverContent>
                                              </Popover>
                                            )}
                                            {taskObj?.completedAt && (
                                              <span className="text-[10px] text-green-400 font-mono ml-2 flex-shrink-0">
                                                • {new Date(taskObj.completedAt).toLocaleTimeString('sv-SE', {
                                                  hour: '2-digit',
                                                  minute: '2-digit'
                                                })}
                                                {taskObj.actualTimeMinutes && (
                                                  <span className="text-green-300 font-semibold ml-1">
                                                    ({formatTime(taskObj.actualTimeMinutes)})
                                                  </span>
                                                )}
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ))}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Right side - Compact stats */}
            <div className="flex flex-col gap-1.5 flex-shrink-0 mr-8">
              {/* Duration & Actual Time */}
              <div className="bg-blue-50 border border-blue-200 rounded-md px-2.5 py-1.5 min-w-[110px]">
                <div className="flex items-center gap-1 text-blue-700 mb-1">
                  <Clock className="h-3 w-3" />
                  <span className="text-[10px] font-medium uppercase tracking-wide">Duration (Target)</span>
                </div>
                <p className="text-base font-bold text-blue-900 mb-1">{formatDurationTarget(step.duration)}</p>

                <div className="flex items-center gap-1 text-green-700 mt-2">
                  <ClockIcon className="h-3 w-3" />
                  <span className="text-[10px] font-medium uppercase tracking-wide">Actual Time</span>
                </div>
                <p className={cn(
                  "text-base font-bold font-mono",
                  totalStepTimeMinutes === 0 ? "text-gray-500" : totalStepTimeMinutes <= step.durationMinutes ? "text-green-900" : "text-red-900"
                )}>
                  {formatTime(totalStepTimeMinutes)}
                </p>
              </div>

              {/* Circular Progress */}
              <div className={cn(
                "border rounded-md px-2.5 py-2 flex flex-col items-center",
                isComplete ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
              )}>
                <div className="relative w-20 h-20">
                  {/* Background Circle */}
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      className={cn(
                        isComplete ? "text-green-200" : "text-yellow-200"
                      )}
                    />
                    {/* Progress Circle */}
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset={`${2 * Math.PI * 32 * (1 - (totalTasks > 0 ? completedTasks / totalTasks : 0))}`}
                      className={cn(
                        "transition-all duration-500",
                        isComplete ? "text-green-500" : "text-yellow-500"
                      )}
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Center Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {isComplete ? (
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    ) : (
                      <>
                        <p className="text-lg font-bold leading-none text-yellow-700">
                          {completedTasks}/{totalTasks}
                        </p>
                        <p className="text-[9px] font-medium uppercase tracking-wide mt-0.5 text-yellow-600">
                          Tasks
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Completion Timestamp */}
                {isComplete && step.completedAt && (
                  <div className="mt-2 text-center">
                    <p className="text-xs font-bold text-green-700 font-mono leading-tight">
                      {new Date(step.completedAt).toLocaleDateString('sv-SE', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </p>
                    <p className="text-xs font-bold text-green-700 font-mono">
                      {new Date(step.completedAt).toLocaleTimeString('sv-SE', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-[9px] font-medium uppercase tracking-wide text-green-600 mt-0.5">
                      Completed
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="checklist" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="checklist">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Checklist
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="media">
              <ImageIcon className="h-4 w-4 mr-2" />
              Media
            </TabsTrigger>
          </TabsList>

          {/* CHECKLIST TAB - SII References with Checkboxes */}
          <TabsContent value="checklist" className="space-y-3">
            {/* Service Filter Toggle - Show at top of checklist */}
            {selectedServiceType !== "all" && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span className="text-xs text-blue-700">
                  Showing tasks for {selectedServiceType} service
                </span>
                <label className="ml-auto flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={showAllTasks}
                    onCheckedChange={setShowAllTasks}
                    className="h-4 w-4"
                  />
                  <span className="text-xs text-blue-700 font-medium">Show All Tasks</span>
                </label>
              </div>
            )}

            {siiReferences.length > 0 ? (
              <>
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium">Service Instruction Instructions (SII)</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click to open the relevant SII document. {siiReferences.length} reference{siiReferences.length > 1 ? 's' : ''} found in this step.
                  </p>
                </div>

                {/* Group references by document */}
                {Array.from(groupedReferences.entries()).map(([docNum, refs]) => {
                  // Calculate progress for this document's tasks
                  const tasks = refs.map(ref => findTaskForReference(ref)).filter(Boolean) as FlowchartTask[];
                  const completedCount = tasks.filter(t => t.completed).length;
                  const totalCount = tasks.length;
                  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
                  const isDocComplete = completedCount === totalCount && totalCount > 0;

                  return (
                    <Card key={docNum} className="border-l-4 border-l-blue-500 transition-colors">
                      <CardContent className="pt-4 pb-4">
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <p className="font-medium text-sm">
                                Doc {docNum}: {refs[0].documentTitle}
                              </p>
                              {isDocComplete && (
                                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openPdfViewer(refs[0])}
                                className="h-6 px-2 py-1 text-xs gap-1 ml-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                PDF
                              </Button>
                            </div>
                            <div className="mt-1 space-y-1">
                              <p className="text-xs text-muted-foreground">
                                {refs.length} section{refs.length > 1 ? 's' : ''} referenced · {completedCount}/{totalCount} completed
                              </p>
                              {/* Progress bar */}
                              <div className="w-48 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    isDocComplete ? "bg-green-500" : "bg-blue-500"
                                  )}
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            </div>
                          </div>

                        {/* List all sections from this document with checkboxes */}
                        <div className="space-y-2 mt-3">
                          {refs.map((ref, idx) => {
                            const task = findTaskForReference(ref);
                            const isCompleted = task?.completed || false;

                            return (
                              <div
                                key={idx}
                                className={cn(
                                  "p-2 rounded-md transition-colors",
                                  isCompleted && "bg-green-50/30"
                                )}
                              >
                                {/* Main task row */}
                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    checked={isCompleted}
                                    onCheckedChange={() => task && onTaskToggle(task.id)}
                                    disabled={!task}
                                    className="flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => openPdfViewer(ref)}
                                        className="font-mono text-xs text-blue-600 font-medium hover:text-blue-800 hover:underline cursor-pointer flex-shrink-0"
                                        title={`View PDF at section ${ref.section}`}
                                      >
                                        § {ref.section}
                                      </button>
                                      <div className="flex items-center gap-2 flex-1">
                                        <p className={cn(
                                          "text-xs flex-1",
                                          isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                                        )}>
                                          {ref.description || '—'}
                                        </p>

                                        {/* Service Type Badge - ALWAYS show button in edit mode */}
                                        {isEditMode && task ? (
                                          <Popover>
                                            <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 px-2 text-[10px] font-mono flex-shrink-0"
                                                style={{
                                                  backgroundColor: task.serviceType ? (SERVICE_TYPE_COLORS[task.serviceType as keyof typeof SERVICE_TYPE_COLORS] || SERVICE_TYPE_COLORS.default) : 'white',
                                                  color: task.serviceType ? 'white' : 'black',
                                                  borderColor: task.serviceType ? 'transparent' : '#ccc'
                                                }}
                                              >
                                                {task.serviceType || 'Set Type'}
                                                <Pencil className="h-2.5 w-2.5 ml-1" />
                                              </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-72" onClick={(e) => e.stopPropagation()}>
                                              <ServiceTypeSelector
                                                currentType={task.serviceType}
                                                onSelect={(type) => {
                                                  if (onTaskServiceTypeChange) {
                                                    onTaskServiceTypeChange(task.id, type);
                                                  }
                                                }}
                                              />
                                            </PopoverContent>
                                          </Popover>
                                        ) : (
                                          task?.serviceType && (
                                            <Badge
                                              style={{
                                                backgroundColor: SERVICE_TYPE_COLORS[task.serviceType as keyof typeof SERVICE_TYPE_COLORS] || SERVICE_TYPE_COLORS.default,
                                                color: 'white'
                                              }}
                                              className="text-[9px] font-mono px-1.5 py-0 flex-shrink-0"
                                            >
                                              {task.serviceType}
                                            </Badge>
                                          )
                                        )}
                                      </div>

                                      {/* Bug Report Icon */}
                                      {task && step && (
                                        <BugReportDialog
                                          flowchartId={flowchartId}
                                          flowchartName={flowchartName}
                                          stepId={step.id}
                                          stepTitle={step.title}
                                          taskId={task.id}
                                          taskDescription={task.description}
                                        />
                                      )}
                                    </div>
                                  </div>

                                  {/* Time input - positioned on the right */}
                                  {task && (
                                    <div className="flex-shrink-0 ml-2">
                                      <TimeInput
                                        value={task.actualTimeMinutes}
                                        onChange={(minutes) => onTaskTimeChange(task.id, minutes)}
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Notes section */}
                                {task && (
                                  <TaskNotes
                                    taskId={task.id}
                                    notes={task.notes}
                                    onAddNote={onTaskNotesChange}
                                    onEditNote={onTaskNoteEdit}
                                    onDeleteNote={onTaskNoteDelete}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No SII references found in this step</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Task descriptions should start with references like &quot;11.5.1 Description&quot;
                </p>
              </div>
            )}
          </TabsContent>

          {/* DOCUMENTS TAB - PDF Links and Resources */}
          <TabsContent value="documents" className="space-y-3">
            {siiReferences.length > 0 || (step.documents && step.documents.length > 0) ? (
              <>
                {/* SII Documents Section */}
                {siiReferences.length > 0 && (
                  <>
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        <p className="text-sm font-medium">Service Instruction Instructions (SII)</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {groupedReferences.size} SII document{groupedReferences.size > 1 ? 's' : ''} referenced in this step
                      </p>
                    </div>

                    {/* List SII documents */}
                    <div className="space-y-2">
                      {Array.from(groupedReferences.entries()).map(([docNum, refs]) => {
                        const metadata = pdfMetadata.get(docNum);

                        return (
                          <Card key={docNum} className="hover:bg-accent cursor-pointer transition-colors">
                            <CardContent
                              className="pt-4 pb-4"
                              onClick={() => openSIIDocument(refs[0])}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">
                                      Doc {docNum}: {refs[0].documentTitle}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {refs.length} section{refs.length > 1 ? 's' : ''} referenced
                                    </p>

                                    {/* Metadata */}
                                    {metadata ? (
                                      <div className="mt-1 flex items-center gap-2 text-xs">
                                        <Badge variant="outline" className="font-mono text-[10px]">
                                          {metadata.documentNumber} {metadata.version}
                                        </Badge>
                                        <span className="text-muted-foreground">·</span>
                                        <Badge variant="secondary" className="text-[10px]">
                                          {metadata.type}
                                        </Badge>
                                        <span className="text-muted-foreground">·</span>
                                        <span className="text-muted-foreground">{metadata.date}</span>
                                      </div>
                                    ) : loadingMetadata ? (
                                      <div className="mt-1 text-xs text-muted-foreground">
                                        Loading metadata...
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                                <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Additional Documents Section */}
                {step.documents && step.documents.length > 0 && (
                  <>
                    <div className={siiReferences.length > 0 ? "mt-6 mb-4" : "mb-4"}>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-gray-600" />
                        <p className="text-sm font-medium">Additional Documents</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Other reference documents for this step
                      </p>
                    </div>

                    <div className="space-y-2">
                      {step.documents.map((doc, idx) => (
                        <Card key={idx} className="hover:bg-accent cursor-pointer transition-colors">
                          <CardContent className="pt-4 pb-4 flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gray-600" />
                            <span className="text-sm">{doc}</span>
                            <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No documents available for this step</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Documents will be linked as they become available
                </p>
              </div>
            )}
          </TabsContent>

          {/* MEDIA TAB */}
          <TabsContent value="media" className="space-y-3">
            {step.media && step.media.length > 0 ? (
              step.media.map((mediaItem, idx) => (
                <Card key={idx} className="hover:bg-accent cursor-pointer">
                  <CardContent className="pt-4 pb-4 flex items-center gap-3">
                    <PlayCircle className="h-5 w-5 text-purple-600" />
                    <span className="text-sm">{mediaItem}</span>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <PlayCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No photos or videos available for this step</p>
                <p className="text-xs text-muted-foreground mt-2">Media content will be added soon</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* PDF Viewer Dialog */}
      <PDFViewerDialog
        open={pdfViewerOpen}
        onOpenChange={setPdfViewerOpen}
        pdfUrl={selectedPdfUrl}
        title={selectedPdfTitle}
        initialPage={selectedPdfPage}
      />
    </Dialog>
  );
}

// Service Type Selector Component (Grid of colored buttons)
interface ServiceTypeSelectorProps {
  currentType?: string;
  onSelect: (type: string) => void;
}

function ServiceTypeSelector({ currentType, onSelect }: ServiceTypeSelectorProps) {
  const serviceTypes = [
    { name: "1Y", color: SERVICE_TYPE_COLORS["1Y"] },
    { name: "2Y", color: SERVICE_TYPE_COLORS["2Y"] },
    { name: "3Y", color: SERVICE_TYPE_COLORS["3Y"] },
    { name: "4Y", color: SERVICE_TYPE_COLORS["4Y"] },
    { name: "5Y", color: SERVICE_TYPE_COLORS["5Y"] },
    { name: "6Y", color: SERVICE_TYPE_COLORS["6Y"] },
    { name: "7Y", color: SERVICE_TYPE_COLORS["7Y"] },
    { name: "10Y", color: SERVICE_TYPE_COLORS["10Y"] },
    { name: "12Y", color: SERVICE_TYPE_COLORS["12Y"] },
  ];

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Select Service Type</Label>

      {/* Grid of colored buttons */}
      <div className="grid grid-cols-3 gap-2">
        {serviceTypes.map((st) => (
          <button
            key={st.name}
            onClick={() => onSelect(st.name)}
            className={cn(
              "h-12 rounded-lg border-2 text-xs font-bold text-white transition-all flex items-center justify-center hover:scale-105",
              currentType === st.name ? "border-blue-500 scale-105 ring-2 ring-blue-300" : "border-transparent"
            )}
            style={{ backgroundColor: st.color }}
            title={st.name}
          >
            {st.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// Task Service Type Editor Component (OLD - keeping for compatibility)
interface TaskServiceTypeEditorProps {
  task: FlowchartTask | undefined;
  onServiceTypeChange: (taskId: string, serviceType: string) => void;
}

function TaskServiceTypeEditor({ task, onServiceTypeChange }: TaskServiceTypeEditorProps) {
  const [editing, setEditing] = useState(false);
  const [selectedType, setSelectedType] = useState(task?.serviceType || "1Y");

  if (!task) return null;

  const serviceTypes = [
    { name: "1Y", color: SERVICE_TYPE_COLORS["1Y"] },
    { name: "2Y", color: SERVICE_TYPE_COLORS["2Y"] },
    { name: "3Y", color: SERVICE_TYPE_COLORS["3Y"] },
    { name: "4Y", color: SERVICE_TYPE_COLORS["4Y"] },
    { name: "5Y", color: SERVICE_TYPE_COLORS["5Y"] },
    { name: "6Y", color: SERVICE_TYPE_COLORS["6Y"] },
    { name: "7Y", color: SERVICE_TYPE_COLORS["7Y"] },
    { name: "10Y", color: SERVICE_TYPE_COLORS["10Y"] },
    { name: "12Y", color: SERVICE_TYPE_COLORS["12Y"] },
  ];

  const handleSave = () => {
    onServiceTypeChange(task.id, selectedType);
    setEditing(false);
  };

  return (
    <Popover open={editing} onOpenChange={setEditing}>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        <div className="inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0">
          {task.serviceType ? (
            <Badge
              style={{
                backgroundColor: SERVICE_TYPE_COLORS[task.serviceType as keyof typeof SERVICE_TYPE_COLORS] || SERVICE_TYPE_COLORS.default,
                color: task.serviceType === "1Y" || task.serviceType === "12Y" ? 'white' : 'white'
              }}
              className="text-[9px] font-mono px-1.5 py-0"
            >
              {task.serviceType}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0">
              Set Type
            </Badge>
          )}
          <Pencil className="h-2.5 w-2.5 text-gray-500 opacity-60 hover:opacity-100 transition-opacity" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-72" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Service Type</Label>

          {/* Grid of colored buttons */}
          <div className="grid grid-cols-5 gap-2">
            {serviceTypes.map((st) => (
              <button
                key={st.name}
                onClick={() => setSelectedType(st.name)}
                className={cn(
                  "h-12 rounded-lg border-2 text-xs font-bold text-white transition-all flex items-center justify-center",
                  selectedType === st.name ? "border-blue-500 scale-105 ring-2 ring-blue-300" : "border-transparent hover:scale-105"
                )}
                style={{ backgroundColor: st.color }}
                title={st.name}
              >
                {st.name}
              </button>
            ))}
          </div>

          <Button size="sm" onClick={handleSave} className="w-full">
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
