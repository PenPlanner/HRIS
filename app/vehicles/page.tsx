"use client"

import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Plus, Car, Users } from "lucide-react";
import Link from "next/link";

export type Vehicle = {
  id: string;
  registration: string;
  team_id: string;
  team_name: string;
  team_color: string;
  make?: string;
  model?: string;
  year?: number;
  assigned_technicians?: string[];
};

const mockVehicles: Vehicle[] = [
  {
    id: "1",
    registration: "ABC123",
    team_id: "1",
    team_name: "Travel S",
    team_color: "#06b6d4",
    make: "Mercedes",
    model: "Sprinter",
    year: 2022,
    assigned_technicians: ["MRADR", "CLEGR"],
  },
  {
    id: "2",
    registration: "DEF456",
    team_id: "1",
    team_name: "Travel S",
    team_color: "#06b6d4",
    make: "Volkswagen",
    model: "Crafter",
    year: 2021,
    assigned_technicians: [],
  },
  {
    id: "3",
    registration: "GHI789",
    team_id: "2",
    team_name: "Travel U",
    team_color: "#0ea5e9",
    make: "Mercedes",
    model: "Sprinter",
    year: 2023,
    assigned_technicians: ["ANLRN"],
  },
  {
    id: "4",
    registration: "JKL012",
    team_id: "3",
    team_name: "South 1",
    team_color: "#ef4444",
    make: "Ford",
    model: "Transit",
    year: 2020,
    assigned_technicians: [],
  },
];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [selectedTeam, setSelectedTeam] = useState<string>("all");

  useEffect(() => {
    const saved = localStorage.getItem("vehicles");
    if (saved) {
      setVehicles(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("vehicles", JSON.stringify(vehicles));
  }, [vehicles]);

  // Group by team
  const teams = Array.from(new Set(vehicles.map(v => v.team_name)));
  const filteredVehicles = selectedTeam === "all"
    ? vehicles
    : vehicles.filter(v => v.team_name === selectedTeam);

  const vehiclesByTeam = teams.reduce((acc, team) => {
    acc[team] = vehicles.filter(v => v.team_name === team);
    return acc;
  }, {} as Record<string, Vehicle[]>);

  // Calculate statistics
  const totalVehicles = vehicles.length;
  const totalTechnicians = vehicles.reduce((sum, vehicle) => {
    return sum + (vehicle.assigned_technicians?.length || 0);
  }, 0);

  const getTeamStats = (teamVehicles: Vehicle[]) => {
    const vehicleCount = teamVehicles.length;
    const technicianCount = teamVehicles.reduce((sum, vehicle) => {
      return sum + (vehicle.assigned_technicians?.length || 0);
    }, 0);
    return { vehicleCount, technicianCount };
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Service Vehicles</h1>
            <p className="mt-2 text-muted-foreground">
              Fleet management and assignments
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Vehicle
          </Button>
        </div>

        {/* Overall Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Vehicles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                <p className="text-3xl font-bold">{totalVehicles}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Assigned Technicians</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <p className="text-3xl font-bold">{totalTechnicians}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-lg px-3 py-1">{teams.length}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedTeam === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTeam("all")}
          >
            All Teams
          </Button>
          {teams.map((team) => {
            const teamColor = vehicles.find(v => v.team_name === team)?.team_color;
            return (
              <Button
                key={team}
                variant={selectedTeam === team ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTeam(team)}
                style={
                  selectedTeam === team
                    ? { backgroundColor: teamColor, borderColor: teamColor }
                    : {}
                }
              >
                {team}
              </Button>
            );
          })}
        </div>

        {/* Grouped by Team */}
        {selectedTeam === "all" ? (
          <div className="space-y-8">
            {Object.entries(vehiclesByTeam).map(([team, teamVehicles]) => {
              const teamColor = teamVehicles[0]?.team_color;
              const teamStats = getTeamStats(teamVehicles);
              return (
                <div key={team}>
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="h-1 w-12 rounded"
                        style={{ backgroundColor: teamColor }}
                      />
                      <h2 className="text-xl font-semibold">{team}</h2>
                    </div>
                    <div className="flex items-center gap-4 ml-16">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{teamStats.vehicleCount} vehicles</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{teamStats.technicianCount} technicians</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {teamVehicles.map((vehicle) => (
                      <VehicleCard key={vehicle.id} vehicle={vehicle} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            {/* Filtered Team Statistics */}
            {selectedTeam !== "all" && filteredVehicles.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Car className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{getTeamStats(filteredVehicles).vehicleCount}</p>
                        <p className="text-sm text-muted-foreground">Vehicles</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{getTeamStats(filteredVehicles).technicianCount}</p>
                        <p className="text-sm text-muted-foreground">Technicians</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredVehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          </>
        )}

        {filteredVehicles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No vehicles found</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Link
      href={`/vehicles/${vehicle.id}`}
      className="rounded-lg border bg-card hover:bg-accent transition-colors"
      style={{ borderLeft: `4px solid ${vehicle.team_color}` }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{vehicle.registration}</CardTitle>
          </div>
          <Badge
            variant="outline"
            style={{
              borderColor: vehicle.team_color,
              color: vehicle.team_color,
            }}
          >
            {vehicle.team_name}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {vehicle.make && vehicle.model && (
            <p className="font-medium">
              {vehicle.make} {vehicle.model}
            </p>
          )}
          {vehicle.year && (
            <p className="text-muted-foreground">Year: {vehicle.year}</p>
          )}
          {vehicle.assigned_technicians && vehicle.assigned_technicians.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1 flex-wrap">
                {vehicle.assigned_technicians.map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {(!vehicle.assigned_technicians || vehicle.assigned_technicians.length === 0) && (
            <p className="text-xs text-muted-foreground italic">No assigned technicians</p>
          )}
        </div>
      </CardContent>
    </Link>
  );
}
