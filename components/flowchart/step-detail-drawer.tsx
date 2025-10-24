"use client"

import { FlowchartStep, FlowchartTask } from "@/lib/flowchart-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckCircle2, FileText, Image as ImageIcon, PlayCircle, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
            {step.documents && step.documents.length > 0 ? (
              step.documents.map((doc, idx) => (
                <Card key={idx} className="hover:bg-accent cursor-pointer">
                  <CardContent className="pt-4 pb-4 flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="text-sm">{doc}</span>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No documents available for this step</p>
                <p className="text-xs text-muted-foreground mt-2">Documents will be added soon</p>
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
