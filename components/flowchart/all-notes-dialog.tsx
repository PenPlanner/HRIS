"use client"

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StickyNote, Filter } from "lucide-react";
import { FlowchartStep, TaskNote } from "@/lib/flowchart-data";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AllNotesDialogProps {
  steps: FlowchartStep[];
}

interface NoteWithContext {
  note: TaskNote;
  stepId: string;
  stepTitle: string;
  taskId: string;
  taskDescription: string;
  stepColor: string;
}

export function AllNotesDialog({ steps }: AllNotesDialogProps) {
  const [open, setOpen] = useState(false);
  const [filterStepId, setFilterStepId] = useState<string>("all");

  // Collect all notes from all tasks across all steps
  const allNotes = useMemo(() => {
    const notes: NoteWithContext[] = [];

    steps.forEach(step => {
      step.tasks.forEach(task => {
        if (task.notes && task.notes.length > 0) {
          task.notes.forEach(note => {
            notes.push({
              note,
              stepId: step.id,
              stepTitle: step.title,
              taskId: task.id,
              taskDescription: task.description,
              stepColor: step.color
            });
          });
        }
      });
    });

    // Sort by timestamp (newest first)
    notes.sort((a, b) => new Date(b.note.timestamp).getTime() - new Date(a.note.timestamp).getTime());

    return notes;
  }, [steps]);

  // Filter notes by step
  const filteredNotes = useMemo(() => {
    if (filterStepId === "all") return allNotes;
    return allNotes.filter(n => n.stepId === filterStepId);
  }, [allNotes, filterStepId]);

  // Get steps that have notes
  const stepsWithNotes = useMemo(() => {
    const stepIds = new Set(allNotes.map(n => n.stepId));
    return steps.filter(s => stepIds.has(s.id));
  }, [steps, allNotes]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 bg-amber-50 border-amber-300 hover:bg-amber-100 text-amber-900"
        >
          <StickyNote className="h-4 w-4" />
          <span>All Notes ({allNotes.length})</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-amber-600" />
            Job Notes Collection
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Filter */}
          {stepsWithNotes.length > 1 && (
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStepId} onValueChange={setFilterStepId}>
                <SelectTrigger className="w-[300px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Steps ({allNotes.length} notes)</SelectItem>
                  {stepsWithNotes.map(step => {
                    const stepNoteCount = allNotes.filter(n => n.stepId === step.id).length;
                    return (
                      <SelectItem key={step.id} value={step.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: step.color }}
                          />
                          <span className="truncate max-w-[300px]">
                            {step.title.split('\n')[0]} ({stepNoteCount})
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <StickyNote className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No notes found</p>
                <p className="text-xs mt-1">Add notes to tasks to see them here</p>
              </div>
            ) : (
              filteredNotes.map(({ note, stepTitle, taskDescription, stepColor }, index) => {
                const latestVersion = note.edits ? note.edits.length + 1 : 1;

                return (
                  <div
                    key={`${note.id}-${index}`}
                    className="bg-amber-50 border border-amber-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-2">
                      <div
                        className="w-1 h-full rounded-full flex-shrink-0 mt-1"
                        style={{ backgroundColor: stepColor }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge
                            className="text-[10px] px-1.5 py-0.5"
                            style={{ backgroundColor: stepColor, color: 'white' }}
                          >
                            {stepTitle.split('\n')[0].substring(0, 30)}...
                          </Badge>
                          <span className="text-[10px] text-amber-600 font-mono">
                            {new Date(note.timestamp).toLocaleString('sv-SE', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {latestVersion > 1 && (
                            <span className="text-[9px] text-amber-700 bg-amber-100 px-1.5 rounded">
                              v{latestVersion}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                          {taskDescription}
                        </p>
                      </div>
                    </div>

                    {/* Note Content */}
                    <div className="pl-4 mt-2">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                        {note.note}
                      </p>
                    </div>

                    {/* Edit History */}
                    {note.edits && note.edits.length > 0 && (
                      <div className="pl-4 mt-2 pt-2 border-t border-amber-200">
                        <details className="text-[10px] text-amber-600">
                          <summary className="cursor-pointer hover:text-amber-800 font-medium">
                            Edit history ({note.edits.length})
                          </summary>
                          <div className="mt-2 space-y-1 pl-2">
                            {note.edits.map((edit) => (
                              <div key={edit.version} className="flex items-center gap-2 text-amber-700">
                                <span className="bg-amber-100 px-1.5 rounded font-mono">v{edit.version}</span>
                                <span className="font-mono">
                                  {new Date(edit.timestamp).toLocaleString('sv-SE', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Summary Footer */}
        {filteredNotes.length > 0 && (
          <div className="pt-3 mt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}</span>
            <span>
              {stepsWithNotes.length} step{stepsWithNotes.length !== 1 ? 's' : ''} with notes
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
