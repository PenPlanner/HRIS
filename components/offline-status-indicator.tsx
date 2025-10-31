"use client"

import { useState, useEffect } from "react";
import { Cloud, CloudOff, HardDrive, Trash2, CheckCircle, AlertCircle, Download, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOfflinePDFs } from "@/hooks/use-offline-pdfs";
import { formatBytes } from "@/lib/offline-pdf-storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FlowchartData, FlowchartStep } from "@/lib/flowchart-data";
import { parseSIIReference, SII_DOCUMENTS } from "@/lib/sii-documents";

interface OfflineStatusIndicatorProps {
  flowchart?: FlowchartData;
  steps?: FlowchartStep[];
  side?: 'top' | 'bottom'; // Where the popover should open
}

interface DocumentDownloadStatus {
  id: string;
  title: string;
  url: string;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export function OfflineStatusIndicator({ flowchart, steps = [], side = 'bottom' }: OfflineStatusIndicatorProps) {
  const { offlinePDFs, storageSize, clearAll, deletePDF, downloadPDF } = useOfflinePDFs();
  const [isOpen, setIsOpen] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadStatuses, setDownloadStatuses] = useState<DocumentDownloadStatus[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const hasOfflineContent = offlinePDFs.length > 0;

  // Get all unique SII documents referenced in the flowchart
  const getFlowchartDocuments = (): DocumentDownloadStatus[] => {
    if (!steps.length) return [];

    const documentMap = new Map<number, DocumentDownloadStatus>();

    // Extract all SII references from all tasks
    steps.forEach(step => {
      step.tasks.forEach(task => {
        const ref = parseSIIReference(task.description);
        if (ref && !documentMap.has(ref.documentNumber)) {
          const docInfo = SII_DOCUMENTS[ref.documentNumber];
          if (docInfo) {
            documentMap.set(ref.documentNumber, {
              id: `sii-${ref.documentNumber}`,
              title: `${ref.documentNumber}. ${docInfo.title}`,
              url: ref.documentPath,
              status: 'pending',
              progress: 0,
            });
          }
        }
      });
    });

    return Array.from(documentMap.values()).sort((a, b) => {
      const aNum = parseInt(a.id.replace('sii-', ''));
      const bNum = parseInt(b.id.replace('sii-', ''));
      return aNum - bNum;
    });
  };

  // Start downloading all documents
  const handleMakeAvailableOffline = async () => {
    const documents = getFlowchartDocuments();
    if (documents.length === 0) {
      alert('No documents found in this flowchart');
      return;
    }

    setIsOpen(false); // Close popover
    setDownloadStatuses(documents);
    setShowDownloadDialog(true);
    setIsDownloading(true);

    // Download each document sequentially
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];

      // Update status to downloading
      setDownloadStatuses(prev =>
        prev.map((d, idx) => idx === i ? { ...d, status: 'downloading', progress: 0 } : d)
      );

      try {
        // Simulate progress (since we don't have real progress from fetch)
        const progressInterval = setInterval(() => {
          setDownloadStatuses(prev =>
            prev.map((d, idx) =>
              idx === i && d.status === 'downloading'
                ? { ...d, progress: Math.min(d.progress + 10, 90) }
                : d
            )
          );
        }, 100);

        await downloadPDF(doc.id, doc.url, doc.title);

        clearInterval(progressInterval);

        // Mark as completed
        setDownloadStatuses(prev =>
          prev.map((d, idx) => idx === i ? { ...d, status: 'completed', progress: 100 } : d)
        );
      } catch (error) {
        // Mark as error
        setDownloadStatuses(prev =>
          prev.map((d, idx) =>
            idx === i
              ? { ...d, status: 'error', progress: 0, error: error instanceof Error ? error.message : 'Download failed' }
              : d
          )
        );
      }
    }

