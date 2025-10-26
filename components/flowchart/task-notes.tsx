"use client"

import { useState } from "react";
import { TaskNote } from "@/lib/flowchart-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StickyNote, Edit2, Trash2, X, Check } from "lucide-react";

interface TaskNotesProps {
  taskId: string;
  notes?: TaskNote[];
  onAddNote: (taskId: string, note: string) => void;
  onEditNote: (taskId: string, noteId: string, newText: string) => void;
  onDeleteNote: (taskId: string, noteId: string) => void;
}

export function TaskNotes({ taskId, notes, onAddNote, onEditNote, onDeleteNote }: TaskNotesProps) {
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(taskId, newNote.trim());
      setNewNote('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };

  const startEdit = (note: TaskNote) => {
    setEditingNoteId(note.id);
    setEditText(note.note);
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setEditText('');
  };

  const saveEdit = (noteId: string) => {
    if (editText.trim() && editText.trim() !== notes?.find(n => n.id === noteId)?.note) {
      onEditNote(taskId, noteId, editText.trim());
    }
    cancelEdit();
  };

  const handleDelete = (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      onDeleteNote(taskId, noteId);
    }
  };

  return (
    <div className="mt-2 ml-7">
      <div className="flex items-center gap-2 mb-2">
        <StickyNote className="h-3 w-3 text-amber-600" />
        <span className="text-[10px] font-medium text-amber-700">
          Notes {notes && notes.length > 0 && `(${notes.length})`}
        </span>
      </div>

      {/* Existing notes */}
      {notes && notes.length > 0 && (
        <div className="mb-2 space-y-1.5 max-h-40 overflow-y-auto">
          {notes.map((note) => {
            const isEditing = editingNoteId === note.id;
            const latestVersion = note.edits ? note.edits.length + 1 : 1;

            return (
              <div
                key={note.id}
                className="bg-gray-50 border border-gray-200 rounded p-2 text-xs"
              >
                {/* Header with timestamp and actions */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-600 font-mono">
                      {new Date(note.timestamp).toLocaleString('sv-SE', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {latestVersion > 1 && (
                      <span className="text-[9px] text-gray-700 bg-gray-200 px-1 rounded">
                        v{latestVersion}
                      </span>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(note)}
                        className="p-0.5 hover:bg-gray-200 rounded"
                        title="Edit note"
                      >
                        <Edit2 className="h-3 w-3 text-gray-700" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="p-0.5 hover:bg-red-100 rounded"
                        title="Delete note"
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Note content or edit input */}
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="text-xs h-8"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => saveEdit(note.id)}
                        className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                        className="h-6 px-2 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-700">{note.note}</p>

                    {/* Edit history */}
                    {note.edits && note.edits.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <details className="text-[10px] text-gray-600">
                          <summary className="cursor-pointer hover:text-gray-800">
                            Edit history ({note.edits.length})
                          </summary>
                          <div className="mt-1 space-y-1 pl-2">
                            {note.edits.map((edit) => (
                              <div key={edit.version} className="flex items-center gap-2">
                                <span className="bg-gray-200 px-1 rounded">v{edit.version}</span>
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
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add new note */}
      <div className="flex gap-2">
        <Input
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add note about deviations, improvements..."
          className="text-xs h-8"
        />
        <Button
          size="sm"
          onClick={handleAddNote}
          disabled={!newNote.trim()}
          className="h-8 px-3 text-xs"
        >
          Add
        </Button>
      </div>
    </div>
  );
}
