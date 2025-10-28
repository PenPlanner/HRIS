"use client"

import { FlowchartStep, FlowchartTask, TaskNote } from "@/lib/flowchart-data";
import { extractSIIReferences, groupReferencesByDocument, openSIIDocument, parseSIIReference, SIIReference } from "@/lib/sii-documents";
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
import { Input } from "@/components/ui/input";
import { Clock, CheckCircle2, FileText, Image as ImageIcon, PlayCircle, X, ExternalLink, BookOpen, Info, Pencil, Save, Indent, Outdent, ChevronDown, ChevronRight, Download, CloudOff, Loader2, User, Plus } from "lucide-react";
import { BugReportDialog } from "../bug-report/bug-report-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useMemo, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { PDFViewerDialog } from "./pdf-viewer-dialog";
import { TimeInput } from "./time-input";
import { TaskNotes } from "./task-notes";
import { Clock as ClockIcon } from "lucide-react";
import { useOfflinePDFs } from "@/hooks/use-offline-pdfs";
import { getSelectedTechnicians, getActiveTechnicians, getTechnicianById, Technician } from "@/lib/technicians-data";

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
  onTaskDescriptionChange?: (taskId: string, description: string) => void;
  onTaskIndentToggle?: (taskId: string, isIndented: boolean) => void;
  onStepUpdate?: (step: FlowchartStep) => void;
  selectedServiceType?: string;
  isEditMode?: boolean;
  onOpenTechnicianModal?: (step: FlowchartStep) => void;
  onAddAdditionalTechnician?: (technicianId: string, role: 'T1' | 'T2' | 'T3') => void;
  onRemoveAdditionalTechnician?: (technicianId: string) => void;
  selectedT1?: Technician | null;
  selectedT2?: Technician | null;
  selectedT3?: Technician | null;
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
  onTaskDescriptionChange,
  onTaskIndentToggle,
  onStepUpdate,
  selectedServiceType = "all",
  isEditMode = false,
  onOpenTechnicianModal,
  onAddAdditionalTechnician,
  onRemoveAdditionalTechnician,
  selectedT1,
  selectedT2,
  selectedT3
}: StepDetailDrawerProps) {
  // State for "Show All" toggle
  const [showAllTasks, setShowAllTasks] = useState(false);

  // State for inline editing
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState<string>("");

  // State for collapsible sections - collapsed by default
  const [inProgressOpen, setInProgressOpen] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(false);

  // Offline PDF management
  const { downloadPDF, isAvailable, loading: offlineLoading } = useOfflinePDFs();

  // Use step-specific technicians if available, otherwise use global selections
  const t1 = step?.t1Id ? getTechnicianById(step.t1Id) : selectedT1;
  const t2 = step?.t2Id ? getTechnicianById(step.t2Id) : selectedT2;
  const t3 = step?.t3Id ? getTechnicianById(step.t3Id) : selectedT3;

  // State for adding additional technicians
  const [showAddTechModal, setShowAddTechModal] = useState(false);
  const [availableTechnicians, setAvailableTechnicians] = useState<Technician[]>([]);

  // Load available technicians
  useEffect(() => {
    const techs = getActiveTechnicians();
    setAvailableTechnicians(techs);
  }, []);

  // Filter tasks based on selected service type
  const filteredTasks = useMemo(() => {
    if (!step) return [];

    // If "Show All" is enabled, return all tasks
    if (showAllTasks) return step.tasks;

    // If service filter is "all" or empty, return all tasks
    if (selectedServiceType === "all" || selectedServiceType === "") return step.tasks;

    const includedTypes = getIncludedServiceTypes(selectedServiceType);
    const filtered = step.tasks.filter(task => {
      // If task has no serviceType, include it (base service)
      if (!task.serviceType) return true;
      // Check if task's serviceType is in the included types
      return includedTypes.includes(task.serviceType);
    });
    return filtered;
  }, [step, selectedServiceType, showAllTasks]);

  // Extract SII references from filtered task descriptions
  const siiReferences = useMemo(() => step ? extractSIIReferences(filteredTasks) : [], [filteredTasks, step]);
  const groupedReferences = useMemo(() => groupReferencesByDocument(siiReferences), [siiReferences]);

  // Identify tasks WITHOUT SII references
  const tasksWithoutSII = useMemo(() => {
    return filteredTasks.filter(task => !parseSIIReference(task.description));
  }, [filteredTasks]);

  // Count ALL filtered tasks, not just those with SII references
  const completedTasks = filteredTasks.filter(t => t.completed).length;
  const totalTasks = filteredTasks.length;
  const isComplete = completedTasks === totalTasks && totalTasks > 0;

  // Keep siiTasks for SII reference matching
  const siiTasks = useMemo(() => {
    if (!step) return [];
    return siiReferences.map(ref =>
      filteredTasks.find(task => task.description.trim().startsWith(ref.fullReference))
    ).filter(Boolean) as FlowchartTask[];
  }, [siiReferences, filteredTasks, step]);

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
                // Silent error handling - metadata loading failed
              }
            }
          })
        );
      } catch (error) {
        // Silent error handling - PDF metadata module failed to load
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">
            Step {step.colorCode} Details
          </DialogTitle>

          {/* Header - Improved Layout */}
          <div className="space-y-3 mb-4">
            {/* Row 1: Technicians - Click to assign technicians for this step */}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                {/* Technician buttons - always show T1, T2, T3 */}
                <button
                  onClick={() => step && onOpenTechnicianModal?.(step)}
                  className="group bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
                  title={step?.t1Id ? "Step-specific T1 (click to change for this step only)" : "T1 from global selection (click to set step-specific)"}
                >
                  <span className="text-xs font-bold text-white">T1</span>
                  <span className="text-xs text-white/90">{t1 ? t1.initials : 'Not assigned'}</span>
                  {step?.t1Id && <span className="text-[10px] text-white/70">*</span>}
                </button>

                <button
                  onClick={() => step && onOpenTechnicianModal?.(step)}
                  className="group bg-purple-500 hover:bg-purple-600 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
                  title={step?.t2Id ? "Step-specific T2 (click to change for this step only)" : "T2 from global selection (click to set step-specific)"}
                >
                  <span className="text-xs font-bold text-white">T2</span>
                  <span className="text-xs text-white/90">{t2 ? t2.initials : 'Not assigned'}</span>
                  {step?.t2Id && <span className="text-[10px] text-white/70">*</span>}
                </button>

                <button
                  onClick={() => step && onOpenTechnicianModal?.(step)}
                  className="group bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
                  title={step?.t3Id ? "Step-specific T3 (click to change for this step only)" : "T3 from global selection (click to set step-specific)"}
                >
                  <span className="text-xs font-bold text-white">T3</span>
                  <span className="text-xs text-white/90">{t3 ? t3.initials : 'Optional'}</span>
                  {step?.t3Id && <span className="text-[10px] text-white/70">*</span>}
                </button>

                {/* Additional technicians */}
                {step.additionalTechnicians && step.additionalTechnicians.length > 0 && step.additionalTechnicians.map((tech) => (
                  <div
                    key={tech.id}
                    className={cn(
                      "px-3 py-1.5 rounded-md flex items-center gap-1.5 group relative",
                      tech.role === 'T1' ? "bg-blue-500/80" : tech.role === 'T2' ? "bg-purple-500/80" : "bg-orange-500/80"
                    )}
                  >
                    <span className="text-xs font-bold text-white">{tech.role}</span>
                    <span className="text-xs text-white/90">{tech.initials}</span>
                    {onRemoveAdditionalTechnician && (
                      <button
                        onClick={() => onRemoveAdditionalTechnician(tech.id)}
                        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove technician"
                      >
                        <X className="h-3 w-3 text-white hover:text-red-200" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Add technician button */}
                <button
                  onClick={() => setShowAddTechModal(true)}
                  className="bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
                  title="Add additional technician"
                >
                  <Plus className="h-3.5 w-3.5 text-gray-600" />
                  <span className="text-xs font-medium text-gray-700">Add Tech</span>
                </button>
              </div>
            </div>

            {/* Row 2: Target Time, Actual Time and Progress */}
            <div className="flex items-center gap-3">
              {/* Target Time */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-2 border-green-200 dark:border-green-800 rounded-lg px-4 py-3 flex items-center gap-3 min-h-[72px]">
                <div className="bg-white dark:bg-gray-900 rounded-full p-2">
                  <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-[10px] text-green-700 dark:text-green-400 font-semibold uppercase tracking-wide">
                    TARGET TIME
                  </div>
                  <div className="text-xl font-bold font-mono text-green-900 dark:text-green-100">
                    {formatDurationTarget(step.duration)}
                  </div>
                </div>
              </div>

              {/* Actual Time */}
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg px-4 py-3 flex items-center gap-3 min-h-[72px]">
                <div className="flex items-center gap-2">
                  <div>
                    <div className="text-[10px] text-yellow-700 dark:text-yellow-400 font-semibold uppercase tracking-wide">
                      ACTUAL TIME
                    </div>
                    <div className="text-xl font-bold font-mono text-yellow-900 dark:text-yellow-100">
                      {formatTime(totalStepTimeMinutes)}
                    </div>
                  </div>
                  {(() => {
                    const targetMinutes = step.durationMinutes || 0;
                    const diff = totalStepTimeMinutes - targetMinutes;

                    // Only show comparison if actual time has been logged
                    if (totalStepTimeMinutes === 0 || targetMinutes === 0) return null;

                    if (diff === 0) {
                      return (
                        <div className="text-xs font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          on target
                        </div>
                      );
                    }

                    const isAhead = diff < 0;
                    const absDiff = Math.abs(diff);
                    return (
                      <div className={cn(
                        "text-xs font-semibold px-1.5 py-0.5 rounded",
                        isAhead
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      )}>
                        {isAhead ? '−' : '+'} {formatTime(absDiff)}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Tasks Progress */}
              <div className={cn(
                "border-2 rounded-lg px-4 py-3 flex items-center gap-3 min-w-[160px] min-h-[72px]",
                isComplete
                  ? "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800"
                  : "bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950 dark:to-slate-950 border-gray-200 dark:border-gray-700"
              )}>
                <div className="relative w-10 h-10 flex-shrink-0">
                  {/* Background Circle */}
                  <svg className="w-10 h-10 transform -rotate-90">
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      className={cn(
                        isComplete ? "text-blue-200 dark:text-blue-900" : "text-gray-200 dark:text-gray-700"
                      )}
                    />
                    {/* Progress Circle */}
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 16}`}
                      strokeDashoffset={`${2 * Math.PI * 16 * (1 - (totalTasks > 0 ? completedTasks / totalTasks : 0))}`}
                      className={cn(
                        "transition-all duration-500",
                        isComplete ? "text-green-500" : "text-blue-500"
                      )}
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Center Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{Math.round((totalTasks > 0 ? completedTasks / totalTasks : 0) * 100)}%</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold uppercase tracking-wide">
                    TASKS
                  </div>
                  <div className={cn(
                    "text-xl font-bold font-mono",
                    isComplete
                      ? "text-blue-900 dark:text-blue-100"
                      : "text-gray-900 dark:text-gray-100"
                  )}>
                    {completedTasks}/{totalTasks}
                  </div>
                  {isComplete && (
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                      Completed
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            {/* Main info */}
            <div className="flex-1 min-w-0">

              {/* Service Filter Toggle */}
              {selectedServiceType !== "all" && selectedServiceType !== "" && (
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
                  // Use filteredTasks array directly instead of parsing step.title
                  const tasks = filteredTasks.map((taskObj, idx) => {
                    // Try to extract reference number from description
                    const taskMatch = taskObj.description.match(/^([\d.\-]+)\s+(.+)$/);
                    // Use task ID as fallback to ensure uniqueness, not index
                    const ref = taskMatch ? taskMatch[1] : taskObj.id;
                    const desc = taskMatch ? taskMatch[2] : taskObj.description;

                    const isCompleted = taskObj?.completed || false;
                    const siiRef = siiReferences.find(r => r.fullReference === ref || ref.startsWith(r.fullReference));

                    return { idx, ref, desc, taskObj, isCompleted, siiRef };
                  });

                  const inProgressTasks = tasks.filter(t => !t.isCompleted);
                  const completedTasks = tasks.filter(t => t.isCompleted);

                  return (
                    <>
                      {/* In Progress Section */}
                      {inProgressTasks.length > 0 && (
                        <div>
                          <button
                            onClick={() => setInProgressOpen(!inProgressOpen)}
                            className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5 hover:text-gray-700 transition-colors"
                          >
                            {inProgressOpen ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                            In Progress ({inProgressTasks.length})
                          </button>
                          {inProgressOpen && (() => {
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
                                        const isIndented = taskObj?.isIndented || false;

                                        return (
                                          <div
                                            key={taskObj.id}
                                            className={cn(
                                              "flex items-center gap-2 text-sm py-1.5 pr-3 rounded-md overflow-hidden",
                                              isIndented && "ml-6",
                                              (serviceType === '1Y' || serviceType === '12Y') ? "pl-2" : "pl-0"
                                            )}
                                            style={{
                                              backgroundColor: serviceType === '1Y' || serviceType === '12Y'
                                                ? 'rgba(156, 163, 175, 0.15)'
                                                : `${SERVICE_TYPE_COLORS[serviceType as keyof typeof SERVICE_TYPE_COLORS] || SERVICE_TYPE_COLORS.default}08`
                                            }}
                                          >
                                            {isEditMode && taskObj ? (
                                              <Select
                                                value={taskObj.serviceType || "1Y"}
                                                onValueChange={(value) => {
                                                  if (onTaskServiceTypeChange) {
                                                    onTaskServiceTypeChange(taskObj.id, value);
                                                  }
                                                }}
                                              >
                                                <SelectTrigger
                                                  className="h-full border-0 px-3 py-2 flex-shrink-0 self-stretch rounded-none"
                                                  style={{
                                                    backgroundColor: (serviceType === '1Y' || serviceType === '12Y')
                                                      ? '#6B7280'
                                                      : SERVICE_TYPE_COLORS[serviceType as keyof typeof SERVICE_TYPE_COLORS] || SERVICE_TYPE_COLORS.default
                                                  }}
                                                >
                                                  <span className="text-[10px] font-mono font-bold text-white">
                                                    {serviceType}
                                                  </span>
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {["1Y", "2Y", "3Y", "4Y", "5Y", "6Y", "7Y", "10Y", "12Y"].map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                      <span className="font-mono text-xs">{type}</span>
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            ) : (
                                              <div
                                                style={{
                                                  backgroundColor: (serviceType === '1Y' || serviceType === '12Y')
                                                    ? '#6B7280'
                                                    : SERVICE_TYPE_COLORS[serviceType as keyof typeof SERVICE_TYPE_COLORS] || SERVICE_TYPE_COLORS.default
                                                }}
                                                className="px-3 py-2 flex items-center justify-center flex-shrink-0 self-stretch w-[50px]"
                                              >
                                                <span className="text-[10px] font-mono font-bold text-white">
                                                  {serviceType}
                                                </span>
                                              </div>
                                            )}
                                            {siiRef ? (
                                              <button
                                                onClick={() => openPdfViewer(siiRef)}
                                                className="font-mono text-xs text-blue-600 font-medium flex-shrink-0 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1"
                                                title={`View PDF at section ${siiRef.section}`}
                                              >
                                                <FileText className="h-3 w-3" />
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

                                            {/* Task Description - Inline editable in edit mode */}
                                            {isEditMode && taskObj && editingTaskId === taskObj.id ? (
                                              <Input
                                                value={editingDescription}
                                                onChange={(e) => setEditingDescription(e.target.value)}
                                                onBlur={() => {
                                                  if (onTaskDescriptionChange && editingDescription.trim()) {
                                                    onTaskDescriptionChange(taskObj.id, editingDescription);
                                                  }
                                                  setEditingTaskId(null);
                                                }}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    if (onTaskDescriptionChange && editingDescription.trim()) {
                                                      onTaskDescriptionChange(taskObj.id, editingDescription);
                                                    }
                                                    setEditingTaskId(null);
                                                  } else if (e.key === 'Escape') {
                                                    setEditingTaskId(null);
                                                  }
                                                }}
                                                className="flex-1 h-7 text-sm"
                                                autoFocus
                                              />
                                            ) : (
                                              <span
                                                className={cn("flex-1", isEditMode && taskObj && "cursor-text hover:bg-gray-100 rounded px-1 -mx-1")}
                                                onClick={() => {
                                                  if (isEditMode && taskObj) {
                                                    setEditingTaskId(taskObj.id);
                                                    setEditingDescription(desc);
                                                  }
                                                }}
                                              >
                                                {desc}
                                              </span>
                                            )}

                                            {/* Indent/Outdent button - Only in edit mode */}
                                            {isEditMode && taskObj && onTaskIndentToggle && (
                                              <button
                                                onClick={() => onTaskIndentToggle(taskObj.id, !isIndented)}
                                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                title={isIndented ? "Make this a normal task" : "Make this a sub-task (indented)"}
                                              >
                                                {isIndented ? (
                                                  <Outdent className="h-4 w-4 text-gray-600" />
                                                ) : (
                                                  <Indent className="h-4 w-4 text-gray-600" />
                                                )}
                                              </button>
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
                          <button
                            onClick={() => setCompletedOpen(!completedOpen)}
                            className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-green-600 mb-1.5 hover:text-green-700 transition-colors"
                          >
                            {completedOpen ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                            Completed ({completedTasks.length})
                          </button>
                          {completedOpen && (() => {
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
                                        const isIndented = taskObj?.isIndented || false;

                                        return (
                                          <div
                                            key={taskObj.id}
                                            className={cn(
                                              "flex items-center gap-2 text-sm py-1.5 pr-3 rounded-md overflow-hidden",
                                              isIndented && "ml-6",
                                              (serviceType === '1Y' || serviceType === '12Y') ? "pl-2" : "pl-0"
                                            )}
                                            style={{
                                              backgroundColor: serviceType === '1Y' || serviceType === '12Y'
                                                ? 'rgba(156, 163, 175, 0.2)'
                                                : 'rgba(134, 239, 172, 0.15)'
                                            }}
                                          >
                                            {isEditMode && taskObj ? (
                                              <Select
                                                value={taskObj.serviceType || "1Y"}
                                                onValueChange={(value) => {
                                                  if (onTaskServiceTypeChange) {
                                                    onTaskServiceTypeChange(taskObj.id, value);
                                                  }
                                                }}
                                              >
                                                <SelectTrigger
                                                  className="h-full border-0 px-3 py-2 flex-shrink-0 self-stretch rounded-none opacity-90"
                                                  style={{
                                                    backgroundColor: (serviceType === '1Y' || serviceType === '12Y')
                                                      ? '#6B7280'
                                                      : SERVICE_TYPE_COLORS[serviceType as keyof typeof SERVICE_TYPE_COLORS] || SERVICE_TYPE_COLORS.default
                                                  }}
                                                >
                                                  <span className="text-[10px] font-mono font-bold text-white">
                                                    {serviceType}
                                                  </span>
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {["1Y", "2Y", "3Y", "4Y", "5Y", "6Y", "7Y", "10Y", "12Y"].map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                      <span className="font-mono text-xs">{type}</span>
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            ) : (
                                              <div
                                                style={{
                                                  backgroundColor: (serviceType === '1Y' || serviceType === '12Y')
                                                    ? '#6B7280'
                                                    : SERVICE_TYPE_COLORS[serviceType as keyof typeof SERVICE_TYPE_COLORS] || SERVICE_TYPE_COLORS.default
                                                }}
                                                className="px-3 py-2 flex items-center justify-center flex-shrink-0 opacity-90 self-stretch w-[50px]"
                                              >
                                                <span className="text-[10px] font-mono font-bold text-white">
                                                  {serviceType}
                                                </span>
                                              </div>
                                            )}
                                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                            {siiRef ? (
                                              <button
                                                onClick={() => openPdfViewer(siiRef)}
                                                className="font-mono text-xs text-white/90 font-medium flex-shrink-0 hover:text-white hover:underline cursor-pointer line-through flex items-center gap-1"
                                                title={`View PDF at section ${siiRef.section}`}
                                              >
                                                <FileText className="h-3 w-3" />
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
                                            {/* Task Description - Inline editable in edit mode */}
                                            {isEditMode && taskObj && editingTaskId === taskObj.id ? (
                                              <Input
                                                value={editingDescription}
                                                onChange={(e) => setEditingDescription(e.target.value)}
                                                onBlur={() => {
                                                  if (onTaskDescriptionChange && editingDescription.trim()) {
                                                    onTaskDescriptionChange(taskObj.id, editingDescription);
                                                  }
                                                  setEditingTaskId(null);
                                                }}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    if (onTaskDescriptionChange && editingDescription.trim()) {
                                                      onTaskDescriptionChange(taskObj.id, editingDescription);
                                                    }
                                                    setEditingTaskId(null);
                                                  } else if (e.key === 'Escape') {
                                                    setEditingTaskId(null);
                                                  }
                                                }}
                                                className="flex-1 h-7 text-sm"
                                                autoFocus
                                              />
                                            ) : (
                                              <span
                                                className={cn("line-through flex-1 text-white/80", isEditMode && taskObj && "cursor-text hover:bg-white/10 rounded px-1 -mx-1")}
                                                onClick={() => {
                                                  if (isEditMode && taskObj) {
                                                    setEditingTaskId(taskObj.id);
                                                    setEditingDescription(desc);
                                                  }
                                                }}
                                              >
                                                {desc}
                                              </span>
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
            {selectedServiceType !== "all" && selectedServiceType !== "" && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span className="text-xs text-blue-700">
                  Showing tasks for {selectedServiceType} service
                </span>
                <label className="ml-auto flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={showAllTasks}
                    onCheckedChange={(checked) => setShowAllTasks(checked === true)}
                    className="h-4 w-4"
                  />
                  <span className="text-xs text-blue-700 font-medium">Show All Tasks</span>
                </label>
              </div>
            )}

            {/* Tasks WITHOUT SII References Section */}
            {tasksWithoutSII.length > 0 && (
              <Card className="border-l-4 border-l-gray-500 mb-4">
                <CardContent className="pt-4 pb-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-gray-600" />
                        <p className="font-medium text-sm">General Tasks (No SII Reference)</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {tasksWithoutSII.length} task{tasksWithoutSII.length > 1 ? 's' : ''} without document references
                      </p>
                    </div>

                    <div className="space-y-2 mt-3">
                      {tasksWithoutSII.map((task) => {
                        const isCompleted = task.completed || false;

                        return (
                          <div
                            key={task.id}
                            className={cn(
                              "p-2 rounded-md transition-colors",
                              isCompleted && "bg-green-50/30"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={isCompleted}
                                onCheckedChange={() => onTaskToggle(task.id)}
                                className="flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className={cn(
                                    "text-xs flex-1",
                                    isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                                  )}>
                                    {task.description}
                                  </p>

                                  {/* Service Type Badge */}
                                  {isEditMode ? (
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
                                    task.serviceType && (
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

                                  {/* Bug Report Icon */}
                                  {step && (
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

                              {/* Time input */}
                              <div className="flex-shrink-0 ml-2">
                                <TimeInput
                                  value={task.actualTimeMinutes}
                                  targetMinutes={step ? Math.round(step.durationMinutes / filteredTasks.length) : undefined}
                                  onChange={(minutes) => onTaskTimeChange(task.id, minutes)}
                                />
                              </div>
                            </div>

                            {/* Notes section */}
                            <TaskNotes
                              taskId={task.id}
                              notes={task.notes}
                              onAddNote={onTaskNotesChange}
                              onEditNote={onTaskNoteEdit}
                              onDeleteNote={onTaskNoteDelete}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SII References Section */}
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
                                        className="font-mono text-xs text-blue-600 font-medium hover:text-blue-800 hover:underline cursor-pointer flex-shrink-0 flex items-center gap-1"
                                        title={`View PDF at section ${ref.section}`}
                                      >
                                        <FileText className="h-3 w-3" />
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
                                        targetMinutes={step ? Math.round(step.durationMinutes / siiTasks.length) : undefined}
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
            ) : null}

            {/* Show message only if there are NO tasks at all (neither SII nor non-SII) */}
            {siiReferences.length === 0 && tasksWithoutSII.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No tasks found in this step</p>
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
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                          <p className="text-sm font-medium">Service Instruction Instructions (SII)</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const allRefs = Array.from(groupedReferences.entries());
                            for (const [docNum, refs] of allRefs) {
                              const pdfId = `sii-${docNum}`;
                              const pdfUrl = refs[0].documentPath;
                              if (!isAvailable(pdfId)) {
                                try {
                                  await downloadPDF(pdfId, pdfUrl, `Doc ${docNum}: ${refs[0].documentTitle}`);
                                } catch (error) {
                                  // Silent error handling - download failed
                                }
                              }
                            }
                          }}
                          disabled={offlineLoading}
                          className="h-7 text-xs"
                        >
                          {offlineLoading ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="h-3 w-3 mr-1" />
                              Download All
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {groupedReferences.size} SII document{groupedReferences.size > 1 ? 's' : ''} referenced in this step
                      </p>
                    </div>

                    {/* List SII documents */}
                    <div className="space-y-2">
                      {Array.from(groupedReferences.entries()).map(([docNum, refs]) => {
                        const metadata = pdfMetadata.get(docNum);
                        const pdfId = `sii-${docNum}`;
                        const pdfUrl = refs[0].documentPath;
                        const isOffline = isAvailable(pdfId);

                        return (
                          <Card key={docNum} className="hover:bg-accent transition-colors">
                            <CardContent className="pt-4 pb-4">
                              <div className="flex items-center justify-between">
                                <div
                                  className="flex items-center gap-3 flex-1 cursor-pointer"
                                  onClick={() => openSIIDocument(refs[0])}
                                >
                                  <div className="relative">
                                    <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                    {isOffline && (
                                      <CloudOff className="h-3 w-3 text-green-600 absolute -bottom-1 -right-1 bg-white rounded-full p-0.5" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-medium">
                                        Doc {docNum}: {refs[0].documentTitle}
                                      </p>
                                      {isOffline && (
                                        <Badge variant="outline" className="text-[9px] bg-green-50 text-green-700 border-green-200">
                                          Offline
                                        </Badge>
                                      )}
                                    </div>
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
                                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                  <Button
                                    size="sm"
                                    variant={isOffline ? "ghost" : "outline"}
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (!isOffline) {
                                        try {
                                          await downloadPDF(pdfId, pdfUrl, `Doc ${docNum}: ${refs[0].documentTitle}`);
                                        } catch (error) {
                                          // Silent error handling - download failed
                                        }
                                      }
                                    }}
                                    disabled={offlineLoading || isOffline}
                                    className="h-8 px-2"
                                  >
                                    {offlineLoading ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : isOffline ? (
                                      <CloudOff className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <Download className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                </div>
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

      {/* Add Technician Modal */}
      <Dialog open={showAddTechModal} onOpenChange={setShowAddTechModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Technician to Step</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Select a technician and their role for this step
            </p>
            <div className="grid gap-2">
              {availableTechnicians.map((tech) => {
                // Check if technician is already added
                const isAlreadyAdded = step.additionalTechnicians?.some(t => t.id === tech.id);
                // Check if technician is primary for this step
                const isPrimary = (step.technician === 'T1' && t1?.id === tech.id) ||
                                (step.technician === 'T2' && t2?.id === tech.id) ||
                                (step.technician === 'both' && (t1?.id === tech.id || t2?.id === tech.id));

                if (isPrimary || isAlreadyAdded) return null;

                return (
                  <Card key={tech.id} className="hover:bg-accent transition-colors">
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <p className="text-sm font-medium">{tech.name}</p>
                          <p className="text-xs text-muted-foreground">{tech.initials}</p>
                        </div>
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 bg-blue-500 text-white hover:bg-blue-600 border-blue-500"
                            onClick={() => {
                              if (onAddAdditionalTechnician) {
                                onAddAdditionalTechnician(tech.id, 'T1');
                                setShowAddTechModal(false);
                              }
                            }}
                          >
                            T1
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 bg-purple-500 text-white hover:bg-purple-600 border-purple-500"
                            onClick={() => {
                              if (onAddAdditionalTechnician) {
                                onAddAdditionalTechnician(tech.id, 'T2');
                                setShowAddTechModal(false);
                              }
                            }}
                          >
                            T2
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 bg-orange-500 text-white hover:bg-orange-600 border-orange-500"
                            onClick={() => {
                              if (onAddAdditionalTechnician) {
                                onAddAdditionalTechnician(tech.id, 'T3');
                                setShowAddTechModal(false);
                              }
                            }}
                          >
                            T3
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
