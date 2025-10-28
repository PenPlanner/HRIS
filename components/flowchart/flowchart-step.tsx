"use client"

import { FlowchartStep as FlowchartStepType } from "@/lib/flowchart-data";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, StickyNote, User, Users, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseSIIReference, SII_DOCUMENTS } from "@/lib/sii-documents";
import { getSectionPage } from "@/lib/sii-page-mapping";
import { useState } from "react";
import { PDFViewerDialog } from "./pdf-viewer-dialog";

interface FlowchartStepProps {
  step: FlowchartStepType;
  onClick: () => void;
  completedTasks: number;
  totalTasks: number;
  selectedT1Initials?: string;
  selectedT2Initials?: string;
}

export function FlowchartStep({ step, onClick, completedTasks, totalTasks, selectedT1Initials, selectedT2Initials }: FlowchartStepProps) {
  const isComplete = completedTasks === totalTasks && totalTasks > 0;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // PDF Viewer state
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfDocument, setPdfDocument] = useState<number | null>(null);
  const [pdfPage, setPdfPage] = useState<number>(1);

  // Handle clicking on a reference number
  const handleRefClick = (refText: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card onClick from firing
    const ref = parseSIIReference(refText);
    if (ref) {
      const page = getSectionPage(ref.documentNumber, ref.section);
      setPdfDocument(ref.documentNumber);
      setPdfPage(page);
      setPdfViewerOpen(true);
    }
  };

  // Get service type description from colorCode
  const getServiceTypeDescription = (colorCode: string): string => {
    const match = colorCode.match(/(\d+)([YM])/);
    if (!match) return ''; // Don't show description for non-service colorCodes like "2.1"

    const [, number, unit] = match;
    if (unit === 'Y') return `${number} year${number !== '1' ? 's' : ''}`;
    if (unit === 'M') return `${number} month${number !== '1' ? 's' : ''}`;
    return '';
  };

  // Calculate total actual time from all tasks
  const totalActualMinutes = step.tasks.reduce((sum, task) => sum + (task.actualTimeMinutes || 0), 0);

  // Calculate total notes count from all tasks
  const totalNotesCount = step.tasks.reduce((sum, task) => sum + (task.notes?.length || 0), 0);

  // Format time
  const formatTime = (minutes: number): string => {
    if (minutes === 0) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Format title lines - make lines with ref numbers bold, clean leading chars
  const formatTitleLine = (line: string): { text: string; isBold: boolean } => {
    // Remove leading dots, spaces, or special chars
    let cleanLine = line.trimStart().replace(/^[.\s-]+/, '');

    // Capitalize first letter if not already
    if (cleanLine.length > 0) {
      cleanLine = cleanLine.charAt(0).toUpperCase() + cleanLine.slice(1);
    }

    // Check if line starts with a reference number (e.g., "13.5.1", "2.7.2.3")
    const hasRefNumber = /^\d+(\.\d+)+/.test(cleanLine);

    return {
      text: cleanLine,
      isBold: hasRefNumber
    };
  };

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
    <>
    <div className="flex flex-col gap-1.5">
      {/* Step Label */}
      <div className="text-xs font-semibold text-muted-foreground pl-1">
        Step {getStepNumber(step.id)}
      </div>

      {/* Card */}
      <Card
        className={cn(
          "relative cursor-pointer hover:shadow-lg transition-all p-4 w-[300px] min-h-[168px]",
          isComplete && "ring-2 ring-green-500"
        )}
        style={{
          backgroundColor: `${step.color}15`,
          borderLeft: `4px solid ${step.color}`
        }}
        onClick={onClick}
        onWheel={(e) => {
          // Stop propagation to allow scrolling inside the card
          e.stopPropagation();
        }}
      >
      {/* Top badges - Technicians only */}
      <div className="absolute top-2 right-2 flex gap-1">
        {step.technician === "both" ? (
          <>
            <div className="bg-blue-500/90 px-2 py-1 rounded-md flex items-center gap-1">
              <User className="h-3 w-3 text-white" />
              <span className="text-xs font-bold text-white">{selectedT1Initials || 'T1'}</span>
            </div>
            <div className="bg-purple-500/90 px-2 py-1 rounded-md flex items-center gap-1">
              <User className="h-3 w-3 text-white" />
              <span className="text-xs font-bold text-white">{selectedT2Initials || 'T2'}</span>
            </div>
          </>
        ) : step.technician === "T1" ? (
          <div className="bg-blue-500/90 px-2 py-1 rounded-md flex items-center gap-1">
            <User className="h-3 w-3 text-white" />
            <span className="text-xs font-bold text-white">{selectedT1Initials || 'T1'}</span>
          </div>
        ) : (
          <div className="bg-purple-500/90 px-2 py-1 rounded-md flex items-center gap-1">
            <User className="h-3 w-3 text-white" />
            <span className="text-xs font-bold text-white">{selectedT2Initials || 'T2'}</span>
          </div>
        )}
      </div>

      {/* Step Content - Compact task list */}
      <div className="mt-6 overflow-hidden">
        <div
          className="space-y-0.5 mb-3 pr-2 max-h-[350px] overflow-y-auto [&::-webkit-scrollbar]:w-6 md:[&::-webkit-scrollbar]:w-4 [&::-webkit-scrollbar-track]:bg-gray-800/30 [&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-thumb]:rounded-lg [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 [&::-webkit-scrollbar-thumb]:active:bg-gray-600"
          style={{
            scrollbarWidth: 'auto',
            scrollbarColor: '#6B7280 rgba(31, 41, 55, 0.3)',
            WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
          }}
        >
          {step.tasks.map((task, index) => {
            const text = task.description;
            if (!text) return null;

            // Check if this task is indented (sub-task)
            const isIndented = task.isIndented || false;

            // Split reference number and description
            // Matches patterns like: "13.5.1.Lift", "13.5.1 Lift", "3.5.1-4.71 ResQ", "6.5.2.11 Visual"
            // Note: \.? matches optional trailing dot but doesn't include it in capture group
            const refMatch = text.match(/^(\d+(?:\.\d+)*(?:-\d+(?:\.\d+)*)*)\.?\s*(.+)$/);
            const hasRefNumber = refMatch !== null;
            const refNumber = refMatch ? refMatch[1] : '';
            const description = refMatch ? refMatch[2] : text;

            return (
              <div
                key={task.id}
                className={cn(
                  "grid items-center gap-2 text-[11px] py-0.5 pl-0 pr-2 rounded-sm overflow-hidden",
                  "grid-cols-[auto_80px_1fr]",
                  isIndented && "ml-6 text-muted-foreground"
                )}
                style={{
                  backgroundColor: !isIndented ? `${step.color}10` : 'transparent'
                }}
              >
                {!isIndented && (
                  <div
                    style={{ backgroundColor: step.color }}
                    className="px-2 py-1 flex items-center justify-center flex-shrink-0 self-stretch w-[42px]"
                  >
                    <span className="text-[9px] font-mono font-bold text-white">
                      {task.serviceType === "All" ? "Ext" : task.serviceType}
                    </span>
                  </div>
                )}
                {hasRefNumber ? (
                  <>
                    <span
                      className="font-semibold text-white font-mono cursor-pointer hover:underline hover:text-blue-300 transition-colors flex items-center gap-1"
                      onClick={(e) => handleRefClick(text, e)}
                    >
                      <FileText className="h-3 w-3 flex-shrink-0" />
                      {refNumber}
                    </span>
                    <span className="font-semibold text-white line-clamp-1">
                      {description}
                    </span>
                  </>
                ) : (
                  <>
                    <span></span>
                    <span className={cn(!isIndented ? "font-semibold" : "font-normal", "line-clamp-1 text-white")}>
                      {text}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Duration - Planned vs Actual */}
        <div className="space-y-0.5 mb-2">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            <span>Planned: {step.duration}</span>
          </div>
          {totalActualMinutes > 0 && (
            <div className="flex items-center gap-1 text-[10px]">
              <Clock className="h-2.5 w-2.5 text-green-600" />
              <span className={cn(
                "font-semibold",
                totalActualMinutes <= step.durationMinutes ? "text-green-600" : "text-red-600"
              )}>
                Actual: {formatTime(totalActualMinutes)}
              </span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">
              {completedTasks}/{totalTasks} tasks
            </span>
            <div className="flex items-center gap-1">
              {totalNotesCount > 0 && (
                <div className="flex items-center gap-0.5 bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5">
                  <StickyNote className="h-2.5 w-2.5 text-amber-600" />
                  <span className="text-[9px] font-semibold text-amber-700">{totalNotesCount}</span>
                </div>
              )}
              {isComplete && (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              )}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: step.color
              }}
            />
          </div>
        </div>
      </div>
      </Card>
    </div>

    {/* PDF Viewer Dialog */}
    {pdfDocument && SII_DOCUMENTS[pdfDocument] && (
      <PDFViewerDialog
        open={pdfViewerOpen}
        onOpenChange={setPdfViewerOpen}
        pdfUrl={`/files/flowchart/sii/${SII_DOCUMENTS[pdfDocument].filename}`}
        title={SII_DOCUMENTS[pdfDocument].title}
        initialPage={pdfPage}
      />
    )}
    </>
  );
}
