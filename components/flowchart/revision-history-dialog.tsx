"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Plus, Minus, Edit, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface RevisionChange {
  type: 'added' | 'removed' | 'modified';
  description: string;
  stepNumber?: string;
}

interface Revision {
  version: string;
  date: string;
  description: string;
  changes: RevisionChange[];
  isCurrent?: boolean;
}

interface RevisionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRevision: string;
  modelName: string;
}

// Dummy revision data - realistic changes for a flowchart
const getDummyRevisions = (currentRev: string): Revision[] => {
  return [
    {
      version: currentRev,
      date: "2025-01-27",
      description: "Current revision - Latest safety updates and procedure improvements",
      isCurrent: true,
      changes: [
        { type: 'added', description: 'Added emergency shutdown procedure verification', stepNumber: 'Step 3' },
        { type: 'modified', description: 'Updated torque specifications for hub bolts', stepNumber: 'Step 7' },
        { type: 'added', description: 'New safety check for pitch system calibration', stepNumber: 'Step 12' },
        { type: 'modified', description: 'Revised time estimates for blade inspection', stepNumber: 'Step 15' },
        { type: 'added', description: 'Additional documentation requirements for warranty', stepNumber: 'Step 18' }
      ]
    },
    {
      version: "03/2025",
      date: "2025-01-10",
      description: "Winter maintenance protocol update",
      changes: [
        { type: 'added', description: 'Cold weather startup sequence', stepNumber: 'Step 2' },
        { type: 'modified', description: 'Updated lubrication intervals for low temperatures', stepNumber: 'Step 9' },
        { type: 'removed', description: 'Removed obsolete temperature sensor check', stepNumber: 'Step 11' },
        { type: 'modified', description: 'Changed hydraulic fluid specifications', stepNumber: 'Step 14' }
      ]
    },
    {
      version: "02/2024",
      date: "2024-12-15",
      description: "Major service interval adjustments",
      changes: [
        { type: 'modified', description: 'Extended filter replacement intervals', stepNumber: 'Step 5' },
        { type: 'added', description: 'New vibration analysis procedure', stepNumber: 'Step 8' },
        { type: 'modified', description: 'Updated gearbox oil sampling requirements', stepNumber: 'Step 10' },
        { type: 'removed', description: 'Deprecated manual brake test procedure', stepNumber: 'Step 13' },
        { type: 'added', description: 'Added SCADA system health check', stepNumber: 'Step 16' }
      ]
    },
    {
      version: "01/2024",
      date: "2024-11-20",
      description: "Safety compliance and regulatory updates",
      changes: [
        { type: 'added', description: 'Mandatory PPE verification checklist', stepNumber: 'Step 1' },
        { type: 'modified', description: 'Enhanced electrical safety procedures', stepNumber: 'Step 4' },
        { type: 'added', description: 'New lockout/tagout documentation', stepNumber: 'Step 6' },
        { type: 'modified', description: 'Updated confined space entry protocol', stepNumber: 'Step 17' }
      ]
    },
    {
      version: "12/2023",
      date: "2024-10-05",
      description: "Initial standardization release",
      changes: [
        { type: 'added', description: 'Standardized all step numbering and naming', stepNumber: 'All Steps' },
        { type: 'added', description: 'Created comprehensive tool list', stepNumber: 'Step 0' },
        { type: 'added', description: 'Established baseline service times', stepNumber: 'All Steps' },
        { type: 'added', description: 'Added SII document references', stepNumber: 'Multiple Steps' }
      ]
    }
  ];
};

const getChangeIcon = (type: RevisionChange['type']) => {
  switch (type) {
    case 'added':
      return <Plus className="h-4 w-4 text-green-600" />;
    case 'removed':
      return <Minus className="h-4 w-4 text-red-600" />;
    case 'modified':
      return <Edit className="h-4 w-4 text-blue-600" />;
  }
};

const getChangeColor = (type: RevisionChange['type']) => {
  switch (type) {
    case 'added':
      return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100';
    case 'removed':
      return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100';
    case 'modified':
      return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100';
  }
};

const getChangeBadgeColor = (type: RevisionChange['type']) => {
  switch (type) {
    case 'added':
      return 'bg-green-600 text-white';
    case 'removed':
      return 'bg-red-600 text-white';
    case 'modified':
      return 'bg-blue-600 text-white';
  }
};

export function RevisionHistoryDialog({
  open,
  onOpenChange,
  currentRevision,
  modelName
}: RevisionHistoryDialogProps) {
  const revisions = getDummyRevisions(currentRevision);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">Revision History</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{modelName}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {revisions.map((revision, index) => (
              <div
                key={revision.version}
                className={cn(
                  "relative pl-8 pb-6 border-l-2",
                  index === revisions.length - 1 ? "border-l-0 pb-0" : "border-gray-200 dark:border-gray-700"
                )}
              >
                {/* Timeline dot */}
                <div className="absolute -left-[9px] top-0">
                  <div className={cn(
                    "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                    revision.isCurrent
                      ? "bg-gradient-to-br from-blue-600 to-purple-600 border-white dark:border-gray-900"
                      : "bg-background border-gray-300 dark:border-gray-600"
                  )}>
                    {revision.isCurrent && <Clock className="h-2 w-2 text-white" />}
                  </div>
                </div>

                {/* Header */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">Rev. {revision.version}</h3>
                    {revision.isCurrent && (
                      <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs">
                        Current
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      • {new Date(revision.date).toLocaleDateString('sv-SE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {revision.description}
                  </p>
                </div>

                {/* Changes */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-muted-foreground">CHANGES ({revision.changes.length})</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  </div>

                  {revision.changes.map((change, changeIndex) => (
                    <div
                      key={changeIndex}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border",
                        getChangeColor(change.type)
                      )}
                    >
                      <div className="mt-0.5">
                        {getChangeIcon(change.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={cn("text-[10px] px-1.5 py-0", getChangeBadgeColor(change.type))}>
                            {change.type === 'added' ? 'Added' : change.type === 'removed' ? 'Removed' : 'Modified'}
                          </Badge>
                          {change.stepNumber && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {change.stepNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-sm">
                          {change.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">{revisions.length} revisions</span> tracked in system
            </div>
            <Button onClick={() => onOpenChange(false)} variant="outline" size="sm">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
