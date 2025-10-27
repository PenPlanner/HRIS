"use client"

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Car,
  GraduationCap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  Award,
  UserCheck,
  CalendarDays,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  X,
  Zap,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import Link from "next/link";
import {
  TEAMS,
  getTechniciansByTeam,
  getVehiclesByTeam,
  calculateVehicleBalance,
  getVestasLevelDistribution,
  getCompetencyLevelDistribution,
  getAverageCompetencyLevel,
  getRecentAssessments,
  VestasLevel,
} from "@/lib/mock-data";

// Vestas Level Colors
const getVestasLevelColor = (level: VestasLevel): string => {
  switch (level) {
    case 'D': return '#9ca3af';
    case 'C': return '#3b82f6';
    case 'B': return '#10b981';
    case 'A': return '#8b5cf6';
    case 'Field Trainer': return '#f59e0b';
    default: return '#9ca3af';
  }
};

export default function Home() {
  // Default to "all" to show all teams
  const [selectedTeamId, setSelectedTeamId] = useState<string>("all");
  const [mounted, setMounted] = useState(false);

  // Only render after mounting on client to avoid hydration errors with random data
  useEffect(() => {
    setMounted(true);
    // Load selected team from localStorage (dashboard-specific)
    const savedTeamId = localStorage.getItem("dashboard_selectedTeamId");
    if (savedTeamId) {
      setSelectedTeamId(savedTeamId);
    }
  }, []);

  // Save selected team to localStorage when it changes (dashboard-specific)
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("dashboard_selectedTeamId", selectedTeamId);
    }
  }, [selectedTeamId, mounted]);

  if (!mounted) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto shadow-lg"></div>
            <p className="mt-6 text-lg font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Loading dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const selectedTeam = TEAMS.find(t => t.id === selectedTeamId);
  const technicians = getTechniciansByTeam(selectedTeamId);
  const vehicles = getVehiclesByTeam(selectedTeamId);
  const vehicleBalance = calculateVehicleBalance(selectedTeamId);
  const vestasDistribution = getVestasLevelDistribution(selectedTeamId);
  const competencyDistribution = getCompetencyLevelDistribution(selectedTeamId);
  const avgCompetencyLevel = getAverageCompetencyLevel(selectedTeamId);
  const recentAssessments = getRecentAssessments(selectedTeamId, 3);

  // Statistics
  const stats = {
    totalTechnicians: technicians.length,
    technicianChange: 2,
    technicianChangePercent: 1.7,
    serviceVehicles: vehicles.length,
    unassignedVehicles: vehicles.filter(v => v.assigned_technicians.length === 0).length,
    trainingNeeds: 8, // Mock
    highPriorityTraining: 3, // Mock
    avgCompetencyLevel,
    levelImprovement: 0.2,
  };

  // Vestas level distribution for display
  const vestasLevelData = Object.entries(vestasDistribution).map(([level, count]) => ({
    level: level as VestasLevel,
    count,
    color: getVestasLevelColor(level as VestasLevel)
  }));

  // Team distribution (mock - could be calculated from all teams)
  const teamDistribution = TEAMS.map(team => ({
    name: team.name,
    value: getTechniciansByTeam(team.id).length,
    color: team.color,
  }));

  // Upcoming training (mock)
  const upcomingTraining = [
    { course: "HV Electrical Course", technicians: 5, priority: "High", date: "Q1 2026" },
    { course: "EN50110 Training", technicians: 3, priority: "Medium", date: "Q1 2026" },
    { course: "Add-on C-Level HV", technicians: 2, priority: "Medium", date: "Q2 2026" },
    { course: "Electrical Safety", technicians: 4, priority: "High", date: "Q1 2026" },
  ];

  // Generate alerts based on vehicle balance
  const alerts = [];

  // Vehicle balance alert
  if (vehicleBalance.status === 'critical') {
    if (vehicleBalance.balance < 0) {
      alerts.push({
        type: "warning" as const,
        title: `Critical: ${Math.abs(vehicleBalance.balance)} vans below optimal`,
        description: `${vehicleBalance.technicianCount} technicians with only ${vehicleBalance.vehicleCount} vans (need ${vehicleBalance.idealVehicleCount})`,
        action: "Review Vehicles",
        link: "/vehicles"
      });
    } else {
      alerts.push({
        type: "info" as const,
        title: `${vehicleBalance.balance} excess vehicles`,
        description: `${vehicleBalance.vehicleCount} vans for ${vehicleBalance.technicianCount} technicians (optimal: ${vehicleBalance.idealVehicleCount})`,
        action: "Review Allocation",
        link: "/vehicles"
      });
    }
  } else if (vehicleBalance.status === 'warning') {
    if (vehicleBalance.balance < 0) {
      alerts.push({
        type: "warning" as const,
        title: `${Math.abs(vehicleBalance.balance)} vans below optimal`,
        description: `Consider adding vehicles or sharing with other teams`,
        action: "View Vehicles",
        link: "/vehicles"
      });
    }
  }

  // Other standard alerts
  alerts.push(
    {
      type: "warning" as const,
      title: "3 competency matrices need updating",
      description: "Assessments older than 12 months",
      action: "Review Assessments",
      link: "/technicians"
    },
    {
      type: "success" as const,
      title: "6 technicians completed training this month",
      description: "Update their competency levels",
      action: "View Details",
      link: "/training"
    }
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header with Team Selector */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Dashboard</h1>
            <p className="mt-2 text-muted-foreground font-medium">
              {selectedTeamId === "all" ? "All Teams" : selectedTeam?.name} - Real-time overview
            </p>
          </div>

          {/* Team Selector with Reset Button */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Select Team:</span>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant={selectedTeamId === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTeamId("all")}
                  className={selectedTeamId === "all" ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md" : "hover:border-blue-300"}
                >
                  All Teams
                </Button>
                {TEAMS.map((team) => (
                  <Button
                    key={team.id}
                    variant={selectedTeamId === team.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTeamId(team.id)}
                    className={selectedTeamId === team.id ? "text-white shadow-md" : "hover:border-gray-400"}
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

            {/* Reset Filter Button */}
            {selectedTeamId !== "all" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTeamId("all")}
                className="gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:hover:bg-red-950"
              >
                <X className="h-4 w-4" />
                Reset Filter
              </Button>
            )}
          </div>
        </div>

        {/* Vehicle Balance Alert (if critical) */}
        {vehicleBalance.status === 'critical' && (
          <Card className="border-2 border-yellow-500 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-yellow-900 dark:text-yellow-100">
                    Vehicle Allocation Warning
                  </h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                    {vehicleBalance.balance < 0 ? (
                      <>
                        Team has <strong>{vehicleBalance.technicianCount} technicians</strong> but only{" "}
                        <strong>{vehicleBalance.vehicleCount} vehicles</strong>.{" "}
                        Optimal ratio is 2 technicians per van ({vehicleBalance.idealVehicleCount} vans needed).{" "}
                        <strong>{Math.abs(vehicleBalance.balance)} vehicles short</strong> - team may need to borrow vehicles for operations.
                      </>
                    ) : (
                      <>
                        Team has <strong>{vehicleBalance.vehicleCount} vehicles</strong> for{" "}
                        <strong>{vehicleBalance.technicianCount} technicians</strong>.{" "}
                        Optimal is {vehicleBalance.idealVehicleCount} vehicles.{" "}
                        <strong>{vehicleBalance.balance} excess vehicles</strong>.
                      </>
                    )}
                  </p>
                </div>
                <Link href="/vehicles">
                  <Button variant="outline" size="sm" className="bg-white hover:bg-yellow-100 border-yellow-400 hover:border-yellow-500 text-yellow-900 shadow-md flex-shrink-0">
                    Review Vehicles
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats - Clickable */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/technicians">
            <Card className="hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer border-2 hover:border-blue-300 dark:hover:border-blue-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Team Technicians
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{stats.totalTechnicians}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <span>Active in {selectedTeamId === "all" ? "all teams" : selectedTeam?.name}</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/vehicles">
            <Card className={`hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer border-2 ${
              vehicleBalance.status === 'critical' ? 'border-yellow-500 hover:border-yellow-600' : 'hover:border-emerald-300 dark:hover:border-emerald-700'
            }`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Service Vehicles
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900 dark:to-emerald-800 flex items-center justify-center">
                  <Car className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{stats.serviceVehicles}</div>
                <div className="flex items-center gap-1 text-xs mt-1">
                  {vehicleBalance.status === 'perfect' && (
                    <span className="text-green-600 font-medium">Perfect ratio (2:1)</span>
                  )}
                  {vehicleBalance.status === 'good' && (
                    <span className="text-green-600 font-medium">Good ratio</span>
                  )}
                  {vehicleBalance.status === 'warning' && (
                    <span className="text-yellow-600 font-medium">
                      {vehicleBalance.balance < 0 ? `${Math.abs(vehicleBalance.balance)} below optimal` : 'Slight surplus'}
                    </span>
                  )}
                  {vehicleBalance.status === 'critical' && (
                    <span className="text-red-600 font-medium">
                      {vehicleBalance.balance < 0 ? `${Math.abs(vehicleBalance.balance)} vans short!` : `${vehicleBalance.balance} excess`}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/training">
            <Card className="hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer border-2 hover:border-amber-300 dark:hover:border-amber-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Training Needs
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900 dark:to-amber-800 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{stats.trainingNeeds}</div>
                <div className="flex items-center gap-1 text-xs text-orange-600 mt-1 font-medium">
                  <AlertCircle className="h-3 w-3" />
                  <span>{stats.highPriorityTraining} high priority</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="hover:shadow-lg hover:scale-[1.02] transition-all border-2 hover:border-purple-300 dark:hover:border-purple-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Competency Level
              </CardTitle>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900 dark:to-purple-800 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{stats.avgCompetencyLevel}</div>
              <div className="flex items-center gap-1 text-xs text-green-600 mt-1 font-medium">
                <TrendingUp className="h-3 w-3" />
                <span>+{stats.levelImprovement} from last quarter</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vestas Level Distribution & Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2 border-2 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 flex items-center justify-center">
                  <Award className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                Vestas Level Distribution
              </CardTitle>
              <CardDescription>Technicians by Vestas certification level in {selectedTeamId === "all" ? "all teams" : selectedTeam?.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vestasLevelData.map((item) => (
                  <div key={item.level} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Badge
                          style={{
                            backgroundColor: item.color,
                            color: '#ffffff'
                          }}
                        >
                          {item.level}
                        </Badge>
                        <span className="font-medium">{item.level === 'Field Trainer' ? 'Field Trainer' : `${item.level}-Level`}</span>
                      </div>
                      <span className="font-bold">{item.count} technicians</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${stats.totalTechnicians > 0 ? (item.count / stats.totalTechnicians) * 100 : 0}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/technicians">
                <Button variant="outline" className="w-full justify-start hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 dark:hover:bg-blue-950 transition-all">
                  <Users className="mr-2 h-4 w-4" />
                  Add Technician
                </Button>
              </Link>
              <Link href="/vehicles">
                <Button variant="outline" className="w-full justify-start hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-950 transition-all">
                  <Car className="mr-2 h-4 w-4" />
                  Add Vehicle
                </Button>
              </Link>
              <Link href="/training">
                <Button variant="outline" className="w-full justify-start hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 dark:hover:bg-amber-950 transition-all">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Plan Training
                </Button>
              </Link>
              <Link href="/admin/teams">
                <Button variant="outline" className="w-full justify-start hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 dark:hover:bg-purple-950 transition-all">
                  <UserCheck className="mr-2 h-4 w-4" />
                  Manage Teams
                </Button>
              </Link>
              <Link href="/admin/courses">
                <Button variant="outline" className="w-full justify-start hover:bg-pink-50 hover:border-pink-300 hover:text-pink-700 dark:hover:bg-pink-950 transition-all">
                  <Award className="mr-2 h-4 w-4" />
                  Course Catalog
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-2 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                All Teams Distribution
              </CardTitle>
              <CardDescription>Technicians across all teams in Sweden</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={teamDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) => `${props.name}: ${(props.percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {teamDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                Competency Level Distribution
              </CardTitle>
              <CardDescription>{selectedTeamId === "all" ? "All teams" : selectedTeam?.name} - Levels 1-5</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={competencyDistribution}>
                  <XAxis dataKey="level" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" name="Technicians" radius={[8, 8, 0, 0]}>
                    {competencyDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Training */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-2 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900 dark:to-teal-900 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  Recent Assessments
                </CardTitle>
                <CardDescription>Latest competency matrix updates in {selectedTeamId === "all" ? "all teams" : selectedTeam?.name}</CardDescription>
              </div>
              <Link href="/technicians">
                <Button variant="ghost" size="sm" className="hover:bg-green-50 dark:hover:bg-green-950">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAssessments.map((assessment, index) => {
                  // Simulate some assessments having progression (in real app, this comes from history)
                  const hasPrevious = index === 0 || index === 2; // Simulate first and third having history
                  const previousLevel = hasPrevious ? (index === 0 ? assessment.level - 1 : assessment.level) : null;
                  const isIncrease = hasPrevious && previousLevel !== null && assessment.level > previousLevel;
                  const isDecrease = hasPrevious && previousLevel !== null && assessment.level < previousLevel;
                  const noChange = hasPrevious && previousLevel !== null && assessment.level === previousLevel;

                  return (
                    <Link key={assessment.id} href={`/technicians/${assessment.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg border-2 hover:border-green-300 hover:shadow-md hover:bg-green-50/50 dark:hover:bg-green-950/50 transition-all cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: assessment.teamColor }}
                          />
                          <div>
                            <p className="font-medium">{assessment.name}</p>
                            <p className="text-sm text-muted-foreground">{assessment.team}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasPrevious && previousLevel !== null && (
                            <>
                              {isIncrease && <ArrowUpRight className="h-4 w-4 text-green-500" />}
                              {isDecrease && <ArrowDownRight className="h-4 w-4 text-red-500" />}
                              {noChange && <Minus className="h-4 w-4 text-gray-400" />}
                              {(isIncrease || isDecrease) && (
                                <span className="text-xs text-muted-foreground">
                                  L{previousLevel} → L{assessment.level}
                                </span>
                              )}
                            </>
                          )}
                          <Badge className={isIncrease ? "bg-green-500" : isDecrease ? "bg-red-500" : "bg-blue-500"}>
                            Level {assessment.level}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{assessment.date}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 flex items-center justify-center">
                    <CalendarDays className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  Upcoming Training
                </CardTitle>
                <CardDescription>Scheduled for Q1-Q2 2026</CardDescription>
              </div>
              <Link href="/training">
                <Button variant="ghost" size="sm" className="hover:bg-amber-50 dark:hover:bg-amber-950">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingTraining.map((training, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border-2 hover:border-amber-300 hover:shadow-md hover:bg-amber-50/50 dark:hover:bg-amber-950/50 transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{training.course}</p>
                        {training.priority === "High" && (
                          <Badge variant="destructive" className="text-xs">High Priority</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {training.technicians} technicians · {training.date}
                      </p>
                    </div>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts & Notifications */}
        <Card className="border-2 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900 dark:to-orange-900 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              Alerts & Notifications
            </CardTitle>
            <CardDescription>Important updates and actions required for {selectedTeamId === "all" ? "all teams" : selectedTeam?.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`rounded-lg border-l-4 p-4 ${
                    alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' :
                    alert.type === 'info' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' :
                    'border-green-500 bg-green-50 dark:bg-green-950'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    {alert.type === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />}
                    {alert.type === 'info' && <Clock className="h-5 w-5 text-blue-600 mt-0.5" />}
                    {alert.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                    </div>
                  </div>
                  <Link href={alert.link}>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      {alert.action}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
