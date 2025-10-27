"use client"

import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useMemo } from "react";
import { Plus, Car, Users, X, CheckCircle2, List, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { ALL_VEHICLES, TEAMS, Vehicle } from "@/lib/mock-data";

interface FleetVehicle {
  "Customer Name": string;
  "Contract Number (Local)": number;
  "Cost Centre": number;
  "Employee Number": number;
  "Full Name (Driver)": string;
  "Brand": string;
  "Model Variant (local)": string;
  "Fuel Type": string;
  "License Plate": string;
  "Order Date": number;
  "Delivery Date": number;
  "Start Date": number;
  "End Date": number;
  "Duration": number;
  "Total Mileage (km)": number;
  "Finance Rental (Avg.)": string;
  "Non-Finance Rental incl. Insurance (Avg.)": number;
  "WC-Reg no_manualy added data": string;
  "Notes_ manually added data": string;
  "MOVES": string;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fleetData, setFleetData] = useState<FleetVehicle[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<"assignments" | "fleet">("assignments");
  const [loading, setLoading] = useState(false);

  // Fleet filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedFuelType, setSelectedFuelType] = useState<string>("all");

  useEffect(() => {
    setMounted(true);
    setVehicles(ALL_VEHICLES);

    // Load saved view
    const savedView = localStorage.getItem("vehicles_view");
    if (savedView) setView(savedView as "assignments" | "fleet");

    const savedTeamId = localStorage.getItem("vehicles_selectedTeamId");
    if (savedTeamId) setSelectedTeam(savedTeamId);

    // Load fleet data if fleet view
    if (savedView === "fleet") {
      loadFleetData();
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("vehicles_selectedTeamId", selectedTeam);
      localStorage.setItem("vehicles_view", view);
    }
  }, [selectedTeam, view, mounted]);

  const loadFleetData = () => {
    setLoading(true);
    fetch('/data/fleet-data.json')
      .then(response => response.json())
      .then((data: FleetVehicle[]) => {
        setFleetData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading fleet data:', error);
        setLoading(false);
      });
  };

  const handleViewChange = (newView: "assignments" | "fleet") => {
    setView(newView);
    if (newView === "fleet" && fleetData.length === 0) {
      loadFleetData();
    }
  };

  // Fleet filters
  const brands = useMemo(() => {
    if (fleetData.length === 0) return [];
    return Array.from(new Set(fleetData.map(v => v.Brand).filter(Boolean))).sort();
  }, [fleetData]);

  const fuelTypes = useMemo(() => {
    if (fleetData.length === 0) return [];
    return Array.from(new Set(fleetData.map(v => v["Fuel Type"]).filter(Boolean))).sort();
  }, [fleetData]);

  const filteredFleetData = useMemo(() => {
    if (fleetData.length === 0) return [];

    return fleetData.filter(vehicle => {
      if (selectedBrand !== "all" && vehicle.Brand !== selectedBrand) return false;
      if (selectedFuelType !== "all" && vehicle["Fuel Type"] !== selectedFuelType) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          vehicle["License Plate"]?.toLowerCase().includes(query) ||
          vehicle.Brand?.toLowerCase().includes(query) ||
          vehicle["Model Variant (local)"]?.toLowerCase().includes(query) ||
          vehicle["Full Name (Driver)"]?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [fleetData, selectedBrand, selectedFuelType, searchQuery]);

  const resetFleetFilters = () => {
    setSearchQuery("");
    setSelectedBrand("all");
    setSelectedFuelType("all");
  };

  const hasActiveFleetFilters = searchQuery !== "" || selectedBrand !== "all" || selectedFuelType !== "all";

  // Assignments view logic
  const filteredVehicles = selectedTeam === "all"
    ? vehicles
    : vehicles.filter(v => v.team_id === selectedTeam);

  const vehiclesByTeam = TEAMS.reduce((acc, team) => {
    acc[team.name] = vehicles.filter(v => v.team_id === team.id);
    return acc;
  }, {} as Record<string, Vehicle[]>);

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
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto shadow-lg"></div>
            <p className="mt-6 text-lg font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Loading vehicles...</p>
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Service Vehicles</h1>
            <p className="mt-2 text-muted-foreground font-medium">
              Fleet management and assignments
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === "fleet" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange("fleet")}
              className={view === "fleet" ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md" : "hover:border-emerald-300"}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Fleet Status
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md">
              <Plus className="mr-2 h-4 w-4" />
              New Vehicle
            </Button>
          </div>
        </div>

        {view === "assignments" ? (
          <>
            {/* Overall Statistics */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="hover:shadow-lg hover:scale-[1.02] transition-all border-2 hover:border-emerald-300 dark:hover:border-emerald-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    Total Vehicles
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900 dark:to-emerald-800 flex items-center justify-center">
                      <Car className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{totalVehicles}</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg hover:scale-[1.02] transition-all border-2 hover:border-blue-300 dark:hover:border-blue-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    Total Assigned Technicians
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{totalTechnicians}</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg hover:scale-[1.02] transition-all border-2 hover:border-purple-300 dark:hover:border-purple-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Teams</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="text-2xl px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-md">{TEAMS.length}</Badge>
                </CardContent>
              </Card>
            </div>

            {/* Team Filter */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Button
                  variant={selectedTeam === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTeam("all")}
                  className={selectedTeam === "all" ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md" : "hover:border-blue-300"}
                >
                  All Teams
                </Button>
                {TEAMS.map((team) => (
                  <Button
                    key={team.id}
                    variant={selectedTeam === team.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTeam(team.id)}
                    className={selectedTeam === team.id ? "text-white shadow-md" : "hover:border-gray-400"}
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

              {selectedTeam !== "all" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTeam("all")}
                  className="gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:hover:bg-red-950"
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
                {selectedTeam !== "all" && filteredVehicles.length > 0 && (
                  <Card className="border-2 shadow-md">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900 dark:to-emerald-800 flex items-center justify-center">
                            <Car className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{getTeamStats(filteredVehicles).vehicleCount}</p>
                            <p className="text-sm text-muted-foreground font-medium">Vehicles</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{getTeamStats(filteredVehicles).technicianCount}</p>
                            <p className="text-sm text-muted-foreground font-medium">Technicians</p>
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
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mx-auto mb-4">
                  <Car className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg font-bold mb-2">No vehicles found</p>
                <p className="text-muted-foreground">Try adjusting your filters</p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Fleet Status View */}
            {loading ? (
              <div className="flex items-center justify-center min-h-[40vh]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto shadow-lg"></div>
                  <p className="mt-6 text-lg font-medium bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Loading fleet data...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Fleet Statistics */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="hover:shadow-lg hover:scale-[1.02] transition-all border-2 hover:border-emerald-300 dark:hover:border-emerald-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                        Total Fleet
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900 dark:to-emerald-800 flex items-center justify-center">
                          <Car className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{fleetData.length}</p>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-lg hover:scale-[1.02] transition-all border-2 hover:border-blue-300 dark:hover:border-blue-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Brands</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{brands.length}</p>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-lg hover:scale-[1.02] transition-all border-2 hover:border-purple-300 dark:hover:border-purple-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Fuel Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{fuelTypes.length}</p>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-lg hover:scale-[1.02] transition-all border-2 hover:border-amber-300 dark:hover:border-amber-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Filtered</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{filteredFleetData.length}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Filters */}
                <Card className="border-2 shadow-md">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Search</label>
                        <Input
                          placeholder="Search by license plate, brand, model, or driver..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="max-w-md border-2 focus:border-blue-400"
                        />
                      </div>

                      {hasActiveFleetFilters && (
                        <div className="flex justify-end">
                          <Button variant="outline" size="sm" onClick={resetFleetFilters} className="gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:hover:bg-red-950">
                            <X className="h-4 w-4" />
                            Reset Filters
                          </Button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Brand</label>
                          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Brands</SelectItem>
                              {brands.map((brand) => (
                                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">Fuel Type</label>
                          <Select value={selectedFuelType} onValueChange={setSelectedFuelType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Fuel Types</SelectItem>
                              {fuelTypes.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Fleet List */}
                <div className="space-y-3">
                  {filteredFleetData.map((vehicle, idx) => (
                    <Card key={idx} className="border-2 hover:border-emerald-300 hover:shadow-md transition-all">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Car className="h-5 w-5 text-primary" />
                              <h3 className="text-lg font-bold">{vehicle["License Plate"]}</h3>
                              <Badge variant="outline">{vehicle.Brand}</Badge>
                              <Badge variant="secondary">{vehicle["Fuel Type"]}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {vehicle["Model Variant (local)"]}
                            </p>
                            {vehicle["Full Name (Driver)"] && (
                              <div className="flex items-center gap-2 text-sm">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{vehicle["Full Name (Driver)"]}</span>
                              </div>
                            )}
                            {vehicle["Notes_ manually added data"] && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Note: {vehicle["Notes_ manually added data"]}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-sm space-y-1">
                            <p className="text-muted-foreground">Duration: {vehicle.Duration} months</p>
                            <p className="text-muted-foreground">Mileage: {vehicle["Total Mileage (km)"]} km</p>
                            {vehicle["Cost Centre"] && (
                              <p className="text-xs text-muted-foreground">CC: {vehicle["Cost Centre"]}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredFleetData.length === 0 && fleetData.length > 0 && (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mx-auto mb-4">
                      <Car className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-bold mb-2">No vehicles match the selected filters</p>
                    <p className="text-muted-foreground">Try adjusting your search criteria</p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Link
      href={`/vehicles/${vehicle.id}`}
      className="rounded-lg border-2 bg-card hover:shadow-lg hover:scale-[1.02] transition-all hover:border-emerald-300 dark:hover:border-emerald-700"
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
