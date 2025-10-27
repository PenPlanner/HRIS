"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, CheckCircle, Sparkles, Bug as BugIcon, Zap, Package } from "lucide-react";

interface VersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const APP_VERSION = "1.3.0";
const RELEASE_DATE = "2025-01-27";

const versionHistory = [
  {
    version: "1.3.0",
    date: "2025-01-27",
    type: "major" as const,
    features: [
      "WTG Number system - Auto-generated 5-digit turbine IDs",
      "Make Year tracking for each flowchart",
      "Bug reporting & tracking system with status management",
      "Completed flowcharts tab with detailed statistics",
      "Modern gradient UI redesign across all pages",
      "Enhanced statistics dashboard with 5 key metrics"
    ],
    fixes: [
      "Fixed technician initials display (now 5 characters)",
      "Fixed AI tutorial auto-open timing",
      "Improved completed flowcharts time variance display"
    ]
  },
  {
    version: "1.2.0",
    date: "2025-01-20",
    type: "major" as const,
    features: [
      "Interactive AI Tutorial Guide with visual previews",
      "Auto-save functionality with real-time persistence",
      "Fullscreen loading animation with turbine visualization",
      "Export to Code feature for permanent layouts",
      "Save as Default Layout functionality"
    ],
    fixes: [
      "Fixed header layout - 2 rows to 1 row compact design",
      "Removed service filter (integrated into legend)",
      "Fixed Clear Cache - no confirmation needed"
    ]
  },
  {
    version: "1.1.0",
    date: "2025-01-15",
    type: "minor" as const,
    features: [
      "Flowchart Info & Progress dropdown panel",
      "Offline document download capability",
      "Progress tracking with time variance",
      "Service type color-coded legend"
    ],
    fixes: [
      "Improved step navigation and zoom",
      "Fixed task completion tracking"
    ]
  },
  {
    version: "1.0.0",
    date: "2025-01-10",
    type: "major" as const,
    features: [
      "Initial release of HRIS Flowchart Manager",
      "Interactive flowchart editing with React Flow",
      "Step-by-step service procedures",
      "Task management with notes and time logging",
      "Technician assignment system",
      "PDF import functionality"
    ],
    fixes: []
  }
];

export function VersionDialog({ open, onOpenChange }: VersionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">HRIS Flowchart Manager</DialogTitle>
              <DialogDescription className="text-sm">
                Version {APP_VERSION} • Released {new Date(RELEASE_DATE).toLocaleDateString('sv-SE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Current Version Highlight */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-lg">Current Version</h3>
              <Badge className="bg-gradient-to-r from-blue-600 to-purple-600">v{APP_VERSION}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              The latest and most advanced version of the HRIS Flowchart Manager with comprehensive bug tracking, WTG management, and modern UI enhancements.
            </p>
          </div>

          {/* Version History */}
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Info className="h-5 w-5" />
              Version History
            </h3>

            <div className="space-y-6">
              {versionHistory.map((version, index) => (
                <div key={version.version} className="relative pl-8 pb-6 border-l-2 border-gray-200 dark:border-gray-700 last:border-0">
                  {/* Version Badge */}
                  <div className="absolute -left-[13px] top-0">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                      version.type === 'major'
                        ? 'bg-gradient-to-br from-blue-600 to-purple-600'
                        : 'bg-gradient-to-br from-green-600 to-green-500'
                    }`}>
                      <Zap className="h-3 w-3 text-white" />
                    </div>
                  </div>

                  {/* Version Header */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-lg">Version {version.version}</h4>
                      <Badge variant={version.type === 'major' ? 'default' : 'secondary'} className="text-xs">
                        {version.type === 'major' ? 'Major Update' : 'Minor Update'}
                      </Badge>
                      {index === 0 && (
                        <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-300">
                          Latest
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Released {new Date(version.date).toLocaleDateString('sv-SE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  {/* Features */}
                  {version.features.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        New Features ({version.features.length})
                      </h5>
                      <ul className="space-y-1.5">
                        {version.features.map((feature, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">●</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Bug Fixes */}
                  {version.fixes.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
                        <BugIcon className="h-4 w-4" />
                        Bug Fixes ({version.fixes.length})
                      </h5>
                      <ul className="space-y-1.5">
                        {version.fixes.map((fix, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">●</span>
                            <span>{fix}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Built with ❤️ for wind turbine service technicians
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              © 2025 HRIS Flowchart Manager. All rights reserved.
            </p>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export version info for use elsewhere
export const VERSION_INFO = {
  version: APP_VERSION,
  releaseDate: RELEASE_DATE
};
