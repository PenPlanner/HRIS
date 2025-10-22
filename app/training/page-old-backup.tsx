"use client"

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Users, Star, Calendar, GraduationCap, Download, Filter } from "lucide-react";
import Link from "next/link";
import { exportTrainingNeedsToPDF, exportPlannedCoursesToPDF } from "@/lib/export-training-pdf";

type AggregatedTrainingNeed = {
  course_id: string;
  course_name: string;
  course_code?: string;
  technicians: {
    id: string;
    initials: string;
    name: string;
    team_name: string;
    team_color: string;
    reason: string;
    priority: boolean;
  }[];
  priority_count: number;
  total_count: number;
};

type PlannedCourseAggregated = {
  course_id: string;
  course_name: string;
  course_code?: string;
  technicians: {
    id: string;
    initials: string;
    name: string;
    team_name: string;
    team_color: string;
  }[];
  total_count: number;
};

// Mock data - will be replaced with real aggregated data from localStorage/Supabase
const mockAggregatedNeeds: AggregatedTrainingNeed[] = [
  {
    course_id: "20",
    course_name: "ESA05 - Electrical Safety",
    course_code: "ESA05",
    technicians: [
      {
        id: "1",
        initials: "MRADR",
        name: "Markus Anderson",
        team_name: "Travel S",
        team_color: "#06b6d4",
        reason: "Certification expiring",
        priority: true,
      },
      {
        id: "2",
        initials: "CLEGR",
        name: "Carl Emil Gryme",
        team_name: "Travel S",
        team_color: "#06b6d4",
        reason: "Upgrade to Level 5",
        priority: true,
      },
      {
        id: "3",
        initials: "ANLRN",
        name: "Anders Larsson",
        team_name: "Travel U",
        team_color: "#0ea5e9",
        reason: "New role requirement",
        priority: false,
      },
    ],
    priority_count: 2,
    total_count: 3,
  },
  {
    course_id: "7",
    course_name: "HV Safety",
    course_code: "HV-SAFETY",
    technicians: [
      {
        id: "1",
        initials: "MRADR",
        name: "Markus Anderson",
        team_name: "Travel S",
        team_color: "#06b6d4",
        reason: "Prerequisites met",
        priority: false,
      },
      {
        id: "4",
        initials: "JOHDA",
        name: "Johan Davidsson",
        team_name: "South 1",
        team_color: "#ef4444",
        reason: "Team requirement",
        priority: true,
      },
    ],
    priority_count: 1,
    total_count: 2,
  },
  {
    course_id: "21",
    course_name: "Heta arbeten (Hot Work Permit)",
    course_code: "HA-NORDIC",
    technicians: [
      {
        id: "5",
        initials: "MIKAN",
        name: "Mikael Andersson",
        team_name: "North 1",
        team_color: "#a855f7",
        reason: "Certification expiring",
        priority: true,
      },
    ],
    priority_count: 1,
    total_count: 1,
  },
];

const mockPlannedCourses: PlannedCourseAggregated[] = [
  {
    course_id: "7",
    course_name: "HV Safety",
    course_code: "HV-SAFETY",
    technicians: [
      {
        id: "1",
        initials: "MRADR",
        name: "Markus Anderson",
        team_name: "Travel S",
        team_color: "#06b6d4",
      },
      {
        id: "2",
        initials: "CLEGR",
        name: "Carl Emil Gryme",
        team_name: "Travel S",
        team_color: "#06b6d4",
      },
    ],
    total_count: 2,
  },
  {
    course_id: "12",
    course_name: "Turbine Operation and Service - EnVentus",
    course_code: "TOS-ENV",
    technicians: [
      {
        id: "3",
        initials: "ANLRN",
        name: "Anders Larsson",
        team_name: "Travel U",
        team_color: "#0ea5e9",
      },
    ],
    total_count: 1,
  },
];

const TEAMS = [
  { name: "Travel S", color: "#06b6d4" },
  { name: "Travel U", color: "#0ea5e9" },
  { name: "South 1", color: "#ef4444" },
  { name: "South 2", color: "#f97316" },
  { name: "North 1", color: "#a855f7" },
  { name: "North 2", color: "#d946ef" },
];

const PERIODS = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026", "Q1 2027", "Q2 2027"];

