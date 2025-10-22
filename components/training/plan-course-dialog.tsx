"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Users, Calendar, GraduationCap, X } from "lucide-react";
import { ALL_COURSES, Course } from "@/lib/courses-data";
import { ALL_TECHNICIANS, Technician } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";

type PlannedCourse = {
  id: string;
  course_id: string;
  course_code: string;
  course_name: string;
  quarter: string;
  year: string;
  technician_ids: string[];
  created_at: string;
};

interface PlanCourseDialogProps {
  onCoursePlanned: (course: PlannedCourse) => void;
}

export function PlanCourseDialog({ onCoursePlanned }: PlanCourseDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState<string>("Q1");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");

  const course = ALL_COURSES.find(c => c.id === selectedCourse);

  // Get unique teams
  const teams = Array.from(new Set(ALL_TECHNICIANS.map(t => t.team_name)));

  // Group courses by category
  const coursesByCategory = ALL_COURSES.reduce((acc, course) => {
    if (!acc[course.category]) {
      acc[course.category] = [];
    }
    acc[course.category].push(course);
    return acc;
  }, {} as Record<string, Course[]>);

  // Category colors
  const categoryColors: Record<string, string> = {
    "Electrical Safety": "#3b82f6",
    "High Voltage": "#ef4444",
    "Mechanical": "#f97316",
    "Turbine Specific": "#8b5cf6",
    "Management": "#10b981",
    "Nordic Specific": "#06b6d4",
  };

  // Filter technicians
  const filteredTechnicians = ALL_TECHNICIANS.filter(tech => {
    const matchesTeam = selectedTeam === "all" || tech.team_name === selectedTeam;
    const matchesSearch = searchQuery === "" ||
      tech.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.initials.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTeam && matchesSearch;
  });

  const handleToggleTechnician = (techId: string) => {
    setSelectedTechnicians(prev =>
      prev.includes(techId)
        ? prev.filter(id => id !== techId)
        : [...prev, techId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTechnicians.length === filteredTechnicians.length) {
      setSelectedTechnicians([]);
    } else {
      setSelectedTechnicians(filteredTechnicians.map(t => t.id));
    }
  };

  const handlePlanCourse = () => {
    if (!selectedCourse || selectedTechnicians.length === 0) {
      return;
    }

    const courseData = ALL_COURSES.find(c => c.id === selectedCourse);
    if (!courseData) return;

    const plannedCourse: PlannedCourse = {
      id: `planned_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      course_id: courseData.id,
      course_code: courseData.code,
      course_name: courseData.name,
      quarter: selectedQuarter,
      year: selectedYear,
      technician_ids: selectedTechnicians,
      created_at: new Date().toISOString(),
    };

    onCoursePlanned(plannedCourse);

    // Reset form
    setSelectedCourse("");
    setSelectedTechnicians([]);
    setSelectedQuarter("Q1");
    setSelectedYear("2026");
    setSearchQuery("");
    setSelectedTeam("all");
    setOpen(false);
  };

  const selectedTechObjects = ALL_TECHNICIANS.filter(t => selectedTechnicians.includes(t.id));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Plan Course
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Plan Training Course</DialogTitle>
          <DialogDescription>
            Select a course, choose technicians, and set the planned quarter
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Course Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Select Course
            </Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a course..." />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                {Object.entries(coursesByCategory).map(([category, courses]) => (
                  <SelectGroup key={category}>
                    <SelectLabel
                      className="flex items-center gap-2 font-semibold text-sm py-2"
                      style={{ color: categoryColors[category] }}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: categoryColors[category] }}
                      />
                      {category}
                    </SelectLabel>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{course.code}</span>
                          <span className="text-muted-foreground">-</span>
                          <span>{course.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            {course && (
              <div className="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="font-medium"
                    style={{
                      borderColor: categoryColors[course.category],
                      color: categoryColors[course.category],
                    }}
                  >
                    {course.category}
                  </Badge>
                </div>
                <p><strong>Duration:</strong> {course.duration_days} days</p>
                <p><strong>Provider:</strong> {course.provider}</p>
                <p><strong>Max participants:</strong> {course.max_participants || "No limit"}</p>
                <p className="mt-1 text-foreground">{course.description}</p>
              </div>
            )}
          </div>

          {/* Quarter and Year Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Quarter
              </Label>
              <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Q1">Q1</SelectItem>
                  <SelectItem value="Q2">Q2</SelectItem>
                  <SelectItem value="Q3">Q3</SelectItem>
                  <SelectItem value="Q4">Q4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2027">2027</SelectItem>
                  <SelectItem value="2028">2028</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Technician Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Select Technicians ({selectedTechnicians.length} selected)
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedTechnicians.length === filteredTechnicians.length ? "Deselect All" : "Select All"}
              </Button>
            </div>

            {/* Team Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={selectedTeam === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTeam("all")}
              >
                All Teams
              </Button>
              {teams.map((team) => {
                const teamData = ALL_TECHNICIANS.find(t => t.team_name === team);
                return (
                  <Button
                    key={team}
                    variant={selectedTeam === team ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTeam(team)}
                    style={
                      selectedTeam === team && teamData
                        ? { backgroundColor: teamData.team_color, borderColor: teamData.team_color }
                        : {}
                    }
                  >
                    {team}
                  </Button>
                );
              })}
            </div>

            {/* Search */}
            <Input
              placeholder="Search technicians..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Selected Technicians Preview */}
            {selectedTechObjects.length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Selected:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTechObjects.map((tech) => (
                    <Badge
                      key={tech.id}
                      variant="secondary"
                      className="gap-1"
                    >
                      {tech.initials}
                      <button
                        onClick={() => handleToggleTechnician(tech.id)}
                        className="ml-1 hover:bg-background/20 rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Technician List */}
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              {filteredTechnicians.map((tech) => (
                <div
                  key={tech.id}
                  className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                  onClick={() => handleToggleTechnician(tech.id)}
                >
                  <Checkbox
                    checked={selectedTechnicians.includes(tech.id)}
                    onCheckedChange={() => handleToggleTechnician(tech.id)}
                  />
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                    style={{ backgroundColor: tech.team_color + "20", color: tech.team_color }}
                  >
                    {tech.initials.substring(0, 2)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{tech.first_name} {tech.last_name}</p>
                    <p className="text-xs text-muted-foreground">{tech.initials} - {tech.team_name}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {tech.vestas_level}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedCourse && selectedTechnicians.length > 0 ? (
              <span className="text-green-600 font-medium">
                Ready to plan {selectedTechnicians.length} technician(s) for {course?.code} in {selectedQuarter} {selectedYear}
              </span>
            ) : (
              <span>
                Select a course and at least one technician
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePlanCourse}
              disabled={!selectedCourse || selectedTechnicians.length === 0}
            >
              Plan Course
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
