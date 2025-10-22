"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Star, Calendar, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";

type CompletedCourse = {
  id: string;
  course_id: string;
  course_name: string;
  course_code?: string;
  completion_date: string;
  expiry_date?: string;
  certificate_url?: string;
};

type PlannedCourse = {
  id: string;
  course_id: string;
  course_name: string;
  course_code?: string;
  target_period: string; // e.g., "Q1 2026"
  added_by: string;
  notes?: string;
};

type TrainingNeed = {
  id: string;
  course_id: string;
  course_name: string;
  course_code?: string;
  reason: string;
  priority: boolean;
  target_period: string;
  added_by: string;
};

interface TrainingNeedsManagerProps {
  technicianId: string;
}

// Mock data - will be replaced with real data
const mockCompletedCourses: CompletedCourse[] = [
  {
    id: "1",
    course_id: "1",
    course_name: "GWO BST",
    course_code: "GWO-BST",
    completion_date: "2023-05-15",
    expiry_date: "2025-05-15",
  },
  {
    id: "2",
    course_id: "2",
    course_name: "GWO ART + EFA",
    course_code: "GWO-ART",
    completion_date: "2023-06-10",
    expiry_date: "2025-06-10",
  },
  {
    id: "3",
    course_id: "4",
    course_name: "Electrical Knowledge Sweden (Ellära)",
    course_code: "951500",
    completion_date: "2022-03-20",
  },
];

const mockPlannedCourses: PlannedCourse[] = [
  {
    id: "1",
    course_id: "7",
    course_name: "HV Safety",
    course_code: "HV-SAFETY",
    target_period: "Q1 2026",
    added_by: "TEORY",
    notes: "Prerequisites met",
  },
];

const mockTrainingNeeds: TrainingNeed[] = [
  {
    id: "1",
    course_id: "20",
    course_name: "ESA05 - Electrical Safety",
    course_code: "ESA05",
    reason: "Certification expiring",
    priority: true,
    target_period: "Q2 2026",
    added_by: "MRADR",
  },
];

