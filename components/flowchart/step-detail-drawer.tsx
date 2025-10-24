"use client"

import { FlowchartStep, FlowchartTask } from "@/lib/flowchart-data";
import { extractSIIReferences, groupReferencesByDocument, openSIIDocument, SIIReference } from "@/lib/sii-documents";
import { extractPDFMetadata, PDFMetadata } from "@/lib/pdf-metadata";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckCircle2, FileText, Image as ImageIcon, PlayCircle, X, ExternalLink, BookOpen, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface StepDetailDrawerProps {
  step: FlowchartStep | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskToggle: (taskId: string) => void;
  onStartStep: () => void;
  onCompleteStep: () => void;
  isStepRunning: boolean;
  stepStartTime: string | null;
  elapsedTime: string;
}

export function StepDetailDrawer({
  step,
  open,
  onOpenChange,
  onTaskToggle,
  onStartStep,
  onCompleteStep,
  isStepRunning,
  stepStartTime,
  elapsedTime
}: StepDetailDrawerProps) {
  if (!step) return null;

  const completedTasks = step.tasks.filter(t => t.completed).length;
  const totalTasks = step.tasks.length;
  const isComplete = completedTasks === totalTasks;

  // Extract SII references from task descriptions
  const siiReferences = useMemo(() => extractSIIReferences(step.tasks), [step.tasks]);
  const groupedReferences = useMemo(() => groupReferencesByDocument(siiReferences), [siiReferences]);

  // State for PDF metadata
  const [pdfMetadata, setPdfMetadata] = useState<Map<number, PDFMetadata>>(new Map());
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Load PDF metadata when modal opens
  useEffect(() => {
    if (!open || siiReferences.length === 0) return;

    const loadMetadata = async () => {
      setLoadingMetadata(true);
      const metadata = new Map<number, PDFMetadata>();

      // Get unique document numbers
      const docNumbers = Array.from(new Set(siiReferences.map(ref => ref.documentNumber)));

      // Load metadata for each document
      await Promise.all(
        docNumbers.map(async (docNum) => {
          const ref = siiReferences.find(r => r.documentNumber === docNum);
          if (ref) {
            try {
              const meta = await extractPDFMetadata(ref.documentPath);
              if (meta) {
                metadata.set(docNum, meta);
              }
            } catch (error) {
              console.error(`Failed to load metadata for doc ${docNum}:`, error);
            }
          }
        })
      );

      setPdfMetadata(metadata);
      setLoadingMetadata(false);
    };

    loadMetadata();
  }, [open, siiReferences]);

  // Helper to find the task that matches a SII reference
  const findTaskForReference = (reference: SIIReference): FlowchartTask | undefined => {
    return step.tasks.find(task => task.description.trim().startsWith(reference.fullReference));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  style={{ backgroundColor: step.color, color: 'white' }}
                  className="text-xs font-mono"
                >
                  {step.colorCode}
                </Badge>
                {step.technician === "both" ? (
                  <>
                    <Badge variant="secondary" className="text-xs bg-blue-500/90 text-white">T1</Badge>
                    <Badge variant="secondary" className="text-xs bg-purple-500/90 text-white">T2</Badge>
                  </>
                ) : step.technician === "T1" ? (
                  <Badge variant="secondary" className="text-xs bg-blue-500/90 text-white">T1</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs bg-purple-500/90 text-white">T2</Badge>
                )}
              </div>
              <DialogTitle className="text-2xl whitespace-pre-line">{step.title}</DialogTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Duration: {step.duration}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="checklist" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="checklist">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Checklist
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="media">
              <ImageIcon className="h-4 w-4 mr-2" />
              Media
            </TabsTrigger>
          </TabsList>

          {/* CHECKLIST TAB - SII References with Checkboxes */}
          <TabsContent value="checklist" className="space-y-3">
            {siiReferences.length > 0 ? (
              <>
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium">Service Instruction Instructions (SII)</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click to open the relevant SII document. {siiReferences.length} reference{siiReferences.length > 1 ? 's' : ''} found in this step.
                  </p>
                </div>

                {/* Group references by document */}
                {Array.from(groupedReferences.entries()).map(([docNum, refs]) => {
                  // Calculate progress for this document's tasks
                  const tasks = refs.map(ref => findTaskForReference(ref)).filter(Boolean) as FlowchartTask[];
                  const completedCount = tasks.filter(t => t.completed).length;
                  const totalCount = tasks.length;
                  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
                  const isDocComplete = completedCount === totalCount && totalCount > 0;

                  return (
                    <Card key={docNum} className={cn(
                      "border-l-4 transition-colors",
                      isDocComplete ? "border-l-green-500 bg-green-50/50" : "border-l-blue-500"
                    )}>
                      <CardContent className="pt-4 pb-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <FileText className={cn(
                                  "h-4 w-4",
                                  isDocComplete ? "text-green-600" : "text-blue-600"
                                )} />
                                <p className="font-medium text-sm">
                                  Doc {docNum}: {refs[0].documentTitle}
                                </p>
                                {isDocComplete && (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                              <div className="mt-1 space-y-1">
                                <p className="text-xs text-muted-foreground">
                                  {refs.length} section{refs.length > 1 ? 's' : ''} referenced · {completedCount}/{totalCount} completed
                                </p>
                                {/* Progress bar */}
                                <div className="w-48 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all",
                                      isDocComplete ? "bg-green-500" : "bg-blue-500"
                                    )}
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openSIIDocument(refs[0])}
                              className="gap-2 ml-4"
                            >
                              Open PDF
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>

                        {/* List all sections from this document with checkboxes */}
                        <div className="space-y-2 mt-3">
                          {refs.map((ref, idx) => {
                            const task = findTaskForReference(ref);
                            const isCompleted = task?.completed || false;

                            return (
                              <div
                                key={idx}
                                className={cn(
                                  "flex items-start gap-3 p-2 rounded-md transition-colors",
                                  isCompleted && "bg-green-50 border border-green-200"
                                )}
                              >
                                <Checkbox
                                  checked={isCompleted}
                                  onCheckedChange={() => task && onTaskToggle(task.id)}
                                  disabled={!task}
                                  className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs text-blue-600 font-medium">
                                      § {ref.section}
                                    </span>
                                    {isCompleted && (
                                      <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                                    )}
                                  </div>
                                  <p className={cn(
                                    "text-xs mt-0.5",
                                    isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                                  )}>
                                    {ref.description || '—'}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No SII references found in this step</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Task descriptions should start with references like "11.5.1 Description"
                </p>
              </div>
            )}
          </TabsContent>

          {/* DOCUMENTS TAB - PDF Links and Resources */}
          <TabsContent value="documents" className="space-y-3">
            {siiReferences.length > 0 || (step.documents && step.documents.length > 0) ? (
              <>
                {/* SII Documents Section */}
                {siiReferences.length > 0 && (
                  <>
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        <p className="text-sm font-medium">Service Instruction Instructions (SII)</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {groupedReferences.size} SII document{groupedReferences.size > 1 ? 's' : ''} referenced in this step
                      </p>
                    </div>

                    {/* List SII documents */}
                    <div className="space-y-2">
                      {Array.from(groupedReferences.entries()).map(([docNum, refs]) => {
                        const metadata = pdfMetadata.get(docNum);

                        return (
                          <Card key={docNum} className="hover:bg-accent cursor-pointer transition-colors">
                            <CardContent
                              className="pt-4 pb-4"
                              onClick={() => openSIIDocument(refs[0])}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">
                                      Doc {docNum}: {refs[0].documentTitle}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {refs.length} section{refs.length > 1 ? 's' : ''} referenced
                                    </p>

                                    {/* Metadata */}
                                    {metadata ? (
                                      <div className="mt-1 flex items-center gap-2 text-xs">
                                        <Badge variant="outline" className="font-mono text-[10px]">
                                          {metadata.documentNumber} {metadata.version}
                                        </Badge>
                                        <span className="text-muted-foreground">·</span>
                                        <Badge variant="secondary" className="text-[10px]">
                                          {metadata.type}
                                        </Badge>
                                        <span className="text-muted-foreground">·</span>
                                        <span className="text-muted-foreground">{metadata.date}</span>
                                      </div>
                                    ) : loadingMetadata ? (
                                      <div className="mt-1 text-xs text-muted-foreground">
                                        Loading metadata...
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                                <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Additional Documents Section */}
                {step.documents && step.documents.length > 0 && (
                  <>
                    <div className={siiReferences.length > 0 ? "mt-6 mb-4" : "mb-4"}>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-gray-600" />
                        <p className="text-sm font-medium">Additional Documents</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Other reference documents for this step
                      </p>
                    </div>

                    <div className="space-y-2">
                      {step.documents.map((doc, idx) => (
                        <Card key={idx} className="hover:bg-accent cursor-pointer transition-colors">
                          <CardContent className="pt-4 pb-4 flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gray-600" />
                            <span className="text-sm">{doc}</span>
                            <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No documents available for this step</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Documents will be linked as they become available
                </p>
              </div>
            )}
          </TabsContent>

          {/* MEDIA TAB */}
          <TabsContent value="media" className="space-y-3">
            {step.media && step.media.length > 0 ? (
              step.media.map((mediaItem, idx) => (
                <Card key={idx} className="hover:bg-accent cursor-pointer">
                  <CardContent className="pt-4 pb-4 flex items-center gap-3">
                    <PlayCircle className="h-5 w-5 text-purple-600" />
                    <span className="text-sm">{mediaItem}</span>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <PlayCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No photos or videos available for this step</p>
                <p className="text-xs text-muted-foreground mt-2">Media content will be added soon</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
