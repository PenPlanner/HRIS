"use client"

import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { TeamDialog } from "@/components/admin/team-dialog";

export type Team = {
  id: string;
  name: string;
  color: string;
  supervisor_initials: string;
  dispatcher_initials: string;
  organization: string;
};

const initialTeams: Team[] = [
  { id: "1", name: "Travel S", color: "#06b6d4", supervisor_initials: "MRADR", dispatcher_initials: "TEORY", organization: "Travel" },
  { id: "2", name: "Travel U", color: "#0ea5e9", supervisor_initials: "ALMER", dispatcher_initials: "CLHAL", organization: "Travel" },
  { id: "3", name: "South 1", color: "#ef4444", supervisor_initials: "RIHEI", dispatcher_initials: "PENAF", organization: "South" },
  { id: "4", name: "South 2", color: "#f97316", supervisor_initials: "MASBR", dispatcher_initials: "PNPEO", organization: "South" },
  { id: "5", name: "North 1", color: "#a855f7", supervisor_initials: "MAFAH", dispatcher_initials: "CAMTE", organization: "North" },
  { id: "6", name: "North 2", color: "#d946ef", supervisor_initials: "DAEJE", dispatcher_initials: "JESST", organization: "North" },
];

export default function TeamsAdminPage() {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("teams");
    if (saved) {
      setTeams(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage whenever teams change
  useEffect(() => {
    localStorage.setItem("teams", JSON.stringify(teams));
  }, [teams]);

  const handleCreate = (team: Omit<Team, "id">) => {
    const newTeam: Team = {
      ...team,
      id: Date.now().toString(),
    };
    setTeams([...teams, newTeam]);
    setIsDialogOpen(false);
  };

  const handleUpdate = (updatedTeam: Team) => {
    setTeams(teams.map((t) => (t.id === updatedTeam.id ? updatedTeam : t)));
    setEditingTeam(null);
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this team?")) {
      setTeams(teams.filter((t) => t.id !== id));
    }
  };

  const openCreateDialog = () => {
    setEditingTeam(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (team: Team) => {
    setEditingTeam(team);
    setIsDialogOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Teams</h1>
            <p className="mt-2 text-muted-foreground">
              Manage teams, colors, and assignments
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Team
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="rounded-lg border bg-card p-4 shadow-sm"
              style={{ borderLeft: `4px solid ${team.color}` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{team.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {team.organization}
                  </p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Supervisor:</span>{" "}
                      {team.supervisor_initials}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Dispatcher:</span>{" "}
                      {team.dispatcher_initials}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className="h-6 w-12 rounded border"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {team.color}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(team)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(team.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <TeamDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        team={editingTeam}
        onSave={editingTeam ? handleUpdate : handleCreate}
      />
    </MainLayout>
  );
}
