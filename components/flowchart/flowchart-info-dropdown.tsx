"use client"

import { useState, useEffect, useRef } from "react";
import { FlowchartData, parseServiceTimes } from "@/lib/flowchart-data";
import { SERVICE_TYPE_COLORS } from "@/lib/service-colors";
import { getSelectedTechnicians } from "@/lib/technicians-data";
import { Users, Clock, Timer, ChevronDown, ChevronUp, Pin, X, GripVertical, FileText, ArrowUp, ArrowDown, ExternalLink, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FlowchartInfoDropdownProps {
  flowchart: FlowchartData;
  steps?: any[]; // Optional steps array for progress tracking
  selectedServiceType?: string; // Selected service type to show additional time
  onServiceTypeChange?: (serviceType: string) => void; // Callback to change service type filter
  onStepClick?: (stepId: string) => void; // Callback to open a step
}

export function FlowchartInfoDropdown({ flowchart, steps = [], selectedServiceType, onServiceTypeChange, onStepClick }: FlowchartInfoDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [position, setPosition] = useState({ x: 18, y: 5 }); // Start 18px from left, 5px from top
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dropDirection, setDropDirection] = useState<'down' | 'up'>('down');
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Get selected technicians from global state
  const { t1, t2 } = getSelectedTechnicians();

  // Calculate progress metrics
  const totalTasks = steps.reduce((sum, step) => sum + (step.tasks?.length || 0), 0);
  const completedTasks = steps.reduce((sum, step) => {
    return sum + (step.tasks?.filter((task: any) => task.completed).length || 0);
  }, 0);
  const taskProgressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Calculate time from steps that have any time logged
  const stepsWithTime = steps.filter((step: any) =>
    step.tasks.some((task: any) => task.actualTimeMinutes && task.actualTimeMinutes > 0)
  );

  // Sum actual time from all steps with logged time
  const totalActualTimeMinutes = stepsWithTime.reduce((sum: number, step: any) => {
    return sum + step.tasks.reduce((taskSum: number, task: any) =>
      taskSum + (task.actualTimeMinutes || 0), 0
    );
  }, 0);

  // Sum target time from steps with logged time
  const targetDurationMinutes = stepsWithTime.reduce((sum: number, step: any) => {
    return sum + (step.durationMinutes || 0);
  }, 0);

  const totalTargetMinutes = flowchart.totalMinutes; // Total for all steps (for percentage calculation)
  const actualProgressPercent = totalTargetMinutes > 0 ? (totalActualTimeMinutes / totalTargetMinutes) * 100 : 0;
  const targetProgressPercent = totalTargetMinutes > 0 ? (targetDurationMinutes / totalTargetMinutes) * 100 : 0;

  const isOvertime = totalActualTimeMinutes > targetDurationMinutes;
  const timeDifferenceMinutes = totalActualTimeMinutes - targetDurationMinutes;
  const isAheadOfSchedule = timeDifferenceMinutes < 0 && totalActualTimeMinutes > 0;

  // Collect all notes from all tasks with metadata
  const allNotes: Array<{
    note: any;
    stepId: string;
    stepTitle: string;
    taskDescription: string;
    taskId: string;
  }> = [];

  steps.forEach((step) => {
    step.tasks?.forEach((task: any) => {
      if (task.notes && Array.isArray(task.notes) && task.notes.length > 0) {
        task.notes.forEach((note: any) => {
          allNotes.push({
            note,
            stepId: step.id,
            stepTitle: step.title || 'Untitled Step',
            taskDescription: task.description,
            taskId: task.id,
          });
        });
      }
    });
  });

  // Sort notes by timestamp (newest first)
  allNotes.sort((a, b) => new Date(b.note.timestamp).getTime() - new Date(a.note.timestamp).getTime());

  const totalNotes = allNotes.length;

  // Format to "H M" format (e.g., "38H", "19H 30M", "30M")
  const formatToHM = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}M`;
    if (mins === 0) return `${hours}H`;
    return `${hours}H ${mins}M`;
  };

  // Helper to format time compactly
  const formatTime = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  // Calculate additional time for a specific service type
  const calculateAdditionalTime = (serviceType?: string): number => {
    const targetServiceType = serviceType || selectedServiceType;
    if (!targetServiceType || targetServiceType === "" || targetServiceType === "1Y" || targetServiceType === "all") return 0;

    let totalAdditionalMinutes = 0;

    steps.forEach(step => {
      if (step.duration) {
        const serviceTimes = parseServiceTimes(step.duration);
        const additionalMinutes = serviceTimes[targetServiceType] || 0;
        totalAdditionalMinutes += additionalMinutes;
      }
    });

    return totalAdditionalMinutes;
  };

  const additionalTimeMinutes = calculateAdditionalTime();

  const durationMinutes = flowchart.totalMinutes / flowchart.technicians;
  const durationFormatted = formatToHM(Math.round(durationMinutes));

  // Auto-close logic: close after 5s if not pinned and not hovering
  useEffect(() => {
    if (isOpen && !isPinned && !isHovering) {
      timerRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 5000); // Changed from 10s to 5s
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isOpen, isPinned, isHovering]);

  // Load saved position from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('flowchart-info-position-v4');
    if (saved) {
      try {
        setPosition(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load position:', e);
      }
    }
  }, []);

  // Check if info panel has been used before
  const [hasBeenOpened, setHasBeenOpened] = useState(true); // Default to true (no pulse)

  useEffect(() => {
    const opened = localStorage.getItem('info-panel-opened');
    setHasBeenOpened(!!opened);
  }, []);

  // Mark as opened when user clicks
  const handleToggleWithTracking = () => {
    if (!hasBeenOpened) {
      localStorage.setItem('info-panel-opened', 'true');
      setHasBeenOpened(true);
    }
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsPinned(false);
    }
  };

  // Save position to localStorage when dragging stops
  useEffect(() => {
    if (isDragging) return; // Don't save while dragging
    localStorage.setItem('flowchart-info-position-v4', JSON.stringify(position));
  }, [position, isDragging]);

  // Determine dropdown direction based on position
  useEffect(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const panelHeight = 300; // Approximate panel height

      setDropDirection(spaceBelow < panelHeight ? 'up' : 'down');
    }
  }, [position, isOpen]);

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPinned(!isPinned);
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return; // Don't drag when clicking buttons

    setIsDragging(true);
    // Use position state instead of DOM rect to avoid cursor jumping
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - 200, e.clientX - dragOffset.x)),
          y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <div
      ref={buttonRef}
      className="absolute z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      data-tutorial="info-panel"
    >
      {/* Info Button */}
      <div className="bg-gray-800/10 hover:bg-gray-800/80 text-white/40 hover:text-white rounded-md shadow-lg transition-all duration-300 select-none backdrop-blur-sm border border-gray-700/10 hover:border-gray-700/50">
        <div className="flex items-center">
          <div
            onMouseDown={handleMouseDown}
            className={cn(
              "p-1.5 hover:bg-gray-600/50 rounded-l-md transition-all duration-300",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            title="Drag to move"
          >
            <GripVertical className="h-3 w-3" />
          </div>
          <button
            onClick={handleToggleWithTracking}
            className="px-3 py-1.5 flex items-center gap-2 text-xs font-medium"
          >
            <span>Info & Progress</span>
            {dropDirection === 'down' ? (
              <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
            ) : (
              <ChevronUp className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
            )}
          </button>
        </div>
      </div>

      {/* Dropdown Legend Panel */}
      <div
        className={cn(
          "absolute left-0 w-[300px] bg-gray-800/10 backdrop-blur-md rounded-lg shadow-2xl border border-gray-600/10 overflow-hidden transition-all duration-300",
          dropDirection === 'down' ? "top-full mt-2" : "bottom-full mb-2",
          isOpen ? "opacity-100 scale-100 bg-gray-800/80 border-gray-600/50" : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-700/80 to-gray-600/80 px-3 py-2 flex items-center justify-between border-b border-gray-700/50">
          <h3 className="text-white font-bold text-sm">{flowchart.model}</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePin}
              className={cn(
                "p-1 rounded hover:bg-white/20 transition-colors",
                isPinned && "bg-white/30"
              )}
              title={isPinned ? "Unpin" : "Pin open"}
            >
              <Pin className={cn("h-3 w-3 text-white", isPinned && "fill-white")} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-white/20 transition-colors"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2.5">
          {/* Technicians */}
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
            <div className="flex items-center gap-1.5">
              {flowchart.technicians === 2 ? (
                <>
                  {/* T1 Badge */}
                  <div className="bg-blue-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                    T1{t1 ? `: ${t1.initials}` : ''}
                  </div>

                  {/* T2 Badge */}
                  <div className="bg-purple-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                    T2{t2 ? `: ${t2.initials}` : ''}
                  </div>
                </>
              ) : (
                <span className="text-xs font-semibold">{flowchart.technicians} Technicians</span>
              )}
            </div>
          </div>

          {/* Time Displays */}
          <div className="flex items-center gap-4 text-[11px]">
            <div
              className="flex items-center gap-1.5 cursor-help"
              title={`Turbine downtime - the time when the turbine is not producing energy (${durationFormatted}). This is the actual duration of the maintenance work.`}
            >
              <Clock className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-500 dark:text-gray-400">Downtime:</span>
              <span className="font-bold">{durationFormatted}</span>
            </div>
            <div
              className="flex items-center gap-1.5 cursor-help"
              title={`Total work hours logged by all technicians. With ${flowchart.technicians} technicians working simultaneously: ${durationFormatted} × ${flowchart.technicians} = ${formatToHM(flowchart.totalMinutes)}`}
            >
              <Timer className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-500 dark:text-gray-400">Total time:</span>
              <span className="font-bold">
                {formatToHM(flowchart.totalMinutes)}
                {additionalTimeMinutes > 0 && selectedServiceType && selectedServiceType !== "" && selectedServiceType !== "all" && (
                  <span className="text-green-600 dark:text-green-400 text-[10px] ml-1">
                    +{formatTime(additionalTimeMinutes)}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="pt-2 border-t border-gray-700/50">
            <div className="text-[10px] text-gray-400 mb-1.5 font-semibold">PROGRESS</div>

            {/* Tasks Progress */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-300">Tasks</span>
                <span className="text-[10px] font-bold text-gray-200">
                  {completedTasks}/{totalTasks} ({Math.round(taskProgressPercent)}%)
                </span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${taskProgressPercent}%` }}
                />
              </div>
            </div>

            {/* Only show time progress bars if time has been logged */}
            {stepsWithTime.length > 0 && (
              <>
                {/* Time Progress - Target */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-300">Target</span>
                    <span className="text-[10px] font-bold text-green-400">
                      {formatToHM(targetDurationMinutes)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{ width: `${targetProgressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Time Progress - Actual with Smart Color Coding */}
                <div className="mb-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-300">Actual</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] font-bold",
                    totalActualTimeMinutes === 0 ? "text-gray-500" :
                    isOvertime && targetDurationMinutes > 0 ? "text-red-600" : "text-green-600"
                  )}>
                    {formatToHM(totalActualTimeMinutes)}
                    {totalActualTimeMinutes > 0 && targetDurationMinutes > 0 && (
                      <>
                        {(() => {
                          const percentDiff = Math.abs((timeDifferenceMinutes / targetDurationMinutes) * 100);
                          const timeDiffText = timeDifferenceMinutes < 0
                            ? ` (−${formatToHM(Math.abs(timeDifferenceMinutes))})`
                            : ` (+${formatToHM(timeDifferenceMinutes)})`;

                          if (timeDifferenceMinutes === 0) {
                            return <span className="text-[9px] italic text-gray-500 ml-1.5">Right on schedule!</span>;
                          } else if (timeDifferenceMinutes < 0) {
                            // Ahead of schedule
                            if (percentDiff > 50) {
                              return (
                                <>
                                  <span className="text-green-600">{timeDiffText}</span>
                                  <span className="text-[9px] italic text-gray-500 ml-1.5">Excellent progress!</span>
                                </>
                              );
                            } else if (percentDiff > 20) {
                              return (
                                <>
                                  <span className="text-green-600">{timeDiffText}</span>
                                  <span className="text-[9px] italic text-gray-500 ml-1.5">Going well</span>
                                </>
                              );
                            } else {
                              return (
                                <>
                                  <span className="text-green-600">{timeDiffText}</span>
                                  <span className="text-[9px] italic text-gray-500 ml-1.5">Nice pace</span>
                                </>
                              );
                            }
                          } else {
                            // Behind schedule
                            if (percentDiff > 50) {
                              return (
                                <>
                                  <span className="text-red-600">{timeDiffText}</span>
                                  <span className="text-[9px] italic text-gray-500 ml-1.5">Take your time, quality matters</span>
                                </>
                              );
                            } else if (percentDiff > 20) {
                              return (
                                <>
                                  <span className="text-red-600">{timeDiffText}</span>
                                  <span className="text-[9px] italic text-gray-500 ml-1.5">No rush needed</span>
                                </>
                              );
                            } else {
                              return (
                                <>
                                  <span className="text-red-600">{timeDiffText}</span>
                                  <span className="text-[9px] italic text-gray-500 ml-1.5">Almost there</span>
                                </>
                              );
                            }
                          }
                        })()}
                      </>
                    )}
                  </span>
                </div>
              </div>
              <div className="relative">
                <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden relative">
                  {/* Green part (up to target) */}
                  {totalActualTimeMinutes > 0 && (
                    <div
                      className="absolute h-full bg-green-500 transition-all"
                      style={{
                        width: `${Math.min(targetProgressPercent, actualProgressPercent)}%`
                      }}
                    />
                  )}
                  {/* Red part (overtime) */}
                  {isOvertime && targetDurationMinutes > 0 && (
                    <div
                      className="absolute h-full bg-red-500 transition-all"
                      style={{
                        left: `${targetProgressPercent}%`,
                        width: `${Math.min(100 - targetProgressPercent, actualProgressPercent - targetProgressPercent)}%`
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
              </>
            )}
          </div>

          {/* Service Type Legend */}
          <div className="pt-2 border-t border-gray-700/50">
            <div className="text-[10px] text-gray-400 mb-1.5 font-semibold">SERVICE TYPES (FILTER)</div>
            <div className="grid grid-cols-5 gap-1">
              {[
                { code: "1Y", label: "1Y" },
                { code: "2Y", label: "2Y" },
                { code: "3Y", label: "3Y" },
                { code: "4Y", label: "4Y" },
                { code: "5Y", label: "5Y" },
                { code: "6Y", label: "6Y" },
                { code: "7Y", label: "7Y" },
                { code: "10Y", label: "10Y" },
                { code: "12Y", label: "12Y" },
                { code: "All", label: "Ext" },
              ].map(({ code, label }) => {
                const additionalTime = code !== "1Y" && code !== "All" ? calculateAdditionalTime(code) : 0;
                const isExtButton = code === "All";
                // isSelected: true if this button's filter is active
                // For Ext: only selected if explicitly set to "all" (not empty string)
                const isSelected = isExtButton
                  ? selectedServiceType === "all"
                  : selectedServiceType === code;

                return (
                  <button
                    key={code}
                    onClick={() => {
                      // For "Ext" (All): toggle between "all" and "" (show all without active filter)
                      if (isExtButton) {
                        onServiceTypeChange?.(isSelected ? "" : "all");
                      } else {
                        // For other buttons: toggle on/off (off = empty string)
                        if (isSelected) {
                          onServiceTypeChange?.("");
                        } else {
                          onServiceTypeChange?.(code);
                        }
                      }
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center px-1 py-1 rounded font-bold text-[9px] shadow-sm transition-all cursor-pointer hover:scale-110",
                      isSelected && "ring-2 ring-white ring-offset-1 ring-offset-gray-800"
                    )}
                    style={{
                      backgroundColor: SERVICE_TYPE_COLORS[code as keyof typeof SERVICE_TYPE_COLORS],
                      color: code === "7Y" || code === "10Y" ? "black" : "white",
                      opacity: isSelected ? 1 : 0.7
                    }}
                    title={isExtButton ? "Show all service types" : (isSelected ? `Click to reset filter` : `Filter by ${code}`)}
                  >
                    <span>{label}</span>
                    {additionalTime > 0 && (
                      <span className="text-[8px] font-semibold opacity-90 mt-0.5">
                        +{formatTime(additionalTime)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes & Reference Info */}
          <div className="pt-2 border-t border-gray-700/50 space-y-1.5">
            {/* All Notes */}
            <button
              onClick={() => setShowNotesDialog(true)}
              className="w-full bg-gray-700/20 hover:bg-gray-700/40 border border-gray-600/30 hover:border-gray-500/50 rounded-md px-2 py-1.5 flex items-center gap-2 transition-all cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-gray-300" />
              <span className="text-[11px] font-semibold text-gray-200">
                All Notes ({totalNotes})
              </span>
              {totalNotes > 0 && (
                <ExternalLink className="h-3 w-3 text-gray-400 ml-auto" />
              )}
            </button>

            {/* Reference Info */}
            <div className="text-[10px] space-y-0.5 text-gray-400">
              <div className="flex items-start gap-1">
                <span className="font-semibold min-w-[24px]">SIF:</span>
                <span>{flowchart.optimizedSIF}</span>
              </div>
              <div className="flex items-start gap-1">
                <span className="font-semibold min-w-[24px]">Ref:</span>
                <span>{flowchart.referenceDocument}</span>
              </div>
              <div className="flex items-start gap-1">
                <span className="font-semibold min-w-[24px]">Rev:</span>
                <span>{flowchart.revisionDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-600 flex items-center justify-center">
                <StickyNote className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">All Notes</DialogTitle>
                <DialogDescription>
                  {totalNotes} {totalNotes === 1 ? 'note' : 'notes'} across all tasks
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {allNotes.length === 0 ? (
              <div className="text-center py-12">
                <StickyNote className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-sm text-muted-foreground">No notes yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add notes to tasks to document observations and deviations
                </p>
              </div>
            ) : (
              allNotes.map((item, index) => (
                <div
                  key={`${item.stepId}-${item.taskId}-${item.note.id}-${index}`}
                  className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4 hover:border-amber-400 dark:hover:border-amber-600 transition-all"
                >
                  {/* Header: Step and Task info */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                          {item.stepTitle}
                        </span>
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-300 truncate">
                        {item.taskDescription}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        onStepClick?.(item.stepId);
                        setShowNotesDialog(false);
                      }}
                      className="flex-shrink-0 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 hover:bg-amber-200 dark:hover:bg-amber-900/50 rounded transition-colors flex items-center gap-1"
                      title="Go to task"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open
                    </button>
                  </div>

                  {/* Note content */}
                  <div className="bg-white dark:bg-gray-900/50 rounded-md p-3 mb-2">
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {item.note.note}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center gap-2 text-[10px] text-amber-600 dark:text-amber-400">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(item.note.timestamp).toLocaleString('sv-SE', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
