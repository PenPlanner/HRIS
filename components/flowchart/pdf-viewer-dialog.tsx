"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { ExternalLink, Maximize2, Minimize2 } from "lucide-react";

interface PDFViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  title: string;
  initialPage?: number;
}

export function PDFViewerDialog({
  open,
  onOpenChange,
  pdfUrl,
  title,
  initialPage = 1,
}: PDFViewerDialogProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfSrc, setPdfSrc] = useState("");

  // Update PDF source when URL or page changes
  useEffect(() => {
    if (open && pdfUrl) {
      // Add #page= fragment to jump to specific page
      setPdfSrc(`${pdfUrl}#page=${initialPage}`);
    }
  }, [open, pdfUrl, initialPage]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const openInNewTab = () => {
    window.open(pdfSrc, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${isFullscreen ? 'max-w-[95vw] h-[95vh]' : 'max-w-5xl max-h-[90vh]'} flex flex-col overflow-hidden p-0`}
      >
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">{title}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={openInNewTab}
                className="h-8 px-3"
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="h-8 w-8 p-0"
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* PDF Viewer - Using iframe for maximum compatibility */}
        <div className="flex-1 overflow-hidden">
          {pdfSrc && (
            <iframe
              src={pdfSrc}
              className="w-full h-full border-0"
              title={title}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
