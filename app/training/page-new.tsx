"use client"

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { GraduationCap, Calendar, Users, X, List, LayoutGrid } from "lucide-react";
import { TEAMS } from "@/lib/mock-data";
import { ALL_COURSES } from "@/lib/courses-data";
import { PlanCourseDialog } from "@/components/training/plan-course-dialog";
import { QuarterlyTimeline, PlannedCourse } from "@/components/training/quarterly-timeline";

export default function TrainingPage() {
  const [plannedCourses, setPlannedCourses] = useState<PlannedCourse[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [mounted, setMounted] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("training_plannedCourses");
    if (saved) {
      setPlannedCourses(JSON.parse(saved));
    }

    // Load filters
    const savedTeam = localStorage.getItem("training_selectedTeam");
    const savedYear = localStorage.getItem("training_selectedYear");
    if (savedTeam) setSelectedTeam(savedTeam);
    if (savedYear) setSelectedYear(savedYear);
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("training_plannedCourses", JSON.stringify(plannedCourses));
      localStorage.setItem("training_selectedTeam", selectedTeam);
      localStorage.setItem("training_selectedYear", selectedYear);
    }
  }, [plannedCourses, selectedTeam, selectedYear, mounted]);

  const handleCoursePlanned = (course: PlannedCourse) => {
    setPlannedCourses(prev => [...prev, course]);
  };

  const handleDeleteCourse = (courseId: string) => {
    setPlannedCourses(prev => prev.filter(c => c.id !== courseId));
  };

  // Reset filters
  const hasActiveFilters = selectedTeam !== "all" || selectedYear !== "2026";
  const resetFilters = () => {
    setSelectedTeam("all");
    setSelectedYear("2026");
  };

  // Calculate stats
  const filteredCourses = plannedCourses.filter(course => {
    const matchesYear = selectedYear === "all" || course.year === selectedYear;
    // Filtering by team is handled in the components
    return matchesYear;
  });

  const totalCourses = filteredCourses.length;
  const uniqueTechnicians = new Set(filteredCourses.flatMap(c => c.technician_ids)).size;
  const totalCoursesAvailable = ALL_COURSES.length;

  if (!mounted) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading training...</p>
          </div>
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
            <h1 className="text-3xl font-bold">Training Planning</h1>
            <p className="mt-2 text-muted-foreground">
              Plan and schedule training courses for your teams
            </p>
          </div>
          <PlanCourseDialog onCoursePlanned={handleCoursePlanned} />
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Courses</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCoursesAvailable}</div>
              <p className="text-xs text-muted-foreground">
                Courses in catalog
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planned Courses</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCourses}</div>
              <p className="text-xs text-muted-foreground">
                For {selectedYear}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Technicians Enrolled</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueTechnicians}</div>
              <p className="text-xs text-muted-foreground">
                Unique technicians
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selected Year</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedYear}</div>
              <p className="text-xs text-muted-foreground">
                Current view
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* View Toggle */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant={view === "calendar" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView("calendar")}
                  >
                    <LayoutGrid className="mr-2 h-4 w-4" />
                    Calendar View
                  </Button>
                  <Button
                    variant={view === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView("list")}
                  >
                    <List className="mr-2 h-4 w-4" />
                    List View
                  </Button>
                </div>

                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Reset Filters
                  </Button>
                )}
              </div>

              {/* Team Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Filter by Team</label>
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

              {/* Year Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Select Year</label>
                <div className="flex items-center gap-2">
                  {["2025", "2026", "2027", "2028"].map((year) => (
                    <Button
                      key={year}
                      variant={selectedYear === year ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedYear(year)}
                    >
                      {year}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar View */}
        {view === "calendar" && (
          <QuarterlyTimeline
            courses={plannedCourses}
            selectedYear={selectedYear}
            selectedTeam={selectedTeam}
          />
        )}

        {/* List View */}
        {view === "list" && (
          <div className="space-y-4">
            {filteredCourses.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No courses planned yet</p>
                    <p className="text-muted-foreground mb-4">
                      Start by planning your first training course
                    </p>
                    <PlanCourseDialog onCoursePlanned={handleCoursePlanned} />
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredCourses.map((course) => {
                const courseData = ALL_COURSES.find(c => c.id === course.course_id);

                return (
                  <Card key={course.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-lg">{course.course_name}</CardTitle>
                            <Badge variant="outline">{course.course_code}</Badge>
                            <Badge>
                              {course.quarter} {course.year}
                            </Badge>
                            {courseData && (
                              <Badge variant="secondary">{courseData.category}</Badge>
                            )}
                          </div>
                          {courseData && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {courseData.duration_days} days - {courseData.provider}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{course.technician_ids.length} technicians enrolled</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {course.technician_ids.map(techId => {
                          const tech = ALL_TECHNICIANS.find(t => t.id === techId);
                          if (!tech) return null;

                          return (
                            <Badge
                              key={techId}
                              variant="outline"
                              style={{
                                borderColor: tech.team_color,
                                color: tech.team_color,
                              }}
                            >
                              {tech.initials}
                            </Badge>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
