"use client"

import { useState, useEffect, useRef } from "react";
import { Search, FileText, CheckSquare, X, Layers, ListChecks } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FlowchartStep } from "@/lib/flowchart-data";
import { SERVICE_TYPE_COLORS } from "@/lib/service-colors";

interface SearchResult {
  type: 'step' | 'task' | 'document';
  id: string;
  stepId?: string;
  title: string;
  subtitle?: string;
  serviceType?: string;
  documentType?: 'pdf' | 'doc' | 'other';
}

interface FlowchartSearchProps {
  steps: FlowchartStep[];
  onSelectStep: (stepId: string) => void;
  onSelectDocument?: (documentUrl: string) => void;
}

export function FlowchartSearch({ steps, onSelectStep, onSelectDocument }: FlowchartSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Ctrl/Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery("");
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchQuery = query.toLowerCase().trim();
    const searchResults: SearchResult[] = [];
    const addedIds = new Set<string>(); // Prevent duplicates

    steps.forEach(step => {
      const stepTitle = step.title.split('\n')[0]; // First line for display

      // Search in step title (all lines)
      if (step.title.toLowerCase().includes(searchQuery)) {
        const resultId = `step-${step.id}`;
        if (!addedIds.has(resultId)) {
          searchResults.push({
            type: 'step',
            id: step.id,
            title: stepTitle,
            subtitle: `Step ${step.id.replace('step-', '')}`,
            serviceType: step.colorCode
          });
          addedIds.add(resultId);
        }
      }

      // Search in tasks (all text in description)
      step.tasks.forEach(task => {
        if (task.description.toLowerCase().includes(searchQuery)) {
          const resultId = `task-${task.id}`;
          if (!addedIds.has(resultId)) {
            searchResults.push({
              type: 'task',
              id: task.id,
              stepId: step.id,
              title: task.description,
              subtitle: `${stepTitle} - Step ${step.id.replace('step-', '')}`,
              serviceType: task.serviceType || step.colorCode
            });
            addedIds.add(resultId);
          }
        }
      });

      // Search in documents array
      if (step.documents && step.documents.length > 0) {
        step.documents.forEach((doc, index) => {
          if (doc.toLowerCase().includes(searchQuery)) {
            const resultId = `doc-${step.id}-${index}`;
            if (!addedIds.has(resultId)) {
              searchResults.push({
                type: 'document',
                id: `${step.id}-doc-${index}`,
                stepId: step.id,
                title: doc,
                subtitle: `Document in ${stepTitle}`,
                documentType: 'pdf'
              });
              addedIds.add(resultId);
            }
          }
        });
      }

      // Search in notes (full text search)
      if (step.notes?.toLowerCase().includes(searchQuery)) {
        // Extract SII references from notes
        const siiMatches = step.notes.match(/SII-\d{3}-\d{3}/g);
        if (siiMatches) {
          siiMatches.forEach((siiRef, index) => {
            const resultId = `sii-notes-${step.id}-${index}`;
            if (!addedIds.has(resultId)) {
              searchResults.push({
                type: 'document',
                id: `${step.id}-sii-${index}`,
                stepId: step.id,
                title: siiRef,
                subtitle: `SII in notes - ${stepTitle}`,
                documentType: 'pdf'
              });
              addedIds.add(resultId);
            }
          });
        } else {
          // If notes match but no SII, show as step note
          const resultId = `note-${step.id}`;
          if (!addedIds.has(resultId)) {
            const notePreview = step.notes.substring(0, 60) + (step.notes.length > 60 ? '...' : '');
            searchResults.push({
              type: 'step',
              id: step.id,
              title: notePreview,
              subtitle: `Note in ${stepTitle}`,
              serviceType: step.colorCode
            });
            addedIds.add(resultId);
          }
        }
      }

      // Search in task descriptions for SII references
      step.tasks.forEach((task, taskIndex) => {
        const siiMatches = task.description.match(/SII-\d{3}-\d{3}/g);
        if (siiMatches) {
          siiMatches.forEach((siiRef, index) => {
            if (siiRef.toLowerCase().includes(searchQuery)) {
              const resultId = `sii-task-${task.id}-${index}`;
              if (!addedIds.has(resultId)) {
                searchResults.push({
                  type: 'document',
                  id: `${task.id}-sii-${index}`,
                  stepId: step.id,
                  title: siiRef,
                  subtitle: `SII in task - ${stepTitle}`,
                  documentType: 'pdf'
                });
                addedIds.add(resultId);
              }
            }
          });
        }
      });

      // Search in media array (if exists)
      if (step.media && step.media.length > 0) {
        step.media.forEach((media, index) => {
          if (media.toLowerCase().includes(searchQuery)) {
            const resultId = `media-${step.id}-${index}`;
            if (!addedIds.has(resultId)) {
              searchResults.push({
                type: 'document',
                id: `${step.id}-media-${index}`,
                stepId: step.id,
                title: media,
                subtitle: `Media in ${stepTitle}`,
                documentType: 'other'
              });
              addedIds.add(resultId);
            }
          }
        });
      }
    });

    // Limit results to 10 (increased from 8 for better coverage)
    setResults(searchResults.slice(0, 10));
    setSelectedIndex(0);
  }, [query, steps]);

  // Handle arrow navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  // Handle result selection
  const handleSelect = (result: SearchResult) => {
    if (result.type === 'step' || result.type === 'task') {
      onSelectStep(result.stepId || result.id);
    } else if (result.type === 'document' && result.stepId) {
      // Navigate to the step that contains this document
      onSelectStep(result.stepId);
      // Optionally open the document if handler is provided
      if (onSelectDocument) {
        onSelectDocument(result.title);
      }
    }
    setIsOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  const getIcon = (result: SearchResult) => {
    if (result.type === 'document') {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded bg-red-50 dark:bg-red-950">
          <FileText className="h-4 w-4 text-red-600 dark:text-red-400" />
        </div>
      );
    } else if (result.type === 'task') {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded bg-green-50 dark:bg-green-950">
          <CheckSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-50 dark:bg-blue-950">
        <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </div>
    );
  };

  return (
    <div className="relative z-[200]" onBlur={(e) => {
      // Close if clicking outside
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setTimeout(() => setIsOpen(false), 200);
      }
    }}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40 group-hover:text-white transition-all duration-300" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search... (Ctrl+K)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="h-8 w-64 pl-8 pr-8 text-xs bg-transparent text-white placeholder:text-white/40 group-hover:placeholder:text-white focus:placeholder:text-white rounded transition-all duration-300 border-0 focus:outline-none focus:ring-0"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Results dropdown - Google-style */}
      {isOpen && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute top-full mt-2 w-full min-w-[400px] bg-background border rounded-xl shadow-2xl z-[210] max-h-[500px] overflow-hidden"
        >
          <div className="p-2 space-y-0.5">
            {results.map((result, index) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelect(result)}
                className={cn(
                  "w-full text-left px-3 py-3 rounded-lg transition-all flex items-start gap-3 group",
                  index === selectedIndex
                    ? "bg-blue-50 dark:bg-blue-950/50 shadow-sm"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                )}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {/* Icon with colored background */}
                {getIcon(result)}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn(
                      "text-sm font-medium truncate",
                      index === selectedIndex && "text-blue-700 dark:text-blue-400"
                    )}>
                      {result.title}
                    </span>
                    {result.serviceType && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded font-bold flex-shrink-0"
                        style={{
                          backgroundColor: SERVICE_TYPE_COLORS[result.serviceType as keyof typeof SERVICE_TYPE_COLORS] || '#gray',
                          color: ['7Y', '10Y'].includes(result.serviceType) ? 'black' : 'white'
                        }}
                      >
                        {result.serviceType}
                      </span>
                    )}
                    {result.type === 'document' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-medium flex-shrink-0">
                        PDF
                      </span>
                    )}
                  </div>
                  {result.subtitle && (
                    <p className="text-xs text-muted-foreground truncate leading-relaxed">
                      {result.subtitle}
                    </p>
                  )}
                </div>

                {/* Hover indicator */}
                {index === selectedIndex && (
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-1 h-8 bg-blue-600 rounded-full" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Footer hint */}
          <div className="border-t p-2 bg-muted/30">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-background border rounded text-[9px]">↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-background border rounded text-[9px]">Enter</kbd>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-background border rounded text-[9px]">Esc</kbd>
                <span>Close</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No results */}
      {isOpen && query && results.length === 0 && (
        <div className="absolute top-full mt-1 w-full bg-background border rounded-lg shadow-2xl z-[210] p-4">
          <p className="text-sm text-muted-foreground text-center">
            No results found for &quot;{query}&quot;
          </p>
        </div>
      )}
    </div>
  );
}
