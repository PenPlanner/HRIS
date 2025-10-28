"use client"

import { useState, useEffect, useRef } from "react";
import { Search, FileText, CheckSquare, X } from "lucide-react";
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

    steps.forEach(step => {
      // Search in step title
      if (step.title.toLowerCase().includes(searchQuery)) {
        searchResults.push({
          type: 'step',
          id: step.id,
          title: step.title,
          subtitle: `Step ${step.id.replace('step-', '')}`,
          serviceType: step.colorCode
        });
      }

      // Search in tasks
      step.tasks.forEach(task => {
        if (task.description.toLowerCase().includes(searchQuery)) {
          searchResults.push({
            type: 'task',
            id: task.id,
            stepId: step.id,
            title: task.description,
            subtitle: `${step.title} - Step ${step.id.replace('step-', '')}`,
            serviceType: task.serviceType || step.colorCode
          });
        }
      });

      // Search in documents (SII references and notes)
      if (step.notes?.toLowerCase().includes(searchQuery)) {
        // Check if notes contain SII references
        const siiMatch = step.notes.match(/SII-\d{3}-\d{3}/);
        if (siiMatch) {
          searchResults.push({
            type: 'document',
            id: `${step.id}-doc`,
            stepId: step.id,
            title: siiMatch[0],
            subtitle: `Document in ${step.title}`,
            documentType: 'pdf'
          });
        }
      }

      // Search in task descriptions for SII references
      step.tasks.forEach(task => {
        const siiMatches = task.description.match(/SII-\d{3}-\d{3}/g);
        if (siiMatches) {
          siiMatches.forEach((siiRef, index) => {
            if (siiRef.toLowerCase().includes(searchQuery)) {
              searchResults.push({
                type: 'document',
                id: `${task.id}-doc-${index}`,
                stepId: step.id,
                title: siiRef,
                subtitle: `Document in ${step.title}`,
                documentType: 'pdf'
              });
            }
          });
        }
      });
    });

    // Limit results to 8
    setResults(searchResults.slice(0, 8));
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
      return <FileText className="h-4 w-4 text-red-500" />;
    } else if (result.type === 'task') {
      return <CheckSquare className="h-4 w-4 text-green-500" />;
    }
    return <Search className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div className="relative z-[200]" onBlur={(e) => {
      // Close if clicking outside
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setTimeout(() => setIsOpen(false), 200);
      }
    }}>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search steps, tasks, documents... (Ctrl+K)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="h-7 pl-7 pr-7 text-xs"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute top-full mt-1 w-full bg-background border rounded-lg shadow-2xl z-[210] max-h-[500px] overflow-y-auto"
        >
          <div className="p-1">
            {results.map((result, index) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelect(result)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md transition-colors flex items-start gap-2",
                  index === selectedIndex
                    ? "bg-accent"
                    : "hover:bg-accent/50"
                )}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="mt-0.5">
                  {getIcon(result)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {result.title}
                    </span>
                    {result.serviceType && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                        style={{
                          backgroundColor: SERVICE_TYPE_COLORS[result.serviceType as keyof typeof SERVICE_TYPE_COLORS] || '#gray',
                          color: ['7Y', '10Y'].includes(result.serviceType) ? 'black' : 'white'
                        }}
                      >
                        {result.serviceType}
                      </span>
                    )}
                  </div>
                  {result.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">
                      {result.subtitle}
                    </p>
                  )}
                </div>
                {result.type === 'document' && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-medium">
                    PDF
                  </span>
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