export function TrainingNeedsManager({ technicianId }: TrainingNeedsManagerProps) {
  const [completedCourses, setCompletedCourses] = useState<CompletedCourse[]>(mockCompletedCourses);
  const [plannedCourses, setPlannedCourses] = useState<PlannedCourse[]>(mockPlannedCourses);
  const [trainingNeeds, setTrainingNeeds] = useState<TrainingNeed[]>(mockTrainingNeeds);
  const [isAddPlannedOpen, setIsAddPlannedOpen] = useState(false);
  const [isAddNeedOpen, setIsAddNeedOpen] = useState(false);

  useEffect(() => {
    // Load from localStorage (temporary)
    const savedCompleted = localStorage.getItem(`completed-courses-${technicianId}`);
    const savedPlanned = localStorage.getItem(`planned-courses-${technicianId}`);
    const savedNeeds = localStorage.getItem(`training-needs-${technicianId}`);

    if (savedCompleted) setCompletedCourses(JSON.parse(savedCompleted));
    if (savedPlanned) setPlannedCourses(JSON.parse(savedPlanned));
    if (savedNeeds) setTrainingNeeds(JSON.parse(savedNeeds));
  }, [technicianId]);

  useEffect(() => {
    localStorage.setItem(`completed-courses-${technicianId}`, JSON.stringify(completedCourses));
  }, [completedCourses, technicianId]);

  useEffect(() => {
    localStorage.setItem(`planned-courses-${technicianId}`, JSON.stringify(plannedCourses));
  }, [plannedCourses, technicianId]);

  useEffect(() => {
    localStorage.setItem(`training-needs-${technicianId}`, JSON.stringify(trainingNeeds));
  }, [trainingNeeds, technicianId]);

  const handleAddPlanned = (course: Omit<PlannedCourse, "id">) => {
    const newCourse: PlannedCourse = {
      ...course,
      id: Date.now().toString(),
    };
    setPlannedCourses([...plannedCourses, newCourse]);
    setIsAddPlannedOpen(false);
  };

  const handleAddNeed = (need: Omit<TrainingNeed, "id">) => {
    const newNeed: TrainingNeed = {
      ...need,
      id: Date.now().toString(),
    };
    setTrainingNeeds([...trainingNeeds, newNeed]);
    setIsAddNeedOpen(false);
  };

  const handleDeletePlanned = (id: string) => {
    if (confirm("Remove this planned course?")) {
      setPlannedCourses(plannedCourses.filter((c) => c.id !== id));
    }
  };

  const handleDeleteNeed = (id: string) => {
    if (confirm("Remove this training need?")) {
      setTrainingNeeds(trainingNeeds.filter((n) => n.id !== id));
    }
  };

  const togglePriority = (id: string) => {
    setTrainingNeeds(
      trainingNeeds.map((need) =>
        need.id === id ? { ...need, priority: !need.priority } : need
      )
    );
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffMonths = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return diffMonths <= 3 && diffMonths > 0;
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Completed Courses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Completed Courses
            </CardTitle>
            <Badge variant="outline">{completedCourses.length} courses</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {completedCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No completed courses yet</p>
          ) : (
            <div className="space-y-3">
              {completedCourses.map((course) => {
                const expiring = course.expiry_date && isExpiringSoon(course.expiry_date);
                const expired = course.expiry_date && isExpired(course.expiry_date);

                return (
                  <div
                    key={course.id}
                    className="flex items-start justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{course.course_name}</p>
                        {course.course_code && (
                          <Badge variant="outline" className="text-xs">
                            {course.course_code}
                          </Badge>
                        )}
                        {expired && (
                          <Badge variant="destructive" className="text-xs">
                            Expired
                          </Badge>
                        )}
                        {expiring && !expired && (
                          <Badge variant="default" className="text-xs bg-yellow-500">
                            Expiring Soon
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                        <span>
                          Completed: {format(new Date(course.completion_date), "MMM dd, yyyy")}
                        </span>
                        {course.expiry_date && (
                          <span>
                            Expires: {format(new Date(course.expiry_date), "MMM dd, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Planned Courses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Planned Courses
            </CardTitle>
            <Button size="sm" onClick={() => setIsAddPlannedOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Planned Course
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {plannedCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No planned courses yet</p>
          ) : (
            <div className="space-y-3">
              {plannedCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-start justify-between rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{course.course_name}</p>
                      {course.course_code && (
                        <Badge variant="outline" className="text-xs">
                          {course.course_code}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {course.target_period}
                      </Badge>
                    </div>
                    {course.notes && (
                      <p className="mt-1 text-sm text-muted-foreground">{course.notes}</p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Added by {course.added_by}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePlanned(course.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training Needs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Training Needs
            </CardTitle>
            <Button size="sm" onClick={() => setIsAddNeedOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Training Need
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {trainingNeeds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No training needs identified</p>
          ) : (
            <div className="space-y-3">
              {trainingNeeds.map((need) => (
                <div
                  key={need.id}
                  className="flex items-start justify-between rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 -ml-1"
                        onClick={() => togglePriority(need.id)}
                      >
                        <Star
                          className={`h-4 w-4 ${
                            need.priority ? "fill-yellow-500 text-yellow-500" : "text-gray-400"
                          }`}
                        />
                      </Button>
                      <p className="font-medium">{need.course_name}</p>
                      {need.course_code && (
                        <Badge variant="outline" className="text-xs">
                          {need.course_code}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {need.target_period}
                      </Badge>
                      {need.priority && (
                        <Badge variant="default" className="text-xs bg-orange-500">
                          Priority
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{need.reason}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Added by {need.added_by}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteNeed(need.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Planned Course Dialog */}
      <AddPlannedCourseDialog
        open={isAddPlannedOpen}
        onOpenChange={setIsAddPlannedOpen}
        onSave={handleAddPlanned}
      />

      {/* Add Training Need Dialog */}
      <AddTrainingNeedDialog
        open={isAddNeedOpen}
        onOpenChange={setIsAddNeedOpen}
        onSave={handleAddNeed}
      />
    </div>
  );
}

// Add Planned Course Dialog Component
function AddPlannedCourseDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (course: Omit<PlannedCourse, "id">) => void;
}) {
  const [formData, setFormData] = useState({
    course_id: "",
    course_name: "",
    course_code: "",
    target_period: "Q1 2026",
    added_by: "MRADR", // TODO: Get from current user
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setFormData({
      course_id: "",
      course_name: "",
      course_code: "",
      target_period: "Q1 2026",
      added_by: "MRADR",
      notes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Planned Course</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course_name">Course Name *</Label>
            <Input
              id="course_name"
              value={formData.course_name}
              onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="course_code">Course Code</Label>
            <Input
              id="course_code"
              value={formData.course_code}
              onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
              placeholder="e.g., GWO-BST"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_period">Target Period *</Label>
            <select
              id="target_period"
              value={formData.target_period}
              onChange={(e) => setFormData({ ...formData, target_period: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            >
              <option value="Q1 2026">Q1 2026</option>
              <option value="Q2 2026">Q2 2026</option>
              <option value="Q3 2026">Q3 2026</option>
              <option value="Q4 2026">Q4 2026</option>
              <option value="Q1 2027">Q1 2027</option>
              <option value="Q2 2027">Q2 2027</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Additional notes..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Planned Course</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Add Training Need Dialog Component
function AddTrainingNeedDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (need: Omit<TrainingNeed, "id">) => void;
}) {
  const [formData, setFormData] = useState({
    course_id: "",
    course_name: "",
    course_code: "",
    reason: "",
    priority: false,
    target_period: "Q2 2026",
    added_by: "MRADR", // TODO: Get from current user
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setFormData({
      course_id: "",
      course_name: "",
      course_code: "",
      reason: "",
      priority: false,
      target_period: "Q2 2026",
      added_by: "MRADR",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Training Need</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="need_course_name">Course Name *</Label>
            <Input
              id="need_course_name"
              value={formData.course_name}
              onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="need_course_code">Course Code</Label>
            <Input
              id="need_course_code"
              value={formData.course_code}
              onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
              placeholder="e.g., GWO-BST"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Input
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g., Certification expiring, New role requirement"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="need_target_period">Target Period *</Label>
            <select
              id="need_target_period"
              value={formData.target_period}
              onChange={(e) => setFormData({ ...formData, target_period: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            >
              <option value="Q1 2026">Q1 2026</option>
              <option value="Q2 2026">Q2 2026</option>
              <option value="Q3 2026">Q3 2026</option>
              <option value="Q4 2026">Q4 2026</option>
              <option value="Q1 2027">Q1 2027</option>
              <option value="Q2 2027">Q2 2027</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="priority"
              checked={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.checked })}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="priority" className="cursor-pointer">
              Mark as Priority
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Training Need</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
