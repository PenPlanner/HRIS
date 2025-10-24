"use client"

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo } from "react";
import { Shield, TrendingUp, Users, X, BarChart3, Table as TableIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface LotoRecord {
  INITIALER: string;
  NAMN: string;
  OMRÅDE: string;
  "Area Supervisor": string;
  "Team Leader": string;
  [key: string]: string | number | undefined;
}

export default function LotoPage() {
  const [lotoData, setLotoData] = useState<LotoRecord[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"chart" | "table">("chart");

  // Filters
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("all");
  const [selectedTeamLeader, setSelectedTeamLeader] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);

    // Fetch data from public folder
    fetch('/data/loto-data.json')
      .then(response => response.json())
      .then((data: LotoRecord[]) => {
        setLotoData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading LOTO data:', error);
        setLoading(false);
      });

    // Load filters from localStorage
    const savedArea = localStorage.getItem("loto_selectedArea");
    const savedSupervisor = localStorage.getItem("loto_selectedSupervisor");
    const savedTeamLeader = localStorage.getItem("loto_selectedTeamLeader");
    const savedMonth = localStorage.getItem("loto_selectedMonth");
    const savedView = localStorage.getItem("loto_view");

    if (savedArea) setSelectedArea(savedArea);
    if (savedSupervisor) setSelectedSupervisor(savedSupervisor);
    if (savedTeamLeader) setSelectedTeamLeader(savedTeamLeader);
    if (savedMonth) setSelectedMonth(savedMonth === "all" ? "all" : parseInt(savedMonth));
    if (savedView) setView(savedView as "chart" | "table");
  }, []);

  // Save filters to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("loto_selectedArea", selectedArea);
      localStorage.setItem("loto_selectedSupervisor", selectedSupervisor);
      localStorage.setItem("loto_selectedTeamLeader", selectedTeamLeader);
      localStorage.setItem("loto_selectedMonth", selectedMonth.toString());
      localStorage.setItem("loto_view", view);
    }
  }, [selectedArea, selectedSupervisor, selectedTeamLeader, selectedMonth, view, mounted]);

  // Get unique values for filters
  const areas = useMemo(() => {
    if (lotoData.length === 0) return [];
    return Array.from(new Set(lotoData.map(r => r.OMRÅDE).filter(Boolean))).sort();
  }, [lotoData]);

  const supervisors = useMemo(() => {
    if (lotoData.length === 0) return [];
    return Array.from(new Set(lotoData.map(r => r["Area Supervisor"]).filter(Boolean))).sort();
  }, [lotoData]);

  const teamLeaders = useMemo(() => {
    if (lotoData.length === 0) return [];
    return Array.from(new Set(lotoData.map(r => r["Team Leader"]).filter(Boolean))).sort();
  }, [lotoData]);

  // Filter data
  const filteredData = useMemo(() => {
    if (lotoData.length === 0) return [];

    return lotoData.filter(record => {
      if (selectedArea !== "all" && record.OMRÅDE !== selectedArea) return false;
      if (selectedSupervisor !== "all" && record["Area Supervisor"] !== selectedSupervisor) return false;
      if (selectedTeamLeader !== "all" && record["Team Leader"] !== selectedTeamLeader) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          record.INITIALER?.toLowerCase().includes(query) ||
          record.NAMN?.toLowerCase().includes(query) ||
          record.OMRÅDE?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [lotoData, selectedArea, selectedSupervisor, selectedTeamLeader, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    let totalLOTOs = 0;
    let activeTechCount = 0;

    filteredData.forEach(record => {
      let recordTotal = 0;
      let hasActivity = false;

      for (let week = 1; week <= 52; week++) {
        const weekKey = `V${week}`;
        const value = record[weekKey];
        if (typeof value === 'number') {
          if (selectedMonth === "all" || Math.ceil(week / 4.33) === selectedMonth) {
            recordTotal += value;
            if (value > 0) hasActivity = true;
          }
        }
      }

      totalLOTOs += recordTotal;
      if (hasActivity) activeTechCount++;
    });

    const avgLOTOsPerTech = activeTechCount > 0 ? (totalLOTOs / activeTechCount).toFixed(1) : "0";

    return { totalLOTOs, activeTechnicians: activeTechCount, avgLOTOsPerTech };
  }, [filteredData, selectedMonth]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const weeksToShow = selectedMonth === "all"
      ? Array.from({ length: 52 }, (_, i) => i + 1)
      : Array.from({ length: 4 }, (_, i) => {
          const startWeek = Math.floor((selectedMonth - 1) * 4.33) + 1;
          return startWeek + i;
        }).filter(week => week <= 52);

    return weeksToShow.map(week => {
      const weekKey = `V${week}`;
      let weekTotal = 0;

      filteredData.forEach(record => {
        const value = record[weekKey];
        if (typeof value === 'number') {
          weekTotal += value;
        }
      });

      return {
        week: `W${week}`,
        weekNumber: week,
        LOTOs: weekTotal,
      };
    });
  }, [filteredData, selectedMonth]);

  const resetFilters = () => {
    setSelectedArea("all");
    setSelectedSupervisor("all");
    setSelectedTeamLeader("all");
    setSelectedMonth("all");
    setSearchQuery("");
  };

  const hasActiveFilters = selectedArea !== "all" || selectedSupervisor !== "all" ||
                           selectedTeamLeader !== "all" || selectedMonth !== "all" || searchQuery !== "";

  if (!mounted || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading LOTO data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (lotoData.length === 0) {
    return (
      <MainLayout>
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4">LOTO Management</h1>
          <Card>
            <CardContent className="pt-6">
              <p className="text-red-500">No data loaded. Please check the console for errors.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">LOTO Management</h1>
            <p className="mt-2 text-muted-foreground">
              Track Lockout/Tagout procedures performed by technicians
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === "chart" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("chart")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Chart
            </Button>
            <Button
              variant={view === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("table")}
            >
              <TableIcon className="mr-2 h-4 w-4" />
              Table
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total LOTOs</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLOTOs}</div>
              <p className="text-xs text-muted-foreground">
                {selectedMonth === "all" ? "All year" : `Month ${selectedMonth}`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Technicians</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeTechnicians}</div>
              <p className="text-xs text-muted-foreground">With LOTO records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average per Tech</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgLOTOsPerTech}</div>
              <p className="text-xs text-muted-foreground">LOTOs per technician</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Filtered Records</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredData.length}</div>
              <p className="text-xs text-muted-foreground">Of {lotoData.length} total</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search */}
              <div>
                <label className="text-sm font-medium mb-2 block">Search Technician</label>
                <Input
                  placeholder="Search by name or initials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>

              {hasActiveFilters && (
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={resetFilters} className="gap-2">
                    <X className="h-4 w-4" />
                    Reset Filters
                  </Button>
                </div>
              )}

              {/* Filters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Area</label>
                  <Select value={selectedArea} onValueChange={setSelectedArea}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Areas</SelectItem>
                      {areas.map((area) => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Supervisor</label>
                  <Select value={selectedSupervisor} onValueChange={setSelectedSupervisor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Supervisors</SelectItem>
                      {supervisors.map((supervisor) => (
                        <SelectItem key={supervisor} value={supervisor}>{supervisor}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Team Leader</label>
                  <Select value={selectedTeamLeader} onValueChange={setSelectedTeamLeader}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Team Leaders</SelectItem>
                      {teamLeaders.map((leader) => (
                        <SelectItem key={leader} value={leader}>{leader}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Month</label>
                  <Select value={selectedMonth.toString()} onValueChange={(val) => setSelectedMonth(val === "all" ? "all" : parseInt(val))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Year</SelectItem>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <SelectItem key={month} value={month.toString()}>Month {month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {view === "chart" ? (
          <Card>
            <CardHeader>
              <CardTitle>LOTOs by Week</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 || chartData.every(d => d.LOTOs === 0) ? (
                <div className="text-center py-12">
                  <p className="text-lg font-medium mb-2">No LOTO data available</p>
                  <p className="text-muted-foreground">No LOTO procedures recorded for the selected filters</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="LOTOs" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>LOTO Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredData.slice(0, 50).map((record, idx) => {
                  let total = 0;
                  for (let week = 1; week <= 52; week++) {
                    const value = record[`V${week}`];
                    if (typeof value === 'number') total += value;
                  }

                  if (total === 0) return null;

                  return (
                    <div key={idx} className="p-3 border rounded flex items-center justify-between">
                      <div>
                        <p className="font-medium">{record.NAMN}</p>
                        <p className="text-sm text-muted-foreground">{record.INITIALER} • {record.OMRÅDE}</p>
                      </div>
                      <Badge>{total} LOTOs</Badge>
                    </div>
                  );
                })}
              </div>
              {filteredData.length > 50 && (
                <p className="text-sm text-muted-foreground mt-4">Showing first 50 of {filteredData.length} records</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
