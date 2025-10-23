"use client"

import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Plus, Car, Users, X, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { ALL_VEHICLES, TEAMS, Vehicle } from "@/lib/mock-data";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load from centralized data source
    setVehicles(ALL_VEHICLES);

    // Load selected team from localStorage (vehicles-specific)
    const savedTeamId = localStorage.getItem("vehicles_selectedTeamId");
    if (savedTeamId) {
      setSelectedTeam(savedTeamId);
    }
  }, []);

  // Save selected team to localStorage when it changes (vehicles-specific)
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("vehicles_selectedTeamId", selectedTeam);
    }
  }, [selectedTeam, mounted]);

  // Filter vehicles by selected team
  const filteredVehicles = selectedTeam === "all"
    ? vehicles
    : vehicles.filter(v => v.team_id === selectedTeam);

  // Group vehicles by team for "all" view
  const vehiclesByTeam = TEAMS.reduce((acc, team) => {
    acc[team.name] = vehicles.filter(v => v.team_id === team.id);
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

  if (!mounted) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading vehicles...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

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
                <Badge variant="outline" className="text-lg px-3 py-1">{TEAMS.length}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Filter with Reset Button */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedTeam === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTeam("all")}
            >
              All Teams
            </Button>
            {TEAMS.map((team) => (
              <Button
                key={team.id}
                variant={selectedTeam === team.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTeam(team.id)}
                style={
                  selectedTeam === team.id
                    ? { backgroundColor: team.color, borderColor: team.color }
                    : {}
                }
              >
                {team.name}
              </Button>
            ))}
          </div>

          {/* Reset Filter Button */}
          {selectedTeam !== "all" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTeam("all")}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Reset Filter
            </Button>
          )}
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
            <div className="mt-3 flex items-start gap-2">
              <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex flex-col gap-2">
                {/* Sort so primary driver comes first */}
                {[...vehicle.assigned_technicians]
                  .sort((a, b) => {
                    if (a === vehicle.primary_driver) return -1;
                    if (b === vehicle.primary_driver) return 1;
                    return 0;
                  })
                  .map((tech) => {
                    const isDriver = tech === vehicle.primary_driver;
                    return (
                      <div key={tech} className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${isDriver ? 'bg-green-500/10 text-green-600 border-green-500/20 font-mono' : 'font-mono'}`}
                        >
                          {tech}
                        </Badge>
                        {isDriver && (
                          <>
                            <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                              Driver
                            </Badge>
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          </>
                        )}
                      </div>
                    );
                  })}
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
