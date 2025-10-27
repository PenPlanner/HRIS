"use client"

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { GraduationCap, Calendar, Users, X, List, LayoutGrid } from "lucide-react";
import { TEAMS, ALL_TECHNICIANS } from "@/lib/mock-data";
import { ALL_COURSES } from "@/lib/courses-data";
import { PlanCourseDialog } from "@/components/training/plan-course-dialog";
import { QuarterlyTimeline, PlannedCourse } from "@/components/training/quarterly-timeline";
import { EXAMPLE_PLANNED_COURSES } from "@/lib/example-courses";

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
    } else {
      // Load example courses if no data exists
      setPlannedCourses(EXAMPLE_PLANNED_COURSES);
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

  const handleUpdateCourse = (courseId: string, updates: Partial<PlannedCourse>) => {
    setPlannedCourses(prev =>
      prev.map(course =>
        course.id === courseId ? { ...course, ...updates } : course
      )
    );
  };

  const handleLoadExamples = () => {
    if (confirm("Load example courses? This will replace your current courses.")) {
      setPlannedCourses(EXAMPLE_PLANNED_COURSES);
    }
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
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto shadow-lg"></div>
            <p className="mt-6 text-lg font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Loading training...</p>
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Training Planning</h1>
            <p className="mt-2 text-muted-foreground font-medium">
              Plan and schedule training courses for your teams
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleLoadExamples} className="hover:border-amber-300">
              Load Examples
            </Button>
            <PlanCourseDialog onCoursePlanned={handleCoursePlanned} />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="hover:shadow-lg hover:scale-[1.02] transition-all border-2 hover:border-amber-300 dark:hover:border-amber-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Courses</CardTitle>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900 dark:to-amber-800 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{totalCoursesAvailable}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                Courses in catalog
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg hover:scale-[1.02] transition-all border-2 hover:border-blue-300 dark:hover:border-blue-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planned Courses</CardTitle>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{totalCourses}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                For {selectedYear}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg hover:scale-[1.02] transition-all border-2 hover:border-emerald-300 dark:hover:border-emerald-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Technicians Enrolled</CardTitle>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900 dark:to-emerald-800 flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{uniqueTechnicians}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                Unique technicians
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg hover:scale-[1.02] transition-all border-2 hover:border-purple-300 dark:hover:border-purple-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selected Year</CardTitle>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900 dark:to-purple-800 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{selectedYear}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                Current view
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-2 shadow-md">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* View Toggle */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant={view === "calendar" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView("calendar")}
                    className={view === "calendar" ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md" : "hover:border-blue-300"}
                  >
                    <LayoutGrid className="mr-2 h-4 w-4" />
                    Calendar View
                  </Button>
                  <Button
                    variant={view === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView("list")}
                    className={view === "list" ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md" : "hover:border-emerald-300"}
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
                    className="gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:hover:bg-red-950"
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
                    className={selectedTeam === "all" ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md" : "hover:border-blue-300"}
                  >
                    All Teams
                  </Button>
                  {TEAMS.map((team) => (
                    <Button
                      key={team.id}
                      variant={selectedTeam === team.name ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTeam(team.name)}
                      className={selectedTeam === team.name ? "text-white shadow-md" : "hover:border-gray-400"}
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
                      className={selectedYear === year ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md" : "hover:border-purple-300"}
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
            onDeleteCourse={handleDeleteCourse}
            onUpdateCourse={handleUpdateCourse}
          />
        )}

        {/* List View */}
        {view === "list" && (
          <div className="space-y-4">
            {filteredCourses.length === 0 ? (
              <Card className="border-2 shadow-md">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900 dark:to-amber-800 flex items-center justify-center mx-auto mb-4">
                      <GraduationCap className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="text-lg font-bold mb-2">No courses planned yet</p>
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
                  <Card key={course.id} className="border-2 hover:border-amber-300 hover:shadow-lg transition-all">
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
