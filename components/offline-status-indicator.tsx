"use client"

import { useState, useEffect } from "react";
import { Cloud, CloudOff, HardDrive, Trash2, CheckCircle, AlertCircle, Download, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
}

interface DocumentDownloadStatus {
  id: string;
  title: string;
  url: string;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export function OfflineStatusIndicator({ flowchart, steps = [] }: OfflineStatusIndicatorProps) {
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
        <Button
          variant="outline"
          size="sm"
          className="relative h-9 gap-2"
        >
          {hasOfflineContent ? (
            <>
              <CloudOff className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium">Offline Ready</span>
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[10px] bg-green-100 text-green-700 hover:bg-green-100"
              >
                {offlinePDFs.length}
              </Badge>
            </>
          ) : (
            <>
              <Cloud className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-muted-foreground">Online Only</span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
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
                        Documents are stored in your browser's local database. Access them anytime, even without internet connection.
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
                <h4 className="text-xs font-semibold">Cached Documents</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {offlinePDFs.map((pdf) => (
                    <div
                      key={pdf.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="text-xs font-medium truncate">{pdf.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">
                            {formatBytes(pdf.size)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">•</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(pdf.downloadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deletePDF(pdf.id)}
                        className="h-7 w-7 p-0 flex-shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                      </Button>
                    </div>
                  ))}
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
