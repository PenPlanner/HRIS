"use client"

import { useState, useEffect, useRef } from "react";
import { FlowchartData } from "@/lib/flowchart-data";
import { SERVICE_TYPE_COLORS } from "@/lib/service-colors";
import { getActiveTechnicians, getSelectedTechnicians, saveSelectedTechnician, Technician } from "@/lib/technicians-data";
import { Users, Clock, Timer, ChevronDown, ChevronUp, Pin, X, GripVertical, FileText, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlowchartInfoDropdownProps {
  flowchart: FlowchartData;
  steps?: any[]; // Optional steps array for progress tracking
}

export function FlowchartInfoDropdown({ flowchart, steps = [] }: FlowchartInfoDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [position, setPosition] = useState({ x: 8, y: 5 }); // Start 8px from left, 5px from top (TEST POSITION)
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dropDirection, setDropDirection] = useState<'down' | 'up'>('down');
  const [showT1Dropdown, setShowT1Dropdown] = useState(false);
  const [showT2Dropdown, setShowT2Dropdown] = useState(false);
  const [selectedT1, setSelectedT1] = useState<Technician | null>(null);
  const [selectedT2, setSelectedT2] = useState<Technician | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const buttonRef = useRef<HTMLDivElement>(null);
  const t1DropdownRef = useRef<HTMLDivElement>(null);
  const t2DropdownRef = useRef<HTMLDivElement>(null);

  // Calculate progress metrics
  const totalTasks = steps.reduce((sum, step) => sum + (step.tasks?.length || 0), 0);
  const completedTasks = steps.reduce((sum, step) => {
    return sum + (step.tasks?.filter((task: any) => task.completed).length || 0);
  }, 0);
  const taskProgressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Calculate actual time and target time from COMPLETED steps only
  const completedSteps = steps.filter(step => step.completedAt);

  // Sum actual time from completed steps
  const totalActualTimeMinutes = completedSteps.reduce((sum, step) => {
    return sum + step.tasks.reduce((taskSum, task) =>
      taskSum + (task.actualTimeMinutes || 0), 0
    );
  }, 0);

  // Sum target time from completed steps only
  const targetDurationMinutes = completedSteps.reduce((sum, step) => {
    return sum + (step.durationMinutes || 0);
  }, 0);

  const totalTargetMinutes = flowchart.totalMinutes; // Total for all steps (for percentage calculation)
  const actualProgressPercent = totalTargetMinutes > 0 ? (totalActualTimeMinutes / totalTargetMinutes) * 100 : 0;
  const targetProgressPercent = totalTargetMinutes > 0 ? (targetDurationMinutes / totalTargetMinutes) * 100 : 0;

  const isOvertime = totalActualTimeMinutes > targetDurationMinutes;
  const timeDifferenceMinutes = totalActualTimeMinutes - targetDurationMinutes;
  const isAheadOfSchedule = timeDifferenceMinutes < 0 && completedSteps.length > 0;

  // Count total notes
  const totalNotes = steps.reduce((sum, step) => {
    return sum + (step.notes ? 1 : 0);
  }, 0);

  // Format minutes to hh:mm format
  const formatToHHMM = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}h`;
  };

  // Format to "h o m" format
  const formatToHM = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const durationMinutes = flowchart.totalMinutes / flowchart.technicians;
  const durationFormatted = formatToHHMM(Math.round(durationMinutes));

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

  // Load saved position and technicians from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('flowchart-info-position-v4');
    if (saved) {
      try {
        setPosition(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load position:', e);
      }
    }

    // Load selected technicians
    const { t1, t2 } = getSelectedTechnicians();
    setSelectedT1(t1);
    setSelectedT2(t2);
  }, []);

  // Listen for auto-open event from flowchart animation
  useEffect(() => {
    const handleAutoOpen = () => {
      console.log('Info dropdown: Received auto-open event, opening in 0.5s...');
      setTimeout(() => {
        setIsOpen(true);
        setIsPinned(false); // Not pinned by default
        console.log('Info dropdown: Opened!');
      }, 500); // 0.5s delay after zoom completes
    };

    window.addEventListener('info-dropdown-auto-open', handleAutoOpen);
    return () => window.removeEventListener('info-dropdown-auto-open', handleAutoOpen);
  }, []);

  // Handle click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (t1DropdownRef.current && !t1DropdownRef.current.contains(event.target as Node)) {
        setShowT1Dropdown(false);
      }
      if (t2DropdownRef.current && !t2DropdownRef.current.contains(event.target as Node)) {
        setShowT2Dropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsPinned(false);
    }
  };

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPinned(!isPinned);
  };

  const handleSelectTechnician = (role: 'T1' | 'T2', technician: Technician) => {
    if (role === 'T1') {
      setSelectedT1(technician);
      saveSelectedTechnician('T1', technician.id);
      setShowT1Dropdown(false);
    } else {
      setSelectedT2(technician);
      saveSelectedTechnician('T2', technician.id);
      setShowT2Dropdown(false);
    }
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
    >
      {/* Info Button */}
      <div className="bg-blue-600/50 hover:bg-blue-700/75 text-white rounded-md shadow-lg transition-all select-none backdrop-blur-sm">
        <div className="flex items-center">
          <div
            onMouseDown={handleMouseDown}
            className={cn(
              "p-1.5 hover:bg-blue-800 rounded-l-md transition-colors",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            title="Drag to move"
          >
            <GripVertical className="h-3 w-3" />
          </div>
          <button
            onClick={handleToggle}
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
          "absolute left-0 w-[300px] bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300",
          dropDirection === 'down' ? "top-full mt-2" : "bottom-full mb-2",
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-2 flex items-center justify-between">
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
                  {/* T1 Badge with dropdown */}
                  <div className="relative" ref={t1DropdownRef}>
                    <button
                      onClick={() => setShowT1Dropdown(!showT1Dropdown)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      T1{selectedT1 ? `: ${selectedT1.initials}` : ''}
                    </button>

                    {showT1Dropdown && (
                      <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-xl border border-gray-200 dark:border-gray-700 z-50 min-w-[150px] max-h-[200px] overflow-y-auto">
                        {getActiveTechnicians().map(tech => (
                          <button
                            key={tech.id}
                            onClick={() => handleSelectTechnician('T1', tech)}
                            className={cn(
                              "w-full px-3 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                              selectedT1?.id === tech.id && "bg-blue-50 dark:bg-blue-950 text-blue-600 font-semibold"
                            )}
                          >
                            <div className="font-medium">{tech.firstName} {tech.lastName}</div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">{tech.initials}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* T2 Badge with dropdown */}
                  <div className="relative" ref={t2DropdownRef}>
                    <button
                      onClick={() => setShowT2Dropdown(!showT2Dropdown)}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      T2{selectedT2 ? `: ${selectedT2.initials}` : ''}
                    </button>

                    {showT2Dropdown && (
                      <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-xl border border-gray-200 dark:border-gray-700 z-50 min-w-[150px] max-h-[200px] overflow-y-auto">
                        {getActiveTechnicians().map(tech => (
                          <button
                            key={tech.id}
                            onClick={() => handleSelectTechnician('T2', tech)}
                            className={cn(
                              "w-full px-3 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                              selectedT2?.id === tech.id && "bg-purple-50 dark:bg-purple-950 text-purple-600 font-semibold"
                            )}
                          >
                            <div className="font-medium">{tech.firstName} {tech.lastName}</div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">{tech.initials}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <span className="text-xs font-semibold">{flowchart.technicians} Technicians</span>
              )}
            </div>
          </div>

          {/* Work Time */}
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-0.5">
                <Timer className="h-3 w-3" />
                <span>Work</span>
              </div>
              <div className="font-bold">{flowchart.totalMinutes}m</div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-0.5">
                <Clock className="h-3 w-3" />
                <span>Total</span>
              </div>
              <div className="font-bold">{formatToHM(flowchart.totalMinutes)}</div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-0.5">
                <Clock className="h-3 w-3" />
                <span>Down</span>
              </div>
              <div className="font-bold">{durationFormatted}</div>
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1.5 font-semibold">PROGRESS</div>

            {/* Tasks Progress */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-600 dark:text-gray-300">Tasks</span>
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200">
                  {completedTasks}/{totalTasks} ({Math.round(taskProgressPercent)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${taskProgressPercent}%` }}
                />
              </div>
            </div>

            {/* Time Progress - Target */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-600 dark:text-gray-300">Target</span>
                <span className="text-[10px] font-bold text-green-600">
                  {formatToHM(targetDurationMinutes)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${targetProgressPercent}%` }}
                />
              </div>
            </div>

            {/* Time Progress - Actual with Arrow Indicator */}
            <div className="mb-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-600 dark:text-gray-300">Actual</span>
                <div className="flex items-center gap-1">
                  {totalActualTimeMinutes > 0 && targetDurationMinutes > 0 && (
                    <>
                      {isAheadOfSchedule ? (
                        <ArrowUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-red-600" />
                      )}
                      <span className={cn(
                        "text-[10px] font-bold",
                        isAheadOfSchedule ? "text-green-600" : "text-red-600"
                      )}>
                        {isAheadOfSchedule ? '-' : '+'}{formatToHM(Math.abs(timeDifferenceMinutes))}
                      </span>
                    </>
                  )}
                  <span className={cn(
                    "text-[10px] font-bold",
                    isOvertime && targetDurationMinutes > 0 ? "text-red-600" : "text-yellow-600"
                  )}>
                    {formatToHM(totalActualTimeMinutes)}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    isOvertime && targetDurationMinutes > 0 ? "bg-red-500" : "bg-yellow-500"
                  )}
                  style={{ width: `${Math.min(100, actualProgressPercent)}%` }}
                />
              </div>
            </div>

            {/* Overtime bar if applicable */}
            {isOvertime && targetDurationMinutes > 0 && (
              <div className="mt-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-red-600 dark:text-red-400">Overtime</span>
                  <span className="text-[10px] font-bold text-red-600">
                    +{formatToHM(totalActualTimeMinutes - targetDurationMinutes)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-red-500 transition-all"
                    style={{ width: `${Math.min(100, ((totalActualTimeMinutes - targetDurationMinutes) / totalTargetMinutes) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Service Type Legend */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1.5 font-semibold">SERVICE TYPES</div>
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
              ].map(({ code, label }) => (
                <div
                  key={code}
                  className="flex items-center justify-center px-1 py-1 rounded font-bold text-[9px] shadow-sm"
                  style={{
                    backgroundColor: SERVICE_TYPE_COLORS[code as keyof typeof SERVICE_TYPE_COLORS],
                    color: code === "7Y" || code === "10Y" ? "black" : "white"
                  }}
                  title={code}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Notes & Reference Info */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1.5">
            {/* All Notes */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md px-2 py-1.5 flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
              <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-100">
                All Notes ({totalNotes})
              </span>
            </div>

            {/* Reference Info */}
            <div className="text-[10px] space-y-0.5 text-gray-600 dark:text-gray-400">
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
    </div>
  );
}