export default function TrainingPage() {
  const [aggregatedNeeds, setAggregatedNeeds] = useState<AggregatedTrainingNeed[]>(mockAggregatedNeeds);
  const [plannedCourses, setPlannedCourses] = useState<PlannedCourseAggregated[]>(mockPlannedCourses);
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("Q1 2026");
  const [view, setView] = useState<"needs" | "planned">("needs");

  // Filter by team
  const filteredNeeds = selectedTeam === "all"
    ? aggregatedNeeds
    : aggregatedNeeds.map(need => ({
        ...need,
        technicians: need.technicians.filter(tech => tech.team_name === selectedTeam),
        total_count: need.technicians.filter(tech => tech.team_name === selectedTeam).length,
        priority_count: need.technicians.filter(tech => tech.team_name === selectedTeam && tech.priority).length,
      })).filter(need => need.total_count > 0);

  const filteredPlanned = selectedTeam === "all"
    ? plannedCourses
    : plannedCourses.map(course => ({
        ...course,
        technicians: course.technicians.filter(tech => tech.team_name === selectedTeam),
        total_count: course.technicians.filter(tech => tech.team_name === selectedTeam).length,
      })).filter(course => course.total_count > 0);

  // Sort by priority count and total count
  const sortedNeeds = [...filteredNeeds].sort((a, b) => {
    if (b.priority_count !== a.priority_count) {
      return b.priority_count - a.priority_count;
    }
    return b.total_count - a.total_count;
  });

  const totalTechnicians = view === "needs"
    ? filteredNeeds.reduce((sum, need) => sum + need.total_count, 0)
    : filteredPlanned.reduce((sum, course) => sum + course.total_count, 0);

  const priorityNeeds = filteredNeeds.filter(need => need.priority_count > 0).length;

  const handleExportPDF = () => {
    if (view === "needs") {
      exportTrainingNeedsToPDF(filteredNeeds, {
        team: selectedTeam,
        period: selectedPeriod,
        view: "needs",
      });
    } else {
      exportPlannedCoursesToPDF(filteredPlanned, {
        team: selectedTeam,
        period: selectedPeriod,
      });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Team Training Overview</h1>
            <p className="mt-2 text-muted-foreground">
              Aggregated training needs for quarterly meetings
            </p>
          </div>
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Export to PDF
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {view === "needs" ? filteredNeeds.length : filteredPlanned.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedPeriod}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Technicians</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTechnicians}</div>
              <p className="text-xs text-muted-foreground">
                Across all courses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Priority Courses</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{priorityNeeds}</div>
              <p className="text-xs text-muted-foreground">
                High priority training
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Period</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedPeriod}</div>
              <p className="text-xs text-muted-foreground">
                Selected quarter
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* View Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant={view === "needs" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setView("needs")}
                >
                  Training Needs
                </Button>
                <Button
                  variant={view === "planned" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setView("planned")}
                >
                  Planned Courses
                </Button>
              </div>

              {/* Team Filter */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Filter by Team</Label>
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
                      key={team.name}
                      variant={selectedTeam === team.name ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTeam(team.name)}
                      style={
                        selectedTeam === team.name
                          ? { backgroundColor: team.color, borderColor: team.color }
                          : {}
                      }
                    >
                      {team.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Period Filter */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Target Period</Label>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {PERIODS.map((period) => (
                    <Button
                      key={period}
                      variant={selectedPeriod === period ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedPeriod(period)}
                    >
                      {period}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aggregated Training Needs */}
        {view === "needs" && (
          <div className="space-y-4">
            {sortedNeeds.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No training needs for the selected filters
                  </p>
                </CardContent>
              </Card>
            ) : (
              sortedNeeds.map((need) => (
                <Card key={need.course_id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {need.priority_count > 0 && (
                            <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                          )}
                          <CardTitle className="text-lg">{need.course_name}</CardTitle>
                          {need.course_code && (
                            <Badge variant="outline">{need.course_code}</Badge>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <Badge variant="default">
                            {need.total_count} {need.total_count === 1 ? "technician" : "technicians"}
                          </Badge>
                          {need.priority_count > 0 && (
                            <Badge variant="default" className="bg-orange-500">
                              {need.priority_count} priority
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {need.technicians.map((tech) => (
                        <Link
                          key={tech.id}
                          href={`/technicians/${tech.id}`}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                          style={{ borderLeft: `4px solid ${tech.team_color}` }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                              style={{ backgroundColor: tech.team_color + "20", color: tech.team_color }}
                            >
                              {tech.initials.substring(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium">{tech.name}</p>
                              <p className="text-sm text-muted-foreground">{tech.initials}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: tech.team_color,
                                color: tech.team_color,
                              }}
                            >
                              {tech.team_name}
                            </Badge>
                            {tech.priority && (
                              <Badge variant="default" className="ml-2 bg-orange-500">
                                Priority
                              </Badge>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">{tech.reason}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Planned Courses */}
        {view === "planned" && (
          <div className="space-y-4">
            {filteredPlanned.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No planned courses for the selected filters
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredPlanned.map((course) => (
                <Card key={course.course_id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{course.course_name}</CardTitle>
                          {course.course_code && (
                            <Badge variant="outline">{course.course_code}</Badge>
                          )}
                        </div>
                        <div className="mt-2">
                          <Badge variant="default">
                            {course.total_count} {course.total_count === 1 ? "technician" : "technicians"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {course.technicians.map((tech) => (
                        <Link
                          key={tech.id}
                          href={`/technicians/${tech.id}`}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                          style={{ borderLeft: `4px solid ${tech.team_color}` }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                              style={{ backgroundColor: tech.team_color + "20", color: tech.team_color }}
                            >
                              {tech.initials.substring(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium">{tech.name}</p>
                              <p className="text-sm text-muted-foreground">{tech.initials}</p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: tech.team_color,
                              color: tech.team_color,
                            }}
                          >
                            {tech.team_name}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