    setIsDownloading(false);
  };

  const allDownloadsComplete = downloadStatuses.length > 0 &&
    downloadStatuses.every(d => d.status === 'completed' || d.status === 'error');
  const completedCount = downloadStatuses.filter(d => d.status === 'completed').length;
  const totalCount = downloadStatuses.length;

  return (
    <>
      {/* Download Progress Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold">
                  {isDownloading ? 'Downloading Documents...' : allDownloadsComplete ? 'Download Complete!' : 'Download Documents'}
                </DialogTitle>
                <DialogDescription>
                  {isDownloading
                    ? `Downloading ${completedCount} of ${totalCount} documents`
                    : allDownloadsComplete
                    ? `Successfully downloaded ${completedCount} of ${totalCount} documents`
                    : 'Preparing to download...'
                  }
                </DialogDescription>
              </div>
              {!isDownloading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDownloadDialog(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Overall Progress */}
          {totalCount > 0 && (
            <div className="mb-4 pb-4 border-b">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm font-bold text-blue-600">
                  {completedCount}/{totalCount}
                </span>
              </div>
              <Progress value={(completedCount / totalCount) * 100} className="h-2" />
            </div>
          )}

          {/* Document List with Progress */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {downloadStatuses.map((doc, idx) => (
              <div
                key={doc.id}
                className={`p-3 rounded-lg border transition-all ${
                  doc.status === 'completed'
                    ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                    : doc.status === 'error'
                    ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                    : doc.status === 'downloading'
                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {doc.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : doc.status === 'error' ? (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    ) : doc.status === 'downloading' ? (
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                    ) : (
                      <Download className="h-5 w-5 text-gray-400" />
                    )}
                  </div>

                  {/* Document Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    {doc.status === 'error' && doc.error && (
                      <p className="text-xs text-red-600 mt-1">{doc.error}</p>
                    )}
                    {doc.status === 'downloading' && (
                      <div className="mt-2">
                        <Progress value={doc.progress} className="h-1.5" />
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    {doc.status === 'completed' && (
                      <Badge className="bg-green-600 text-white">Done</Badge>
                    )}
                    {doc.status === 'error' && (
                      <Badge variant="destructive">Failed</Badge>
                    )}
                    {doc.status === 'downloading' && (
                      <Badge className="bg-blue-600 text-white">
                        {doc.progress}%
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          {allDownloadsComplete && (
            <div className="pt-4 border-t flex justify-end gap-2">
              <Button
                onClick={() => setShowDownloadDialog(false)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "h-8 w-8 flex items-center justify-center rounded transition-all duration-300 border-0 relative",
            hasOfflineContent
              ? "bg-green-600/80 hover:bg-green-700/80 text-white"
              : "bg-transparent hover:bg-gray-600/70 text-white/40 group-hover:text-white hover:text-white"
          )}
          title={hasOfflineContent ? `Offline Ready (${offlinePDFs.length} documents)` : "Online Only - No offline content"}
        >
          {hasOfflineContent ? (
            <>
              <CloudOff className="h-4 w-4" />
              {offlinePDFs.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {offlinePDFs.length}
                </span>
              )}
            </>
          ) : (
            <Cloud className="h-4 w-4" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 max-h-[85vh] overflow-y-auto" align="end" side={side}>
        <div className="space-y-4">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              {hasOfflineContent ? (
                <CloudOff className="h-5 w-5 text-green-600" />
              ) : (
                <Cloud className="h-5 w-5 text-gray-400" />
              )}
              <h3 className="font-semibold text-sm">
                {hasOfflineContent ? "Offline Storage" : "No Offline Content"}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {hasOfflineContent
                ? "Documents cached for offline access"
                : "Download documents to access them offline"}
            </p>
          </div>

          {hasOfflineContent ? (
            <>
              {/* Storage Summary */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4 pb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-green-900">Documents</span>
                      </div>
                      <p className="text-lg font-bold text-green-900">{offlinePDFs.length}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <HardDrive className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-green-900">Storage Used</span>
                      </div>
                      <p className="text-lg font-bold text-green-900">{formatBytes(storageSize)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="border-t my-4" />

              {/* Storage Location Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-blue-600" />
                  <h4 className="text-xs font-semibold">Storage Location</h4>
                </div>
                <div className="bg-gray-50 rounded-md p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-xs text-gray-700">
                        <span className="font-mono font-semibold">Browser Storage (IndexedDB)</span>
                      </p>
                      <p className="text-xs text-gray-600">
                        Documents are stored in your browser&apos;s local database. Access them anytime, even without internet connection.
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-[10px] text-gray-500 font-mono">
                      Database: <span className="font-semibold">HRIS_Offline_PDFs</span>
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono">
                      Browser: <span className="font-semibold">{navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : navigator.userAgent.includes('Safari') ? 'Safari' : 'Browser'}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t my-4" />

              {/* Document List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold">Cached Documents ({offlinePDFs.length})</h4>
                  <Badge className="bg-green-100 text-green-700 text-[10px]">
                    Available Offline
                  </Badge>
                </div>
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {offlinePDFs.map((pdf) => {
                    const handleOpenPDF = async () => {
                      try {
                        // Open the PDF in a new tab from blob data
                        const blob = new Blob([pdf.data], { type: 'application/pdf' });
                        const url = URL.createObjectURL(blob);
                        window.open(url, '_blank');

                        // Clean up the URL after a delay
                        setTimeout(() => URL.revokeObjectURL(url), 100);
                      } catch (error) {
                        console.error('Error opening PDF:', error);
                        alert('Failed to open PDF');
                      }
                    };

                    return (
                      <div
                        key={pdf.id}
                        className="group flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                        onClick={handleOpenPDF}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                          {/* PDF Icon */}
                          <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
                            <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                          </div>

                          {/* Document Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate group-hover:text-blue-600 transition-colors">
                              {pdf.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <span className="text-[10px] text-green-600 font-medium">
                                Available Offline
                              </span>
                              <span className="text-[10px] text-muted-foreground">•</span>
                              <span className="text-[10px] text-muted-foreground">
                                {formatBytes(pdf.size)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPDF();
                            }}
                            className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Open PDF"
                          >
                            Open
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete "${pdf.title}" from offline storage?`)) {
                                deletePDF(pdf.id);
                              }
                            }}
                            className="h-7 w-7 p-0"
                            title="Delete from offline storage"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t my-4" />

              {/* Clear All Button */}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete all ${offlinePDFs.length} offline documents?`)) {
                    clearAll();
                  }
                }}
                className="w-full h-8 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear All Offline Data
              </Button>
            </>
          ) : (
            <div className="text-center py-8">
              <Cloud className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-600 mb-2">No offline content yet</p>
              <p className="text-xs text-muted-foreground mb-4">
                Download all documents from this flowchart for offline access
              </p>

              {/* Make Available Offline Button */}
              {flowchart && steps.length > 0 && (
                <>
                  <div className="flex items-center justify-center gap-2 mb-3 text-xs text-muted-foreground">
                    <span>{getFlowchartDocuments().length} documents will be downloaded</span>
                  </div>
                  <Button
                    onClick={handleMakeAvailableOffline}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Make Available Offline
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
    </>
  );
}
