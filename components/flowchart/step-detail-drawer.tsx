"use client"

import { FlowchartStep, FlowchartTask } from "@/lib/flowchart-data";
import { extractSIIReferences, groupReferencesByDocument, openSIIDocument, SIIReference } from "@/lib/sii-documents";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckCircle2, FileText, Image as ImageIcon, PlayCircle, X, ExternalLink, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useMemo } from "react";

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

          <TabsContent value="checklist" className="space-y-4">
            {/* Progress Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {completedTasks}/{totalTasks} tasks
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(completedTasks / totalTasks) * 100}%`,
                        backgroundColor: step.color
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* Tasks List */}
            <div className="space-y-2">
              {step.tasks.map((task) => (
                <Card
                  key={task.id}
                  className={task.completed ? "bg-green-50 border-green-200" : ""}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => onTaskToggle(task.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className={`text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                          {task.description}
                        </p>
                      </div>
                      {task.completed && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {step.notes && (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium mb-2">Notes:</p>
                  <p className="text-sm text-muted-foreground">{step.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-3">
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
                {Array.from(groupedReferences.entries()).map(([docNum, refs]) => (
                  <Card key={docNum} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4 pb-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              Doc {docNum}: {refs[0].documentTitle}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {refs.length} section{refs.length > 1 ? 's' : ''} referenced
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openSIIDocument(refs[0])}
                            className="gap-2"
                          >
                            Open PDF
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* List all sections from this document */}
                        <div className="space-y-1 pl-6 border-l-2 border-gray-200">
                          {refs.map((ref, idx) => (
                            <div key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="font-mono text-blue-600 font-medium">§ {ref.section}</span>
                              <span>{ref.description || '—'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Show additional manual documents if any */}
                {step.documents && step.documents.length > 0 && (
                  <>
                    <div className="mt-6 mb-2">
                      <p className="text-sm font-medium">Additional Documents</p>
                    </div>
                    {step.documents.map((doc, idx) => (
                      <Card key={idx} className="hover:bg-accent cursor-pointer">
                        <CardContent className="pt-4 pb-4 flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-600" />
                          <span className="text-sm">{doc}</span>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No SII references found in this step</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Task descriptions should start with references like "11.5.1 Description"
                </p>
              </div>
            )}
          </TabsContent>

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
