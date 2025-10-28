"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { VestasLevel, Technician } from "@/lib/mock-data";
import { TechnicianWorkHistoryDialog } from "./technician-work-history-dialog";

interface TechnicianSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (technician: Technician) => void;
  title: string;
  currentSelection?: Technician | null;
}

// Vestas Level Colors
const getVestasLevelColor = (level: VestasLevel): { bg: string; text: string; border: string } => {
  switch (level) {
    case 'D':
      return { bg: '#9ca3af', text: '#ffffff', border: '#6b7280' }; // Gray
    case 'C':
      return { bg: '#3b82f6', text: '#ffffff', border: '#2563eb' }; // Blue
    case 'B':
      return { bg: '#10b981', text: '#ffffff', border: '#059669' }; // Green
    case 'A':
      return { bg: '#8b5cf6', text: '#ffffff', border: '#7c3aed' }; // Purple
    case 'Field Trainer':
      return { bg: '#f59e0b', text: '#ffffff', border: '#d97706' }; // Amber/Gold
    default:
      return { bg: '#9ca3af', text: '#ffffff', border: '#6b7280' };
  }
};

// Competency Level Colors
const getLevelColor = (level?: number) => {
  if (!level) return "bg-gray-500";
  if (level === 5) return "bg-green-500";
  if (level === 4) return "bg-blue-500";
  if (level === 3) return "bg-yellow-500";
  if (level === 2) return "bg-orange-500";
  return "bg-red-500";
};

