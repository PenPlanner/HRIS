"use client"

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Car,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  Award,
  UserCheck,
  CalendarDays,
  BarChart3
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, RadialBarChart, RadialBar } from "recharts";
import Link from "next/link";

type VestasLevel = 'D' | 'C' | 'B' | 'A' | 'Field Trainer';

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
  // Mock data - in real app, fetch from Supabase
  const stats = {
    totalTechnicians: 117,
    technicianChange: 2,
    technicianChangePercent: 1.7,
    serviceVehicles: 45,
    unassignedVehicles: 3,
    trainingNeeds: 23,
    highPriorityTraining: 8,
    avgCompetencyLevel: 3.4,
    levelImprovement: 0.2,
    totalTeams: 20,
  };

  const teamDistribution = [
    { name: "Travel S", value: 15, color: "#06b6d4" },
    { name: "Travel U", value: 12, color: "#0ea5e9" },
    { name: "South 1", value: 20, color: "#ef4444" },
    { name: "South 2", value: 18, color: "#f97316" },
    { name: "North 1", value: 22, color: "#a855f7" },
    { name: "Other", value: 30, color: "#64748b" },
  ];

  const competencyLevels = [
    { level: "Level 1", count: 8, fill: "#ef4444" },
    { level: "Level 2", count: 15, fill: "#f97316" },
    { level: "Level 3", count: 35, fill: "#eab308" },
    { level: "Level 4", count: 42, fill: "#3b82f6" },
    { level: "Level 5", count: 17, fill: "#10b981" },
  ];

  const vestasLevelDistribution = [
    { level: "D", count: 25, color: getVestasLevelColor('D') },
    { level: "C", count: 38, color: getVestasLevelColor('C') },
    { level: "B", count: 32, color: getVestasLevelColor('B') },
    { level: "A", count: 18, color: getVestasLevelColor('A') },
    { level: "Field Trainer", count: 4, color: getVestasLevelColor('Field Trainer') },
  ];

  const recentAssessments = [
    { id: 1, name: "Carl Emil Gryme", team: "Travel S", level: 4, date: "2025-10-20", teamColor: "#06b6d4" },
    { id: 2, name: "Markus Anderson", team: "Travel S", level: 5, date: "2025-10-19", teamColor: "#06b6d4" },
    { id: 3, name: "Andreas Larsson", team: "Travel U", level: 4, date: "2025-10-18", teamColor: "#0ea5e9" },
  ];

  const upcomingTraining = [
    { course: "HV Electrical Course", technicians: 5, priority: "High", date: "Q1 2026" },
    { course: "EN50110 Training", technicians: 3, priority: "Medium", date: "Q1 2026" },
    { course: "Add-on C-Level HV", technicians: 2, priority: "Medium", date: "Q2 2026" },
    { course: "Electrical Safety", technicians: 4, priority: "High", date: "Q1 2026" },
  ];

  const alerts = [
    {
      type: "warning",
      title: "5 competency matrices need updating",
      description: "Assessments older than 12 months",
      action: "Review Assessments",
      link: "/technicians"
    },
    {
      type: "info",
      title: "3 vehicles without assigned technicians",
      description: "Check vehicle assignments",
      action: "Assign Technicians",
      link: "/vehicles"
    },
    {
      type: "success",
      title: "8 technicians completed training this month",
      description: "Update their competency levels",
      action: "View Details",
      link: "/training"
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Real-time overview of your workforce and operations
          </p>
        </div>

        {/* Quick Stats - Clickable */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/technicians">
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Technicians
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTechnicians}</div>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{stats.technicianChange} ({stats.technicianChangePercent}%) from last month</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/vehicles">
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Service Vehicles
                </CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.serviceVehicles}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Across {stats.totalTeams} teams</span>
                  {stats.unassignedVehicles > 0 && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      {stats.unassignedVehicles} unassigned
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/training">
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Training Needs
                </CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.trainingNeeds}</div>
                <div className="flex items-center gap-1 text-xs text-orange-600">
                  <AlertCircle className="h-3 w-3" />
                  <span>{stats.highPriorityTraining} high priority</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Competency Level
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgCompetencyLevel}</div>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span>+{stats.levelImprovement} from last quarter</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vestas Level Distribution & Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Vestas Level Distribution</CardTitle>
              <CardDescription>Technicians by Vestas certification level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vestasLevelDistribution.map((item) => (
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
                          width: `${(item.count / stats.totalTechnicians) * 100}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/technicians">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Add Technician
                </Button>
              </Link>
              <Link href="/vehicles">
                <Button variant="outline" className="w-full justify-start">
                  <Car className="mr-2 h-4 w-4" />
                  Add Vehicle
                </Button>
              </Link>
              <Link href="/training">
                <Button variant="outline" className="w-full justify-start">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Plan Training
                </Button>
              </Link>
              <Link href="/admin/teams">
                <Button variant="outline" className="w-full justify-start">
                  <UserCheck className="mr-2 h-4 w-4" />
                  Manage Teams
                </Button>
              </Link>
              <Link href="/admin/courses">
                <Button variant="outline" className="w-full justify-start">
                  <Award className="mr-2 h-4 w-4" />
                  Course Catalog
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Team Distribution</CardTitle>
              <CardDescription>Technicians per team</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={teamDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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

          <Card>
            <CardHeader>
              <CardTitle>Competency Level Distribution</CardTitle>
              <CardDescription>Technicians by competency level (1-5)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={competencyLevels}>
                  <XAxis dataKey="level" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" name="Technicians" radius={[8, 8, 0, 0]}>
                    {competencyLevels.map((entry, index) => (
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Assessments</CardTitle>
                <CardDescription>Latest competency matrix updates</CardDescription>
              </div>
              <Link href="/technicians">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAssessments.map((assessment) => (
                  <Link key={assessment.id} href={`/technicians/${assessment.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
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
                        <Badge className="bg-blue-500">Level {assessment.level}</Badge>
                        <span className="text-xs text-muted-foreground">{assessment.date}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Upcoming Training</CardTitle>
                <CardDescription>Scheduled for Q1-Q2 2026</CardDescription>
              </div>
              <Link href="/training">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingTraining.map((training, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
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
        <Card>
          <CardHeader>
            <CardTitle>Alerts & Notifications</CardTitle>
            <CardDescription>Important updates and actions required</CardDescription>
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
