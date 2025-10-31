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
  const [iframeKey, setIframeKey] = useState(0);

  // Update PDF source when URL or page changes
  useEffect(() => {
    if (open && pdfUrl) {
      const pageNum = initialPage || 1;
      console.log('📄 PDF Viewer: Setting page', { initialPage, pageNum, pdfUrl });
      // Add #page= fragment to jump to specific page
      // Set zoom to 100% and hide sidebar/thumbnails
      setPdfSrc(`${pdfUrl}#page=${pageNum}&zoom=100&pagemode=none&navpanes=0`);
      // Force iframe re-render by changing key
      setIframeKey(prev => prev + 1);
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
        className={`${
          isFullscreen
            ? 'w-screen h-screen max-w-none m-0 p-0'
            : 'max-w-[95vw] h-[95vh]'
        } flex flex-col overflow-hidden p-0`}
      >
        <DialogHeader className={`${isFullscreen ? 'px-4 pt-4 pb-3' : 'px-6 pt-6 pb-4'} flex-shrink-0 border-b`}>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg truncate pr-6">{title}</DialogTitle>
            <div className="flex items-center gap-4 flex-shrink-0 mr-16">
              <Button
                variant="ghost"
                size="sm"
                onClick={openInNewTab}
                className="h-10 px-4"
                title="Open in new tab"
              >
                <ExternalLink className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="h-10 w-10 p-0"
                title={isFullscreen ? "Exit fullscreen" : "Maximize"}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* PDF Viewer - Using iframe for maximum compatibility */}
        <div className="flex-1 min-h-0 overflow-hidden bg-gray-100">
          {pdfSrc && (
            <iframe
              key={iframeKey}
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