export function TechnicianSelectModal({
  open,
  onOpenChange,
  onSelect,
  title,
  currentSelection
}: TechnicianSelectModalProps) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVestasLevel, setSelectedVestasLevel] = useState<VestasLevel | "all">("all");
  const [selectedCompetencyLevel, setSelectedCompetencyLevel] = useState<number | "all">("all");
  const [loading, setLoading] = useState(true);
  const [showWorkHistory, setShowWorkHistory] = useState(false);
  const [selectedTechForHistory, setSelectedTechForHistory] = useState<Technician | null>(null);

  // Fetch technicians from API
  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch('/api/technicians')
        .then(res => res.json())
        .then(data => {
          setTechnicians(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch technicians:', err);
          setLoading(false);
        });
    }
  }, [open]);

  // Filter by Vestas level
  const vestasFilteredTechnicians = selectedVestasLevel === "all"
    ? technicians
    : technicians.filter(tech => tech.vestas_level === selectedVestasLevel);

  // Filter by Competency level
  const competencyFilteredTechnicians = selectedCompetencyLevel === "all"
    ? vestasFilteredTechnicians
    : vestasFilteredTechnicians.filter(tech => tech.competency_level === selectedCompetencyLevel);

  // Filter by search query
  const filteredTechnicians = competencyFilteredTechnicians.filter((tech) => {
    const query = searchQuery.toLowerCase().trim();
    const basicMatch =
      tech.initials.toLowerCase().includes(query) ||
      tech.first_name.toLowerCase().includes(query) ||
      tech.last_name.toLowerCase().includes(query) ||
      tech.team_name.toLowerCase().includes(query);

    const vestasMatch = tech.vestas_level?.toLowerCase().includes(query);
    const competencyMatch = tech.competency_level && (
      `l${tech.competency_level}`.toLowerCase().includes(query) ||
      `level ${tech.competency_level}`.toLowerCase().includes(query) ||
      tech.competency_level.toString() === query
    );

    return basicMatch || vestasMatch || competencyMatch;
  });

  const hasActiveFilters = selectedVestasLevel !== "all" || selectedCompetencyLevel !== "all" || searchQuery !== "";

  const resetFilters = () => {
    setSelectedVestasLevel("all");
    setSelectedCompetencyLevel("all");
    setSearchQuery("");
  };

  const handleSelect = (tech: Technician) => {
    // If clicking the same technician, deselect (pass null)
    if (currentSelection?.id === tech.id) {
      onSelect(null as any); // Deselect
      onOpenChange(false);
      return;
    }

    onSelect(tech);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="px-6 py-3 space-y-3 border-b bg-muted/30">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by initials, name, level (e.g., 'L4', 'B')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-3 flex-wrap text-xs">
            {/* Vestas Level Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground font-medium">Vestas:</span>
              <div className="flex gap-1">
                <Button
                  variant={selectedVestasLevel === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedVestasLevel("all")}
                  className="h-6 px-2 text-xs"
                >
                  All
                </Button>
                {(["D", "C", "B", "A", "Field Trainer"] as const).map((level) => {
                  const colors = getVestasLevelColor(level);
                  return (
                    <Button
                      key={level}
                      variant={selectedVestasLevel === level ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedVestasLevel(level)}
                      className="h-6 px-2 text-xs"
                      style={
                        selectedVestasLevel === level
                          ? { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }
                          : {}
                      }
                    >
                      {level === "Field Trainer" ? "FT" : level}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Competency Level Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground font-medium">Level:</span>
              <div className="flex gap-1">
                <Button
                  variant={selectedCompetencyLevel === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCompetencyLevel("all")}
                  className="h-6 px-2 text-xs"
                >
                  All
                </Button>
                {[1, 2, 3, 4, 5].map((level) => (
                  <Button
                    key={level}
                    variant={selectedCompetencyLevel === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCompetencyLevel(level)}
                    className={cn(
                      "h-6 px-2 text-xs",
                      selectedCompetencyLevel === level && getLevelColor(level) + " text-white border-0"
                    )}
                  >
                    L{level}
                  </Button>
                ))}
              </div>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-6 px-2 text-xs gap-1"
              >
                <X className="h-3 w-3" />
                Reset
              </Button>
            )}
          </div>

          {/* Results Count */}
          <div className="text-xs text-muted-foreground">
            {filteredTechnicians.length} technician{filteredTechnicians.length !== 1 ? 's' : ''} found
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-3 text-sm text-muted-foreground">Loading technicians...</p>
              </div>
            </div>
          ) : filteredTechnicians.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">No technicians found</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredTechnicians.map((tech) => (
                <button
                  key={tech.id}
                  onClick={() => handleSelect(tech)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors relative",
                    currentSelection?.id === tech.id && "bg-accent border-primary ring-2 ring-primary"
                  )}
                  style={{ borderLeft: `3px solid ${tech.team_color}` }}
                  title={currentSelection?.id === tech.id ? "Click again to deselect" : "Click to select"}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {tech.first_name} {tech.last_name}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {tech.initials}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                          style={{
                            borderColor: tech.team_color,
                            color: tech.team_color,
                          }}
                        >
                          {tech.team_name}
                        </Badge>
                        {tech.vestas_level && (
                          <Badge
                            className="text-[10px] px-1.5 py-0"
                            style={{
                              backgroundColor: getVestasLevelColor(tech.vestas_level).bg,
                              color: getVestasLevelColor(tech.vestas_level).text,
                              borderColor: getVestasLevelColor(tech.vestas_level).border
                            }}
                          >
                            {tech.vestas_level}
                          </Badge>
                        )}
                        {tech.competency_level && (
                          <Badge
                            className={`text-[10px] px-1.5 py-0 ${getLevelColor(tech.competency_level)} text-white border-0`}
                          >
                            L{tech.competency_level}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTechForHistory(tech);
                        setShowWorkHistory(true);
                      }}
                      className="h-7 px-2 gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      title="View work history"
                    >
                      <History className="h-3.5 w-3.5" />
                      History
                    </Button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>

      {/* Work History Dialog */}
      <TechnicianWorkHistoryDialog
        open={showWorkHistory}
        onOpenChange={setShowWorkHistory}
        technician={selectedTechForHistory as any}
      />
    </Dialog>
  );
}
