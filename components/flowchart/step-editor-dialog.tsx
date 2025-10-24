"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FlowchartStep, FlowchartTask, generateTaskId } from "@/lib/flowchart-data";
import { Plus, Trash2, Save, X } from "lucide-react";

interface StepEditorDialogProps {
  step: FlowchartStep | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (step: FlowchartStep) => void;
}

const PRESET_COLORS = [
  { name: "Orange", value: "#FF9800", code: "2Y" },
  { name: "Blue", value: "#2196F3", code: "4Y" },
  { name: "Green", value: "#4CAF50", code: "T1" },
  { name: "Yellow", value: "#FFC107", code: "3Y" },
  { name: "Purple", value: "#9C27B0", code: "5Y" },
  { name: "Red", value: "#FF5722", code: "6Y" },
  { name: "Pink", value: "#E91E63", code: "T2" },
  { name: "Brown", value: "#795548", code: "Both" },
  { name: "Cyan", value: "#00BCD4", code: "7Y" },
  { name: "Lime", value: "#CDDC39", code: "8Y" }
];

export function StepEditorDialog({ step, open, onOpenChange, onSave }: StepEditorDialogProps) {
  const [editedStep, setEditedStep] = useState<FlowchartStep | null>(null);

  useEffect(() => {
    if (step) {
      setEditedStep({ ...step });
    }
  }, [step]);

  if (!editedStep) return null;

  const handleSave = () => {
    onSave(editedStep);
    onOpenChange(false);
  };

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Step</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Textarea
                id="title"
                value={editedStep.title}
                onChange={(e) => setEditedStep({ ...editedStep, title: e.target.value })}
                placeholder="Step title..."
                rows={3}
              />
            </div>

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
          </div>

          {/* Color and Code */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setEditedStep({
                      ...editedStep,
                      color: preset.value,
                      colorCode: preset.code
                    })}
                    className={`h-10 rounded border-2 transition-all ${
                      editedStep.color === preset.value
                        ? "border-black scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Label htmlFor="custom-color" className="text-xs">Custom:</Label>
                <Input
                  id="custom-color"
                  type="color"
                  value={editedStep.color}
                  onChange={(e) => setEditedStep({ ...editedStep, color: e.target.value })}
                  className="w-20 h-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="colorCode">Color Code</Label>
              <Input
                id="colorCode"
                value={editedStep.colorCode}
                onChange={(e) => setEditedStep({ ...editedStep, colorCode: e.target.value })}
                placeholder="e.g., 2Y, 3Y, T1, T2"
              />
              <Label htmlFor="technician" className="mt-4 block">Technician</Label>
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
              {editedStep.tasks.map((task, index) => (
                <Card key={task.id}>
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-1">{index + 1}</Badge>
                      <Input
                        value={task.description}
                        onChange={(e) => handleTaskChange(task.id, e.target.value)}
                        placeholder="Task description..."
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTask(task.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
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

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <Card
              className="p-3 w-[200px]"
              style={{
                backgroundColor: `${editedStep.color}15`,
                borderLeft: `4px solid ${editedStep.color}`
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge
                  style={{ backgroundColor: editedStep.color, color: 'white' }}
                  className="text-[10px] font-mono px-1 py-0"
                >
                  {editedStep.colorCode}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {editedStep.technician === "both" ? "T1+T2" : editedStep.technician}
                </Badge>
              </div>
              <h3 className="font-bold text-xs leading-tight mb-1 line-clamp-3">
                {editedStep.title || "Step title..."}
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {editedStep.duration} • {editedStep.tasks.length} tasks
              </p>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
