"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, User, History, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { TechnicianWorkHistoryDialog } from "./technician-work-history-dialog";

interface Technician {
  id: string;
  first_name: string;
  last_name: string;
  initials: string;
  email: string;
  vestas_level?: string;
  competency_level?: string;
  team_name?: string;
}

interface TechnicianGroupSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (t1: Technician | null, t2: Technician | null, t3?: Technician | null) => void;
  currentT1?: Technician | null;
  currentT2?: Technician | null;
  currentT3?: Technician | null;
  mode?: 'global' | 'step'; // global = from start service, step = for individual step
  stepId?: string; // if mode is 'step', this is the step ID
  includeT3?: boolean; // whether to show T3 selection (default: true)
}

export function TechnicianGroupSelectModal({
  open,
  onOpenChange,
  onSelect,
  currentT1,
  currentT2,
  currentT3,
  mode = 'global',
  stepId,
  includeT3 = true
}: TechnicianGroupSelectModalProps) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState<Technician[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedT1, setSelectedT1] = useState<Technician | null>(null);
  const [selectedT2, setSelectedT2] = useState<Technician | null>(null);
  const [selectedT3, setSelectedT3] = useState<Technician | null>(null);
  const [loading, setLoading] = useState(false);
  const [showWorkHistory, setShowWorkHistory] = useState(false);
  const [selectedTechForHistory, setSelectedTechForHistory] = useState<Technician | null>(null);

  // Filter states
  const [selectedVestasLevel, setSelectedVestasLevel] = useState<string>("all");
  const [selectedCompetencyLevel, setSelectedCompetencyLevel] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");

  // Load technicians from API
  useEffect(() => {
    if (!open) return;

    const fetchTechnicians = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/technicians');
        const data = await response.json();
        setTechnicians(data);
        setFilteredTechnicians(data);
      } catch (error) {
        console.error('Failed to load technicians:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicians();
  }, [open]);

  // Set current selections when modal opens
  useEffect(() => {
    if (open && currentT1) {
      const t1Match = technicians.find(t => t.id === currentT1.id);
      if (t1Match) setSelectedT1(t1Match);
    } else if (open && !currentT1) {
      setSelectedT1(null);
    }

    if (open && currentT2) {
      const t2Match = technicians.find(t => t.id === currentT2.id);
      if (t2Match) setSelectedT2(t2Match);
    } else if (open && !currentT2) {
      setSelectedT2(null);
    }

    if (open && currentT3 && includeT3) {
      const t3Match = technicians.find(t => t.id === currentT3.id);
      if (t3Match) setSelectedT3(t3Match);
    } else if (open && !currentT3) {
      setSelectedT3(null);
    }
  }, [open, currentT1, currentT2, currentT3, technicians, includeT3]);

  // Filter technicians based on search and filters
  useEffect(() => {
    let filtered = technicians;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tech =>
        tech.initials.toLowerCase().includes(query) ||
        tech.first_name.toLowerCase().includes(query) ||
        tech.last_name.toLowerCase().includes(query) ||
        tech.email.toLowerCase().includes(query)
      );
    }

    // Apply Vestas level filter
    if (selectedVestasLevel !== "all") {
      filtered = filtered.filter(tech => tech.vestas_level === selectedVestasLevel);
    }

    // Apply Competency level filter
    if (selectedCompetencyLevel !== "all") {
      filtered = filtered.filter(tech => tech.competency_level === selectedCompetencyLevel);
    }

    // Apply Team filter
    if (selectedTeam !== "all") {
      filtered = filtered.filter(tech => tech.team_name === selectedTeam);
    }

    setFilteredTechnicians(filtered);
  }, [searchQuery, technicians, selectedVestasLevel, selectedCompetencyLevel, selectedTeam]);

  const handleConfirm = () => {
    // For global mode, require T1 and T2
    if (mode === 'global' && (!selectedT1 || !selectedT2)) {
      return;
    }

    // For step mode, at least one technician should be selected
    if (mode === 'step' && !selectedT1 && !selectedT2 && !selectedT3) {
      return;
    }

    onSelect(selectedT1, selectedT2, selectedT3);
    onOpenChange(false);
  };

  const getVestasLevelColor = (level?: string) => {
    switch (level) {
      case 'D': return 'bg-red-100 text-red-700 border-red-300';
      case 'C': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'B': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'A': return 'bg-green-100 text-green-700 border-green-300';
      case 'Field Trainer': return 'bg-purple-100 text-purple-700 border-purple-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getDialogTitle = () => {
    if (mode === 'global') {
      return 'Select Technicians for Service';
    }
    return `Select Technicians for Step ${stepId || ''}`;
  };

  const getDialogDescription = () => {
    if (mode === 'global') {
      return 'Choose Technician 1 (T1), Technician 2 (T2), and optionally Trainee (T3). These will be the default technicians for all steps.';
    }
    return 'Change technicians for this specific step only. This will not affect other steps or the default selection.';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[88vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by initials, name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Vestas Level</label>
            <select
              value={selectedVestasLevel}
              onChange={(e) => setSelectedVestasLevel(e.target.value)}
              className="w-full h-9 px-3 text-sm border rounded-md bg-background"
            >
              <option value="all">All Levels</option>
              <option value="D">Level D</option>
              <option value="C">Level C</option>
              <option value="B">Level B</option>
              <option value="A">Level A</option>
              <option value="Field Trainer">Field Trainer</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Competency Level</label>
            <select
              value={selectedCompetencyLevel}
              onChange={(e) => setSelectedCompetencyLevel(e.target.value)}
              className="w-full h-9 px-3 text-sm border rounded-md bg-background"
            >
              <option value="all">All Levels</option>
              <option value="L1">L1</option>
              <option value="L2">L2</option>
              <option value="L3">L3</option>
              <option value="L4">L4</option>
              <option value="L5">L5</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Team</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full h-9 px-3 text-sm border rounded-md bg-background"
            >
              <option value="all">All Teams</option>
              <option value="Travel S">Travel S</option>
              <option value="Travel U">Travel U</option>
              <option value="South 1">South 1</option>
              <option value="South 2">South 2</option>
              <option value="North 1">North 1</option>
              <option value="North 2">North 2</option>
            </select>
          </div>
        </div>

        {/* Selected technicians display */}
        <div className={cn(
          "grid gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border",
          includeT3 ? "grid-cols-3" : "grid-cols-2"
        )}>
          {/* T1 */}
          <div className={cn(
            "p-3 rounded-md border-2 transition-all",
            selectedT1 ? "bg-blue-50 dark:bg-blue-950 border-blue-300" : "bg-white dark:bg-gray-800 border-gray-200 border-dashed"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-600">TECHNICIAN 1</span>
            </div>
            {selectedT1 ? (
              <div>
                <p className="font-bold text-sm">{selectedT1.initials}</p>
                <p className="text-xs text-muted-foreground">{selectedT1.first_name} {selectedT1.last_name}</p>
                {mode === 'step' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedT1(null)}
                    className="h-5 px-1 text-xs mt-1 text-red-600 hover:text-red-700"
                  >
                    Clear
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Not selected</p>
            )}
          </div>

          {/* T2 */}
          <div className={cn(
            "p-3 rounded-md border-2 transition-all",
            selectedT2 ? "bg-purple-50 dark:bg-purple-950 border-purple-300" : "bg-white dark:bg-gray-800 border-gray-200 border-dashed"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-bold text-purple-600">TECHNICIAN 2</span>
            </div>
            {selectedT2 ? (
              <div>
                <p className="font-bold text-sm">{selectedT2.initials}</p>
                <p className="text-xs text-muted-foreground">{selectedT2.first_name} {selectedT2.last_name}</p>
                {mode === 'step' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedT2(null)}
                    className="h-5 px-1 text-xs mt-1 text-red-600 hover:text-red-700"
                  >
                    Clear
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Not selected</p>
            )}
          </div>

          {/* T3 - Trainee */}
          {includeT3 && (
            <div className={cn(
              "p-3 rounded-md border-2 transition-all",
              selectedT3 ? "bg-amber-50 dark:bg-amber-950 border-amber-300" : "bg-white dark:bg-gray-800 border-gray-200 border-dashed"
            )}>
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-bold text-amber-600">TRAINEE (T3)</span>
              </div>
              {selectedT3 ? (
                <div>
                  <p className="font-bold text-sm">{selectedT3.initials}</p>
                  <p className="text-xs text-muted-foreground">{selectedT3.first_name} {selectedT3.last_name}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedT3(null)}
                    className="h-5 px-1 text-xs mt-1 text-red-600 hover:text-red-700"
                  >
                    Clear
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Optional</p>
              )}
            </div>
          )}
        </div>

        {/* Technician list */}
        <div className="flex-1 overflow-y-auto border rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm text-muted-foreground">Loading technicians...</p>
            </div>
          ) : filteredTechnicians.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm text-muted-foreground">No technicians found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredTechnicians.map((tech) => {
                const isSelectedT1 = selectedT1?.id === tech.id;
                const isSelectedT2 = selectedT2?.id === tech.id;
                const isSelectedT3 = selectedT3?.id === tech.id;
                const isSelected = isSelectedT1 || isSelectedT2 || isSelectedT3;

                return (
                  <div
                    key={tech.id}
                    className={cn(
                      "p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                      isSelected && "bg-blue-50 dark:bg-blue-950"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm">{tech.initials}</span>
                          {tech.vestas_level && (
                            <Badge variant="outline" className={cn("text-[10px] h-5", getVestasLevelColor(tech.vestas_level))}>
                              {tech.vestas_level}
                            </Badge>
                          )}
                          {tech.competency_level && (
                            <Badge variant="outline" className="text-[10px] h-5 bg-gray-100 text-gray-700">
                              {tech.competency_level}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {tech.first_name} {tech.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{tech.email}</p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedTechForHistory(tech);
                            setShowWorkHistory(true);
                          }}
                          className="h-8 px-2 gap-1 text-xs"
                          title="View work history"
                        >
                          <History className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant={isSelectedT1 ? "default" : "outline"}
                          onClick={() => setSelectedT1(isSelectedT1 ? null : tech)}
                          className={cn(
                            "h-8 text-xs",
                            isSelectedT1 && "bg-blue-600 hover:bg-blue-700"
                          )}
                          title={isSelectedT1 ? "Click to deselect T1" : "Set as T1"}
                        >
                          {isSelectedT1 ? "✓ T1" : "Set as T1"}
                        </Button>
                        <Button
                          size="sm"
                          variant={isSelectedT2 ? "default" : "outline"}
                          onClick={() => setSelectedT2(isSelectedT2 ? null : tech)}
                          className={cn(
                            "h-8 text-xs",
                            isSelectedT2 && "bg-purple-600 hover:bg-purple-700"
                          )}
                          title={isSelectedT2 ? "Click to deselect T2" : "Set as T2"}
                        >
                          {isSelectedT2 ? "✓ T2" : "Set as T2"}
                        </Button>
                        {includeT3 && (
                          <Button
                            size="sm"
                            variant={isSelectedT3 ? "default" : "outline"}
                            onClick={() => setSelectedT3(isSelectedT3 ? null : tech)}
                            className={cn(
                              "h-8 text-xs",
                              isSelectedT3 && "bg-amber-600 hover:bg-amber-700"
                            )}
                            title={isSelectedT3 ? "Click to deselect T3" : "Set as T3 (Trainee)"}
                          >
                            {isSelectedT3 ? "✓ T3" : "Set as T3"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={mode === 'global' && (!selectedT1 || !selectedT2)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Users className="h-4 w-4 mr-2" />
            Confirm Selection
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Work History Dialog */}
      <TechnicianWorkHistoryDialog
        open={showWorkHistory}
        onOpenChange={setShowWorkHistory}
        technician={selectedTechForHistory}
      />
    </Dialog>
  );
}
