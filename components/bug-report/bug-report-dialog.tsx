"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bug } from "lucide-react";
import { BugReport, generateBugReportId, saveBugReport } from "@/lib/bug-reports";
import { toast } from "sonner";

interface BugReportDialogProps {
  flowchartId: string;
  flowchartName: string;
  stepId: string;
  stepTitle: string;
  taskId: string;
  taskDescription: string;
}

export function BugReportDialog({
  flowchartId,
  flowchartName,
  stepId,
  stepTitle,
  taskId,
  taskDescription,
}: BugReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<BugReport["reportType"]>("other");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Please provide a description");
      return;
    }

    setIsSubmitting(true);

    try {
      const bugReport: BugReport = {
        id: generateBugReportId(),
        timestamp: new Date().toISOString(),
        flowchartId,
        flowchartName,
        stepId,
        stepTitle,
        taskId,
        taskDescription,
        reportType,
        description: description.trim(),
        status: "open",
        comments: [],
      };

      saveBugReport(bugReport);

      toast.success("Bug report submitted successfully!");

      // Reset form
      setDescription("");
      setReportType("other");
      setOpen(false);
    } catch (error) {
      console.error("Failed to submit bug report:", error);
      toast.error("Failed to submit bug report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
          title="Report bug"
        >
          <Bug className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-red-600" />
            Report Bug
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Task Context */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
            <p className="text-xs font-medium text-gray-600">Task:</p>
            <p className="text-sm font-semibold text-gray-900">{taskDescription}</p>
            <p className="text-xs text-gray-500 mt-1">
              Step: {stepTitle.split('\n')[0]}
            </p>
          </div>

          {/* Bug Type */}
          <div className="space-y-2">
            <Label htmlFor="bug-type" className="text-sm font-medium">
              Bug Type
            </Label>
            <Select value={reportType} onValueChange={(value) => setReportType(value as BugReport["reportType"])}>
              <SelectTrigger id="bug-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wrong_step">Wrong Step</SelectItem>
                <SelectItem value="missing_reference">Missing Reference in Document</SelectItem>
                <SelectItem value="incorrect_info">Incorrect Information</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue... (e.g., Step reference 13.5.1 not found in document 0093-1909)"
              className="min-h-[120px] text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !description.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Submitting..." : "Submit Bug Report"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
