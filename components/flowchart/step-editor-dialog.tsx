"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FlowchartStep, FlowchartTask, generateTaskId } from "@/lib/flowchart-data";
import { SERVICE_TYPE_COLORS } from "@/lib/service-colors";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepEditorDialogProps {
  step: FlowchartStep | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (step: FlowchartStep) => void;
}

export function StepEditorDialog({ step, open, onOpenChange, onSave }: StepEditorDialogProps) {
  const [editedStep, setEditedStep] = useState<FlowchartStep | null>(null);

  useEffect(() => {
    if (step) {
      setEditedStep({ ...step });
    }
  }, [step]);

  // Auto-save when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && editedStep) {
      onSave(editedStep);
    }
    onOpenChange(newOpen);
  };

  if (!editedStep) return null;

  const handleAddTask = () => {
    const newTask: FlowchartTask = {
      id: generateTaskId(),
      description: "",
      completed: false
    };
    setEditedStep({
      ...editedStep,
      tasks: [...editedStep.tasks, newTask]
    });
  };

  const handleRemoveTask = (taskId: string) => {
    setEditedStep({
      ...editedStep,
      tasks: editedStep.tasks.filter(t => t.id !== taskId)
    });
  };

  const handleTaskChange = (taskId: string, description: string) => {
    setEditedStep({
      ...editedStep,
      tasks: editedStep.tasks.map(t =>
        t.id === taskId ? { ...t, description } : t
      )
    });
  };

  const handleTaskServiceTypeChange = (taskId: string, serviceType: string) => {
    setEditedStep({
      ...editedStep,
      tasks: editedStep.tasks.map(t =>
        t.id === taskId ? { ...t, serviceType } : t
      )
    });
  };

  const handleDurationChange = (duration: string) => {
    // Extract minutes from duration string (e.g., "60m" -> 60)
    const minutes = parseInt(duration.replace(/\D/g, "")) || 0;
    setEditedStep({
      ...editedStep,
      duration,
      durationMinutes: minutes
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Step</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={editedStep.duration}
                onChange={(e) => handleDurationChange(e.target.value)}
                placeholder="e.g., 60m or 120m"
              />
              <p className="text-xs text-muted-foreground">
                Duration in minutes (e.g., 60m, 120m, 90m+)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="technician">Technician</Label>
              <Select
                value={editedStep.technician}
                onValueChange={(value: "T1" | "T2" | "both") =>
                  setEditedStep({ ...editedStep, technician: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="T1">T1</SelectItem>
                  <SelectItem value="T2">T2</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Tasks ({editedStep.tasks.length})</Label>
              <Button onClick={handleAddTask} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {editedStep.tasks.map((task, index) => {
                // Check if task starts with reference number (e.g., "13.5.1", "2.7.2.3", "11.5.1.")
                // Match 2 or more parts, allow optional trailing dot
                const hasReferenceNumber = /^\d+(\.\d+)+\.?\s/.test(task.description);

                return (
                  <Card
                    key={task.id}
                    className={cn(
                      !hasReferenceNumber && "ml-8 border-l-4 border-l-blue-200"
                    )}
                  >
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-start gap-2">
                        <Badge
                          variant={hasReferenceNumber ? "default" : "outline"}
                          className={cn("mt-1", hasReferenceNumber && "bg-blue-600")}
                        >
                          {index + 1}
                        </Badge>
                        <div className="flex-1 space-y-2">
                          <Input
                            value={task.description}
                            onChange={(e) => handleTaskChange(task.id, e.target.value)}
                            placeholder={hasReferenceNumber ? "Main task (e.g., 13.5.1 Description...)" : "Sub-task description..."}
                            className={cn(!hasReferenceNumber && "text-sm text-muted-foreground")}
                          />
                          {/* Service Type Selector - Only show for tasks with reference numbers */}
                          {hasReferenceNumber && (
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground">Service Type:</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-[10px] font-mono"
                                    style={{
                                      backgroundColor: task.serviceType ? (SERVICE_TYPE_COLORS[task.serviceType as keyof typeof SERVICE_TYPE_COLORS] || SERVICE_TYPE_COLORS.default) : 'white',
                                      color: task.serviceType ? 'white' : 'black',
                                      borderColor: task.serviceType ? 'transparent' : '#ccc'
                                    }}
                                  >
                                    {task.serviceType || 'Set Type'}
                                    <Pencil className="h-2.5 w-2.5 ml-1" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                  <ServiceTypeSelector
                                    currentType={task.serviceType}
                                    onSelect={(type) => handleTaskServiceTypeChange(task.id, type)}
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTask(task.id)}
                          className="text-red-600 hover:text-red-700 mt-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={editedStep.notes || ""}
              onChange={(e) => setEditedStep({ ...editedStep, notes: e.target.value })}
              placeholder="Additional notes about this step..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => handleOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Service Type Selector Component (Grid of colored buttons)
interface ServiceTypeSelectorProps {
  currentType?: string;
  onSelect: (type: string) => void;
}

function ServiceTypeSelector({ currentType, onSelect }: ServiceTypeSelectorProps) {
  const serviceTypes = [
    { name: "1Y", color: SERVICE_TYPE_COLORS["1Y"] },
    { name: "2Y", color: SERVICE_TYPE_COLORS["2Y"] },
    { name: "3Y", color: SERVICE_TYPE_COLORS["3Y"] },
    { name: "4Y", color: SERVICE_TYPE_COLORS["4Y"] },
    { name: "5Y", color: SERVICE_TYPE_COLORS["5Y"] },
    { name: "6Y", color: SERVICE_TYPE_COLORS["6Y"] },
    { name: "7Y", color: SERVICE_TYPE_COLORS["7Y"] },
    { name: "10Y", color: SERVICE_TYPE_COLORS["10Y"] },
    { name: "12Y", color: SERVICE_TYPE_COLORS["12Y"] },
  ];

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Select Service Type</Label>

      {/* Grid of colored buttons */}
      <div className="grid grid-cols-3 gap-2">
        {serviceTypes.map((st) => (
          <button
            key={st.name}
            onClick={() => onSelect(st.name)}
            className={cn(
              "h-12 rounded-lg border-2 text-xs font-bold text-white transition-all flex items-center justify-center hover:scale-105",
              currentType === st.name ? "border-blue-500 scale-105 ring-2 ring-blue-300" : "border-transparent"
            )}
            style={{ backgroundColor: st.color }}
            title={st.name}
          >
            {st.name}
          </button>
        ))}
      </div>
    </div>
  );
}
