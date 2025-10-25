"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Maximize2, Minimize2 } from "lucide-react";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

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
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [scale, setScale] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Configure PDF.js worker (client-side only)
  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  }, []);

  // Reset to initial page when dialog opens or initialPage changes
  useEffect(() => {
    if (open) {
      setPageNumber(initialPage);
    }
  }, [open, initialPage]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const goToPrevPage = () => {
    setPageNumber(Math.max(1, pageNumber - 1));
  };

  const goToNextPage = () => {
    setPageNumber(Math.min(numPages, pageNumber + 1));
  };

  const zoomIn = () => {
    setScale(Math.min(2.5, scale + 0.2));
  };

  const zoomOut = () => {
    setScale(Math.max(0.5, scale - 0.2));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${isFullscreen ? 'max-w-[95vw] h-[95vh]' : 'max-w-5xl max-h-[90vh]'} flex flex-col overflow-hidden`}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">{title}</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="h-8 w-8 p-0"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogHeader>

        {/* PDF Controls */}
        <div className="flex items-center justify-between border-b pb-3 gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[100px] text-center">
              Page {pageNumber} of {numPages || '...'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={zoomOut} disabled={scale <= 0.5}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={zoomIn} disabled={scale >= 2.5}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* PDF Document */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 flex items-start justify-center p-4">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center p-12">
                <div className="text-sm text-muted-foreground">Loading PDF...</div>
              </div>
            }
            error={
              <div className="flex items-center justify-center p-12">
                <div className="text-sm text-red-500">Failed to load PDF</div>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-lg"
            />
          </Document>
        </div>
      </DialogContent>
    </Dialog>
  );
}
