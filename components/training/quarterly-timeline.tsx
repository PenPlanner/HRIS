"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, X, Info } from "lucide-react";
import { ALL_TECHNICIANS } from "@/lib/mock-data";
import { ALL_COURSES } from "@/lib/courses-data";
import { useState } from "react";

export type PlannedCourse = {
  id: string;
  course_id: string;
  course_code: string;
  course_name: string;
  quarter: string;
  year: string;
  technician_ids: string[];
  created_at: string;
};

interface QuarterlyTimelineProps {
  courses: PlannedCourse[];
  selectedYear?: string;
  selectedTeam?: string;
  onDeleteCourse?: (courseId: string) => void;
}

export function QuarterlyTimeline({ courses, selectedYear = "2026", selectedTeam = "all", onDeleteCourse }: QuarterlyTimelineProps) {
  const [hoveredCourse, setHoveredCourse] = useState<string | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<string | null>(null);
  const quarters = ["Q1", "Q2", "Q3", "Q4"];

  // Filter courses by year and team
  const filteredCourses = courses.filter(course => {
    const matchesYear = !selectedYear || course.year === selectedYear;

    if (!matchesYear) return false;

    if (selectedTeam === "all") return true;

    // Check if any technician in this course is from the selected team
    const technicians = ALL_TECHNICIANS.filter(t => course.technician_ids.includes(t.id));
    return technicians.some(t => t.team_name === selectedTeam);
  });

  // Group courses by quarter
  const coursesByQuarter = quarters.map(quarter => ({
    quarter,
    courses: filteredCourses.filter(course => course.quarter === quarter)
  }));

  const getQuarterColor = (quarter: string) => {
    switch (quarter) {
      case "Q1": return "bg-blue-100 border-blue-300 text-blue-900";
      case "Q2": return "bg-green-100 border-green-300 text-green-900";
      case "Q3": return "bg-yellow-100 border-yellow-300 text-yellow-900";
      case "Q4": return "bg-purple-100 border-purple-300 text-purple-900";
      default: return "bg-gray-100 border-gray-300 text-gray-900";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-2xl font-bold">
        <Calendar className="h-6 w-6" />
        <span>{selectedYear} Training Calendar</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {coursesByQuarter.map(({ quarter, courses: quarterCourses }) => {
          const totalTechnicians = quarterCourses.reduce(
            (sum, course) => sum + course.technician_ids.length,
            0
          );

          return (
            <Card key={quarter} className={`border-2 ${getQuarterColor(quarter)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{quarter} {selectedYear}</CardTitle>
                  <Badge variant="secondary">
                    {quarterCourses.length} {quarterCourses.length === 1 ? "course" : "courses"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {quarterCourses.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No courses planned
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">{totalTechnicians} technicians</span>
                    </div>
                    <div className="space-y-2">
                      {quarterCourses.map((course) => {
                        const technicians = ALL_TECHNICIANS.filter(t =>
                          course.technician_ids.includes(t.id)
                        );

                        // Get unique teams
                        const teams = Array.from(new Set(technicians.map(t => t.team_name)));

                        // Get course details
                        const courseData = ALL_COURSES.find(c => c.id === course.course_id);
                        const isHovered = hoveredCourse === course.id;

                        return (
                          <div
                            key={course.id}
                            className="relative group"
                            onMouseEnter={() => setHoveredCourse(course.id)}
                            onMouseLeave={() => setHoveredCourse(null)}
                          >
                            <div className="p-3 bg-white rounded-lg border hover:shadow-md hover:border-primary/50 transition-all cursor-pointer">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate" title={course.course_name}>
                                    {course.course_code}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {course.course_name}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Badge variant="secondary" className="text-xs bg-primary text-primary-foreground">
                                    {course.technician_ids.length}
                                  </Badge>
                                  {onDeleteCourse && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingCourse(course.id);
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {teams.map(team => {
                                  const teamData = ALL_TECHNICIANS.find(t => t.team_name === team);
                                  const teamTechCount = technicians.filter(t => t.team_name === team).length;

                                  return (
                                    <Badge
                                      key={team}
                                      variant="outline"
                                      className="text-xs"
                                      style={{
                                        borderColor: teamData?.team_color,
                                        color: teamData?.team_color,
                                      }}
                                    >
                                      {team.split(" ")[0]} ({teamTechCount})
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Hover Tooltip */}
                            {isHovered && courseData && (
                              <div className="absolute left-0 right-0 bottom-full mb-1 z-10 p-3 bg-popover border rounded-lg shadow-lg text-xs space-y-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Info className="h-3 w-3" />
                                  <span className="font-semibold">Course Details</span>
                                </div>
                                <p><strong>Duration:</strong> {courseData.duration_days} days</p>
                                <p><strong>Provider:</strong> {courseData.provider}</p>
                                <p><strong>Category:</strong> {courseData.category}</p>
                                {courseData.max_participants && (
                                  <p><strong>Max participants:</strong> {courseData.max_participants}</p>
                                )}
                                <p className="text-muted-foreground pt-1">{courseData.description}</p>
                              </div>
                            )}

                            {/* Delete Confirmation Dialog */}
                            {deletingCourse === course.id && (
                              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                                <div className="bg-background border rounded-lg p-6 shadow-xl max-w-md mx-4">
                                  <h3 className="text-lg font-semibold mb-2">Delete Course?</h3>
                                  <p className="text-sm text-muted-foreground mb-4">
                                    Are you sure you want to delete <strong>{course.course_code}</strong> from {quarter} {selectedYear}?
                                    This will remove all {course.technician_ids.length} enrolled technician(s).
                                  </p>
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingCourse(null);
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onDeleteCourse) {
                                          onDeleteCourse(course.id);
                                        }
                                        setDeletingCourse(null);
                                      }}
                                    >
                                      Delete Course
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
