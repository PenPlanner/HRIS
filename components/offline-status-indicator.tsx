"use client"

import { useState, useEffect } from "react";
import { Cloud, CloudOff, HardDrive, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useOfflinePDFs } from "@/hooks/use-offline-pdfs";
import { formatBytes } from "@/lib/offline-pdf-storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OfflineStatusIndicator() {
  const { offlinePDFs, storageSize, clearAll, deletePDF } = useOfflinePDFs();
  const [isOpen, setIsOpen] = useState(false);

  const hasOfflineContent = offlinePDFs.length > 0;

  return (
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
              <p className="text-sm text-gray-600 mb-1">No offline content yet</p>
              <p className="text-xs text-muted-foreground">
                Download documents from the Documents tab to access them offline
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
