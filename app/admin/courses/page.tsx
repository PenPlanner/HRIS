"use client"

import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { CourseDialog } from "@/components/admin/course-dialog";

export type Course = {
  id: string;
  name: string;
  code?: string;
  category: string;
  type: 'internal' | 'external';
  validity_period_months?: number;
  prerequisites?: string;
  description?: string;
};

const VESTAS_COURSES: Course[] = [
  // Safety & GWO
  { id: "1", name: "GWO BST", code: "GWO-BST", category: "Safety & GWO", type: "internal", validity_period_months: 24 },
  { id: "2", name: "GWO ART + EFA", code: "GWO-ART", category: "Safety & GWO", type: "internal", validity_period_months: 24 },
  { id: "3", name: "Safety Introduction for Technicians", code: "951100", category: "Safety & GWO", type: "internal" },

  // Electrical
  { id: "4", name: "Electrical Knowledge Sweden (Ellära)", code: "951500", category: "Electrical", type: "internal", validity_period_months: null },
  { id: "5", name: "Electrical Safety for Qualified", code: "252037", category: "Electrical", type: "internal", validity_period_months: 36 },
  { id: "6", name: "Lock Out Level 2 - Person in Charge", code: "LOTO-2", category: "Electrical", type: "internal", validity_period_months: 36 },
  { id: "7", name: "HV Safety", code: "HV-SAFETY", category: "Electrical", type: "internal", prerequisites: "Minimum 100 points in Electrical matrix" },

  // Turbine-Specific
  { id: "8", name: "TLP VMP 5000 (V52-V90 2MW Mk1-5)", code: "TLP-5000", category: "Turbine-Specific", type: "internal" },
  { id: "9", name: "TLP VMP 6000 (V90 3MW)", code: "TLP-6000", category: "Turbine-Specific", type: "internal" },
  { id: "10", name: "Service Lead 2MW", code: "SL-2MW", category: "Turbine-Specific", type: "internal" },
  { id: "11", name: "Service Lead 4MW", code: "SL-4MW", category: "Turbine-Specific", type: "internal" },
  { id: "12", name: "Turbine Operation and Service - EnVentus", code: "TOS-ENV", category: "Turbine-Specific", type: "internal" },
];

const EXTERNAL_COURSES: Course[] = [
  { id: "20", name: "ESA05 - Electrical Safety", code: "ESA05", category: "External", type: "external", validity_period_months: 36 },
  { id: "21", name: "Heta arbeten (Hot Work Permit)", code: "HA-NORDIC", category: "External", type: "external", validity_period_months: 60 },
  { id: "22", name: "Truckkort A+B", code: "TRUCK-AB", category: "External", type: "external" },
  { id: "23", name: "ActSafe (Fiber work)", code: "ACTSAFE", category: "External", type: "external", validity_period_months: 24 },
];

const CATEGORIES = [
  "Safety & GWO",
  "Electrical",
  "Turbine-Specific",
  "Lifts & Equipment",
  "Specialized",
  "External"
];

export default function CoursesAdminPage() {
  const [courses, setCourses] = useState<Course[]>([...VESTAS_COURSES, ...EXTERNAL_COURSES]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    const saved = localStorage.getItem("courses");
    if (saved) {
      setCourses(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("courses", JSON.stringify(courses));
  }, [courses]);

  const handleCreate = (course: Omit<Course, "id">) => {
    const newCourse: Course = {
      ...course,
      id: Date.now().toString(),
    };
    setCourses([...courses, newCourse]);
    setIsDialogOpen(false);
  };

  const handleUpdate = (updatedCourse: Course) => {
    setCourses(courses.map((c) => (c.id === updatedCourse.id ? updatedCourse : c)));
    setEditingCourse(null);
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this course?")) {
      setCourses(courses.filter((c) => c.id !== id));
    }
  };

  const filteredCourses = selectedCategory === "all"
    ? courses
    : courses.filter(c => c.category === selectedCategory);

  const coursesByCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = courses.filter(c => c.category === cat);
    return acc;
  }, {} as Record<string, Course[]>);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Course Catalog</h1>
            <p className="mt-2 text-muted-foreground">
              {filteredCourses.length} courses
            </p>
          </div>
          <Button onClick={() => { setEditingCourse(null); setIsDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            New Course
          </Button>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            All Categories
          </Button>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Grouped by Category */}
        {selectedCategory === "all" ? (
          <div className="space-y-8">
            {Object.entries(coursesByCategory).map(([category, categoryCourses]) => {
              if (categoryCourses.length === 0) return null;
              return (
                <div key={category}>
                  <div className="mb-4 flex items-center gap-3">
                    <h2 className="text-xl font-semibold">{category}</h2>
                    <Badge variant="outline">{categoryCourses.length} courses</Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categoryCourses.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        onEdit={() => { setEditingCourse(course); setIsDialogOpen(true); }}
                        onDelete={() => handleDelete(course.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onEdit={() => { setEditingCourse(course); setIsDialogOpen(true); }}
                onDelete={() => handleDelete(course.id)}
              />
            ))}
          </div>
        )}
      </div>

      <CourseDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        course={editingCourse}
        onSave={editingCourse ? handleUpdate : handleCreate}
      />
    </MainLayout>
  );
}

function CourseCard({
  course,
  onEdit,
  onDelete,
}: {
  course: Course;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{course.name}</CardTitle>
            {course.code && (
              <p className="mt-1 text-sm font-mono text-muted-foreground">{course.code}</p>
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2">
          <Badge variant={course.type === 'internal' ? 'default' : 'secondary'}>
            {course.type === 'internal' ? 'Vestas Internal' : 'External'}
          </Badge>
        </div>
        {course.validity_period_months && (
          <p className="text-sm text-muted-foreground">
            Valid for {course.validity_period_months} months
          </p>
        )}
        {course.prerequisites && (
          <p className="text-xs text-muted-foreground italic">
            Prerequisites: {course.prerequisites}
          </p>
        )}
        {course.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
