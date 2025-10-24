"use client"

import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Plus, Search, Car, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ALL_TECHNICIANS, ALL_VEHICLES, TEAMS, VestasLevel, Technician } from "@/lib/mock-data";

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

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("all");
  const [selectedVestasLevel, setSelectedVestasLevel] = useState<VestasLevel | "all">("all");
  const [selectedCompetencyLevel, setSelectedCompetencyLevel] = useState<number | "all">("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load from centralized data source
    setTechnicians(ALL_TECHNICIANS);

    // Load filters from localStorage (technicians-specific)
    const savedTeamId = localStorage.getItem("technicians_selectedTeamId");
    const savedVestasLevel = localStorage.getItem("technicians_vestasLevel");
    const savedCompetencyLevel = localStorage.getItem("technicians_competencyLevel");

    if (savedTeamId) {
      setSelectedTeamId(savedTeamId);
    }
    if (savedVestasLevel) {
      setSelectedVestasLevel(savedVestasLevel as VestasLevel | "all");
    }
    if (savedCompetencyLevel) {
      const level = savedCompetencyLevel === "all" ? "all" : parseInt(savedCompetencyLevel);
      setSelectedCompetencyLevel(level);
    }
  }, []);

  // Save filters to localStorage when they change (technicians-specific)
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("technicians_selectedTeamId", selectedTeamId);
      localStorage.setItem("technicians_vestasLevel", selectedVestasLevel);
      localStorage.setItem("technicians_competencyLevel", selectedCompetencyLevel.toString());
    }
  }, [selectedTeamId, selectedVestasLevel, selectedCompetencyLevel, mounted]);

  // Filter by selected team
  const teamFilteredTechnicians = selectedTeamId === "all"
    ? technicians
    : technicians.filter(tech => tech.team_id === selectedTeamId);

  // Filter by Vestas level
  const vestasFilteredTechnicians = selectedVestasLevel === "all"
    ? teamFilteredTechnicians
    : teamFilteredTechnicians.filter(tech => tech.vestas_level === selectedVestasLevel);

  // Filter by Competency level
  const competencyFilteredTechnicians = selectedCompetencyLevel === "all"
    ? vestasFilteredTechnicians
    : vestasFilteredTechnicians.filter(tech => tech.competency_level === selectedCompetencyLevel);

  // Then filter by search query (enhanced to search Vestas levels and Competency levels)
  const filteredTechnicians = competencyFilteredTechnicians.filter((tech) => {
    const query = searchQuery.toLowerCase().trim();

    // Search by basic fields
    const basicMatch =
      tech.initials.toLowerCase().includes(query) ||
      tech.first_name.toLowerCase().includes(query) ||
      tech.last_name.toLowerCase().includes(query) ||
      tech.team_name.toLowerCase().includes(query);

    // Search by Vestas level (e.g., "A", "B", "C", "D", "field trainer")
    const vestasMatch = tech.vestas_level?.toLowerCase().includes(query);

    // Search by Competency level (e.g., "L4", "4", "level 4")
    const competencyMatch = tech.competency_level && (
      `l${tech.competency_level}`.toLowerCase().includes(query) ||
      `level ${tech.competency_level}`.toLowerCase().includes(query) ||
      tech.competency_level.toString() === query
    );

    return basicMatch || vestasMatch || competencyMatch;
  });

  const selectedTeam = TEAMS.find(t => t.id === selectedTeamId);

  // Check if any filters are active (not default)
  const hasActiveFilters =
    selectedTeamId !== "all" ||
    selectedVestasLevel !== "all" ||
    selectedCompetencyLevel !== "all" ||
    searchQuery !== "";

  // Reset all filters to default
  const resetAllFilters = () => {
    setSelectedTeamId("all");
    setSelectedVestasLevel("all");
    setSelectedCompetencyLevel("all");
    setSearchQuery("");
  };

  const getLevelColor = (level?: number) => {
    if (!level) return "bg-gray-500";
    if (level === 5) return "bg-green-500";
    if (level === 4) return "bg-blue-500";
    if (level === 3) return "bg-yellow-500";
    if (level === 2) return "bg-orange-500";
    return "bg-red-500";
  };

  if (!mounted) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading technicians...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Technicians</h1>
            <p className="mt-2 text-muted-foreground">
              {selectedTeamId === "all" ? "All Teams" : selectedTeam?.name} - {filteredTechnicians.length} technicians
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Technician
          </Button>
        </div>

        {/* Team Selector with Reset Button */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Select Team:</span>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={selectedTeamId === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTeamId("all")}
              >
                All Teams
              </Button>
              {TEAMS.map((team) => (
                <Button
                  key={team.id}
                  variant={selectedTeamId === team.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTeamId(team.id)}
                  style={
                    selectedTeamId === team.id
                      ? { backgroundColor: team.color, borderColor: team.color }
                      : {}
                  }
                >
                  {team.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetAllFilters}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Reset All Filters
            </Button>
          )}
        </div>

        {/* Filter Section */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Vestas Level Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Vestas Level:</span>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={selectedVestasLevel === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedVestasLevel("all")}
              >
                All Levels
              </Button>
              {(["D", "C", "B", "A", "Field Trainer"] as const).map((level) => {
                const colors = getVestasLevelColor(level);
                return (
                  <Button
                    key={level}
                    variant={selectedVestasLevel === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedVestasLevel(level)}
                    style={
                      selectedVestasLevel === level
                        ? { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }
                        : {}
                    }
                  >
                    {level}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Competency Level Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Competency:</span>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={selectedCompetencyLevel === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCompetencyLevel("all")}
              >
                All Levels
              </Button>
              {[1, 2, 3, 4, 5].map((level) => (
                <Button
                  key={level}
                  variant={selectedCompetencyLevel === level ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCompetencyLevel(level)}
                  className={selectedCompetencyLevel === level ? getLevelColor(level) : ""}
                >
                  L{level}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by initials, name, team, level (e.g., 'L4', 'B', 'Field Trainer')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTechnicians.map((tech) => {
            // Find assigned vehicle for this technician
            const assignedVehicle = ALL_VEHICLES.find(vehicle =>
              vehicle.assigned_technicians.includes(tech.initials)
            );

            return (
              <Link
                key={tech.id}
                href={`/technicians/${tech.id}`}
                className="rounded-lg border bg-card p-4 hover:bg-accent transition-colors"
                style={{ borderLeft: `4px solid ${tech.team_color}` }}
              >
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback
                      style={{ backgroundColor: tech.team_color + "20" }}
                      className="text-sm font-bold"
                    >
                      {tech.initials.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">
                        {tech.first_name} {tech.last_name}
                      </h3>
                    </div>
                    <p className="text-sm font-mono text-muted-foreground">
                      {tech.initials}
                    </p>
                    {assignedVehicle && (
                      <div className="flex items-center gap-1 mt-1">
                        <Car className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs font-mono text-muted-foreground">
                          {assignedVehicle.registration}
                        </p>
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: tech.team_color,
                          color: tech.team_color,
                        }}
                      >
                        {tech.team_name}
                      </Badge>
                      {tech.vestas_level && (
                        <Badge
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
                          className={`${getLevelColor(tech.competency_level)} text-white`}
                        >
                          L{tech.competency_level}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredTechnicians.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No technicians found</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
